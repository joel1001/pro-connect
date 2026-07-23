import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { adminApi } from '@/api/admin.api';
import { paymentsApi } from '@/api/payments.api';
import { verificationsApi } from '@/api/verifications.api';
import { Card, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SectionHeader, StatCard } from '@/components/molecules';
import { modulesForRole } from '@/config/adminModules';
import { UserSummary, Verification, Payment } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const accent = roleAccent.admin;
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [disputes, setDisputes] = useState<Payment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      adminApi.listUsers().catch(() => []),
      verificationsApi.list('PENDING').catch(() => []),
      paymentsApi.listDisputes().catch(() => []),
      paymentsApi.list().catch(() => []),
    ]).then(([usersData, verificationData, disputeData, paymentData]) => {
      if (cancelled) return;
      setUsers(usersData);
      setVerifications(verificationData);
      setDisputes(disputeData);
      setPayments(paymentData);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeProfessionals = useMemo(
    () => users.filter((user) => user.role === 'PROFESSIONAL' && user.status === 'ACTIVE').length,
    [users],
  );

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return payments
      .filter((payment) => {
        if (!payment.createdAt) return false;
        const createdAt = new Date(payment.createdAt);
        return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
      })
      .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  }, [payments]);

  return (
    <ScreenContainer>
      <SectionHeader title={t('admin.dashboardTitle')} subtitle={t('admin.dashboardSubtitle')} />

      <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
        <StatCard label={t('admin.stats.pendingVerifications')} value={String(verifications.length)} icon="checkmark-done-outline" accent={accent} />
        <StatCard label={t('admin.stats.activeProfessionals')} value={String(activeProfessionals)} icon="people-outline" accent={accent} />
        <StatCard label={t('admin.stats.openDisputes')} value={String(disputes.length)} icon="alert-circle-outline" accent={accent} />
        <StatCard label={t('admin.stats.monthlyRevenue')} value={`$${monthlyRevenue.toLocaleString('en-US')}`} icon="cash-outline" accent={accent} />
      </View>

      <SectionHeader title={t('admin.actionQueue')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        <ListRow title={t('admin.queue.verifications')} subtitle={t('admin.queue.pendingCount', { count: verifications.length })} icon="shield-checkmark-outline" accent={accent} showChevron onPress={() => router.push('/admin/verifications' as never)} />
        <ListRow title={t('admin.queue.disputes')} subtitle={t('admin.queue.openCount', { count: disputes.length })} icon="alert-circle-outline" accent={accent} showChevron onPress={() => router.push('/admin/disputes' as never)} />
        <ListRow title={t('admin.queue.users')} subtitle={t('admin.queue.usersHint')} icon="people-outline" accent={accent} showChevron onPress={() => router.push('/admin/users' as never)} />
      </Card>

      <SectionHeader title={t('admin.modulesTitle')} subtitle={t('admin.modulesSubtitle')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {modulesForRole('ADMIN').map((module) => (
          <ListRow
            key={module.key}
            title={t(module.titleKey)}
            subtitle={module.permissions.join(' · ')}
            icon={module.icon}
            accent={accent}
            showChevron
            onPress={() => router.push(module.route as never)}
            right={<Text variant="label" style={{ color: accent }}>{module.permissions.length}</Text>}
          />
        ))}
      </Card>
    </ScreenContainer>
  );
}
