import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { contractsApi } from '@/api/contracts.api';
import { reviewsApi } from '@/api/reviews.api';
import { servicesApi } from '@/api/services.api';
import { Card, Icon, IconName, ScreenContainer, Text } from '@/components/atoms';
import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { Appointment, Contract, Review, Service } from '@/types';
import { radius, spacing } from '@/theme';

const OPEN_APPOINTMENT_STATUSES = new Set([
  'PENDING',
  'PENDING_CLIENT_RESPONSE',
  'PENDING_PROFESSIONAL_RESPONSE',
  'COUNTER_PROPOSED',
  'ACCEPTED',
  'CONFIRMED',
  'MODIFIED',
]);

const INCOME_APPOINTMENT_STATUSES = new Set<Appointment['status']>(['CONFIRMED', 'COMPLETED']);

const UPCOMING_JOB_STATUS_PRIORITY: Partial<Record<Appointment['status'], number>> = {
  PENDING_PROFESSIONAL_RESPONSE: 0,
  PENDING: 0,
  COUNTER_PROPOSED: 0,
  MODIFIED: 0,
  PENDING_CLIENT_RESPONSE: 1,
  ACCEPTED: 2,
  CONFIRMED: 2,
};

function appointmentDatePart(value?: string) {
  if (!value) return null;
  return value.includes('T') ? value.slice(0, 10) : value;
}

function appointmentTimePart(value?: string) {
  if (!value) return '00:00';
  if (!value.includes('T')) return value.slice(0, 5);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '00:00' : parsed.toISOString().slice(11, 16);
}

