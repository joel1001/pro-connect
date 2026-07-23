import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, FadeInView, Text } from '@/components/atoms';
import { LanguagePickerButton } from '@/components/molecules/LanguagePickerButton';
import { BrandLogo } from '@/components/organisms/BrandLogo';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import { layout, spacing } from '@/theme';

export interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBrand?: boolean;
  /** Show back button. Defaults to true when navigation history exists. */
  showBack?: boolean;
  onBack?: () => void;
  /** Show compact language picker in the top bar. */
  showLanguage?: boolean;
}

/**
 * Auth/onboarding wrapper with mobile top bar (back + language), entrance
 * animations, and a centered card layout on desktop web.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  showBrand = true,
  showBack,
  onBack,
  showLanguage = true,
}: AuthLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { useDesktopLayout, isMobile } = useResponsive();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(router.canGoBack());
  }, [title]);

  const backVisible = showBack ?? canGoBack;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: useDesktopLayout ? theme.colors.surfaceAlt : theme.colors.background }}
    >
      {/* Top bar: back + language */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.sm,
          minHeight: 52,
        }}
      >
        <View style={{ minWidth: 44 }}>
          {backVisible && <BackButton onPress={onBack} compact={isMobile} />}
        </View>
        {showLanguage && <LanguagePickerButton variant={isMobile ? 'compact' : 'full'} />}
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: useDesktopLayout ? 'center' : 'flex-start',
          paddingTop: spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView style={{ width: '100%', maxWidth: layout.authCardWidth }}>
          <View
            style={[
              { width: '100%', gap: spacing.xl },
              useDesktopLayout && {
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: spacing.xxl,
                ...(theme.shadow.md as object),
              },
            ]}
          >
            {showBrand && (
              <FadeInView delay={80}>
                <View style={{ alignItems: useDesktopLayout ? 'center' : 'flex-start' }}>
                  <BrandLogo size="md" showTagline color={theme.colors.primary} />
                </View>
              </FadeInView>
            )}
            {(title || subtitle) && (
              <FadeInView delay={140}>
                <View style={{ gap: spacing.xs }}>
                  {title && <Text variant="h2">{title}</Text>}
                  {subtitle && (
                    <Text variant="body" color="textSecondary">
                      {subtitle}
                    </Text>
                  )}
                </View>
              </FadeInView>
            )}
            <FadeInView delay={200}>{children}</FadeInView>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
