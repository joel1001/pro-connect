import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { presenceApi } from '@/api/presence.api';
import { bindNotificationRealtime, resetNotificationSession, useNotificationStore } from '@/store/notificationStore';
import { resetPresenceStore } from '@/store/presenceStore';
import { realtimeService } from '@/services/realtime';
import { useAuthStore } from '@/store/authStore';
import { onSessionRefreshed } from '@/lib/authSession';

/** Keeps STOMP connected and notification counts in sync while authenticated. */
export function useRealtimeConnection() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.user?.userId);
  const refresh = useNotificationStore((s) => s.refresh);

  useEffect(() => {
    if (status !== 'authenticated') {
      void realtimeService.shutdown();
      resetNotificationSession();
      resetPresenceStore();
      return;
    }

    realtimeService.resume();
    void realtimeService.connect();
    void refresh();
    void useNotificationStore.getState().loadInbox(true);

    const offSession = onSessionRefreshed(() => {
      void realtimeService.reconnect();
    });

    const offRealtime = bindNotificationRealtime(userId);

    return () => {
      offSession();
      offRealtime();
    };
  }, [status, userId, refresh]);

  useNotificationPolling();

  useEffect(() => {
    if (status !== 'authenticated') return;

    const onAppState = (next: AppStateStatus) => {
      if (next === 'background') {
        void presenceApi.offline().catch(() => undefined);
        void realtimeService.disconnect();
        return;
      }
      if (next === 'active') {
        realtimeService.resume();
        void realtimeService.reconnect();
        void refresh();
        void useNotificationStore.getState().loadInbox(true);
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [status, refresh]);
}
