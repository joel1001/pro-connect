import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { ListRow, SectionHeader } from '@/components/molecules';
import { paymentsApi } from '@/api/payments.api';
import { useTheme } from '@/hooks/useTheme';
import { Payment } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function ProfessionalFinances() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.professional;

  useEffect(() => {
    paymentsApi
      .list()
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const balance = useMemo(
    () =>
      payments
        .filter((p) => p.status === 'HELD' || p.status === 'RELEASED')
        .reduce((sum, p) => sum + Number(p.professionalNet ?? 0), 0),
    [payments],
  );

  const commissions = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.platformFee ?? 0), 0),
    [payments],
  );

  if (loading) {
    return (
      <ScreenContainer showBack>
        <Spinner />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showBack>
      <Card style={{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primaryDark, gap: spacing.sm }}>
        <Text variant="caption" style={{ color: theme.colors.onPrimary }}>{t('screens.availableBalance')}</Text>
        <Text variant="display" style={{ color: theme.colors.onPrimary }}>${balance.toFixed(2)}</Text>
        <Button label={t('screens.withdraw')} variant="secondary" fullWidth={false} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} />
      </Card>

      <SectionHeader title="Resumen" subtitle={`${payments.length} pagos registrados`} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        <ListRow title={t('screens.commissionsPaid')} right={<Text variant="bodyStrong">${commissions.toFixed(2)}</Text>} />
        {payments.slice(0, 8).map((p) => (
          <ListRow
            key={p.id}
            title={p.id}
            subtitle={`${p.status} · ${p.contractId}`}
            right={<Text variant="bodyStrong">${Number(p.professionalNet).toFixed(2)}</Text>}
          />
        ))}
      </Card>
    </ScreenContainer>
  );
}
