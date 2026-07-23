import { create } from 'zustand';

import { chatApi } from '@/api/chat.api';
import { notificationsApi } from '@/api/notifications.api';
import { isSameChatUser } from '@/lib/chat';
import { realtimeService } from '@/services/realtime';
import { Conversation, Message, Notification } from '@/types';

export interface InAppAlert {
  id: string;
  title: string;
  body: string;
  conversationId?: string;
}

interface NotificationState {
  unreadCount: number;
  unreadNotificationCount: number;
  ready: boolean;
  activeChatConversationId: string | null;
  pendingAlert: InAppAlert | null;
  lastAlertKey: string | null;
  seenMessageIds: Record<string, true>;
  seenNotificationIds: Record<string, true>;
  lastSeenNotificationId: string | null;
  inboxConversations: Conversation[];
  inboxLoading: boolean;
  setActiveChatConversationId: (conversationId: string | null) => void;
  refresh: () => Promise<void>;
  loadInbox: (silent?: boolean) => Promise<void>;
  scheduleSync: () => void;
  applyNotification: (notification: Notification) => void;
  markRead: (id: string) => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
  applyIncomingMessage: (message: Message, viewerId?: string | null) => void;
  pushAlert: (alert: InAppAlert) => void;
  dismissAlert: () => void;
  conversationPatches: Record<string, Partial<Conversation>>;
  patchConversation: (conversationId: string, patch: Partial<Conversation>) => void;
  clearConversationPatch: (conversationId: string) => void;
}

const ALERT_TTL_MS = 5000;
const SYNC_DEBOUNCE_MS = 600;
let alertTimer: ReturnType<typeof setTimeout> | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
const activeChatListeners = new Set<(message: Message) => void>();

/** Push live messages to the open chat screen (always, before inbox dedupe). */
function emitActiveChatMessage(message: Message) {
  activeChatListeners.forEach((listener) => listener(message));
}

/** Subscribe while a chat thread is mounted. */
export function subscribeActiveChatMessages(listener: (message: Message) => void) {
  activeChatListeners.add(listener);
  return () => activeChatListeners.delete(listener);
}

