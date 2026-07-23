import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Icon, Text } from '@/components/atoms';
import { ProfessionalPricingNotice } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { CREDENTIAL_START } from '@/lib/credentialFlow';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export default function RegisterProfessionalNotice() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <AuthLayout
      title={t('registerPro.noticeTitle')}
      subtitle={t('registerPro.noticeSubtitle')}
      showBrand={false}
    >
      <View style={{ gap: spacing.md }}>
        <Card style={{ gap: spacing.md, alignItems: 'center', paddingVertical: spacing.xl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: theme.colors.primarySurface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="time-outline" size={36} color={theme.colors.primary} />
          </View>
          <Text variant="body" center color="textSecondary" style={{ lineHeight: 22 }}>
            {t('registerPro.noticeBody')}
          </Text>
          <Text variant="caption" center color="textMuted">
            {t('registerPro.noticeHint')}
          </Text>
        </Card>
        <ProfessionalPricingNotice />
        <Button
          label={t('registerPro.noticeContinue')}
          iconRight="arrow-forward"
          onPress={() => router.push(CREDENTIAL_START as never)}
        />
      </View>
    </AuthLayout>
  );
}
