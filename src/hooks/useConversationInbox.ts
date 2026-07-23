import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { useNotificationStore } from '@/store/notificationStore';

/** Shared inbox backed by the global notification store (live WS + polling). */
export function useConversationInbox() {
  const conversations = useNotificationStore((s) => s.inboxConversations);
  const loading = useNotificationStore((s) => s.inboxLoading);
  const loadInbox = useNotificationStore((s) => s.loadInbox);
  const refresh = useNotificationStore((s) => s.refresh);

  const reload = useCallback(() => {
    void loadInbox();
    void refresh();
  }, [loadInbox, refresh]);

  useFocusEffect(
    useCallback(() => {
      void loadInbox();
      void refresh();
    }, [loadInbox, refresh]),
  );

  return { conversations, loading, reload };
}
