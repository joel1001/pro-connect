import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { adminApi } from '@/api/admin.api';
import { getApiErrorMessage } from '@/api/client';
import { paymentsApi } from '@/api/payments.api';
import { Card, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SectionHeader, StatCard } from '@/components/molecules';
import { modulesForRole } from '@/config/adminModules';
import { roleAccent, spacing } from '@/theme';
import { Payment, UserSummary } from '@/types';

const REVENUE_PAYMENT_STATUSES: Payment['status'][] = ['HELD', 'RELEASED'];

function compactNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

function formatMoney(value: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function paymentRevenueDate(payment: Payment) {
  return payment.heldAt ?? payment.releasedAt ?? payment.createdAt;
}

function isCurrentMonth(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function SuperAdminDashboard() {
  const { t } = useTranslation();
  const accent = roleAccent.superAdmin;
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    Promise.all([adminApi.listUsers(), paymentsApi.list()])
      .then(([nextUsers, nextPayments]) => {
        if (!mounted) return;
        setUsers(nextUsers);
        setPayments(nextPayments);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(getApiErrorMessage(err, t('errors.generic')));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t]);

  const stats = useMemo(() => {
    const revenuePayments = payments.filter(
      (payment) => REVENUE_PAYMENT_STATUSES.includes(payment.status) && isCurrentMonth(paymentRevenueDate(payment)),
    );
    const currency = revenuePayments.find((payment) => payment.currency)?.currency ?? 'USD';
    const platformRevenue = revenuePayments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
    const commissionRevenue = revenuePayments.reduce((sum, payment) => sum + Number(payment.platformFee ?? 0), 0);
    const clients = users.filter((user) => user.role === 'CLIENT').length;
    const professionals = users.filter((user) => user.role === 'PROFESSIONAL').length;

    return {
      platformRevenue: formatMoney(platformRevenue, currency),
      commissionRevenue: formatMoney(commissionRevenue, currency),
      clients: compactNumber(clients),
      professionals: compactNumber(professionals),
    };
  }, [payments, users]);

  const moduleRoute = (key: string) => {
    if (key === 'users') return '/super-admin/users';
    if (key === 'verifications') return '/super-admin/verifications';
    if (key === 'disputes') return '/super-admin/disputes';
    return `/super-admin/${key}`;
  };

  return (
    <ScreenContainer>
      <SectionHeader title={t('admin.superDashboardTitle')} subtitle={t('admin.superDashboardSubtitle')} />

      {error && (
        <Card style={{ borderColor: '#EF4444' }}>
          <Text color="danger">{error}</Text>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
        <StatCard label={t('admin.stats.platformRevenue')} value={loading ? '…' : stats.platformRevenue} icon="cash-outline" accent={accent} />
        <StatCard label={t('admin.stats.commissionRevenue')} value={loading ? '…' : stats.commissionRevenue} icon="trending-up-outline" accent={accent} />
        <StatCard label={t('admin.stats.clients')} value={loading ? '…' : stats.clients} icon="people-outline" accent={accent} />
        <StatCard label={t('admin.stats.professionals')} value={loading ? '…' : stats.professionals} icon="briefcase-outline" accent={accent} />
      </View>

      <SectionHeader title={t('admin.modulesTitle')} subtitle={t('admin.superModulesSubtitle')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {modulesForRole('SUPER_ADMIN').map((module) => (
          <ListRow
            key={module.key}
            title={t(module.titleKey)}
            subtitle={module.permissions.join(' · ')}
            icon={module.icon}
            accent={accent}
            showChevron
            onPress={() => router.push(moduleRoute(module.key) as never)}
            right={<Text variant="label" style={{ color: accent }}>{module.critical ? t('admin.critical') : t('admin.operational')}</Text>}
          />
        ))}
        <ListRow title={t('nav.commissions')} subtitle={t('admin.configuration.commissions')} icon="cash-outline" accent={accent} showChevron onPress={() => router.push('/super-admin/commissions' as never)} />
        <ListRow title={t('nav.plans')} subtitle={t('admin.configuration.plans')} icon="pricetags-outline" accent={accent} showChevron onPress={() => router.push('/super-admin/plans' as never)} />
        <ListRow title={t('nav.categories')} subtitle={t('admin.configuration.categories')} icon="list-outline" accent={accent} showChevron onPress={() => router.push('/super-admin/categories' as never)} />
      </Card>
    </ScreenContainer>
  );
}
