import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { ListRow, SectionHeader } from '@/components/molecules';
import { EmergencyHireContactOverlay, EmergencyHireContactStep } from '@/components/client/EmergencyHireContactOverlay';
import { emergencyHireApi } from '@/api/emergencyHire.api';
import { professionalsApi } from '@/api/professionals.api';
import { getApiErrorMessage } from '@/api/client';
import { useEmergencyHireCountdown } from '@/hooks/useEmergencyHireCountdown';
import { useEmergencyHireRealtime } from '@/hooks/useEmergencyHireRealtime';
import { runEmergencyHireContactFlow } from '@/lib/emergencyHireContact';
import { emergencyStatusLabelKey } from '@/lib/emergencyHireExpiration';
import { applyEmergencyHireRealtimeUpdate } from '@/lib/emergencyHireRealtime';
import { EmergencyHireRequest, EmergencyHireResponse } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function EmergencyHireDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const accent = roleAccent.client;
  const [request, setRequest] = useState<EmergencyHireRequest | null>(null);
  const [responses, setResponses] = useState<EmergencyHireResponse[]>([]);
  const [proNames, setProNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contacting, setContacting] = useState<string | null>(null);
  const [contactStep, setContactStep] = useState<EmergencyHireContactStep | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const { expired, remaining } = useEmergencyHireCountdown(request);

  const load = useCallback(() => {
    if (!id) return;
    setLoadError(null);
    (async () => {
      try {
        const [req, res] = await Promise.all([emergencyHireApi.get(id), emergencyHireApi.responses(id)]);
        setRequest(req);
        setResponses(res);
        const names: Record<string, string> = {};
        await Promise.all(
          res.map(async (r) => {
            try {
              const pro = await professionalsApi.getById(r.professionalId);
              names[r.professionalId] = pro.displayName ?? pro.headline?.split(' · ')[0] ?? r.professionalId;
            } catch {
              names[r.professionalId] = r.professionalId;
            }
          }),
        );
        setProNames(names);
      } catch (e) {
        setLoadError(getApiErrorMessage(e, t('emergencyHire.errors.contact')));
        setRequest(null);
        setResponses([]);
        setProNames({});
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const handleRealtime = useCallback(
    (update: Parameters<typeof applyEmergencyHireRealtimeUpdate>[1]) => {
      setRequest((prev) => (prev ? applyEmergencyHireRealtimeUpdate(prev, update) : prev));
      if (update.action === 'EXPIRED') load();
    },
    [load],
  );

  useEmergencyHireRealtime(id, handleRealtime);

  useEffect(() => {
    load();
  }, [load]);

  const openChat = async (professionalId: string, conversationId?: string) => {
    if (!id) return;
    setContacting(professionalId);
    setContactStep('connecting');
    setContactError(null);
    try {
      const result = await runEmergencyHireContactFlow({
        existingRequestId: id,
        existingConversationId: conversationId,
        ensureRequest: async () => id,
        contact: (requestId) => emergencyHireApi.contact(requestId, professionalId),
        onStep: setContactStep,
      });
      router.push({
        pathname: '/shared/chat',
        params: {
          conversationId: result.conversationId,
          emergencyHireRequestId: id,
        },
      } as never);
    } catch (e) {
      setContactError(getApiErrorMessage(e, t('emergencyHire.errors.contact')));
    } finally {
      setContacting(null);
      setContactStep(null);
    }
  };

  const contactProgressLabels = useMemo(
    () => ({
      publishing: t('emergencyHire.contactProgress.publishing'),
      connecting: t('emergencyHire.contactProgress.connecting'),
      messaging: t('emergencyHire.contactProgress.messaging'),
      opening: t('emergencyHire.contactProgress.opening'),
    }),
    [t],
  );

  if (loadError) {
    return (
      <ScreenContainer showBack>
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('emergencyHire.trackingTitle')}</Text>
          <Text variant="caption" color="danger">
            {loadError}
          </Text>
        </Card>
      </ScreenContainer>
    );
  }
  if (loading || !request) return <Spinner fullscreen />;

  const activeResponses = responses.filter(
    (r) => r.status === 'ACCEPTED' || r.status === 'COUNTER_PROPOSED' || r.status === 'PENDING',
  );

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader
        title={t('emergencyHire.trackingTitle')}
        subtitle={t(emergencyStatusLabelKey(request.status))}
      />
      {!expired && remaining ? (
        <Card style={{ gap: spacing.xs, backgroundColor: '#FFF7ED' }}>
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.expiration.active', { time: remaining })}
          </Text>
        </Card>
      ) : request.status === 'EXPIRED' || expired ? (
        <Card style={{ gap: spacing.xs, backgroundColor: '#FEF2F2' }}>
          <Text variant="caption" color="danger">
            {t('emergencyHire.expiration.expired')}
          </Text>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.sm }}>
        <Text variant="body">{request.description}</Text>
        {request.locationLabel ? (
          <Text variant="caption" color="textSecondary">
            {request.locationLabel}
          </Text>
        ) : null}
      </Card>
      <SectionHeader title={t('emergencyHire.responsesTitle')} subtitle={`${activeResponses.length}`} />
      {contactError ? (
        <Card style={{ backgroundColor: '#FEF2F2' }}>
          <Text variant="caption" color="danger">
            {contactError}
          </Text>
        </Card>
      ) : null}
      {activeResponses.length === 0 ? (
        <Card>
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.waitingResponses')}
          </Text>
        </Card>
      ) : (
        activeResponses.map((r) => (
          <View key={r.id} style={{ marginBottom: spacing.sm }}>
            <ListRow
              title={proNames[r.professionalId] ?? r.professionalId}
              subtitle={`${r.status}${r.distanceKm != null ? ` · ${r.distanceKm.toFixed(1)} km` : ''}`}
              icon="person-outline"
              accent={accent}
            />
            {r.message ? (
              <Text variant="caption" color="textSecondary" style={{ paddingHorizontal: spacing.lg }}>
                {r.message}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
              <Button
                label={t('emergencyHire.openChat')}
                size="sm"
                variant="outline"
                accentColor={accent}
                loading={contacting === r.professionalId}
                onPress={() => openChat(r.professionalId, r.conversationId)}
                style={{ flex: 1 }}
              />
              {(r.status === 'ACCEPTED' || r.status === 'COUNTER_PROPOSED') && !r.contractId ? (
                <Text
                  variant="caption"
                  color="textSecondary"
                  style={{ flex: 1, paddingVertical: spacing.xs }}
                >
                  {t('emergencyHire.negotiation.waitingQuote')}
                </Text>
              ) : null}
              {r.contractId ? (
                <Button
                  label={t('emergencyHire.negotiation.viewContract')}
                  size="sm"
                  accentColor={accent}
                  onPress={() => router.push(`/client/contract/${r.contractId}` as never)}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </View>
        ))
      )}
      {request.appointmentId ? (
        <Button
          label={t('emergencyHire.viewAppointment')}
          accentColor={accent}
          onPress={() => router.push(`/client/appointments/${request.appointmentId}` as never)}
        />
      ) : null}

      <EmergencyHireContactOverlay
        visible={contactStep != null}
        step={contactStep ?? 'connecting'}
        professionalName={contacting ? proNames[contacting] : undefined}
        accentColor={accent}
        hint={t('emergencyHire.contactProgress.hint')}
        labels={contactProgressLabels}
      />
    </ScreenContainer>
  );
}
