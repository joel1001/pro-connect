import { WS_BASE_URL } from '@/constants/config';
import { storage, STORAGE_KEYS } from '@/utils/storage';

export type WsListener = (event: { type: string; payload: unknown }) => void;

/**
 * Lightweight reconnecting WebSocket client for real-time chat & notifications.
 * Subscribers register a listener; messages are expected as JSON
 * `{ type, payload }`. Auto-reconnects with backoff while authenticated.
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners = new Set<WsListener>();
  private reconnectAttempts = 0;
  private shouldRun = false;

  async connect() {
    this.shouldRun = true;
    const token = await storage.get(STORAGE_KEYS.accessToken);
    const url = token ? `${WS_BASE_URL}?token=${encodeURIComponent(token)}` : WS_BASE_URL;

    try {
      this.socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.listeners.forEach((l) => l(data));
      } catch {
        // ignore malformed frames
      }
    };
    this.socket.onclose = () => {
      if (this.shouldRun) this.scheduleReconnect();
    };
    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  private scheduleReconnect() {
    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);
    setTimeout(() => {
      if (this.shouldRun) this.connect();
    }, delay);
  }

  send(type: string, payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  subscribe(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  disconnect() {
    this.shouldRun = false;
    this.socket?.close();
    this.socket = null;
  }
}

export const wsService = new WebSocketService();
