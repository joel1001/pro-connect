import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { notificationsApi } from '@/api/notifications.api';
import { Badge, Button, Card, Divider, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, SectionHeader } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { getNotificationChatConversationId, internalHrefFromNotificationLink } from '@/lib/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import { radius, spacing } from '@/theme';
import { Notification } from '@/types';

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value?: string, locale = 'en') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = firstParam(params.id);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    notificationsApi
      .get(id)
      .then((item) => {
        setNotification(item.read ? item : { ...item, read: true });
        if (!item.read) {
          void useNotificationStore.getState().markRead(item.id);
        }
      })
      .catch((err) => setError(getApiErrorMessage(err, t('notifications.detailError'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  const actionHref = useMemo(
    () => internalHrefFromNotificationLink(notification?.link ?? notification?.metadata?.deepLink),
    [notification],
  );
  const conversationId = notification ? getNotificationChatConversationId(notification) : null;

  if (loading) {
    return (
      <ScreenContainer showBack>
        <Spinner />
      </ScreenContainer>
    );
  }

  if (!notification) {
    return (
      <ScreenContainer showBack>
        <EmptyState icon="notifications-outline" title={error ?? t('notifications.detailNotFound')} />
      </ScreenContainer>
    );
  }

  const openAction = () => {
    if (conversationId) {
      router.push({ pathname: '/shared/chat', params: { conversationId } } as never);
      return;
    }
    if (actionHref) {
      router.push(actionHref as never);
    }
  };

  return (
    <ScreenContainer showBack>
      <SectionHeader title={t('notifications.detailTitle')} subtitle={formatDate(notification.createdAt, i18n.language)} />
      <Card
        style={{
          gap: spacing.md,
          borderRadius: radius.xl,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: theme.colors.primarySurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="notifications-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">{notification.title}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Badge label={notification.type} tone="info" />
              <Badge label={notification.read ? t('screens.read') : t('screens.unread')} tone={notification.read ? 'neutral' : 'success'} />
            </View>
          </View>
        </View>
        <Divider />
        <Text color="textSecondary">{notification.body}</Text>
        {notification.referenceId ? (
          <Text variant="caption" color="textSecondary">
            {t('notifications.reference')}: {notification.referenceId}
          </Text>
        ) : null}
        {conversationId || actionHref ? (
          <Button
            label={conversationId ? t('notifications.openChat') : t('notifications.openRelated')}
            iconLeft={conversationId ? 'chatbubble-outline' : 'open-outline'}
            onPress={openAction}
          />
        ) : null}
      </Card>
    </ScreenContainer>
  );
}
