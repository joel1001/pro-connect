import { useEffect } from 'react';
import { AppState } from 'react-native';

import { presenceApi } from '@/api/presence.api';
import { useAuthStore } from '@/store/authStore';

const HEARTBEAT_MS = 30_000;

/** Keeps HTTP presence alive; backend also uses WebSocket sessions when STOMP connects. */
export function usePresenceHeartbeat() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const ping = () => {
      void presenceApi.heartbeat().catch(() => undefined);
    };

    ping();

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') ping();
    });

    const interval = setInterval(ping, HEARTBEAT_MS);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [status]);
}
