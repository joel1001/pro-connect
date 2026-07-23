import { canonicalChatUserId } from '@/lib/chat';

export type PresenceUpdate = {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
};

function coerceInstant(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length >= 1) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value as number[];
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }
  if (typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

/** All id forms that may refer to the same account in lists/API. */
export function presenceUserAliases(userId: string): string[] {
  const canonical = canonicalChatUserId(userId);
  const aliases = new Set<string>([userId, canonical]);
  if (canonical.startsWith('usr_pro_')) {
    aliases.add(`pro_${canonical.slice('usr_pro_'.length)}`);
  }
  if (userId.startsWith('pro_')) {
    aliases.add(`usr_pro_${userId.slice(4)}`);
  }
  return [...aliases];
}

export function normalizePresenceUpdate(raw: Record<string, unknown>): PresenceUpdate | null {
  const userId = typeof raw.userId === 'string' ? raw.userId : '';
  if (!userId) return null;
  return {
    userId: canonicalChatUserId(userId),
    online: Boolean(raw.online),
    lastSeenAt: coerceInstant(raw.lastSeenAt),
  };
}

export function presenceTopic(userId: string): string {
  return `/topic/presence.${canonicalChatUserId(userId)}`;
}

export function resolveLiveOnline(
  onlineByUserId: Record<string, boolean | undefined>,
  userId: string,
  fallback = false,
): boolean {
  for (const alias of presenceUserAliases(userId)) {
    const live = onlineByUserId[alias];
    if (live !== undefined) return live;
  }
  return fallback;
}
