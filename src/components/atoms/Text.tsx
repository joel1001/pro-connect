import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { typography } from '@/theme';

type Variant = keyof typeof typography;
type ColorKey = 'text' | 'textSecondary' | 'textMuted' | 'textInverse' | 'primary' | 'danger' | 'success' | 'warning';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey;
  center?: boolean;
  weight?: '400' | '500' | '600' | '700';
}

export function Text({
  variant = 'body',
  color = 'text',
  center,
  weight,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        typography[variant],
        { color: theme.colors[color] },
        center && { textAlign: 'center' },
        weight && { fontWeight: weight },
        style,
      ]}
      {...rest}
    />
  );
}
