import { ReactNode, Ref } from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/atoms/BackButton';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import { layout, spacing } from '@/theme';

export interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Constrain content to a readable column and center it on wide web layouts. */
  centered?: boolean;
  maxWidth?: number;
  style?: ViewStyle;
  /** Show a back arrow at the top of the screen. */
  showBack?: boolean;
  onBack?: () => void;
  scrollRef?: Ref<ScrollView>;
}

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  centered = true,
  maxWidth = layout.maxContentWidth,
  style,
  showBack = false,
  onBack,
  scrollRef,
}: ScreenContainerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { useDesktopLayout } = useResponsive();

  const inner: ViewStyle = {
    width: '100%',
    maxWidth: centered ? maxWidth : undefined,
    alignSelf: 'center',
    padding: padded ? (useDesktopLayout ? spacing.xxl : spacing.lg) : 0,
    gap: spacing.lg,
  };

  const header = showBack ? <BackButton onPress={onBack} compact /> : null;
  const body = (
    <>
      {header}
      {children}
    </>
  );

  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }, style]}>
        <View style={[inner, { flex: 1, minHeight: 0 }]}>{body}</View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl }}
      showsVerticalScrollIndicator={useDesktopLayout}
    >
      <View style={[inner, style]}>{body}</View>
    </ScrollView>
  );
}
