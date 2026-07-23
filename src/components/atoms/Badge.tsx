import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

import { Icon, IconName } from './Icon';
import { Text } from './Text';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface BadgeProps {
  label: string;
  tone?: Tone;
  icon?: IconName;
  solid?: boolean;
  color?: string;
}

export function Badge({ label, tone = 'neutral', icon, solid, color }: BadgeProps) {
  const theme = useTheme();
  const toneColor =
    color ??
    {
      neutral: theme.colors.textSecondary,
      success: theme.colors.success,
      warning: theme.colors.warning,
      danger: theme.colors.danger,
      info: theme.colors.info,
      primary: theme.colors.primary,
    }[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: solid ? toneColor : `${toneColor}1A`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.pill,
      }}
    >
      {icon && <Icon name={icon} size={12} color={solid ? '#fff' : toneColor} />}
      <Text variant="label" style={{ color: solid ? '#fff' : toneColor }}>
        {label}
      </Text>
    </View>
  );
}
