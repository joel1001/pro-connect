import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { DeclineReasonModal, ListRow, SectionHeader } from '@/components/molecules';
import { EmergencyHireDisclaimer } from '@/components/client/EmergencyHireDisclaimer';
import { emergencyHireApi } from '@/api/emergencyHire.api';
import { useEmergencyHireCountdown } from '@/hooks/useEmergencyHireCountdown';
import { useEmergencyHireRealtimeAll } from '@/hooks/useEmergencyHireRealtime';
import {
  formatEmergencyTimeRemaining,
  isEmergencyExpired,
  resolveEmergencyExpiresAt,
} from '@/lib/emergencyHireExpiration';
import { applyEmergencyHireRealtimeUpdate } from '@/lib/emergencyHireRealtime';
import { EmergencyHireRequest } from '@/types';
import { roleAccent, spacing } from '@/theme';

function EmergencyHireInboxRow({
  item,
  accent,
  acting,
  openingChat,
  onOpenChat,
  onRespond,
  t,
}: {
  item: EmergencyHireRequest;
  accent: string;
  acting: string | null;
  openingChat: string | null;
  onOpenChat: (id: string) => void;
  onRespond: (id: string, action: 'accept' | 'decline') => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [request, setRequest] = useState(item);
  const { expired, remaining } = useEmergencyHireCountdown(request);

  useEffect(() => {
    setRequest(item);
  }, [item]);

  const expiresAt = resolveEmergencyExpiresAt(request);
  const showCountdown = !expired && !isEmergencyExpired(request) && (remaining ?? expiresAt);

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <ListRow title={request.status} subtitle={request.description} icon="flash-outline" accent={accent} />
      {showCountdown ? (
        <Text variant="caption" color="textSecondary" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
          {t('emergencyHire.expiration.active', {
            time: remaining ?? (expiresAt ? formatEmergencyTimeRemaining(expiresAt) : ''),
          })}
        </Text>
      ) : expired || request.status === 'EXPIRED' ? (
        <Text variant="caption" color="danger" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
          {t('emergencyHire.expiration.expired')}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <Button
          label={t('emergencyHire.openChat')}
          size="sm"
          variant="outline"
          accentColor={accent}
          loading={openingChat === request.id}
          onPress={() => onOpenChat(request.id)}
          style={{ flex: 1 }}
        />
        <Button
          label={t('emergencyHire.accept')}
          size="sm"
          accentColor={accent}
          loading={acting === request.id}
          disabled={expired || request.status === 'EXPIRED'}
          onPress={() => onRespond(request.id, 'accept')}
          style={{ flex: 1 }}
        />
        <Button
          label={t('emergencyHire.decline')}
          size="sm"
          variant="outline"
          accentColor={accent}
          loading={acting === request.id}
          onPress={() => onRespond(request.id, 'decline')}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export default function ProfessionalEmergencyInbox() {
  const { t } = useTranslation();
  const accent = roleAccent.professional;
  const [items, setItems] = useState<EmergencyHireRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineReasonError, setDeclineReasonError] = useState('');

  const load = useCallback(() => {
    emergencyHireApi
      .list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRealtime = useCallback(
    (update: Parameters<typeof applyEmergencyHireRealtimeUpdate>[1]) => {
      setItems((prev) =>
        prev.map((item) => (item.id === update.requestId ? applyEmergencyHireRealtimeUpdate(item, update) : item)),
      );
      if (update.action === 'EXPIRED') load();
    },
    [load],
  );

  useEmergencyHireRealtimeAll(handleRealtime);

  useEffect(() => {
    load();
  }, [load]);

  const openDeclineReason = (id: string) => {
    setDecliningId(id);
    setDeclineReason('');
    setDeclineReasonError('');
  };

  const closeDeclineReason = () => {
    if (acting) return;
    setDecliningId(null);
    setDeclineReason('');
    setDeclineReasonError('');
  };

  const respond = async (id: string, action: 'accept' | 'decline', reason?: string) => {
    setActing(id);
    try {
      if (action === 'accept') await emergencyHireApi.accept(id);
      else await emergencyHireApi.decline(id, reason);
      load();
    } finally {
      setActing(null);
    }
  };

  const submitDecline = async () => {
    const reason = declineReason.trim();
    if (!reason) {
      setDeclineReasonError(t('emergencyHire.declineReasonRequired'));
      return;
    }
    if (!decliningId) return;
    await respond(decliningId, 'decline', reason);
    setDecliningId(null);
    setDeclineReason('');
    setDeclineReasonError('');
  };

  const openChat = async (requestId: string) => {
    setOpeningChat(requestId);
    try {
      const chat = await emergencyHireApi.openChat(requestId);
      router.push({
        pathname: '/shared/chat',
        params: {
          conversationId: chat.conversationId,
          emergencyHireRequestId: requestId,
        },
      } as never);
    } finally {
      setOpeningChat(null);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('emergencyHire.proInboxTitle')} subtitle={t('emergencyHire.proInboxSubtitle')} />
      <EmergencyHireDisclaimer />
      {items.length === 0 ? (
        <Card>
          <Text variant="caption" color="textSecondary">
            {t('emergencyHire.proEmpty')}
          </Text>
        </Card>
      ) : (
        items.map((item) => (
          <EmergencyHireInboxRow
            key={item.id}
            item={item}
            accent={accent}
            acting={acting}
            openingChat={openingChat}
            onOpenChat={openChat}
            onRespond={(id, action) => (action === 'decline' ? openDeclineReason(id) : respond(id, action))}
            t={t}
          />
        ))
      )}
      <DeclineReasonModal
        visible={!!decliningId}
        title={t('emergencyHire.declineReasonTitle')}
        description={t('emergencyHire.declineReasonDescription')}
        reason={declineReason}
        placeholder={t('emergencyHire.declineReasonPlaceholder')}
        error={declineReasonError}
        cancelLabel={t('appointments.cancel')}
        submitLabel={t('emergencyHire.decline')}
        loading={!!decliningId && acting === decliningId}
        onChangeReason={(value) => {
          setDeclineReason(value);
          if (declineReasonError) setDeclineReasonError('');
        }}
        onClose={closeDeclineReason}
        onSubmit={() => void submitDecline()}
      />
    </ScreenContainer>
  );
}
