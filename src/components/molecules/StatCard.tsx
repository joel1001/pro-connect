import { View, ViewStyle } from 'react-native';

import { Card, Icon, IconName, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export interface StatCardProps {
  label: string;
  value: string;
  icon?: IconName;
  accent?: string;
  delta?: string;
  deltaPositive?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, accent, delta, deltaPositive, style, onPress }: StatCardProps) {
  const theme = useTheme();
  const color = accent ?? theme.colors.primary;
  return (
    <Card onPress={onPress} style={{ flex: 1, minWidth: 150, gap: spacing.sm, ...style }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
        <Text variant="caption" color="textSecondary" style={{ flex: 1, paddingRight: spacing.xs }}>
          {label}
        </Text>
        {icon && (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: `${color}1A`,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={icon} size={18} color={color} />
          </View>
        )}
      </View>
      <Text variant="h2">{value}</Text>
      {delta && (
        <Text variant="caption" color={deltaPositive ? 'success' : 'danger'}>
          {delta}
        </Text>
      )}
    </Card>
  );
}
