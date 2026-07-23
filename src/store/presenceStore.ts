import { create } from 'zustand';

import { PresenceUpdate, presenceUserAliases } from '@/lib/presence';

type PresenceState = {
  onlineByUserId: Record<string, boolean>;
  lastSeenByUserId: Record<string, string>;
  applyUpdate: (update: PresenceUpdate) => void;
  resolveOnline: (userId: string, fallback?: boolean) => boolean;
  reset: () => void;
};

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineByUserId: {},
  lastSeenByUserId: {},

  applyUpdate: (update) => {
    set((state) => {
      const onlineByUserId = { ...state.onlineByUserId };
      for (const alias of presenceUserAliases(update.userId)) {
        onlineByUserId[alias] = update.online;
      }
      return {
        onlineByUserId,
        lastSeenByUserId: update.lastSeenAt
          ? { ...state.lastSeenByUserId, [update.userId]: update.lastSeenAt }
          : state.lastSeenByUserId,
      };
    });
  },

  resolveOnline: (userId, fallback = false) => {
    const onlineByUserId = get().onlineByUserId;
    for (const alias of presenceUserAliases(userId)) {
      const live = onlineByUserId[alias];
      if (live !== undefined) return live;
    }
    return fallback;
  },

  reset: () => set({ onlineByUserId: {}, lastSeenByUserId: {} }),
}));

export function resetPresenceStore() {
  usePresenceStore.getState().reset();
}
