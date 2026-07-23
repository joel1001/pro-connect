import { presenceApi } from '@/api/presence.api';
import { canonicalChatUserId } from '@/lib/chat';
import { usePresenceStore } from '@/store/presenceStore';

export async function syncPresenceSnapshot(userIds: string[]): Promise<void> {
  const ids = [...new Set(userIds.filter(Boolean).map((id) => canonicalChatUserId(id)))];
  if (ids.length === 0) return;

  try {
    const status = await presenceApi.fetchStatus(ids);
    for (const [userId, online] of Object.entries(status)) {
      usePresenceStore.getState().applyUpdate({ userId, online: Boolean(online) });
    }
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[ProConnect] presence/status failed', error);
    }
  }
}