function appointmentMoment(appointment: Appointment): number {
  const date = appointmentDatePart(appointment.active?.date);
  const time = appointmentTimePart(appointment.active?.time);
  const candidate = date ? `${date}T${time}:00` : (appointment.updatedAt ?? appointment.createdAt ?? '');
  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isUpcomingAppointment(appointment: Appointment) {
  const moment = appointmentMoment(appointment);
  if (!moment) return false;
  return moment >= Date.now();
}

function appointmentActivityMoment(appointment: Appointment) {
  const parsed = Date.parse(appointment.updatedAt ?? appointment.createdAt ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function upcomingJobPriority(appointment: Appointment) {
  return UPCOMING_JOB_STATUS_PRIORITY[appointment.status] ?? 99;
}

function compareUpcomingJobs(left: Appointment, right: Appointment) {
  const priorityDiff = upcomingJobPriority(left) - upcomingJobPriority(right);
  if (priorityDiff !== 0) return priorityDiff;

  const activityDiff = appointmentActivityMoment(right) - appointmentActivityMoment(left);
  if (activityDiff !== 0) return activityDiff;

  return appointmentMoment(left) - appointmentMoment(right);
}

function appointmentMonthSource(appointment: Appointment) {
  return appointment.active?.date || appointment.updatedAt || appointment.createdAt || '';
}

function isAppointmentInCurrentMonth(appointment: Appointment, now: Date) {
  const source = appointmentMonthSource(appointment);
  if (!source) return false;
  const parsed = new Date(source.includes('T') ? source : `${source}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth();
}

function serviceAmountById(services: Service[]) {
  return services.reduce<Record<string, number>>((map, service) => {
    map[service.id] = Number(service.price ?? 0);
    return map;
  }, {});
}

function appointmentServiceAmount(appointment: Appointment, pricesByServiceId: Record<string, number>) {
  return (appointment.active?.serviceIds ?? []).reduce((sum, serviceId) => sum + (pricesByServiceId[serviceId] ?? 0), 0);
}

function appointmentStatusLabel(status: Appointment['status'], t: (key: string) => string) {
  return t(`appointments.status.${status}`);
}

function shortId(value?: string) {
  return value ? value.replace(/^apt_/, '').slice(0, 8).toUpperCase() : '—';
}

function appointmentServiceNames(appointment: Appointment, services: Service[]) {
  const ids = appointment.active?.serviceIds ?? [];
  if (!ids.length) return [];
  const byId = services.reduce<Record<string, string>>((map, service) => {
    map[service.id] = service.name;
    return map;
  }, {});
  return ids.map((id) => byId[id]).filter(Boolean);
}

function appointmentTitle(appointment: Appointment, services: Service[], t: (key: string, params?: Record<string, string>) => string) {
  const serviceNames = appointmentServiceNames(appointment, services);
  if (serviceNames.length) return serviceNames.slice(0, 2).join(' + ');
  if (appointment.active?.notes?.trim()) return appointment.active.notes.trim();
  return t('appointments.jobTitleFallback', { code: shortId(appointment.id) });
}

function formatAppointmentDateTime(appointment: Appointment, locale: string, fallback: string) {
  const date = appointmentDatePart(appointment.active?.date);
  const time = appointmentTimePart(appointment.active?.time);
  if (!date) return appointment.createdAt ?? fallback;

  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return `${date}${time ? ` · ${time}` : ''}`;
  }

  return parsed.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MiniIncomeChart({ accent, muted, surface }: { accent: string; muted: string; surface: string }) {
  const points = [
    { x: 18, y: 70 },
    { x: 68, y: 50 },
    { x: 118, y: 54 },
    { x: 168, y: 34 },
    { x: 218, y: 42 },
    { x: 268, y: 24 },
  ];
  const segments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const width = Math.hypot(next.x - point.x, next.y - point.y);
    const angle = Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI);
    return {
      key: `${point.x}-${next.x}`,
      left: point.x,
      top: point.y,
      width,
      angle,
    };
  });

  return (
    <View
      pointerEvents="none"
      style={{
        width: '100%',
        height: 116,
        overflow: 'hidden',
        opacity: 0.95,
        marginTop: spacing.xs,
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 90,
          backgroundColor: `${accent}09`,
          borderRadius: 26,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 18,
          height: 1,
          backgroundColor: `${muted}16`,
        }}
      />
      {segments.map((segment) => (
        <View
          key={segment.key}
          style={{
            position: 'absolute',
            left: segment.left,
            top: segment.top + 5,
            width: segment.width,
            height: 3,
            borderRadius: 2,
            backgroundColor: accent,
            transform: [{ rotate: `${segment.angle}deg` }],
            transformOrigin: 'left center',
          }}
        />
      ))}
      {points.map((point) => (
        <View key={`${point.x}-${point.y}`}>
          <View
            style={{
              position: 'absolute',
              left: point.x + 4,
              top: point.y + 11,
              width: 1,
              height: 86 - point.y,
              backgroundColor: `${muted}18`,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: point.x,
              top: point.y,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: accent,
              borderWidth: 2,
              borderColor: surface,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export default function ProfessionalDashboard() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { user } = useAuthStore();
  const accent = theme.colors.primary;
  const { appointments } = useRealtimeAppointments(!!user?.userId);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    if (!user?.userId) return;
    let cancelled = false;

    Promise.all([
      contractsApi.list().catch(() => []),
      reviewsApi.listByProfessional(user.userId).catch(() => []),
      servicesApi.list({ professionalId: user.userId }).catch(() => []),
    ]).then(([contractsData, reviewsData, servicesData]) => {
      if (cancelled) return;
      setContracts(contractsData);
      setReviews(reviewsData);
      setServices(servicesData);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  const activeContracts = useMemo(
    () => contracts.filter((contract) => contract.status === 'SIGNED' || contract.status === 'PENDING_SIGNATURE'),
    [contracts],
  );

  const confirmedMonthlyAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter(
      (appointment) =>
        INCOME_APPOINTMENT_STATUSES.has(appointment.status) &&
        isAppointmentInCurrentMonth(appointment, now),
    );
  }, [appointments]);

  const pricesByServiceId = useMemo(() => serviceAmountById(services), [services]);

  const monthlyIncome = useMemo(
    () =>
      confirmedMonthlyAppointments.reduce(
        (sum, appointment) => sum + appointmentServiceAmount(appointment, pricesByServiceId),
        0,
      ),
    [confirmedMonthlyAppointments, pricesByServiceId],
  );

  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            OPEN_APPOINTMENT_STATUSES.has(appointment.status) && isUpcomingAppointment(appointment),
        )
        .slice()
        .sort(compareUpcomingJobs),
    [appointments],
  );
  const visibleUpcomingAppointments = useMemo(() => upcomingAppointments.slice(0, 5), [upcomingAppointments]);

  const renderStatTile = ({
    label,
    value,
    icon,
    onPress,
  }: {
    label: string;
    value: string;
    icon: IconName;
    onPress: () => void;
  }) => (
    <Card
      onPress={onPress}
      style={{
        flexBasis: '30%',
        flexGrow: 1,
        minWidth: 100,
        minHeight: 132,
        padding: spacing.lg,
        gap: spacing.md,
        justifyContent: 'space-between',
        borderRadius: radius.xl,
        borderColor: `${accent}18`,
        backgroundColor: theme.colors.surface,
        shadowColor: '#000',
        shadowOpacity: theme.isDark ? 0 : 0.05,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: `${accent}12`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={accent} />
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="h1" style={{ lineHeight: 36 }}>
          {value}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={2} style={{ minHeight: 36 }}>
          {label}
        </Text>
      </View>
    </Card>
  );

  const renderUpcomingJob = (appointment: Appointment, index: number) => (
    <Pressable
      key={appointment.id}
      onPress={() => router.push(`/professional/appointment/${appointment.id}` as never)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.md,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.lg,
          borderBottomWidth: index === visibleUpcomingAppointments.length - 1 ? 0 : 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 16,
            backgroundColor: `${accent}10`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="calendar-outline" size={20} color={accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {appointmentTitle(appointment, services, t)}
          </Text>
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {formatAppointmentDateTime(appointment, i18n.language, t('appointments.noDate'))}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {t('appointments.reference', { code: shortId(appointment.id) })}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radius.pill,
            backgroundColor: `${theme.colors.success}12`,
            maxWidth: 112,
          }}
        >
          <Icon name="checkmark-circle" size={13} color={theme.colors.success} />
          <Text variant="label" numberOfLines={1} style={{ color: theme.colors.success }}>
            {appointmentStatusLabel(appointment.status, t)}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text variant="h1" numberOfLines={1}>
            {t('professional.dashboard.greeting', {
              name: user?.email?.split('@')[0] ?? t('professional.dashboard.fallbackName'),
            })}
          </Text>
          <Text variant="body" color="textSecondary">
            {t('professional.dashboard.summary')}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/professional/profile' as never)}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 22,
            backgroundColor: `${accent}10`,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Icon name="person" size={27} color={accent} />
        </Pressable>
      </View>

      <Card
        style={{
          backgroundColor: theme.colors.primarySurface,
          borderColor: `${accent}20`,
          borderRadius: radius.xl,
          overflow: 'hidden',
          padding: spacing.xl,
          minHeight: 280,
        }}
      >
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg }}>
            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <Text variant="bodyStrong" color="textSecondary">
                {t('professional.dashboard.monthlyIncome')}
              </Text>
              <Text variant="display" style={{ color: accent, fontSize: 50, lineHeight: 56 }}>
                ${monthlyIncome.toLocaleString('en-US')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/professional/finances' as never)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 18,
                backgroundColor: `${accent}12`,
                zIndex: 2,
              }}
            >
              <Icon name="cash-outline" size={24} color={accent} />
              <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: `${accent}20`,
              maxWidth: '100%',
              zIndex: 2,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="checkmark" size={14} color={theme.colors.textInverse} />
            </View>
            <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t('professional.dashboard.confirmedAppointments', { count: confirmedMonthlyAppointments.length })}
            </Text>
          </View>
          <MiniIncomeChart accent={accent} muted={theme.colors.textMuted} surface={theme.colors.primarySurface} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {renderStatTile({
          label: t('professional.dashboard.activeContracts'),
          value: String(activeContracts.length),
          icon: 'briefcase-outline',
          onPress: () => router.push('/professional/contracts?filter=active' as never),
        })}
        {renderStatTile({
          label: t('professional.dashboard.services'),
          value: String(services.length),
          icon: 'construct-outline',
          onPress: () =>
            router.push({
              pathname: '/shared/settings',
              params: { section: 'services', focus: 'services' },
            } as never),
        })}
        {renderStatTile({
          label: t('professional.dashboard.rating'),
          value: averageRating ? averageRating.toFixed(1) : '—',
          icon: 'star-outline',
          onPress: () => router.push('/professional/reviews' as never),
        })}
      </View>

      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <Text variant="h2" style={{ flex: 1 }} numberOfLines={1}>
            {t('professional.dashboard.upcomingJobs')}
          </Text>
          <Pressable
            onPress={() => router.push('/professional/agenda' as never)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text variant="bodyStrong" style={{ color: accent }}>
              {t('professional.dashboard.viewAgenda')}
            </Text>
            <Icon name="chevron-forward" size={18} color={accent} />
          </Pressable>
        </View>
        <Card
          padded={false}
          style={{
            padding: 0,
            borderRadius: radius.xl,
            borderColor: `${accent}18`,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
          }}
        >
          {visibleUpcomingAppointments.length ? (
            visibleUpcomingAppointments.map(renderUpcomingJob)
          ) : (
            <Text variant="body" color="textSecondary" style={{ paddingVertical: spacing.md }}>
              {t('professional.dashboard.noUpcomingJobs')}
            </Text>
          )}
        </Card>
      </View>
    </ScreenContainer>
  );
}
