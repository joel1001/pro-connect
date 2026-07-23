import { presenceApi } from '@/api/presence.api';
import { getWsChatUrl } from '@/constants/config';
import { ensureValidAccessToken } from '@/lib/authSession';
import { normalizeRealtimeMessage, normalizeRealtimeNotification } from '@/lib/chat';
import {
  normalizeEmergencyHireAvailabilityUpdate,
  normalizeEmergencyHireUpdate,
  EmergencyHireAvailabilityRealtimeUpdate,
  EmergencyHireRealtimeUpdate,
} from '@/lib/emergencyHireRealtime';
import { applyEmergencyHireVisibilityUpdate } from '@/lib/emergencyHireVisibility';
import { normalizePresenceUpdate, presenceTopic } from '@/lib/presence';
import { syncPresenceSnapshot } from '@/lib/presenceSync';
import { usePresenceStore } from '@/store/presenceStore';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { AppointmentRealtimeUpdate, AuthUser, ContractRealtimeUpdate, Message, Notification, PaymentRealtimeUpdate } from '@/types';

export type RealtimeMessageHandler = (message: Message) => void;
export type RealtimeNotificationHandler = (notification: Notification) => void;
export type RealtimeAppointmentHandler = (update: AppointmentRealtimeUpdate) => void;
export type RealtimeContractHandler = (update: ContractRealtimeUpdate) => void;
export type RealtimePaymentHandler = (update: PaymentRealtimeUpdate) => void;
export type RealtimeEmergencyHireHandler = (update: EmergencyHireRealtimeUpdate) => void;
export type RealtimeEmergencyHireAvailabilityHandler = (update: EmergencyHireAvailabilityRealtimeUpdate) => void;
export type ChatCallSignalType = 'offer' | 'answer' | 'candidate' | 'hangup' | 'reject';

export interface ChatCallSignal {
  type: ChatCallSignalType;
  callId: string;
  conversationId: string;
  senderId?: string;
  recipientId?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export type RealtimeCallSignalHandler = (signal: ChatCallSignal) => void;

interface SimpleStompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

interface SimpleStompSubscription {
  id: string;
  unsubscribe: () => void;
}

class StompRealtimeService {
  private client: WebSocket | null = null;
  private messageHandlers = new Set<RealtimeMessageHandler>();
  private notificationHandlers = new Set<RealtimeNotificationHandler>();
  private appointmentHandlers = new Set<RealtimeAppointmentHandler>();
  private contractHandlers = new Map<string, Set<RealtimeContractHandler>>();
  private paymentHandlers = new Map<string, Set<RealtimePaymentHandler>>();
  private emergencyHireHandlers = new Set<RealtimeEmergencyHireHandler>();
  private emergencyHireAvailabilityHandlers = new Set<RealtimeEmergencyHireAvailabilityHandler>();
  private callSignalHandlers = new Set<RealtimeCallSignalHandler>();
  private messageSubs: SimpleStompSubscription[] = [];
  private notificationSubs: SimpleStompSubscription[] = [];
  private appointmentSubs: SimpleStompSubscription[] = [];
  private contractSubs = new Map<string, SimpleStompSubscription>();
  private paymentSubs = new Map<string, SimpleStompSubscription>();
  private emergencyHireSubs: SimpleStompSubscription[] = [];
  private callSubs: SimpleStompSubscription[] = [];
  private presenceSubs = new Map<string, SimpleStompSubscription>();
  private subscriptions = new Map<string, (frame: SimpleStompFrame) => void>();
  private subscriptionSeq = 0;
  private presenceWatchRefs = new Map<string, number>();
  private watchedPresenceUserIds = new Set<string>();
  private connecting = false;
  private connected = false;
  private stopped = false;
  private userId: string | null = null;
  private readyWaiters: Array<(ready: boolean) => void> = [];

  isConnected() {
    return this.isStompReady();
  }

  resume() {
    this.stopped = false;
  }

  addPresenceWatch(userIds: string[]) {
    for (const id of userIds) {
      if (!id) continue;
      this.presenceWatchRefs.set(id, (this.presenceWatchRefs.get(id) ?? 0) + 1);
    }
    this.reconcilePresenceWatch();
    void syncPresenceSnapshot(userIds);
    void this.connect();
  }

  removePresenceWatch(userIds: string[]) {
    for (const id of userIds) {
      if (!id) continue;
      const next = (this.presenceWatchRefs.get(id) ?? 0) - 1;
      if (next <= 0) this.presenceWatchRefs.delete(id);
      else this.presenceWatchRefs.set(id, next);
    }
    this.reconcilePresenceWatch();
  }

