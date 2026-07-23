import { Platform, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { Text } from './Text';

type CountBadgeSize = 'sm' | 'md';

export interface CountBadgeProps {
  count: number;
  color?: string;
  size?: CountBadgeSize;
}

const SIZES: Record<CountBadgeSize, { box: number; font: number; pad: number }> = {
  sm: { box: 18, font: 10, pad: 4 },
  md: { box: 22, font: 11, pad: 5 },
};

/** Circular numeric badge with centered label (tab bar, inbox rows). */
export function CountBadge({ count, color, size = 'md' }: CountBadgeProps) {
  const theme = useTheme();
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);
  const { box, font, pad } = SIZES[size];
  const wide = label.length > 1;
  const badgeColor = theme.colors.primary;

  return (
    <View
      style={{
        minWidth: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: badgeColor,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wide ? pad : 0,
      }}
    >
      <Text
        style={{
          color: theme.colors.onPrimary,
          fontSize: font,
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: font + 1,
          minWidth: wide ? font * label.length * 0.8 : font,
          ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
        }}
      >
        {label}
      </Text>
    </View>
  );
}