function sortConversations(items: Conversation[]) {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function withPatches(conversation: Conversation, patches: Record<string, Partial<Conversation>>): Conversation {
  const patch = patches[conversation.id];
  if (!patch) return conversation;
  return { ...conversation, ...patch };
}

/** Tab badge = total unread messages (matches inbox rows), not notification rows. */
function totalMessageUnread(conversations: Conversation[]) {
  return conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

function parseChatConversationId(link?: string) {
  if (!link) return null;
  const query = link.split('?')[1];
  if (!query) return null;
  return new URLSearchParams(query).get('conversationId');
}

function notificationChatConversationId(notification: Notification) {
  return (
    notification.metadata?.conversationId ??
    parseChatConversationId(notification.link) ??
    (notification.type === 'CHAT' ? notification.referenceId : null)
  );
}

function parseCallPreview(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { status?: string };
    if (parsed.status == null) return null;
    return parsed.status === 'answered' ? 'Llamada realizada' : 'Llamada perdida';
  } catch {
    return value.includes('"status":"answered"') ? 'Llamada realizada' : null;
  }
}

function messagePreview(message: Message) {
  if (message.type === 'CALL') {
    return parseCallPreview(message.message) ?? 'Llamada perdida';
  }
  return message.message;
}

function notificationPreview(body?: string) {
  return parseCallPreview(body) ?? body;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  unreadNotificationCount: 0,
  ready: false,
  activeChatConversationId: null,
  pendingAlert: null,
  lastAlertKey: null,
  seenMessageIds: {},
  seenNotificationIds: {},
  lastSeenNotificationId: null,
  inboxConversations: [],
  inboxLoading: false,
  conversationPatches: {},

  setActiveChatConversationId: (conversationId) => set({ activeChatConversationId: conversationId }),

  loadInbox: async (silent = false) => {
    if (!silent) set({ inboxLoading: true });
    try {
      const items = await chatApi.listConversations();
      const patches = get().conversationPatches;
      const inboxConversations = sortConversations(items.map((c) => withPatches(c, patches)));
      set({
        inboxConversations,
        unreadCount: totalMessageUnread(inboxConversations),
      });
    } catch {
      if (!silent) set({ inboxConversations: [] });
    } finally {
      if (!silent) set({ inboxLoading: false });
    }
  },

  scheduleSync: () => {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void get().refresh();
      void get().loadInbox(true);
    }, SYNC_DEBOUNCE_MS);
  },

  refresh: async () => {
    try {
      const wasReady = get().ready;
      const prevNewestId = get().lastSeenNotificationId;
      const [{ count: unreadNotificationCount }, unread] = await Promise.all([
        notificationsApi.unreadCount(),
        notificationsApi.list(true),
      ]);
      const newest = unread[0];

      if (
        wasReady &&
        newest &&
        !newest.read &&
        newest.id !== prevNewestId &&
        notificationChatConversationId(newest) !== get().activeChatConversationId
      ) {
        get().pushAlert({
          id: newest.id,
          title: newest.title,
          body: newest.body,
          conversationId: notificationChatConversationId(newest) ?? undefined,
        });
      }

      set({
        ready: true,
        unreadNotificationCount,
        lastSeenNotificationId: newest?.id ?? prevNewestId,
      });
    } catch {
      set({ ready: true });
    }
  },

  pushAlert: (alert) => {
    const key = alert.conversationId ?? alert.id;
    if (get().lastAlertKey === key) return;
    if (alertTimer) clearTimeout(alertTimer);
    set({ pendingAlert: alert, lastAlertKey: key });
    alertTimer = setTimeout(() => {
      if (get().pendingAlert?.id === alert.id) {
        set({ pendingAlert: null, lastAlertKey: null });
      }
      alertTimer = null;
    }, ALERT_TTL_MS);
  },

  dismissAlert: () => {
    if (alertTimer) clearTimeout(alertTimer);
    alertTimer = null;
    set({ pendingAlert: null, lastAlertKey: null });
  },

  applyNotification: (notification) => {
    if (notification.read) return;
    if (notification.type === 'CHAT') {
      get().scheduleSync();
      return;
    }
    const dedupeKey = notification.id || `${notification.referenceId}-${notification.createdAt}`;
    if (dedupeKey && get().seenNotificationIds[dedupeKey]) return;
    if (dedupeKey) {
      set((state) => ({
        seenNotificationIds: { ...state.seenNotificationIds, [dedupeKey]: true },
      }));
    }

    const chatConversationId = notificationChatConversationId(notification);
    const isActiveChat = chatConversationId && chatConversationId === get().activeChatConversationId;

    if (isActiveChat) {
      if (chatConversationId) {
        void get().markConversationRead(chatConversationId);
      }
      return;
    }

    if (chatConversationId) {
      const { body, createdAt } = notification;
      const preview = notificationPreview(body);
      const conversationId = chatConversationId;
      get().patchConversation(conversationId, {
        lastMessagePreview: preview,
        lastMessageAt: createdAt,
      });
      set((state) => {
        const idx = state.inboxConversations.findIndex((c) => c.id === conversationId);
        if (idx === -1) return state;
        const next = [...state.inboxConversations];
        next[idx] = {
          ...next[idx],
          lastMessagePreview: preview,
          lastMessageAt: createdAt ?? next[idx].lastMessageAt,
        };
        return { inboxConversations: sortConversations(next) };
      });
    }

    get().pushAlert({
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      conversationId: chatConversationId ?? undefined,
    });

    set((state) => ({
      unreadNotificationCount: state.unreadNotificationCount + 1,
    }));

    if (notification.id) {
      set({ lastSeenNotificationId: notification.id });
    }

    get().scheduleSync();
  },

  markRead: async (id) => {
    set((state) => ({
      unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
    }));
    try {
      await notificationsApi.markRead(id);
      await get().refresh();
    } catch {
      await get().refresh();
    }
  },

  markConversationRead: async (conversationId) => {
    try {
      await notificationsApi.markConversationRead(conversationId);
      get().clearConversationPatch(conversationId);
      set((state) => {
        const inboxConversations = state.inboxConversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        );
        return {
          inboxConversations,
          unreadCount: totalMessageUnread(inboxConversations),
        };
      });
      await get().refresh();
      await get().loadInbox(true);
    } catch {
      // ignore
    }
  },

  applyIncomingMessage: (message, viewerId) => {
    emitActiveChatMessage(message);

    const dedupeKey = message.id || `${message.conversationId}-${message.createdAt}`;
    if (dedupeKey && get().seenMessageIds[dedupeKey]) return;
    if (dedupeKey) {
      set((state) => ({
        seenMessageIds: { ...state.seenMessageIds, [dedupeKey]: true },
      }));
    }

    const isActiveChat = message.conversationId === get().activeChatConversationId;
    const fromPeer =
      viewerId != null && viewerId !== '' && !isSameChatUser(message.senderId, viewerId);

    if (isActiveChat && fromPeer) {
      void get().markConversationRead(message.conversationId);
      return;
    }

    const preview = messagePreview(message);
    get().patchConversation(message.conversationId, {
      lastMessagePreview: preview,
      lastMessageAt: message.createdAt,
    });

    set((state) => {
      const idx = state.inboxConversations.findIndex((c) => c.id === message.conversationId);
      if (idx === -1) return state;

      const current = withPatches(state.inboxConversations[idx], state.conversationPatches);
      const updated: Conversation = {
        ...current,
        lastMessageAt: message.createdAt,
        lastMessagePreview: preview,
      };
      const next = [...state.inboxConversations];
      next[idx] = updated;
      return { inboxConversations: sortConversations(next) };
    });

    get().scheduleSync();
  },

  patchConversation: (conversationId, patch) => {
    set((state) => ({
      conversationPatches: {
        ...state.conversationPatches,
        [conversationId]: { ...state.conversationPatches[conversationId], ...patch },
      },
    }));
  },

  clearConversationPatch: (conversationId) => {
    set((state) => {
      const next = { ...state.conversationPatches };
      delete next[conversationId];
      return { conversationPatches: next };
    });
  },
}));

/** Global realtime listeners for inbox badges and notification count. */
export function bindNotificationRealtime(viewerId?: string | null) {
  const store = useNotificationStore.getState();

  const offMessage = realtimeService.onMessage((message) => {
    store.applyIncomingMessage(message, viewerId);
  });

  const offNotification = realtimeService.onNotification((notification) => {
    store.applyNotification(notification);
  });

  return () => {
    offMessage();
    offNotification();
  };
}

export function mergeConversationPatch(conversation: Conversation): Conversation {
  return withPatches(conversation, useNotificationStore.getState().conversationPatches);
}

/** Clears inbox/badge state on logout or user switch. */
export function resetNotificationSession() {
  if (syncTimer) clearTimeout(syncTimer);
  if (alertTimer) clearTimeout(alertTimer);
  syncTimer = null;
  alertTimer = null;
  activeChatListeners.clear();
  useNotificationStore.setState({
    unreadCount: 0,
    unreadNotificationCount: 0,
    ready: false,
    activeChatConversationId: null,
    pendingAlert: null,
    lastAlertKey: null,
    seenMessageIds: {},
    seenNotificationIds: {},
    lastSeenNotificationId: null,
    inboxConversations: [],
    inboxLoading: false,
    conversationPatches: {},
  });
}
