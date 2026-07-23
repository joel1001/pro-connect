import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, ScreenContainer, Spinner } from '@/components/atoms';
import { EmptyState, ListRow, SectionHeader, SegmentTabs } from '@/components/molecules';
import { paymentsApi } from '@/api/payments.api';
import { Payment } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function AdminDisputes() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('open');
  const [disputes, setDisputes] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.admin;

  useEffect(() => {
    Promise.all([paymentsApi.listDisputes(), paymentsApi.list()])
      .then(([d, all]) => {
        setDisputes(d);
        setAllPayments(all);
      })
      .catch(() => {
        setDisputes([]);
        setAllPayments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'open', label: t('screens.open') },
    { key: 'all', label: t('screens.all') },
  ];

  const shown = tab === 'open' ? disputes : allPayments.filter((p) => p.status === 'DISPUTE');

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.disputes')} />
      <SegmentTabs tabs={tabs} active={tab} onChange={setTab} accent={accent} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {shown.length === 0 ? (
          <EmptyState icon="alert-circle-outline" title="Sin disputas abiertas" />
        ) : (
          shown.map((p) => (
            <ListRow
              key={p.id}
              title={p.id}
              subtitle={`${p.clientId} vs ${p.professionalId} · $${Number(p.amount)}`}
              icon="alert-circle-outline"
              accent={accent}
              showChevron
            />
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}