  private isStompReady(): boolean {
    return this.connected && this.client?.readyState === WebSocket.OPEN;
  }

  private resolveReadyWaiters(ready: boolean) {
    const waiters = this.readyWaiters.splice(0);
    waiters.forEach((resolve) => resolve(ready));
  }

  private waitForReady(timeoutMs = 6500): Promise<boolean> {
    if (this.isStompReady()) return Promise.resolve(true);
    if (this.stopped) return Promise.resolve(false);

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.readyWaiters = this.readyWaiters.filter((waiter) => waiter !== done);
        resolve(false);
      }, timeoutMs);

      const done = (ready: boolean) => {
        clearTimeout(timeout);
        resolve(ready);
      };

      this.readyWaiters.push(done);
    });
  }

  private safeUnsubscribe(sub: SimpleStompSubscription | undefined) {
    if (!sub) return;
    try {
      sub.unsubscribe();
    } catch {
      // STOMP socket already closed
    }
  }

  private reconcilePresenceWatch() {
    this.watchedPresenceUserIds = new Set(this.presenceWatchRefs.keys());
    if (this.isStompReady()) {
      this.syncPresenceSubscriptions();
    }
  }

  async connect(forceRefreshToken = false) {
    if (this.stopped) return;
    if (!forceRefreshToken && this.isStompReady()) return;
    if (this.connecting) return;

    const token = await ensureValidAccessToken(forceRefreshToken);
    const user = await storage.getJSON<AuthUser>(STORAGE_KEYS.user);
    if (!token || !user?.userId) {
      this.resolveReadyWaiters(false);
      return;
    }

    this.userId = user.userId;

    if (this.client) {
      this.client.close();
    }

    this.connecting = true;
    const wsUrl = getWsChatUrl();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ProConnect] STOMP opening →', wsUrl, 'token', token ? 'present' : 'missing');
    }

    try {
      const socket = new WebSocket(wsUrl);
      socket.binaryType = 'arraybuffer';
      this.client = socket;
      const connectionTimeout = setTimeout(() => {
        if (!this.connected) {
          this.connecting = false;
          this.resolveReadyWaiters(false);
          if (this.client === socket) {
            this.client = null;
          }
          socket.close();
        }
      }, 7000);

      socket.onopen = () => {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[ProConnect] WebSocket open → sending STOMP CONNECT');
        }
        this.sendFrame('CONNECT', {
          Authorization: `Bearer ${token}`,
          host: 'proconnect',
          'accept-version': '1.2,1.1,1.0',
          'heart-beat': '10000,10000',
        });
      };
      socket.onmessage = (event) => {
        void this.decodeWebSocketData(event.data).then((data) => this.handleRawFrame(data, connectionTimeout));
      };
      socket.onclose = () => {
        if (__DEV__ && !this.connected) {
          // eslint-disable-next-line no-console
          console.warn('[ProConnect] WebSocket closed before STOMP connected →', wsUrl);
        }
        clearTimeout(connectionTimeout);
        this.connected = false;
        this.connecting = false;
        this.resolveReadyWaiters(false);
        this.messageSubs = [];
        this.notificationSubs = [];
        this.appointmentSubs = [];
        this.contractSubs.clear();
        this.paymentSubs.clear();
        this.emergencyHireSubs = [];
        this.callSubs = [];
        this.presenceSubs.clear();
        this.subscriptions.clear();
      };
      socket.onerror = () => {
        clearTimeout(connectionTimeout);
        this.connecting = false;
        this.connected = false;
        this.resolveReadyWaiters(false);
        void presenceApi.heartbeat().catch(() => undefined);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[ProConnect] WebSocket error before STOMP connected →', wsUrl);
        }
      };
    } catch {
      this.connecting = false;
      this.connected = false;
      this.resolveReadyWaiters(false);
    }
  }

  async reconnect(forceRefreshToken = false) {
    if (this.stopped) return;
    this.connected = false;
    this.connecting = false;
    this.unsubscribeAll();
    this.unsubscribePresenceAll();
    this.client?.close();
    this.client = null;
    await this.connect(forceRefreshToken);
  }

  async disconnect() {
    this.connected = false;
    this.unsubscribeAll();
    this.unsubscribePresenceAll();
    this.client?.close();
    this.client = null;
    this.connecting = false;
  }

  async shutdown() {
    this.stopped = true;
    this.connected = false;
    this.unsubscribeAll();
    this.unsubscribePresenceAll();
    this.presenceWatchRefs.clear();
    this.watchedPresenceUserIds.clear();
    this.client?.close();
    this.client = null;
    this.userId = null;
    this.connecting = false;
  }

  onMessage(handler: RealtimeMessageHandler) {
    this.messageHandlers.add(handler);
    void this.connect();
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onNotification(handler: RealtimeNotificationHandler) {
    this.notificationHandlers.add(handler);
    void this.connect();
    return () => {
      this.notificationHandlers.delete(handler);
    };
  }

  onAppointmentUpdate(handler: RealtimeAppointmentHandler) {
    this.appointmentHandlers.add(handler);
    void this.connect();
    return () => {
      this.appointmentHandlers.delete(handler);
    };
  }

  onContractUpdate(contractId: string, handler: RealtimeContractHandler) {
    if (!contractId) return () => undefined;
    const handlers = this.contractHandlers.get(contractId) ?? new Set<RealtimeContractHandler>();
    handlers.add(handler);
    this.contractHandlers.set(contractId, handlers);
    if (this.isStompReady()) {
      this.ensureContractSubscription(contractId);
    }
    void this.connect();
    return () => {
      const current = this.contractHandlers.get(contractId);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.contractHandlers.delete(contractId);
        this.safeUnsubscribe(this.contractSubs.get(contractId));
        this.contractSubs.delete(contractId);
      }
    };
  }

  onPaymentUpdate(paymentId: string, handler: RealtimePaymentHandler) {
    if (!paymentId) return () => undefined;
    const handlers = this.paymentHandlers.get(paymentId) ?? new Set<RealtimePaymentHandler>();
    handlers.add(handler);
    this.paymentHandlers.set(paymentId, handlers);
    if (this.isStompReady()) {
      this.ensurePaymentSubscription(paymentId);
    }
    void this.connect();
    return () => {
      const current = this.paymentHandlers.get(paymentId);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.paymentHandlers.delete(paymentId);
        this.safeUnsubscribe(this.paymentSubs.get(paymentId));
        this.paymentSubs.delete(paymentId);
      }
    };
  }

  onEmergencyHireUpdate(handler: RealtimeEmergencyHireHandler) {
    this.emergencyHireHandlers.add(handler);
    void this.connect();
    return () => {
      this.emergencyHireHandlers.delete(handler);
    };
  }

  onEmergencyHireAvailabilityChange(handler: RealtimeEmergencyHireAvailabilityHandler) {
    this.emergencyHireAvailabilityHandlers.add(handler);
    void this.connect();
    return () => {
      this.emergencyHireAvailabilityHandlers.delete(handler);
    };
  }

  onCallSignal(handler: RealtimeCallSignalHandler) {
    this.callSignalHandlers.add(handler);
    void this.connect();
    return () => {
      this.callSignalHandlers.delete(handler);
    };
  }

  async sendCallSignal(signal: ChatCallSignal) {
    await this.connect();
    let ready = await this.waitForReady();
    if (!ready) {
      await this.reconnect(true);
      ready = await this.waitForReady();
    }
    if (!ready || !this.isStompReady() || !this.client) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[ProConnect] Realtime call signal skipped: STOMP not ready');
      }
      return false;
    }
    this.sendFrame('SEND', { destination: '/app/calls/signal' }, JSON.stringify(signal));
    return true;
  }

  private sendFrame(command: string, headers: Record<string, string> = {}, body = '') {
    if (!this.client || this.client.readyState !== WebSocket.OPEN) return false;
    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
    const frame = `${command}\n${headerLines.join('\n')}\n\n${body}\0`;
    this.client.send(new TextEncoder().encode(frame).buffer);
    return true;
  }

  private async decodeWebSocketData(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    if (data instanceof ArrayBuffer) {
      return new TextDecoder().decode(data);
    }
    if (data && typeof (data as { arrayBuffer?: unknown }).arrayBuffer === 'function') {
      const buffer = await (data as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
      return new TextDecoder().decode(buffer);
    }
    return String(data);
  }

  private subscribe(destination: string, handler: (frame: SimpleStompFrame) => void): SimpleStompSubscription {
    const id = `sub-${++this.subscriptionSeq}`;
    this.subscriptions.set(id, handler);
    this.sendFrame('SUBSCRIBE', { id, destination });
    return {
      id,
      unsubscribe: () => {
        this.subscriptions.delete(id);
        this.sendFrame('UNSUBSCRIBE', { id });
      },
    };
  }

  private handleRawFrame(rawData: string, connectionTimeout?: ReturnType<typeof setTimeout>) {
    const frames = rawData.split('\0').filter((frame) => frame.trim().length > 0);
    for (const rawFrame of frames) {
      const frame = this.parseFrame(rawFrame);
      if (!frame) continue;
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] STOMP frame ←', frame.command);
      }
      if (frame.command === 'CONNECTED') {
        if (connectionTimeout) clearTimeout(connectionTimeout);
        this.handleConnected();
        continue;
      }
      if (frame.command === 'MESSAGE') {
        const subscriptionId = frame.headers.subscription;
        const handler = subscriptionId ? this.subscriptions.get(subscriptionId) : undefined;
        handler?.(frame);
        continue;
      }
      if (frame.command === 'ERROR') {
        this.connecting = false;
        this.connected = false;
        this.resolveReadyWaiters(false);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[ProConnect] STOMP error', frame.headers.message ?? frame.body);
        }
      }
    }
  }

  private parseFrame(rawFrame: string): SimpleStompFrame | null {
    const normalized = rawFrame.replace(/^\n+/, '');
    const separator = normalized.indexOf('\n\n');
    const headerBlock = separator >= 0 ? normalized.slice(0, separator) : normalized;
    const body = separator >= 0 ? normalized.slice(separator + 2) : '';
    const lines = headerBlock.split('\n');
    const command = lines.shift()?.trim();
    if (!command) return null;
    const headers: Record<string, string> = {};
    for (const line of lines) {
      const index = line.indexOf(':');
      if (index <= 0) continue;
      headers[line.slice(0, index)] = line.slice(index + 1);
    }
    return { command, headers, body };
  }

  private handleConnected() {
    if (this.stopped) return;
    this.connecting = false;
    this.connected = true;
    this.resolveReadyWaiters(true);
    this.unsubscribeAll();

    const uid = this.userId;
    if (!uid || !this.client) return;

    this.messageSubs.push(this.subscribe(`/topic/user.${uid}.messages`, (frame) => this.handleMessage(frame)));
    this.notificationSubs.push(this.subscribe(`/topic/user.${uid}.notifications`, (frame) => this.handleNotification(frame)));
    this.appointmentSubs.push(this.subscribe(`/topic/user.${uid}.appointments`, (frame) => this.handleAppointment(frame)));
    this.emergencyHireSubs.push(this.subscribe(`/topic/user.${uid}.emergency-hire`, (frame) => this.handleEmergencyHire(frame)));
    this.emergencyHireSubs.push(
      this.subscribe('/topic/emergency-hire.available-professionals', (frame) => this.handleEmergencyHireAvailability(frame)),
    );
    this.callSubs.push(this.subscribe(`/topic/user.${uid}.calls`, (frame) => this.handleCallSignal(frame)));
    this.syncContractSubscriptions();
    this.syncPaymentSubscriptions();
    this.syncPresenceSubscriptions();
    void syncPresenceSnapshot([...this.watchedPresenceUserIds]);
    void presenceApi.heartbeat().catch(() => undefined);

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ProConnect] STOMP connected →', getWsChatUrl(), 'user', uid);
    }
  }

  private unsubscribeAll() {
    for (const sub of this.messageSubs) this.safeUnsubscribe(sub);
    for (const sub of this.notificationSubs) this.safeUnsubscribe(sub);
    for (const sub of this.appointmentSubs) this.safeUnsubscribe(sub);
    for (const sub of this.contractSubs.values()) this.safeUnsubscribe(sub);
    for (const sub of this.paymentSubs.values()) this.safeUnsubscribe(sub);
    for (const sub of this.emergencyHireSubs) this.safeUnsubscribe(sub);
    for (const sub of this.callSubs) this.safeUnsubscribe(sub);
    this.messageSubs = [];
    this.notificationSubs = [];
    this.appointmentSubs = [];
    this.contractSubs.clear();
    this.paymentSubs.clear();
    this.emergencyHireSubs = [];
    this.callSubs = [];
  }

  private unsubscribePresenceAll() {
    for (const sub of this.presenceSubs.values()) this.safeUnsubscribe(sub);
    this.presenceSubs.clear();
  }

  private syncPresenceSubscriptions() {
    if (!this.isStompReady() || !this.client) return;

    for (const [userId, sub] of this.presenceSubs.entries()) {
      if (!this.watchedPresenceUserIds.has(userId)) {
        this.safeUnsubscribe(sub);
        this.presenceSubs.delete(userId);
      }
    }

    for (const userId of this.watchedPresenceUserIds) {
      if (this.presenceSubs.has(userId)) continue;
      try {
        const sub = this.subscribe(presenceTopic(userId), (frame) => this.handlePresence(frame));
        this.presenceSubs.set(userId, sub);
      } catch {
        // STOMP not ready yet — onConnect will retry
      }
    }
  }

  private syncContractSubscriptions() {
    for (const contractId of this.contractHandlers.keys()) {
      this.ensureContractSubscription(contractId);
    }
  }

  private syncPaymentSubscriptions() {
    for (const paymentId of this.paymentHandlers.keys()) {
      this.ensurePaymentSubscription(paymentId);
    }
  }

  private ensureContractSubscription(contractId: string) {
    if (!this.isStompReady() || !this.client || this.contractSubs.has(contractId)) return;
    const sub = this.subscribe(`/topic/contracts.${contractId}`, (frame) => this.handleContract(frame));
    this.contractSubs.set(contractId, sub);
  }

  private ensurePaymentSubscription(paymentId: string) {
    if (!this.isStompReady() || !this.client || this.paymentSubs.has(paymentId)) return;
    const sub = this.subscribe(`/topic/payments.${paymentId}`, (frame) => this.handlePayment(frame));
    this.paymentSubs.set(paymentId, sub);
  }

  private handlePresence(frame: SimpleStompFrame) {
    try {
      const payload = normalizePresenceUpdate(JSON.parse(frame.body));
      if (payload) {
        usePresenceStore.getState().applyUpdate(payload);
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[ProConnect] presence', payload.userId, payload.online ? 'online' : 'offline');
        }
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handleMessage(frame: SimpleStompFrame) {
    try {
      const payload = normalizeRealtimeMessage(JSON.parse(frame.body));
      this.messageHandlers.forEach((h) => h(payload));
    } catch {
      // ignore malformed payloads
    }
  }

  private handleNotification(frame: SimpleStompFrame) {
    try {
      const payload = normalizeRealtimeNotification(JSON.parse(frame.body));
      this.notificationHandlers.forEach((h) => h(payload));
    } catch {
      // ignore malformed payloads
    }
  }

  private handleAppointment(frame: SimpleStompFrame) {
    try {
      const payload = JSON.parse(frame.body) as AppointmentRealtimeUpdate;
      if (payload?.event !== 'APPOINTMENT_UPDATED' || !payload.appointmentId) return;
      this.appointmentHandlers.forEach((h) => h(payload));
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] appointment', payload.appointmentId, payload.newStatus ?? payload.action);
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handleContract(frame: SimpleStompFrame) {
    try {
      const payload = JSON.parse(frame.body) as ContractRealtimeUpdate;
      if (payload?.event !== 'CONTRACT_UPDATED' || !payload.contractId) return;
      this.contractHandlers.get(payload.contractId)?.forEach((handler) => handler(payload));
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] contract', payload.contractId, payload.newStatus);
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handlePayment(frame: SimpleStompFrame) {
    try {
      const payload = JSON.parse(frame.body) as PaymentRealtimeUpdate;
      if (payload?.event !== 'PAYMENT_UPDATED' || !payload.paymentId) return;
      this.paymentHandlers.get(payload.paymentId)?.forEach((handler) => handler(payload));
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] payment', payload.paymentId, payload.newStatus);
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handleEmergencyHire(frame: SimpleStompFrame) {
    try {
      const payload = normalizeEmergencyHireUpdate(JSON.parse(frame.body));
      if (!payload) return;
      this.emergencyHireHandlers.forEach((h) => h(payload));
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] emergency-hire', payload.requestId, payload.action);
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handleEmergencyHireAvailability(frame: SimpleStompFrame) {
    try {
      const payload = normalizeEmergencyHireAvailabilityUpdate(JSON.parse(frame.body));
      if (!payload) return;
      applyEmergencyHireVisibilityUpdate(payload);
      this.emergencyHireAvailabilityHandlers.forEach((h) => h(payload));
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[ProConnect] emergency-hire-availability', payload.professionalId, payload.enabled);
      }
    } catch {
      // ignore malformed payloads
    }
  }

  private handleCallSignal(frame: SimpleStompFrame) {
    try {
      const payload = JSON.parse(frame.body) as ChatCallSignal;
      if (!payload?.type || !payload.callId || !payload.conversationId) return;
      this.callSignalHandlers.forEach((handler) => handler(payload));
    } catch {
      // ignore malformed payloads
    }
  }
}

export const realtimeService = new StompRealtimeService();
