import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { notificationsApi } from '@/api/notifications.api';
import { Card, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, SectionHeader, SegmentTabs } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { getNotificationChatConversationId } from '@/lib/notifications';
import { realtimeService } from '@/services/realtime';
import { useNotificationStore } from '@/store/notificationStore';
import { spacing } from '@/theme';
import { Notification } from '@/types';

export function NotificationsView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void useNotificationStore.getState().refresh();
    notificationsApi
      .list(tab === 'unread')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return realtimeService.onNotification((notification) => {
      useNotificationStore.getState().applyNotification(notification);
      setItems((prev) => {
        if (tab === 'unread' && notification.read) return prev;
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    });
  }, [tab]);

  const openNotification = (notification: Notification) => {
    if (!notification.read) {
      setItems((prev) =>
        tab === 'unread'
          ? prev.filter((item) => item.id !== notification.id)
          : prev.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
      void useNotificationStore.getState().markRead(notification.id);
    }

    const conversationId = getNotificationChatConversationId(notification);
    if (conversationId) {
      router.push({ pathname: '/shared/chat', params: { conversationId } } as never);
      return;
    }

    router.push({ pathname: '/shared/notification/[id]', params: { id: notification.id } } as never);
  };

  const tabs = [
    { key: 'all', label: t('screens.all') },
    { key: 'unread', label: t('screens.unread') },
  ];

  if (loading) {
    return (
      <ScreenContainer showBack>
        <Spinner />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showBack>
      <SectionHeader title={t('nav.notifications')} />
      <SegmentTabs tabs={tabs} active={tab} onChange={setTab} />
      <Card padded={false}>
        {items.length === 0 ? (
          <EmptyState icon="notifications-outline" title={t('client.noResults')} />
        ) : (
          items.map((notification) => {
            const conversationId = getNotificationChatConversationId(notification);
            return (
              <Pressable key={notification.id} onPress={() => openNotification(notification)}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: spacing.md,
                    padding: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    opacity: notification.read ? 0.7 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: theme.colors.primarySurface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={conversationId ? 'chatbubble-outline' : 'notifications-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{notification.title}</Text>
                    <Text variant="caption" color="textSecondary">
                      {notification.body}
                    </Text>
                  </View>
                  {!notification.read && (
                    <View
                      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 6 }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </Card>
    </ScreenContainer>
  );
}
