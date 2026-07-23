import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationStore } from '@/store/notificationStore';
import { radius, spacing } from '@/theme';

export function InAppNotificationBanner() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useNotificationStore((s) => s.pendingAlert);
  const dismissAlert = useNotificationStore((s) => s.dismissAlert);

  if (!alert) return null;

  const open = () => {
    dismissAlert();
    if (alert.conversationId) {
      router.push({
        pathname: '/shared/chat',
        params: { conversationId: alert.conversationId },
      } as never);
      return;
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + spacing.sm,
        left: spacing.md,
        right: spacing.md,
        zIndex: 100,
      }}
    >
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={t('notifications.bannerOpen')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: radius.lg,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${theme.colors.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {alert.title}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {alert.body}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            dismissAlert();
          }}
          hitSlop={12}
          accessibilityLabel={t('notifications.bannerDismiss')}
        >
          <Icon name="close-outline" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </Pressable>
    </View>
  );
}
