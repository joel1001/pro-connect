import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, BackButton, Button, Icon, Spinner, Text } from '@/components/atoms';
import { formatLocalDate, ErrorBanner } from '@/components/molecules';
import { chatApi } from '@/api/chat.api';
import { emergencyHireApi } from '@/api/emergencyHire.api';
import { offersApi } from '@/api/offers.api';
import { professionalsApi } from '@/api/professionals.api';
import { getApiErrorMessage } from '@/api/client';
import { EmergencyHireChatBanner } from '@/components/client/EmergencyHireChatBanner';
import { EmergencyHireNegotiationPanel } from '@/components/client/EmergencyHireNegotiationPanel';
import {
  EmergencyHireQuoteCard,
  EmergencyHireQuoteCardSkeleton,
} from '@/components/client/EmergencyHireQuoteCard';
import { ChatCallModal, ChatCallSummary } from '@/components/organisms/ChatCallModal';
import {
  filterNegotiationsForRequest,
  findPendingProfessionalQuoteForClient,
  isPendingProfessionalQuoteForClient,
} from '@/lib/emergencyHireQuote';
import { applyEmergencyHireRealtimeUpdate } from '@/lib/emergencyHireRealtime';
import {
  isValidPreferredSchedule,
  maxPreferredDate,
} from '@/lib/emergencyHireSchedule';
import { servicesApi } from '@/api/services.api';
import { roleHome, roleMessagesRoute } from '@/config/roles';
import { useEmergencyHireCountdown } from '@/hooks/useEmergencyHireCountdown';
import { useEmergencyHireRealtime } from '@/hooks/useEmergencyHireRealtime';
import { useTheme } from '@/hooks/useTheme';
import { appendChatMessage, isSameChatUser } from '@/lib/chat';
import { containsOffPlatformContactInfo } from '@/lib/contactPolicy';
import { resolveProfessionalAvatarUrl } from '@/lib/professionalAvatar';
import { realtimeService } from '@/services/realtime';
import { useAuthStore } from '@/store/authStore';
import { subscribeActiveChatMessages, useNotificationStore } from '@/store/notificationStore';
import { ChatPeer, EmergencyHireNegotiation, EmergencyHireRequest, Message, PriceOffer } from '@/types';
import { roleAccent, radius, shadow, spacing, Theme } from '@/theme';
import { urgentHireMessageBubble, urgentHireColors } from '@/theme/urgentHire';

function formatChatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function bubbleCorners(mine: boolean) {
  return mine
    ? {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderBottomLeftRadius: radius.lg,
        borderBottomRightRadius: radius.sm,
      }
    : {
        borderTopLeftRadius: radius.lg,
        borderTopRightRadius: radius.lg,
        borderBottomLeftRadius: radius.sm,
        borderBottomRightRadius: radius.lg,
      };
}

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function isActiveEmergencyHireStatus(status?: EmergencyHireRequest['status']) {
  return (
    status === 'OPEN' ||
    status === 'NEGOTIATING' ||
    status === 'QUOTE_SENT' ||
    status === 'QUOTE_DECLINED' ||
    status === 'QUOTE_ACCEPTED' ||
    status === 'CONTRACT_PENDING' ||
    status === 'SEARCHING_PROFESSIONALS' ||
    status === 'AWAITING_RESPONSES' ||
    status === 'PROFESSIONAL_ACCEPTED' ||
    status === 'PROFESSIONAL_SELECTED'
  );
}

function peerFromProfessional(pro: {
  id: string;
  displayName?: string;
  headline?: string;
  avatarUrl?: string;
}): ChatPeer {
  return {
    userId: pro.id,
    displayName: pro.displayName?.trim() || pro.headline?.split(' · ')[0] || 'Profesional',
    avatarUrl: resolveProfessionalAvatarUrl({
      id: pro.id,
      name: pro.displayName ?? pro.headline ?? '',
      avatarUrl: pro.avatarUrl,
    }),
    headline: pro.headline,
    role: 'PROFESSIONAL',
  };
}

function messageBody(m: Message): string {
  return m.message?.trim() ?? '';
}

function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

interface LocalCallSummary extends ChatCallSummary {
  id: string;
  conversationId: string;
}

function serializeCallSummary(summary: ChatCallSummary) {
  return JSON.stringify(summary);
}

