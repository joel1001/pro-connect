import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { appointmentsApi } from '@/api/appointments.api';
import { contractsApi } from '@/api/contracts.api';
import { getApiErrorMessage } from '@/api/client';
import { realtimeService } from '@/services/realtime';
import { useAuthStore } from '@/store/authStore';
import { Appointment, Contract } from '@/types';
import { roleAccent, spacing } from '@/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export default function AppointmentDetail() {
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.userId);
  const paymentRequestedRef = useRef(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [paying, setPaying] = useState(false);
  const accent = roleAccent.client;

  const load = useCallback(() => {
    if (!id) return;
    setLoadError(null);
    setLoading(true);
    appointmentsApi
      .get(id)
      .then(async (nextAppointment) => {
        setAppointment(nextAppointment);
        if (!nextAppointment.contractId) {
          setContract(null);
          return;
        }
        try {
          setContract(await contractsApi.get(nextAppointment.contractId));
        } catch {
          setContract(null);
        }
      })
      .catch((e) => setLoadError(getApiErrorMessage(e, t('appointments.errors.create'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id) return undefined;
    return realtimeService.onAppointmentUpdate((update) => {
      if (update.appointmentId === id) {
        load();
      }
    });
  }, [id, load]);

  useEffect(() => {
    if (!appointment?.contractId) return undefined;
    return realtimeService.onContractUpdate(appointment.contractId, () => {
      load();
    });
  }, [appointment?.contractId, load]);

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

  const proceedToPayment = useCallback(async () => {
    if (!appointment?.contractId) {
      setActionError(t('appointments.errors.payment'));
      return;
    }
    const contractReady = Boolean(contract?.professionalSigned && (contract.documentText || contract.pdfUrl));
    if (!contractReady) {
      setActionError(t('appointments.waitingContract'));
      return;
    }
    setPaying(true);
    setActionError(null);
    try {
      router.push(`/client/contract/${appointment.contractId}` as never);
    } catch (e) {
      setActionError(getApiErrorMessage(e, t('appointments.errors.payment')));
    } finally {
      setPaying(false);
    }
  }, [appointment, contract, t]);

  const acceptAndOpenContract = async () => {
    setActing(true);
    setActionError(null);
    try {
      const updated = await appointmentsApi.accept(appointment!.id);
      setAppointment(updated);
      if (updated.contractId) {
        const updatedContract = await contractsApi.get(updated.contractId).catch(() => null);
        setContract(updatedContract);
        if (updatedContract?.professionalSigned && (updatedContract.documentText || updatedContract.pdfUrl)) {
          router.push(`/client/contract/${updated.contractId}` as never);
        }
      }
    } catch (e) {
      setActionError(getApiErrorMessage(e, t('appointments.errors.action')));
    } finally {
      setActing(false);
    }
  };

  const isClient = !!appointment && userId === appointment.clientId;
  const isPro = !!appointment && userId === appointment.professionalId;
  const contractReadyForClient = Boolean(contract?.professionalSigned && (contract.documentText || contract.pdfUrl));
  const canProceedToPayment = isClient && appointment?.status === 'CONFIRMED' && contractReadyForClient;
  const isWaitingForProfessionalContract =
    isClient && appointment?.status === 'CONFIRMED' && !contractReadyForClient;

  useEffect(() => {
    if (pay !== '1' || !canProceedToPayment || paymentRequestedRef.current) return;
    paymentRequestedRef.current = true;
    void proceedToPayment();
  }, [canProceedToPayment, pay, proceedToPayment]);

  if (loadError) {
    return (
      <ScreenContainer showBack>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('appointments.detailTitle')}</Text>
          <Text variant="caption" color="danger">
            {loadError}
          </Text>
        </Card>
      </ScreenContainer>
    );
  }

  if (loading || !appointment) return <Spinner fullscreen />;

  const active = appointment.active;
  const canAccept =
    (isPro && appointment.status === 'PENDING_PROFESSIONAL_RESPONSE') ||
    (isClient && appointment.status === 'PENDING_CLIENT_RESPONSE');
  const canDecline = isPro && appointment.status === 'PENDING_PROFESSIONAL_RESPONSE';
  const canCancel = appointment.status !== 'CANCELLED' && appointment.status !== 'DECLINED' && appointment.status !== 'COMPLETED';

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('appointments.detailTitle')} subtitle={t(`appointments.status.${appointment.status}`)} />
      <Card style={{ gap: spacing.md }}>
        <Row label={t('client.contract.date')} value={active?.date ?? '—'} />
        <Row label={t('appointments.time')} value={active?.time?.slice(0, 5) ?? '—'} />
        <Row label={t('appointments.duration')} value={`${active?.durationMinutes ?? 60} min`} />
        <Row
          label={t('appointments.source')}
          value={appointment.source === 'EMERGENCY' ? t('appointments.sourceEmergency') : t('appointments.sourceStandard')}
        />
        {active?.serviceIds?.length ? <Row label={t('appointments.services')} value={active.serviceIds.join(', ')} /> : null}
        {active?.notes ? <Text variant="caption">{active.notes}</Text> : null}
      </Card>
      <SectionHeader title={t('appointments.history')} />
      <Card style={{ gap: spacing.sm }}>
        {(appointment.history ?? []).map((h) => (
          <View key={h.id} style={{ borderBottomWidth: 1, borderBottomColor: '#E2E8E5', paddingVertical: spacing.sm }}>
            <Text variant="bodyStrong">{h.action}</Text>
            <Text variant="caption" color="textSecondary">
              {h.actorRole} · {h.message ?? ''}
            </Text>
          </View>
        ))}
      </Card>
      {actionError ? (
        <Text variant="caption" color="danger">
          {actionError}
        </Text>
      ) : null}
      {isWaitingForProfessionalContract ? (
        <Card style={{ gap: spacing.xs }}>
          <Text variant="bodyStrong">{t('appointments.waitingContractTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('appointments.waitingContract')}
          </Text>
        </Card>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {canAccept ? (
          <Button label={t('appointments.accept')} accentColor={accent} loading={acting} onPress={() => void acceptAndOpenContract()} />
        ) : null}
        {canDecline ? (
          <Button label={t('appointments.decline')} variant="outline" accentColor={accent} loading={acting} onPress={() => act(() => appointmentsApi.decline(appointment.id))} />
        ) : null}
        {canCancel ? (
          <Button label={t('appointments.cancel')} variant="outline" accentColor={accent} loading={acting} onPress={() => act(() => appointmentsApi.cancel(appointment.id))} />
        ) : null}
        {canProceedToPayment ? (
          <Button label={t('appointments.proceedToPayment')} accentColor={accent} loading={paying} onPress={proceedToPayment} />
        ) : null}
        {isPro && appointment.status === 'CONFIRMED' ? (
          <Button label={t('appointments.complete')} accentColor={accent} loading={acting} onPress={() => act(() => appointmentsApi.complete(appointment.id))} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}
