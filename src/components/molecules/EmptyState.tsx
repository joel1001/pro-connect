import { View } from 'react-native';

import { Icon, IconName, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
}

export function EmptyState({ icon = 'file-tray-outline', title, message }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={28} color={theme.colors.textMuted} />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      {message && (
        <Text variant="caption" color="textSecondary" center style={{ maxWidth: 320 }}>
          {message}
        </Text>
      )}
    </View>
  );
}
