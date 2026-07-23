/** Compare chat user ids across legacy (`pro_001`) and canonical (`usr_pro_001`) forms. */
import { Message, Notification } from '@/types';

export function isSameChatUser(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return canonicalChatUserId(a) === canonicalChatUserId(b);
}

export function canonicalChatUserId(id: string): string {
  if (id.startsWith('usr_')) return id;
  if (id.startsWith('pro_')) return `usr_pro_${id.slice(4)}`;
  if (id.startsWith('cli_')) return `usr_cli_${id.slice(4)}`;
  return id;
}

export function appendChatMessage<T extends { id: string }>(existing: T[], incoming: T): T[] {
  if (existing.some((m) => m.id === incoming.id)) return existing;
  return [...existing, incoming];
}

function coerceInstant(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length >= 1) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value as number[];
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }
  if (typeof value === 'number') return new Date(value).toISOString();
  return new Date().toISOString();
}

/** Normalize STOMP payloads from Spring/Jackson into app Message shape. */
export function normalizeRealtimeMessage(raw: Record<string, unknown>): Message {
  return {
    id: String(raw.id ?? ''),
    conversationId: String(raw.conversationId ?? ''),
    senderId: String(raw.senderId ?? ''),
    type: String(raw.type ?? 'TEXT'),
    message: typeof raw.message === 'string' ? raw.message : undefined,
    offerId: raw.offerId ? String(raw.offerId) : undefined,
    negotiationId: raw.negotiationId ? String(raw.negotiationId) : undefined,
    read: Boolean(raw.read),
    createdAt: coerceInstant(raw.createdAt),
  };
}

export function normalizeRealtimeNotification(raw: Record<string, unknown>): Notification {
  const rawType = raw.type;
  const type =
    typeof rawType === 'object' && rawType !== null && 'name' in rawType
      ? String((rawType as { name: string }).name)
      : String(rawType ?? 'CHAT');

  return {
    id: String(raw.id ?? ''),
    userId: String(raw.userId ?? ''),
    type,
    title: String(raw.title ?? ''),
    body: String(raw.body ?? ''),
    referenceId: raw.referenceId ? String(raw.referenceId) : undefined,
    read: Boolean(raw.read),
    createdAt: coerceInstant(raw.createdAt),
  };
}
