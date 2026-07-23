import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar, Icon, IconName, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  avatarName?: string;
  avatarUri?: string;
  accent?: string;
  right?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function ListRow({
  title,
  subtitle,
  icon,
  avatarName,
  avatarUri,
  accent,
  right,
  showChevron,
  onPress,
  onLongPress,
}: ListRowProps) {
  const theme = useTheme();
  const color = accent ?? theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
        opacity: pressed && onPress ? 0.7 : 1,
      })}
    >
      {(avatarName || avatarUri) && <Avatar name={avatarName} uri={avatarUri} size={42} />}
      {icon && !avatarName && !avatarUri && (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: `${color}1A`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={color} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle && (
          <Text variant="caption" color="textSecondary">
            {subtitle}
          </Text>
        )}
      </View>
      {right}
      {showChevron && <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />}
    </Pressable>
  );
}
