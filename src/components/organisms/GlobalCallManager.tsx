import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chatApi } from '@/api/chat.api';
import { ChatCallModal, ChatCallSummary } from '@/components/organisms/ChatCallModal';
import { useTheme } from '@/hooks/useTheme';
import { ChatCallSignal, realtimeService } from '@/services/realtime';

export function GlobalCallManager() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [incomingOffer, setIncomingOffer] = useState<ChatCallSignal | null>(null);
  const [peerName, setPeerName] = useState(t('client.chatCall.incoming'));
  const activeCallIdRef = useRef<string | null>(null);

  const labels = useMemo(
    () => ({
      calling: t('client.chatCall.calling'),
      incoming: t('client.chatCall.incoming'),
      connecting: t('client.chatCall.connecting'),
      connected: t('client.chatCall.connected'),
      ended: t('client.chatCall.ended'),
      unavailable: t('client.chatCall.unavailable'),
      nativeBuildRequired: t('client.chatCall.nativeBuildRequired'),
      realtimeError: t('client.chatCall.realtimeError'),
      connectTimeout: t('client.chatCall.connectTimeout'),
      microphoneError: t('client.chatCall.microphoneError'),
      accept: t('client.chatCall.accept'),
      reject: t('client.chatCall.reject'),
      hangup: t('client.chatCall.hangup'),
      start: t('client.chatCall.start'),
    }),
    [t],
  );

  const closeCall = useCallback((summary?: ChatCallSummary) => {
    if (summary && incomingOffer?.conversationId) {
      void chatApi
        .sendCallSummary(incomingOffer.conversationId, JSON.stringify(summary))
        .catch(() => undefined);
    }
    activeCallIdRef.current = null;
    setIncomingOffer(null);
  }, [incomingOffer?.conversationId]);

  useEffect(() => {
    return realtimeService.onCallSignal((signal) => {
      if (signal.type !== 'offer') return;
      if (activeCallIdRef.current && activeCallIdRef.current !== signal.callId) return;

      activeCallIdRef.current = signal.callId;
      setPeerName(t('client.chatCall.incoming'));
      setIncomingOffer(signal);

      chatApi
        .getConversation(signal.conversationId)
        .then((conversation) => {
          const name = conversation.peer?.displayName?.trim();
          if (name && activeCallIdRef.current === signal.callId) {
            setPeerName(name);
          }
        })
        .catch(() => undefined);
    });
  }, [t]);

  if (!incomingOffer) return null;

  return (
    <ChatCallModal
      visible
      conversationId={incomingOffer.conversationId}
      peerName={peerName}
      accentColor={theme.colors.primary}
      incomingOffer={incomingOffer}
      labels={labels}
      onClose={closeCall}
    />
  );
}
