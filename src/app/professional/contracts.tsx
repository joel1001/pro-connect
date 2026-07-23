import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Card, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, SectionHeader, SegmentTabs } from '@/components/molecules';
import { MonthlyTaxInvoiceGenerator } from '@/components/organisms/MonthlyTaxInvoiceGenerator';
import { contractsApi } from '@/api/contracts.api';
import { paymentsApi } from '@/api/payments.api';
import { useTheme } from '@/hooks/useTheme';
import { Contract, Payment } from '@/types';
import { radius, roleAccent, spacing } from '@/theme';

type ContractTab = 'active' | 'completed' | 'cancelled';
const PAID_PAYMENT_STATUSES = new Set<Payment['status']>(['HELD', 'RELEASED']);

function normalizeContractTab(value?: string | string[]): ContractTab {
  const key = Array.isArray(value) ? value[0] : value;
  return key === 'completed' || key === 'cancelled' ? key : 'active';
}

function shortContractId(value?: string) {
  return value ? value.replace(/^ctr_/, '').slice(0, 8).toUpperCase() : '—';
}

function getContractPayment(contract: Contract, paymentsByContractId: Record<string, Payment>, paymentsById: Record<string, Payment>) {
  if (contract.paymentId && paymentsById[contract.paymentId]) return paymentsById[contract.paymentId];
  return paymentsByContractId[contract.id];
}

function hasConfirmedPayment(contract: Contract, paymentsByContractId: Record<string, Payment>, paymentsById: Record<string, Payment>) {
  const payment = getContractPayment(contract, paymentsByContractId, paymentsById);
  return payment ? PAID_PAYMENT_STATUSES.has(payment.status) : false;
}

function contractTitle(contract: Contract, isPaid: boolean, t: (key: string) => string) {
  if (isPaid) return t('professional.contracts.paidTitle');
  if (contract.status === 'COMPLETED') return t('professional.contracts.completedTitle');
  if (contract.status === 'CANCELLED') return t('professional.contracts.cancelledTitle');
  if (contract.status === 'PENDING_SIGNATURE') return t('professional.contracts.pendingSignatureTitle');
  if (contract.status === 'SIGNED') return t('professional.contracts.signedTitle');
  return t('professional.contracts.draftTitle');
}

function contractStatusStampLabel(contract: Contract, isPaid: boolean, t: (key: string) => string) {
  if (isPaid) return t('professional.contracts.stampPaid');
  if (contract.status === 'COMPLETED') return t('professional.contracts.stampCompleted');
  if (contract.status === 'CANCELLED') return t('professional.contracts.stampCancelled');
  if (contract.status === 'PENDING_SIGNATURE') return t('professional.contracts.stampPending');
  if (contract.status === 'SIGNED') return t('professional.contracts.stampSigned');
  return t('professional.contracts.stampDraft');
}

function contractStatusStampColor(contract: Contract, isPaid: boolean, accent: string, theme: ReturnType<typeof useTheme>) {
  if (isPaid) return theme.colors.success;
  if (contract.status === 'COMPLETED' || contract.status === 'SIGNED') return theme.colors.success;
  if (contract.status === 'CANCELLED') return theme.colors.danger;
  if (contract.status === 'PENDING_SIGNATURE') return theme.colors.warning;
  return accent;
}

function ContractStatusStamp({ contract, isPaid, accent }: { contract: Contract; isPaid: boolean; accent: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = contractStatusStampColor(contract, isPaid, accent, theme);

  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        borderWidth: 2,
        borderColor: `${color}B8`,
        backgroundColor: `${color}10`,
        transform: [{ rotate: '-8deg' }],
        alignSelf: 'flex-start',
      }}
    >
      <Text
        variant="label"
        style={{
          color,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {contractStatusStampLabel(contract, isPaid, t)}
      </Text>
    </View>
  );
}

function formatContractDate(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProfessionalContracts() {
  const { t } = useTranslation();
  const theme = useTheme();
  const params = useLocalSearchParams<{ filter?: string | string[] }>();
  const [tab, setTab] = useState<ContractTab>(() => normalizeContractTab(params.filter));
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.professional;

  useEffect(() => {
    Promise.all([contractsApi.list(), paymentsApi.list()])
      .then(([nextContracts, nextPayments]) => {
        setContracts(nextContracts);
        setPayments(nextPayments);
      })
      .catch(() => {
        setContracts([]);
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTab(normalizeContractTab(params.filter));
  }, [params.filter]);

  const tabs = [
    { key: 'active', label: t('screens.active') },
    { key: 'completed', label: t('screens.completed') },
    { key: 'cancelled', label: t('screens.cancelled') },
  ];

  const paymentsByContractId = useMemo(
    () => Object.fromEntries(payments.map((payment) => [payment.contractId, payment])),
    [payments],
  );
  const paymentsById = useMemo(() => Object.fromEntries(payments.map((payment) => [payment.id, payment])), [payments]);

  const filtered = contracts.filter((c) => {
    const isPaid = hasConfirmedPayment(c, paymentsByContractId, paymentsById);
    if (tab === 'active') return !isPaid && !['DRAFT', 'CANCELLED', 'DISPUTE'].includes(c.status);
    if (tab === 'completed') return isPaid;
    return c.status === 'CANCELLED';
  });

  const changeTab = (key: string) => {
    const nextTab = normalizeContractTab(key);
    setTab(nextTab);
    router.setParams({ filter: nextTab });
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer>
      <SectionHeader title={t('nav.contracts')} />
      <MonthlyTaxInvoiceGenerator role="professional" accent={accent} />
      <SegmentTabs tabs={tabs} active={tab} onChange={changeTab} accent={accent} />
      <Card padded={false} style={{ padding: spacing.sm, gap: spacing.sm, backgroundColor: theme.colors.primarySurface }}>
        {filtered.length === 0 ? (
          <EmptyState icon="document-text-outline" title={t('client.noResults')} />
        ) : (
          filtered.map((c) => {
            const isPaid = hasConfirmedPayment(c, paymentsByContractId, paymentsById);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/professional/contract/${c.id}` as never)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    borderRadius: radius.lg,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: `${accent}18`,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 16,
                      backgroundColor: `${accent}14`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="document-text-outline" size={21} color={accent} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {contractTitle(c, isPaid, t)}
                    </Text>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {t('professional.contracts.clientLine', { client: c.clientId, date: formatContractDate(c.scheduledDate) })}
                    </Text>
                    <Text variant="caption" color="textMuted">
                      {t('client.contract.reference')}: {shortContractId(c.id)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', paddingTop: 2 }}>
                      <ContractStatusStamp contract={c} isPaid={isPaid} accent={accent} />
                      <Badge label={`$${Number(c.amount)}`} tone="info" />
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </View>
              </Pressable>
            );
          })
        )}
      </Card>
    </ScreenContainer>
  );
}
