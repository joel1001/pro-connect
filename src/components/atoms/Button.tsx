import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

import { Icon, IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  accentColor?: string;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { sm: 38, md: 48, lg: 54 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth = true,
  iconLeft,
  iconRight,
  accentColor,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.primary;

  const variants: Record<Variant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: accent, fg: theme.colors.onPrimary },
    secondary: { bg: theme.colors.surfaceSunken, fg: theme.colors.text },
    ghost: { bg: 'transparent', fg: accent },
    outline: { bg: 'transparent', fg: accent, border: accent },
    danger: { bg: theme.colors.danger, fg: '#fff' },
  };
  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          backgroundColor: v.bg,
          borderRadius: radius.md,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.lg : spacing.xl,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size={18} color={v.fg} />}
          <Text variant="bodyStrong" style={{ color: v.fg }}>
            {label}
          </Text>
          {iconRight && <Icon name={iconRight} size={18} color={v.fg} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
