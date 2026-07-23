import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, FadeInView, Icon, IconName, Text } from '@/components/atoms';
import { AuthLayout } from '@/components/templates';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

const slides: { icon: IconName; titleKey: string; textKey: string }[] = [
  { icon: 'shield-checkmark', titleKey: 'onboarding.verifiedTitle', textKey: 'onboarding.verifiedText' },
  { icon: 'navigate', titleKey: 'onboarding.nearbyTitle', textKey: 'onboarding.nearbyText' },
  { icon: 'lock-closed', titleKey: 'onboarding.paymentsTitle', textKey: 'onboarding.paymentsText' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <AuthLayout title={t('onboarding.title')} subtitle={t('onboarding.subtitle')} showBack={false}>
      <View style={{ gap: spacing.md }}>
        {slides.map((s, index) => (
          <FadeInView key={s.titleKey} delay={260 + index * 80}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: theme.colors.primarySurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={s.icon} size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{t(s.titleKey)}</Text>
                <Text variant="caption" color="textSecondary">
                  {t(s.textKey)}
                </Text>
              </View>
            </Card>
          </FadeInView>
        ))}
      </View>

      <FadeInView delay={560}>
        <View style={{ gap: spacing.sm }}>
          <Button label={t('onboarding.start')} iconRight="arrow-forward" onPress={() => router.push('/(auth)/role-select')} />
          <Button label={t('onboarding.haveAccount')} variant="ghost" onPress={() => router.push('/(auth)/login')} />
        </View>
      </FadeInView>
    </AuthLayout>
  );
}
