import { Pressable, View, ViewStyle } from 'react-native';

import { Button, Icon, Text } from '@/components/atoms';
import { isConnectionError } from '@/api/client';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
};

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  retryLabel = 'Reintentar',
  style,
}: ErrorBannerProps) {
  const theme = useTheme();
  const icon = isConnectionError(message) ? 'cloud-offline-outline' : 'alert-circle-outline';

  return (
    <View
      accessibilityRole="alert"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: `${theme.colors.danger}12`,
          borderWidth: 1,
          borderColor: `${theme.colors.danger}40`,
        },
        style,
      ]}
    >
      <View style={{ marginTop: 2 }}>
        <Icon name={icon} size={20} color={theme.colors.danger} />
      </View>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text variant="caption" color="danger" weight="600">
          {message}
        </Text>
        {onRetry ? (
          <Button label={retryLabel} size="sm" variant="outline" onPress={onRetry} style={{ alignSelf: 'flex-start' }} />
        ) : null}
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss">
          <Icon name="close" size={18} color={theme.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
