import { useEffect, useMemo } from 'react';

import { resolveLiveOnline } from '@/lib/presence';
import { syncPresenceSnapshot } from '@/lib/presenceSync';
import { usePresenceStore } from '@/store/presenceStore';
import { realtimeService } from '@/services/realtime';

const PRESENCE_POLL_MS = 10_000;

/** Subscribe to live online/offline updates for the given user ids over WebSocket. */
export function usePresenceWatch(userIds: string[]) {
  const normalized = useMemo(
    () => [...new Set(userIds.filter(Boolean))].sort(),
    [userIds],
  );
  const key = normalized.join('|');

  useEffect(() => {
    if (normalized.length === 0) return;

    realtimeService.addPresenceWatch(normalized);
    void syncPresenceSnapshot(normalized);

    const interval = setInterval(() => {
      void syncPresenceSnapshot(normalized);
    }, PRESENCE_POLL_MS);

    return () => {
      clearInterval(interval);
      realtimeService.removePresenceWatch(normalized);
    };
  }, [key]);
}

export function useLiveOnline(userId: string, fallback = false): boolean {
  return usePresenceStore((s) => s.resolveOnline(userId, fallback));
}

export function useLiveOnlineMap<T extends { id: string; online?: boolean }>(
  items: T[],
): Record<string, boolean> {
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  usePresenceWatch(ids);
  const onlineByUserId = usePresenceStore((s) => s.onlineByUserId);

  return useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const item of items) {
      map[item.id] = resolveLiveOnline(onlineByUserId, item.id, item.online ?? false);
    }
    return map;
  }, [items, onlineByUserId]);
}
