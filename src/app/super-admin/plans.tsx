import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { adminApi } from '@/api/admin.api';
import { AppSettings } from '@/types';
import { roleAccent, spacing } from '@/theme';

const PLANS = [
  { key: 'FREE', labelKey: 'screens.freePlan', commissionKey: 'freeCommission' as const },
  { key: 'PRO', labelKey: 'screens.proPlan', commissionKey: 'proCommission' as const },
  { key: 'PREMIUM', labelKey: 'screens.premiumPlan', commissionKey: 'premiumCommission' as const },
];

export default function SuperAdminPlans() {
  const { t } = useTranslation();
  const accent = roleAccent.superAdmin;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner fullscreen />;
  if (!settings) return null;

  return (
    <ScreenContainer scroll>
      <SectionHeader title={t('nav.plans')} subtitle="Comisiones por plan desde la API" />
      {PLANS.map((plan) => (
        <Card key={plan.key} style={{ gap: spacing.md, borderWidth: plan.key === 'PRO' ? 2 : 0, borderColor: accent }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="title">{t(plan.labelKey)}</Text>
            <Badge label={`${settings[plan.commissionKey]}% ${t('screens.commissionLabel')}`} tone="info" />
          </View>
          <Button label={t('screens.edit')} variant="outline" accentColor={accent} size="sm" />
        </Card>
      ))}
    </ScreenContainer>
  );
}
