import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

const POLL_INTERVAL_MS = 8_000;

/** Polls unread notifications and inbox when WebSocket delivery is unavailable. */
export function useNotificationPolling() {
  const status = useAuthStore((s) => s.status);
  const refresh = useNotificationStore((s) => s.refresh);
  const loadInbox = useNotificationStore((s) => s.loadInbox);

  useEffect(() => {
    if (status !== 'authenticated') return;

    void refresh();
    void loadInbox(true);

    const sync = () => {
      void refresh();
      void loadInbox(true);
    };

    const interval = setInterval(sync, POLL_INTERVAL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') sync();
    };

    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [status, refresh, loadInbox]);
}
