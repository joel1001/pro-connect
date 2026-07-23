import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  /** Icon-only on narrow screens when true. */
  compact?: boolean;
}

export function BackButton({ onPress, style, compact }: BackButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    if (onPress) onPress();
    else if (router.canGoBack()) router.back();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={8}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingVertical: spacing.sm,
          paddingRight: spacing.sm,
          opacity: pressed ? 0.65 : 1,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: theme.colors.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevron-back" size={22} color={theme.colors.text} />
      </View>
      {!compact && (
        <Text variant="bodyStrong" color="textSecondary">
          {t('common.back')}
        </Text>
      )}
    </Pressable>
  );
}
