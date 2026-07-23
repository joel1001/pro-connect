import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, Card, ScreenContainer, Spinner } from '@/components/atoms';
import { EmptyState, ListRow, SectionHeader, SegmentTabs } from '@/components/molecules';
import { MonthlyTaxInvoiceGenerator } from '@/components/organisms/MonthlyTaxInvoiceGenerator';
import { contractsApi } from '@/api/contracts.api';
import { contractServiceIds } from '@/lib/contractServices';
import { Contract, ContractStatus } from '@/types';
import { roleAccent, spacing } from '@/theme';

const STATUS_MAP = {
  all: null,
  active: ['SIGNED', 'PENDING_SIGNATURE'] as ContractStatus[],
  completed: ['COMPLETED'] as ContractStatus[],
  pending: ['DRAFT'] as ContractStatus[],
} as const;

type ClientContractTab = keyof typeof STATUS_MAP;

function normalizeContractTab(value?: string | string[]): ClientContractTab {
  const key = Array.isArray(value) ? value[0] : value;
  return key === 'all' || key === 'completed' || key === 'pending' ? key : 'active';
}

export default function ClientContracts() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: string | string[] }>();
  const [tab, setTab] = useState<ClientContractTab>(() => normalizeContractTab(params.filter));
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.client;

  useEffect(() => {
    contractsApi
      .list()
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTab(normalizeContractTab(params.filter));
  }, [params.filter]);

  const tabs = [
    { key: 'all', label: t('screens.all') },
    { key: 'active', label: t('screens.active') },
    { key: 'completed', label: t('screens.completed') },
    { key: 'pending', label: t('screens.pending') },
  ];

  const filtered = contracts.filter((c) => {
    const allowed = STATUS_MAP[tab];
    return !allowed || allowed.includes(c.status);
  });

  const changeTab = (key: string) => {
    const nextTab = normalizeContractTab(key);
    setTab(nextTab);
    router.setParams({ filter: nextTab });
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.contracts')} subtitle="Contratos digitales con firma" />
      <MonthlyTaxInvoiceGenerator role="client" accent={accent} />
      <SegmentTabs tabs={tabs} active={tab} onChange={changeTab} accent={accent} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {filtered.length === 0 ? (
          <EmptyState icon="document-text-outline" title={t('client.noResults')} />
        ) : (
          filtered.map((c) => (
            <ListRow
              key={c.id}
              title={c.id}
              subtitle={`${contractServiceIds(c).length} ${t('client.contract.services').toLowerCase()} · ${c.scheduledDate} · ${c.status}`}
              icon="document-text-outline"
              accent={accent}
              right={<Badge label={`$${Number(c.amount)}`} tone="info" />}
              showChevron
              onPress={() => router.push(`/client/contract/${c.id}` as never)}
            />
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}
