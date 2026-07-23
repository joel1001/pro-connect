import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { AppLanguage, LANGUAGES } from '@/i18n';
import { useLanguageStore } from '@/store/languageStore';
import { radius, spacing } from '@/theme';

export interface LanguagePickerButtonProps {
  /** Compact pill (flag only) vs full label. */
  variant?: 'compact' | 'full';
}

export function LanguagePickerButton({ variant = 'compact' }: LanguagePickerButtonProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguageStore();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const pick = async (code: AppLanguage) => {
    await setLanguage(code);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.select')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: variant === 'compact' ? spacing.sm : spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 18 }}>{current.flag}</Text>
        {variant === 'full' && (
          <Text variant="caption" weight="600">
            {current.nativeName}
          </Text>
        )}
        <Icon name="chevron-down" size={14} color={theme.colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingTop: spacing.lg,
              paddingHorizontal: spacing.lg,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
              maxHeight: '70%',
              ...(Platform.OS === 'web' ? { maxWidth: 440, alignSelf: 'center', width: '100%' } : {}),
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.borderStrong,
                }}
              />
            </View>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {t('language.select')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => {
                const active = lang.code === language;
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => pick(lang.code)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: active ? theme.colors.primarySurface : 'transparent',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{lang.nativeName}</Text>
                      <Text variant="caption" color="textSecondary">
                        {lang.name}
                      </Text>
                    </View>
                    {active && <Icon name="checkmark-circle" size={22} color={theme.colors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
