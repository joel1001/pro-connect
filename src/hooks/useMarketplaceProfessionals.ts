import { useEffect, useMemo } from 'react';

import { useLiveOnlineMap } from '@/hooks/usePresenceWatch';
import { useMarketplaceStore, ensureMarketplaceInitialized } from '@/store/marketplaceStore';

export function useMarketplaceProfessionals() {
  const state = useMarketplaceStore();
  const onlineByUserId = useLiveOnlineMap(state.professionals);

  const professionals = useMemo(
    () =>
      state.professionals.map((p) => ({
        ...p,
        online: onlineByUserId[p.id] ?? p.online,
      })),
    [state.professionals, onlineByUserId],
  );

  useEffect(() => {
    void ensureMarketplaceInitialized();
  }, []);

  return { ...state, professionals };
}
