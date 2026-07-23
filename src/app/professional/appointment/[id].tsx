import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { appointmentsApi } from '@/api/appointments.api';
import { getApiErrorMessage } from '@/api/client';
import { Badge, Button, Card, Divider, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DeclineReasonModal, SectionHeader } from '@/components/molecules';
import { realtimeService } from '@/services/realtime';
import { Appointment, AppointmentStatus } from '@/types';
import { spacing } from '@/theme';

function statusTone(status: AppointmentStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  if (status === 'CONFIRMED' || status === 'ACCEPTED') return 'success';
  if (status === 'CANCELLED' || status === 'DECLINED') return 'danger';
  if (status === 'COMPLETED') return 'primary';
  if (status === 'COUNTER_PROPOSED' || status.includes('PENDING')) return 'warning';
  return 'info';
}

function formatDateTime(appointment: Appointment, noDateLabel: string) {
  const date = appointment.active?.date ?? appointment.createdAt ?? noDateLabel;
  const time = appointment.active?.time ? ` · ${appointment.active.time}` : '';
  return `${date}${time}`;
}

function appointmentStatusLabel(status: AppointmentStatus, t: (key: string) => string) {
  return t(`appointments.status.${status}`);
}

export default function ProfessionalAppointmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineReasonError, setDeclineReasonError] = useState('');

  const loadAppointment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setAppointment(await appointmentsApi.get(id));
    } catch {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  useEffect(() => {
    if (!id) return undefined;
    return realtimeService.onAppointmentUpdate((update) => {
      if (update.appointmentId === id) {
        void loadAppointment();
      }
    });
  }, [id, loadAppointment]);

  const act = async (fn: () => Promise<Appointment>) => {
    setActing(true);
    setActionError(null);
    try {
      setAppointment(await fn());
    } catch (e) {
      setActionError(getApiErrorMessage(e, t('appointments.errors.action')));
    } finally {
      setActing(false);
    }
  };

  const confirmAndOpenContract = async () => {
    setActing(true);
    setActionError(null);
    try {
      const updated = await appointmentsApi.accept(appointment!.id);
      setAppointment(updated);
      if (updated.contractId) {
        router.push(`/professional/contract/${updated.contractId}` as never);
      }
    } catch (e) {
      setActionError(getApiErrorMessage(e, t('appointments.errors.action')));
    } finally {
      setActing(false);
    }
  };

  const closeDeclineModal = () => {
    if (acting) return;
    setDeclineModalOpen(false);
    setDeclineReason('');
    setDeclineReasonError('');
  };

  const submitDecline = async () => {
    const reason = declineReason.trim();
    if (!reason) {
      setDeclineReasonError(t('appointments.declineReasonRequired'));
      return;
    }
    await act(() => appointmentsApi.decline(appointment!.id, reason));
    setDeclineModalOpen(false);
    setDeclineReason('');
    setDeclineReasonError('');
  };

  if (loading) return <Spinner fullscreen />;

  if (!appointment) {
    return (
      <ScreenContainer showBack>
        <SectionHeader title={t('appointments.jobDetailTitle')} />
        <Card>
          <Text variant="body" color="textSecondary">
            {t('appointments.loadError')}
          </Text>
        </Card>
      </ScreenContainer>
    );
  }

  const active = appointment.active;
  const history = appointment.history ?? [];
  const canConfirm = appointment.status === 'PENDING_PROFESSIONAL_RESPONSE';

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('appointments.jobDetailTitle')} subtitle={appointment.id} />

      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="caption" color="textSecondary">
              {t('appointments.dateTime')}
            </Text>
            <Text variant="title">{formatDateTime(appointment, t('appointments.noDate'))}</Text>
          </View>
          <Badge label={appointmentStatusLabel(appointment.status, t)} tone={statusTone(appointment.status)} />
        </View>
        <Divider />
        <Row label={t('appointments.source')} value={appointment.source === 'EMERGENCY' ? t('appointments.sourceEmergency') : t('appointments.sourceStandard')} />
        <Row label={t('appointments.client')} value={appointment.clientId} />
        <Row label={t('appointments.professional')} value={appointment.professionalId} />
        {active?.durationMinutes ? <Row label={t('appointments.duration')} value={`${active.durationMinutes} min`} /> : null}
        {active?.locationAddress ? <Row label={t('appointments.location')} value={active.locationAddress} /> : null}
        {active?.serviceIds?.length ? <Row label={t('appointments.services')} value={active.serviceIds.join(', ')} /> : null}
      </Card>

      <Button
        label={t('reviews.viewClientProfile')}
        variant="outline"
        onPress={() => router.push(`/shared/client/${appointment.clientId}` as never)}
      />

      {active?.notes ? (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('appointments.notes')}</Text>
          <Text variant="body" color="textSecondary">
            {active.notes}
          </Text>
        </Card>
      ) : null}

      <Card style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">{t('appointments.history')}</Text>
        {history.length ? (
          history
            .slice()
            .reverse()
            .map((entry) => (
              <View key={entry.id} style={{ gap: 2 }}>
                <Text variant="bodyStrong">{entry.action}</Text>
                <Text variant="caption" color="textSecondary">
                  {entry.createdAt ?? t('appointments.noDate')} · {entry.actorRole}
                </Text>
                {entry.message ? (
                  <Text variant="caption" color="textSecondary">
                    {entry.message}
                  </Text>
                ) : null}
              </View>
            ))
        ) : (
          <Text variant="body" color="textSecondary">
            {t('appointments.noHistory')}
          </Text>
        )}
      </Card>

      {actionError ? (
        <Text variant="caption" color="danger">
          {actionError}
        </Text>
      ) : null}

      {canConfirm ? (
        <View style={{ gap: spacing.sm }}>
          <Button
            label={t('appointments.confirm', { defaultValue: t('appointments.accept') })}
            loading={acting}
            onPress={() => void confirmAndOpenContract()}
          />
          <Button
            label={t('appointments.decline')}
            variant="outline"
            loading={acting}
            onPress={() => setDeclineModalOpen(true)}
          />
        </View>
      ) : null}
      <DeclineReasonModal
        visible={declineModalOpen}
        title={t('appointments.declineReasonTitle')}
        description={t('appointments.declineReasonDescription')}
        reason={declineReason}
        placeholder={t('appointments.declineReasonPlaceholder')}
        error={declineReasonError}
        cancelLabel={t('appointments.cancel')}
        submitLabel={t('appointments.decline')}
        loading={acting}
        onChangeReason={(value) => {
          setDeclineReason(value);
          if (declineReasonError) setDeclineReasonError('');
        }}
        onClose={closeDeclineModal}
        onSubmit={() => void submitDecline()}
      />
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="body" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}