function parseCallSummary(message?: string): ChatCallSummary | null {
  if (!message) return null;
  try {
    const parsed = JSON.parse(message) as Partial<ChatCallSummary>;
    if (parsed.status !== 'answered' && parsed.status !== 'missed') return null;
    return {
      status: parsed.status,
      direction: parsed.direction === 'incoming' ? 'incoming' : 'outgoing',
      durationSeconds: Number(parsed.durationSeconds ?? 0),
      startedAt: String(parsed.startedAt ?? ''),
      endedAt: String(parsed.endedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

function CallSummaryCard({
  summary,
  accent,
  theme,
  labels,
}: {
  summary: ChatCallSummary;
  accent: string;
  theme: Theme;
  labels: {
    answered: string;
    missed: string;
    duration: string;
    incoming: string;
    outgoing: string;
    missedHint: string;
  };
}) {
  const answered = summary.status === 'answered';
  return (
    <View
      style={{
        alignSelf: 'center',
        width: '86%',
        borderWidth: 1,
        borderColor: answered ? `${accent}55` : theme.colors.border,
        backgroundColor: answered ? `${accent}12` : theme.colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: answered ? `${accent}22` : theme.colors.surfaceAlt,
          }}
        >
          <Icon
            name={answered ? 'call-outline' : 'call'}
            size={18}
            color={answered ? accent : theme.colors.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">
            {answered ? labels.answered : labels.missed}
          </Text>
          <Text variant="caption" color="textMuted">
            {answered ? `${labels.duration}: ${formatCallDuration(summary.durationSeconds)}` : labels.missedHint}
            {' · '}
            {summary.direction === 'incoming' ? labels.incoming : labels.outgoing}
          </Text>
        </View>
        <Text variant="caption" color="textMuted">
          {formatChatTime(summary.endedAt)}
        </Text>
      </View>
    </View>
  );
}

export default function Chat() {
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    professionalId?: string | string[];
    otherUserId?: string | string[];
    emergencyHireRequestId?: string | string[];
  }>();
  const conversationId = firstParam(params.conversationId);
  const professionalId = firstParam(params.professionalId);
  const otherUserId = firstParam(params.otherUserId);
  const emergencyHireRequestIdParam = firstParam(params.emergencyHireRequestId);
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuthStore((s) => s.user?.userId);
  const role = useAuthStore((s) => s.user?.role);
  const activeRole = useAuthStore((s) => s.activeRole);
  const authStatus = useAuthStore((s) => s.status);
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [offers, setOffers] = useState<PriceOffer[]>([]);
  const [negotiations, setNegotiations] = useState<EmergencyHireNegotiation[]>([]);
  const [emergencyRequestId, setEmergencyRequestId] = useState<string | null>(emergencyHireRequestIdParam ?? null);
  const [emergencyRequest, setEmergencyRequest] = useState<EmergencyHireRequest | null>(null);
  const [negotiationServiceNames, setNegotiationServiceNames] = useState<Record<string, string[]>>({});
  const [proposing, setProposing] = useState(false);
  const [negoDate, setNegoDate] = useState(() => new Date());
  const [negoTime, setNegoTime] = useState('14:00');
  const [negoArrival, setNegoArrival] = useState('14:30');
  const [negoPrice, setNegoPrice] = useState('');
  const [negoNotes, setNegoNotes] = useState('');
  const [negoDuration, setNegoDuration] = useState('60');
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callSummaries, setCallSummaries] = useState<LocalCallSummary[]>([]);
  const [listPriceHint, setListPriceHint] = useState('');
  const [message, setMessage] = useState('');
  const [activeId, setActiveId] = useState<string | null>(conversationId ?? null);
  const [peer, setPeer] = useState<ChatPeer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const [creatingContract, setCreatingContract] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewerRole = activeRole ?? role;
  const isProfessionalView = viewerRole === 'PROFESSIONAL';
  const accent = isProfessionalView ? roleAccent.professional : roleAccent.client;

  useEffect(() => {
    if (authStatus !== 'unauthenticated') return;
    const query = new URLSearchParams();
    if (conversationId) query.set('conversationId', conversationId);
    if (professionalId) query.set('professionalId', professionalId);
    if (otherUserId) query.set('otherUserId', otherUserId);
    if (emergencyHireRequestIdParam) query.set('emergencyHireRequestId', emergencyHireRequestIdParam);
    const redirectTo = `/shared/chat${query.toString() ? `?${query.toString()}` : ''}`;
    router.replace({ pathname: '/(auth)/login', params: { redirectTo } } as never);
  }, [authStatus, conversationId, professionalId, otherUserId, emergencyHireRequestIdParam]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const inbox = activeRole ? roleMessagesRoute(activeRole) : null;
    router.replace((inbox ?? roleHome(activeRole ?? 'CLIENT')) as never);
  }, [activeRole]);

  const peerUserId = peer?.userId ?? otherUserId ?? professionalId ?? null;
  const peerName = (peer?.displayName?.trim()) || t('client.chatTitle');
  const peerAvatar = peer?.avatarUrl;

  const handleDeleteChat = useCallback(() => {
    if (!activeId) return;
    Alert.alert(t('client.chatActions.delete'), t('client.chatActions.deleteConfirm'), [
      { text: t('client.chatActions.cancel'), style: 'cancel' },
      {
        text: t('client.chatActions.delete'),
        style: 'destructive',
        onPress: () => {
          void chatApi.deleteConversation(activeId).then(() => {
            useNotificationStore.getState().clearConversationPatch(activeId);
            goBack();
          });
        },
      },
    ]);
  }, [activeId, goBack, t]);

  const handleBlockUser = useCallback(() => {
    if (!peerUserId) return;
    Alert.alert(
      t('client.chatActions.block'),
      t('client.chatActions.blockConfirm', { name: peerName }),
      [
        { text: t('client.chatActions.cancel'), style: 'cancel' },
        {
          text: t('client.chatActions.block'),
          style: 'destructive',
          onPress: () => {
            void chatApi.blockPeer(peerUserId).then(() => goBack()).catch((e) => {
              setError(getApiErrorMessage(e, t('client.chatError')));
            });
          },
        },
      ],
    );
  }, [peerUserId, peerName, goBack, t]);

  const openChatActions = useCallback(() => {
    if (!activeId) return;
    Alert.alert(t('client.chatActions.title'), undefined, [
      { text: t('client.chatActions.delete'), onPress: handleDeleteChat, style: 'destructive' },
      { text: t('client.chatActions.block'), onPress: handleBlockUser, style: 'destructive' },
      { text: t('client.chatActions.cancel'), style: 'cancel' },
    ]);
  }, [activeId, handleDeleteChat, handleBlockUser, t]);

  const openWebCall = useCallback(() => {
    setShowCallModal(true);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const closeWebCall = useCallback((summary?: ChatCallSummary) => {
    if (summary && activeId) {
      void chatApi.sendCallSummary(activeId, serializeCallSummary(summary)).catch(() => undefined);
      setCallSummaries((prev) => [
        ...prev,
        {
          ...summary,
          id: `call_${summary.endedAt}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId: activeId,
        },
      ]);
      scrollToBottom();
    }
    setShowCallModal(false);
  }, [activeId, scrollToBottom]);

  const applyPeer = useCallback((next?: ChatPeer | null) => {
    if (!next) return;
    setPeer((prev) => {
      if (!prev) return next;
      return {
        ...prev,
        ...next,
        displayName: next.displayName || prev.displayName,
        avatarUrl: next.avatarUrl || prev.avatarUrl,
      };
    });
  }, []);

  const loadEmergencyRequest = useCallback(async (requestId: string) => {
    try {
      const request = await emergencyHireApi.get(requestId);
      setEmergencyRequest(request);
    } catch {
      setEmergencyRequest(null);
    }
  }, []);

  const loadNegotiationServiceNames = useCallback(
    async (nego: EmergencyHireNegotiation[]) => {
      if (nego.length === 0) {
        setNegotiationServiceNames({});
        return;
      }
      const proId = nego[0]?.professionalId;
      if (!proId) return;
      try {
        const services = await servicesApi.list({ professionalId: proId });
        const map: Record<string, string[]> = {};
        for (const n of nego) {
          const names = (n.serviceIds ?? [])
            .map((id) => services.find((s) => s.id === id)?.name)
            .filter((name): name is string => !!name);
          map[n.id] = names.length > 0 ? names : [t('emergencyHire.negotiation.serviceFallback')];
        }
        setNegotiationServiceNames(map);
      } catch {
        const fallback: Record<string, string[]> = {};
        for (const n of nego) {
          fallback[n.id] = [t('emergencyHire.negotiation.serviceFallback')];
        }
        setNegotiationServiceNames(fallback);
      }
    },
    [t],
  );

  const reloadNegotiations = useCallback(
    async (conversationId: string, requestId?: string | null) => {
      const reqId = requestId ?? emergencyRequestId;
      if (!reqId) return;
      try {
        const nego = filterNegotiationsForRequest(
          await emergencyHireApi.listNegotiations(conversationId),
          reqId,
        );
        setNegotiations(nego);
        void loadNegotiationServiceNames(nego);
      } catch {
        // keep existing list
      }
    },
    [emergencyRequestId, loadNegotiationServiceNames],
  );

  const handleEmergencyHireRealtime = useCallback(
    (update: Parameters<typeof applyEmergencyHireRealtimeUpdate>[1]) => {
      setEmergencyRequest((prev) => (prev ? applyEmergencyHireRealtimeUpdate(prev, update) : prev));
      if (update.action === 'EXPIRED') {
        void loadEmergencyRequest(update.requestId);
      }
      if (
        (update.action === 'QUOTE_SENT' ||
          update.action === 'QUOTE_DECLINED' ||
          update.action === 'CONTRACT_PENDING') &&
        activeId
      ) {
        void reloadNegotiations(activeId, update.requestId);
        void loadEmergencyRequest(update.requestId);
      }
    },
    [loadEmergencyRequest, activeId, reloadNegotiations],
  );

  useEmergencyHireRealtime(emergencyRequestId, handleEmergencyHireRealtime);

  const loadConversation = useCallback(
    async (id: string) => {
      const [msgsResult, offersResult, summaryResult] = await Promise.allSettled([
        chatApi.getMessages(id),
        offersApi.listByConversation(id),
        chatApi.getConversation(id),
      ]);

      if (msgsResult.status === 'rejected') {
        throw msgsResult.reason;
      }

      setMessages(msgsResult.value);
      setOffers(offersResult.status === 'fulfilled' ? offersResult.value : []);
      if (summaryResult.status === 'fulfilled') {
        const conv = summaryResult.value;
        applyPeer(conv.peer ?? null);

        // If the backend didn't include a peer (e.g. emergency-hire flow without professionalId),
        // try to resolve the peer from the other participant in the conversation.
        if (!conv.peer?.displayName?.trim() && conv.participants && userId) {
          const otherParticipant = conv.participants.find((p) => p !== userId);
          if (otherParticipant) {
            professionalsApi
              .getById(otherParticipant)
              .then((pro) => applyPeer(peerFromProfessional(pro)))
              .catch(() => undefined);
          }
        }

        const reqId = conv.emergencyHireRequestId ?? emergencyHireRequestIdParam ?? null;
        setEmergencyRequestId(reqId);
        if (reqId) {
          try {
            const nego = filterNegotiationsForRequest(
              await emergencyHireApi.listNegotiations(id),
              reqId,
            );
            setNegotiations(nego);
            void loadNegotiationServiceNames(nego);
            void loadEmergencyRequest(reqId);
          } catch {
            setNegotiations([]);
          }
        } else {
          setNegotiations([]);
        }
      }
      useNotificationStore.getState().setActiveChatConversationId(id);
      setActiveId(id);
      scrollToBottom();
      void useNotificationStore.getState().markConversationRead(id);
    },
    [applyPeer, scrollToBottom, emergencyHireRequestIdParam, loadEmergencyRequest, loadNegotiationServiceNames, userId],
  );

  useEffect(() => {
    const peerId = otherUserId ?? professionalId;
    if (!peerId) return;

    professionalsApi
      .getById(peerId)
      .then((pro) => applyPeer(peerFromProfessional(pro)))
      .catch(() => undefined);
  }, [otherUserId, professionalId, applyPeer]);

  useEffect(() => {
    (async () => {
      try {
        if (conversationId) {
          await loadConversation(conversationId);
          return;
        }
        const peerId = otherUserId ?? professionalId;
        if (peerId) {
          const conv = await chatApi.openDirect(peerId);
          applyPeer(conv.peer ?? null);
          await loadConversation(conv.id);
          return;
        }
        const convs = await chatApi.listConversations();
        if (convs[0]?.id) {
          applyPeer(convs[0].peer ?? null);
          await loadConversation(convs[0].id);
        }
      } catch (e) {
        setError(getApiErrorMessage(e, t('client.chatError')));
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, professionalId, otherUserId, loadConversation, applyPeer, t]);

  useEffect(() => {
    if (!activeId) return;
    useNotificationStore.getState().setActiveChatConversationId(activeId);
    return () => {
      const closingId = activeId;
      useNotificationStore.getState().setActiveChatConversationId(null);
      void useNotificationStore.getState().markConversationRead(closingId);
    };
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    const offLive = subscribeActiveChatMessages((incoming) => {
      const openId = useNotificationStore.getState().activeChatConversationId;
      if (!openId || incoming.conversationId !== openId) return;
      setMessages((prev) => appendChatMessage(prev, incoming));
      if (incoming.type === 'EMERGENCY_NEGOTIATION') {
        void reloadNegotiations(openId);
      }
      scrollToBottom();
      if (userId && !isSameChatUser(incoming.senderId, userId)) {
        void useNotificationStore.getState().markConversationRead(openId);
      }
    });

    const poll = setInterval(() => {
      void chatApi
        .getMessages(activeId)
        .then((serverMessages) => {
          setMessages((prev) => {
            const merged = new Map(serverMessages.map((m) => [m.id, m]));
            for (const m of prev) {
              if (m.id.startsWith('local_')) merged.set(m.id, m);
            }
            return [...merged.values()].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
          });
          if (
            emergencyRequestId &&
            serverMessages.some((m) => m.type === 'EMERGENCY_NEGOTIATION' && m.negotiationId)
          ) {
            void reloadNegotiations(activeId);
          }
        })
        .catch(() => undefined);
    }, 4000);

    return () => {
      offLive();
      clearInterval(poll);
    };
  }, [activeId, scrollToBottom, userId, emergencyRequestId, reloadNegotiations]);

  useEffect(() => {
    if (!emergencyRequestId) {
      setEmergencyRequest(null);
      return;
    }
    void loadEmergencyRequest(emergencyRequestId);
  }, [emergencyRequestId, loadEmergencyRequest]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const send = async () => {
    if (!activeId) {
      setError(t('client.chatNoConversation'));
      return;
    }
    const text = message.trim();
    if (!text || sending || !userId) return;
    if (containsOffPlatformContactInfo(text)) {
      setMessage('');
      setError(t('client.chatContactBlocked'));
      return;
    }

    setSending(true);
    setError(null);
    const optimisticId = `local_${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      conversationId: activeId,
      senderId: userId,
      type: 'TEXT',
      message: text,
      read: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessage('');
    scrollToBottom();

    try {
      const sent = await chatApi.sendMessage(activeId, text);
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
        return appendChatMessage(withoutOptimistic, sent);
      });
      scrollToBottom();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setMessage(text);
      setError(getApiErrorMessage(e, t('client.chatError')));
    } finally {
      setSending(false);
    }
  };

  const respond = async (offerId: string, action: 'accept' | 'decline') => {
    setResponding(offerId);
    try {
      if (action === 'accept') await offersApi.accept(offerId);
      else await offersApi.decline(offerId);
      if (activeId) await loadConversation(activeId);
    } finally {
      setResponding(null);
    }
  };

  const respondNegotiation = async (negotiationId: string, action: 'accept' | 'reject') => {
    const target = negotiations.find((n) => n.id === negotiationId);
    if (!target || !isPendingProfessionalQuoteForClient(target, userId, emergencyRequestId)) {
      setError(t('emergencyHire.negotiation.errors.quoteRequired'));
      return;
    }
    setResponding(negotiationId);
    setError(null);
    try {
      if (action === 'accept') {
        setCreatingContract(true);
        const saved = await emergencyHireApi.acceptNegotiation(negotiationId);
        if (activeId) {
          await loadConversation(activeId);
          void loadEmergencyRequest(emergencyRequestId!);
        }
        if (saved.contractId) {
          router.push(`/client/contract/${saved.contractId}` as never);
        }
      } else {
        await emergencyHireApi.rejectNegotiation(negotiationId);
        if (activeId) {
          await loadConversation(activeId);
          void reloadNegotiations(activeId);
          if (emergencyRequestId) void loadEmergencyRequest(emergencyRequestId);
        }
      }
    } catch (e) {
      setError(getApiErrorMessage(e, t('emergencyHire.negotiation.errors.propose')));
    } finally {
      setResponding(null);
      setCreatingContract(false);
    }
  };

  const proposeNegotiation = async () => {
    if (!activeId || !emergencyRequestId) return;
    const price = Number.parseFloat(negoPrice.replace(',', '.'));
    if (!Number.isFinite(price) || price <= 0) {
      setError(t('emergencyHire.negotiation.errors.price'));
      return;
    }
    if (!isValidPreferredSchedule(negoDate, negoTime)) {
      setError(t('emergencyHire.errors.scheduleBeyond'));
      return;
    }
    setProposing(true);
    setError(null);
    try {
      await emergencyHireApi.propose(emergencyRequestId, {
        conversationId: activeId,
        serviceDate: formatLocalDate(negoDate),
        serviceTime: negoTime.length >= 5 ? negoTime : `${negoTime}:00`,
        estimatedArrivalTime: negoArrival.length >= 5 ? negoArrival : `${negoArrival}:00`,
        price,
        currency: 'USD',
        notes: negoNotes.trim() || undefined,
        estimatedDurationMinutes: Number.parseInt(negoDuration, 10) || 60,
      });
      setShowProposalModal(false);
      await loadConversation(activeId);
    } catch (e) {
      setError(getApiErrorMessage(e, t('emergencyHire.negotiation.errors.propose')));
    } finally {
      setProposing(false);
    }
  };

  const openProposalModal = async () => {
    if (!activeId || !emergencyRequestId) return;
    setError(null);
    try {
      const [request, std] = await Promise.all([
        emergencyHireApi.get(emergencyRequestId),
        emergencyHireApi.getStandardPrice(emergencyRequestId, activeId),
      ]);
      if (request.preferredDate) {
        const d = new Date(`${request.preferredDate}T12:00:00`);
        if (!Number.isNaN(d.getTime())) setNegoDate(d);
      }
      if (request.preferredTime) setNegoTime(request.preferredTime.slice(0, 5));
      setNegoPrice(String(std.price));
      setNegoDuration(String(std.durationMinutes || 60));
      setListPriceHint(`${std.serviceName} · ${std.price} ${std.currency}`);
      setShowProposalModal(true);
    } catch (e) {
      setError(getApiErrorMessage(e, t('emergencyHire.negotiation.errors.propose')));
    }
  };

  const offerById = (id?: string) => offers.find((o) => o.id === id);
  const negotiationById = (id?: string) => negotiations.find((n) => n.id === id);
  const isEmergencyChat = !!emergencyRequestId;
  const { expired: emergencyExpired, remaining: emergencyTimeRemaining } =
    useEmergencyHireCountdown(emergencyRequest);
  const canSend = !!activeId && !sending && !!message.trim();
  const quoteCardLabels = {
    title: t('emergencyHire.quoteCard.title'),
    date: t('emergencyHire.negotiation.date'),
    time: t('emergencyHire.negotiation.time'),
    arrival: t('emergencyHire.negotiation.arrival'),
    price: t('emergencyHire.negotiation.price'),
    included: t('quoteConfirmation.included'),
    notes: t('emergencyHire.negotiation.notes'),
    duration: t('emergencyHire.negotiation.duration'),
    confirm: t('quoteConfirmation.confirm'),
    decline: t('quoteConfirmation.decline'),
    viewContract: t('emergencyHire.negotiation.viewContract'),
    statusPending: t('emergencyHire.quoteCard.statusPending'),
    statusAccepted: t('emergencyHire.quoteCard.statusAccepted'),
    statusDeclined: t('emergencyHire.quoteCard.statusDeclined'),
    statusCancelled: t('emergencyHire.quoteCard.statusCancelled'),
    statusSuperseded: t('emergencyHire.quoteCard.statusSuperseded'),
    basePrice: t('emergencyHire.quoteCard.basePrice'),
    proconnectFee: t('payment.proconnectFee'),
    estimatedTotal: t('emergencyHire.quoteCard.estimatedTotal'),
  };
  const hasPendingProQuote = !!findPendingProfessionalQuoteForClient(
    negotiations,
    userId,
    emergencyRequestId,
  );
  const quoteCancelled =
    !hasPendingProQuote &&
    negotiations.some((n) => n.status === 'REJECTED' && n.requestId === emergencyRequestId);
  const contractPending =
    emergencyRequest?.status === 'CONTRACT_PENDING' ||
    emergencyRequest?.status === 'QUOTE_ACCEPTED';
  const showEmergencyChatBanner =
    isEmergencyChat &&
    !emergencyExpired &&
    isActiveEmergencyHireStatus(emergencyRequest?.status);

  if (loading) return <Spinner fullscreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.surfaceAlt }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1 }}>
        <View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingTop: insets.top + spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
            shadow.sm,
          ]}
        >
          <BackButton compact onPress={goBack} />
          <Avatar name={peerName} uri={peerAvatar} size={44} accentColor={accent} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {activeId ? peerName : t('client.chatEmpty')}
            </Text>
            {peer?.headline ? (
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {peer.headline}
              </Text>
            ) : null}
          </View>
          {activeId ? (
            <>
              <Pressable
                onPress={openWebCall}
                hitSlop={12}
                accessibilityLabel={t('client.chatCall.start')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${accent}16`,
                }}
              >
                <Icon name="call-outline" size={19} color={accent} />
              </Pressable>
              <Pressable
                onPress={openChatActions}
                hitSlop={12}
                accessibilityLabel={t('client.chatActions.title')}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceAlt,
                }}
              >
                <Icon name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </>
          ) : null}
        </View>

        {showEmergencyChatBanner ? (
          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.sm,
              backgroundColor: theme.colors.surfaceAlt,
            }}
          >
            <EmergencyHireChatBanner
              expired={emergencyExpired}
              timeRemaining={emergencyTimeRemaining}
              isProfessional={isProfessionalView}
              hasPendingProQuote={hasPendingProQuote}
              quoteCancelled={quoteCancelled}
              contractPending={contractPending}
              accentColor={accent}
              onSendQuote={() => void openProposalModal()}
              labels={{
                title: t('emergencyHire.chatBanner'),
                countdown: t('emergencyHire.expiration.countdown'),
                subtitle: t('emergencyHire.expiration.activeShort'),
                expiredSubtitle: t('emergencyHire.expiration.expiredShort'),
                readOnlyHint: t('emergencyHire.expiration.readOnlyHint'),
                sendQuote: t('emergencyHire.negotiation.sendQuote'),
                reviewQuote: t('emergencyHire.negotiation.reviewQuote'),
                waitingQuote: t('emergencyHire.negotiation.waitingQuote'),
                freeMessaging: t('emergencyHire.negotiation.freeMessaging'),
                contractPending: t('emergencyHire.negotiation.contractPending'),
                resendQuoteHint: t('emergencyHire.negotiation.resendQuoteHint'),
              }}
            />
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: theme.colors.surfaceAlt }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
            gap: spacing.md,
            flexGrow: 1,
            paddingBottom: spacing.xxl,
          }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
        >
          {!activeId ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.xxxl,
              }}
            >
              <Icon name="chatbubbles-outline" size={40} color={theme.colors.textMuted} />
              <Text variant="caption" color="textSecondary" center style={{ marginTop: spacing.md }}>
                {t('client.chatNoConversation')}
              </Text>
            </View>
          ) : null}

          {activeId && messages.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: spacing.xxxl,
                paddingHorizontal: spacing.xl,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${accent}14`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                }}
              >
                <Icon name="chatbubble-ellipses-outline" size={28} color={accent} />
              </View>
              <Text variant="bodyStrong" center>
                {peerName}
              </Text>
              <Text variant="caption" color="textMuted" center style={{ marginTop: spacing.xs }}>
                {t('client.chatEmptyThread')}
              </Text>
            </View>
          ) : null}

          {messages.map((m) => {
            const mine = isSameChatUser(m.senderId, userId);
            const body = messageBody(m);
            const callSummary = m.type === 'CALL' ? parseCallSummary(m.message) : null;
            if (!body && !callSummary && m.type !== 'PRICE_OFFER' && m.type !== 'EMERGENCY_NEGOTIATION') return null;

            const offer = m.type === 'PRICE_OFFER' ? offerById(m.offerId) : undefined;
            const negotiation = m.type === 'EMERGENCY_NEGOTIATION' ? negotiationById(m.negotiationId) : undefined;
            if (
              m.type === 'EMERGENCY_NEGOTIATION' &&
              emergencyRequestId &&
              negotiation &&
              negotiation.requestId !== emergencyRequestId
            ) {
              return null;
            }
            const corners = bubbleCorners(mine);

            const isQuoteMessage = m.type === 'EMERGENCY_NEGOTIATION';
            const isCallMessage = !!callSummary;
            const urgentBubble =
              showEmergencyChatBanner && !isQuoteMessage
                ? urgentHireMessageBubble(isProfessionalView, mine)
                : null;

            return (
              <View
                key={m.id}
                style={{
                  alignSelf: isQuoteMessage || isCallMessage ? 'stretch' : mine ? 'flex-end' : 'flex-start',
                  maxWidth: isQuoteMessage || isCallMessage ? '100%' : '80%',
                  gap: spacing.xs,
                }}
              >
                <View
                  style={
                    isQuoteMessage || isCallMessage
                      ? { paddingVertical: spacing.xs }
                      : [
                          {
                            backgroundColor: urgentBubble?.backgroundColor ?? (mine ? accent : theme.colors.surface),
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm + 2,
                            borderWidth: urgentBubble || !mine ? 1 : 0,
                            borderColor: urgentBubble?.borderColor ?? theme.colors.border,
                          },
                          corners,
                          !mine && !urgentBubble ? shadow.sm : undefined,
                        ]
                  }
                >
                  {negotiation ? (
                    <EmergencyHireQuoteCard
                      negotiation={negotiation}
                      serviceNames={negotiationServiceNames[negotiation.id] ?? []}
                      accentColor={accent}
                      labels={quoteCardLabels}
                      showActions={
                        isPendingProfessionalQuoteForClient(negotiation, userId, emergencyRequestId) &&
                        !isProfessionalView &&
                        !emergencyExpired
                      }
                      actionsLoading={responding === negotiation.id}
                      onConfirm={() => void respondNegotiation(negotiation.id, 'accept')}
                      onDecline={() => void respondNegotiation(negotiation.id, 'reject')}
                      showViewContract={negotiation.status === 'ACCEPTED' && !!negotiation.contractId}
                      onViewContract={() => {
                        const contractPath = isProfessionalView
                          ? `/professional/contract/${negotiation.contractId}`
                          : `/client/contract/${negotiation.contractId}`;
                        router.push(contractPath as never);
                      }}
                    />
                  ) : isQuoteMessage ? (
                    <EmergencyHireQuoteCardSkeleton
                      title={quoteCardLabels.title}
                      loadingLabel={t('emergencyHire.quoteCard.loading')}
                      accentColor={accent}
                    />
                  ) : callSummary ? (
                    <CallSummaryCard
                      summary={callSummary}
                      accent={accent}
                      theme={theme}
                      labels={{
                        answered: t('client.chatCall.summaryAnswered'),
                        missed: t('client.chatCall.summaryMissed'),
                        duration: t('client.chatCall.summaryDuration'),
                        incoming: t('client.chatCall.summaryIncoming'),
                        outgoing: t('client.chatCall.summaryOutgoing'),
                        missedHint: t('client.chatCall.connectTimeout'),
                      }}
                    />
                  ) : body ? (
                    <Text
                      variant="body"
                      style={{
                        color: urgentBubble
                          ? urgentHireColors.messageText
                          : mine
                            ? theme.colors.textInverse
                            : theme.colors.text,
                        lineHeight: 22,
                      }}
                    >
                      {body}
                    </Text>
                  ) : null}

                  {offer && !isEmergencyChat && offer.status === 'PENDING' && role === 'PROFESSIONAL' ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                      <Pressable
                        onPress={() => respond(offer.id, 'accept')}
                        disabled={responding === offer.id}
                        style={{
                          flex: 1,
                          backgroundColor: mine ? theme.colors.surface : accent,
                          borderRadius: radius.md,
                          paddingVertical: spacing.sm,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ color: mine ? accent : theme.colors.textInverse, fontWeight: '600' }}
                        >
                          {t('client.offer.accept')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => respond(offer.id, 'decline')}
                        disabled={responding === offer.id}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: mine ? theme.colors.textInverse : accent,
                          borderRadius: radius.md,
                          paddingVertical: spacing.sm,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          variant="caption"
                          style={{ color: mine ? theme.colors.textInverse : accent, fontWeight: '600' }}
                        >
                          {t('client.offer.decline')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {offer && !isEmergencyChat && offer.status !== 'PENDING' ? (
                    <Text variant="caption" color={offer.status === 'ACCEPTED' ? 'success' : 'danger'}>
                      {offer.status === 'ACCEPTED'
                        ? t('client.offer.statusAccepted')
                        : t('client.offer.statusDeclined')}
                    </Text>
                  ) : null}

                  {offer && !isEmergencyChat && offer.status === 'ACCEPTED' && role === 'CLIENT' ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: `/client/hire/${offer.professionalId}`,
                          params: { serviceId: offer.serviceId, amount: String(offer.offeredAmount) },
                        } as never)
                      }
                      style={{
                        marginTop: spacing.sm,
                        backgroundColor: mine ? theme.colors.surface : accent,
                        borderRadius: radius.md,
                        paddingVertical: spacing.sm,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{ color: mine ? accent : theme.colors.textInverse, fontWeight: '600' }}
                      >
                        {t('client.offer.continueHire')}
                      </Text>
                    </Pressable>
                  ) : null}


                </View>
                <Text
                  variant="caption"
                  color="textMuted"
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    marginHorizontal: spacing.xs,
                    fontSize: 11,
                  }}
                >
                  {formatChatTime(m.createdAt)}
                </Text>
              </View>
            );
          })}

          {callSummaries
            .filter((summary) => summary.conversationId === activeId)
            .map((summary) => {
              const answered = summary.status === 'answered';
              return (
                <View
                  key={summary.id}
                  style={{
                    alignSelf: 'center',
                    width: '86%',
                    borderWidth: 1,
                    borderColor: answered ? `${accent}55` : theme.colors.border,
                    backgroundColor: answered ? `${accent}12` : theme.colors.surface,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    marginTop: spacing.sm,
                    gap: spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: answered ? `${accent}22` : theme.colors.surfaceAlt,
                      }}
                    >
                      <Icon
                        name={answered ? 'call-outline' : 'call'}
                        size={18}
                        color={answered ? accent : theme.colors.textMuted}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">
                        {answered ? t('client.chatCall.summaryAnswered') : t('client.chatCall.summaryMissed')}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {answered
                          ? `${t('client.chatCall.summaryDuration')}: ${formatCallDuration(summary.durationSeconds)}`
                          : t('client.chatCall.connectTimeout')}
                        {' · '}
                        {summary.direction === 'incoming'
                          ? t('client.chatCall.summaryIncoming')
                          : t('client.chatCall.summaryOutgoing')}
                      </Text>
                    </View>
                    <Text variant="caption" color="textMuted">
                      {formatChatTime(summary.endedAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
        </ScrollView>

        {error ? (
          <ErrorBanner
            message={error}
            retryLabel={t('common.retry')}
            onRetry={() => {
              if (activeId) void loadConversation(activeId);
            }}
            onDismiss={() => setError(null)}
            style={{ marginHorizontal: spacing.lg, marginBottom: spacing.xs }}
          />
        ) : null}

        {showEmergencyChatBanner && isProfessionalView && showProposalModal ? (
          <EmergencyHireNegotiationPanel
            visible={showProposalModal}
            accentColor={accent}
            title={t('emergencyHire.negotiation.panelTitle')}
            serviceDate={negoDate}
            serviceTime={negoTime}
            estimatedArrivalTime={negoArrival}
            price={negoPrice}
            notes={negoNotes}
            durationMinutes={negoDuration}
            listPriceHint={listPriceHint}
            lockSchedule
            maximumScheduleDate={maxPreferredDate()}
            onChangeServiceDate={setNegoDate}
            onChangeServiceTime={setNegoTime}
            onChangeEstimatedArrivalTime={setNegoArrival}
            onChangePrice={setNegoPrice}
            onChangeNotes={setNegoNotes}
            onChangeDurationMinutes={setNegoDuration}
            onPropose={proposeNegotiation}
            onClose={() => setShowProposalModal(false)}
            proposing={proposing}
            labels={{
              date: t('emergencyHire.negotiation.date'),
              time: t('emergencyHire.negotiation.time'),
              arrival: t('emergencyHire.negotiation.arrival'),
              price: t('emergencyHire.negotiation.price'),
              notes: t('emergencyHire.negotiation.notes'),
              duration: t('emergencyHire.negotiation.duration'),
              propose: t('emergencyHire.negotiation.propose'),
              cancel: t('emergencyHire.negotiation.cancel'),
              listPriceHint: t('emergencyHire.negotiation.listPriceHint'),
            }}
          />
        ) : null}

        <Modal visible={creatingContract} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing.xl,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: radius.lg,
                padding: spacing.xl,
                alignItems: 'center',
                gap: spacing.md,
                minWidth: 260,
                ...shadow.md,
              }}
            >
              <ActivityIndicator size="large" color={accent} />
              <Text variant="bodyStrong" center>
                {t('emergencyHire.negotiation.creatingContract')}
              </Text>
              <Text variant="caption" color="textSecondary" center style={{ lineHeight: 20 }}>
                {t('emergencyHire.negotiation.creatingContractHint')}
              </Text>
            </View>
          </View>
        </Modal>

        {activeId ? (
          <ChatCallModal
            visible={showCallModal}
            conversationId={activeId}
            peerName={peerName}
            accentColor={accent}
            onClose={closeWebCall}
            labels={{
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
            }}
          />
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: Math.max(insets.bottom, spacing.md),
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            alignItems: 'flex-end',
            backgroundColor: theme.colors.surface,
          }}
        >
          <Pressable
            hitSlop={8}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Icon name="attach-outline" size={22} color={theme.colors.textMuted} />
          </Pressable>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 44,
              maxHeight: 120,
              borderRadius: radius.pill,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: Platform.OS === 'ios' ? spacing.sm : 0,
            }}
          >
            <TextInput
              placeholder={t('client.offer.messagePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              value={message}
              onChangeText={setMessage}
              editable={!!activeId && !sending}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline
              style={{
                flex: 1,
                fontSize: 15,
                lineHeight: 20,
                color: theme.colors.text,
                maxHeight: 96,
                paddingVertical: Platform.OS === 'android' ? spacing.sm : spacing.xs,
              }}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!canSend}
            hitSlop={8}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? accent : theme.colors.surfaceAlt,
              marginBottom: 0,
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color={canSend ? theme.colors.textInverse : theme.colors.textMuted} />
            ) : (
              <Icon
                name="send-outline"
                size={20}
                color={canSend ? theme.colors.textInverse : theme.colors.textMuted}
              />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
