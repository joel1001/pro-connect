import { Pressable, View } from 'react-native';

import { Text } from '@/components/atoms';
import { spacing } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="h3">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text variant="bodyStrong" color="primary">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
