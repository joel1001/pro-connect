import { Pressable, View } from 'react-native';

import { Icon, IconName, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export interface RoleCardProps {
  title: string;
  description: string;
  icon: IconName;
  accent: string;
  selected?: boolean;
  onPress?: () => void;
}

export function RoleCard({ title, description, icon, accent, selected, onPress }: RoleCardProps) {
  const theme = useTheme();
  const color = theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: selected ? color : theme.colors.border,
        backgroundColor: selected ? theme.colors.primarySurface : theme.colors.surface,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: theme.colors.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="title">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {description}
        </Text>
      </View>
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? color : theme.colors.borderStrong}
      />
    </Pressable>
  );
}
