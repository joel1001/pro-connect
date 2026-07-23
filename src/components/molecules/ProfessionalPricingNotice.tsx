import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Spinner, Text } from '@/components/atoms';
import { onboardingApi, ProfessionalPricingDisclosure } from '@/api/onboarding.api';
import { roleAccent, radius, spacing } from '@/theme';

type Props = {
  compact?: boolean;
  countryCode?: string;
};

function pct(rate: number) {
  return `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
}

export function ProfessionalPricingNotice({ compact, countryCode }: Props) {
  const { t } = useTranslation();
  const accent = roleAccent.professional;
  const [disclosure, setDisclosure] = useState<ProfessionalPricingDisclosure | null>(null);

  useEffect(() => {
    onboardingApi
      .pricingDisclosure(countryCode)
      .then(setDisclosure)
      .catch(() => setDisclosure(null));
  }, [countryCode]);

  if (!disclosure) {
    return compact ? null : <Spinner />;
  }

  const bullets = [
    t('registerPro.pricingNoticePlatform', { rate: pct(disclosure.platformCommissionRate) }),
    disclosure.marketplaceCommissionRate > 0
      ? t('registerPro.pricingNoticeMarketplace', { rate: pct(disclosure.marketplaceCommissionRate) })
      : null,
    t('registerPro.pricingNoticeAppStore', { rate: pct(disclosure.appStoreFeeRate) }),
    t('registerPro.pricingNoticeGooglePlay', { rate: pct(disclosure.googlePlayFeeRate) }),
    disclosure.defaultTaxRate > 0
      ? t('registerPro.pricingNoticeTaxExample', {
          country: disclosure.defaultCountryCode,
          rate: pct(disclosure.defaultTaxRate),
        })
      : t('registerPro.pricingNoticeTax'),
  ].filter(Boolean) as string[];

  return (
    <Card
      style={{
        gap: spacing.sm,
        borderColor: accent,
        borderWidth: 1,
        backgroundColor: '#F4FBF7',
        padding: compact ? spacing.md : spacing.lg,
        borderRadius: radius.lg,
      }}>
      <Text variant={compact ? 'bodyStrong' : 'title'}>{t('registerPro.pricingNoticeTitle')}</Text>
      <Text variant="caption" color="textSecondary" style={{ lineHeight: 20 }}>
        {compact ? t('registerPro.pricingNoticeCompactIntro') : t('registerPro.pricingNoticeIntro')}
      </Text>
      <View style={{ gap: spacing.xs }}>
        {bullets.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Text variant="caption" color="textSecondary">
              •
            </Text>
            <Text variant="caption" color="textSecondary" style={{ flex: 1, lineHeight: 20 }}>
              {line}
            </Text>
          </View>
        ))}
      </View>
      <Text variant="caption" color="textMuted" style={{ lineHeight: 20 }}>
        {t('registerPro.pricingNoticeFooter')}
      </Text>
    </Card>
  );
}
