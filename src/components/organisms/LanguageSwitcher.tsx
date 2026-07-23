import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Card, Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { AppLanguage, LANGUAGES } from '@/i18n';
import { useLanguageStore } from '@/store/languageStore';
import { spacing } from '@/theme';

export function LanguageSwitcher() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon name="language-outline" size={18} color={theme.colors.primary} />
        <Text variant="bodyStrong">{t('language.title')}</Text>
      </View>

      <View style={{ gap: spacing.sm }}>
        {LANGUAGES.map((lang) => {
          const active = lang.code === language;
          return (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code as AppLanguage)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primarySurface : theme.colors.surface,
              }}
            >
              <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
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
      </View>
    </Card>
  );
}
