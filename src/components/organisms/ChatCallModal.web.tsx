import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { ChatCallSignal, realtimeService } from '@/services/realtime';
import { radius, shadow, spacing } from '@/theme';

type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'error';
const CALL_CONNECT_TIMEOUT_MS = 20_000;

export interface ChatCallSummary {
  status: 'missed' | 'answered';
  direction: 'incoming' | 'outgoing';
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

interface ChatCallModalProps {
  visible: boolean;
  conversationId: string;
  peerName: string;
  accentColor: string;
  incomingOffer?: ChatCallSignal | null;
  labels: {
    calling: string;
    incoming: string;
    connecting: string;
    connected: string;
    ended: string;
    unavailable: string;
    nativeBuildRequired: string;
    realtimeError: string;
    connectTimeout: string;
    microphoneError: string;
    accept: string;
    reject: string;
    hangup: string;
    start: string;
  };
  onClose: (summary?: ChatCallSummary) => void;
}

function createCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
}

export function ChatCallModal({
  visible,
  conversationId,
  peerName,
  accentColor,
  incomingOffer,
  labels,
  onClose,
}: ChatCallModalProps) {
  const theme = useTheme();
  const [status, setStatus] = useState<CallStatus>('idle');
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callIdRef = useRef<string>(incomingOffer?.callId ?? createCallId());
  const callStartedAtRef = useRef<string>(new Date().toISOString());
  const connectedAtRef = useRef<number | null>(null);
  const closeReportedRef = useRef(false);
  const acceptedIncomingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  const armConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    connectTimeoutRef.current = setTimeout(() => {
      setErrorHint(labels.connectTimeout);
      setStatus('error');
      cleanup();
    }, CALL_CONNECT_TIMEOUT_MS);
  }, [cleanup, labels.connectTimeout]);

  const sendSignal = useCallback(
    async (signal: Omit<ChatCallSignal, 'callId' | 'conversationId'>) => {
      return realtimeService.sendCallSignal({
        ...signal,
        callId: callIdRef.current,
        conversationId,
      });
    },
    [conversationId],
  );

  const addIceCandidateSafely = useCallback(async (candidate: RTCIceCandidateInit) => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;
    if (!peerConnection.remoteDescription) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    await peerConnection.addIceCandidate(candidate).catch(() => undefined);
  }, []);

  const flushPendingCandidates = useCallback(async () => {
    const queued = pendingCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      await addIceCandidateSafely(candidate);
    }
  }, [addIceCandidateSafely]);

  const buildSummary = useCallback((): ChatCallSummary => {
    const endedAtMs = Date.now();
    const connectedAt = connectedAtRef.current;
    return {
      status: connectedAt ? 'answered' : 'missed',
      direction: incomingOffer ? 'incoming' : 'outgoing',
      startedAt: callStartedAtRef.current,
      endedAt: new Date(endedAtMs).toISOString(),
      durationSeconds: connectedAt ? Math.max(1, Math.round((endedAtMs - connectedAt) / 1000)) : 0,
    };
  }, [incomingOffer]);

  const reportClose = useCallback(() => {
    if (closeReportedRef.current) return;
    closeReportedRef.current = true;
    onClose(buildSummary());
  }, [buildSummary, onClose]);

  const markCallAnswered = useCallback(() => {
    if (!connectedAtRef.current) {
      connectedAtRef.current = Date.now();
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    setStatus('connected');
  }, []);

  const setupPeerConnection = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setErrorHint(labels.unavailable);
      setStatus('error');
      return null;
    }

    const peerConnection = createPeerConnection();
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        void sendSignal({ type: 'candidate', candidate: event.candidate.toJSON() });
      }
    };
    peerConnection.ontrack = (event) => {
      markCallAnswered();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'connected') {
        markCallAnswered();
      }
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setErrorHint(labels.connectTimeout);
        setStatus('ended');
      }
    };
    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        markCallAnswered();
      }
    };

    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = localStream;
      localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
      return peerConnection;
    } catch {
      setErrorHint(labels.microphoneError);
      setStatus('error');
      cleanup();
      return null;
    }
  }, [cleanup, labels.connectTimeout, labels.microphoneError, labels.unavailable, markCallAnswered, sendSignal]);

  const startOutgoingCall = useCallback(async () => {
    setStatus('connecting');
    armConnectTimeout();
    const peerConnection = await setupPeerConnection();
    if (!peerConnection) return;
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const sent = await sendSignal({ type: 'offer', sdp: offer.sdp });
    if (!sent) {
      setErrorHint(labels.realtimeError);
      setStatus('error');
      cleanup();
      return;
    }
    setStatus('ringing');
  }, [armConnectTimeout, cleanup, labels.realtimeError, sendSignal, setupPeerConnection]);

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingOffer?.sdp || acceptedIncomingRef.current) return;
    acceptedIncomingRef.current = true;
    setStatus('connecting');
    armConnectTimeout();
    const peerConnection = await setupPeerConnection();
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription({ type: 'offer', sdp: incomingOffer.sdp });
    await flushPendingCandidates();
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const sent = await sendSignal({ type: 'answer', sdp: answer.sdp });
    if (!sent) {
      setErrorHint(labels.realtimeError);
      setStatus('error');
      cleanup();
      return;
    }
    markCallAnswered();
  }, [armConnectTimeout, cleanup, flushPendingCandidates, incomingOffer, labels.realtimeError, markCallAnswered, sendSignal, setupPeerConnection]);

  const closeCall = useCallback(
    async (type: 'hangup' | 'reject' = 'hangup') => {
      if (status !== 'ended') {
        await sendSignal({ type }).catch(() => undefined);
      }
      cleanup();
      setStatus('ended');
      reportClose();
    },
    [cleanup, reportClose, sendSignal, status],
  );

  useEffect(() => {
    if (!visible) return;
    callIdRef.current = incomingOffer?.callId ?? createCallId();
    callStartedAtRef.current = new Date().toISOString();
    connectedAtRef.current = null;
    closeReportedRef.current = false;
    acceptedIncomingRef.current = false;
    setErrorHint(null);
    setStatus(incomingOffer ? 'ringing' : 'idle');
    return cleanup;
  }, [cleanup, incomingOffer, visible]);

  useEffect(() => {
    if (!visible || incomingOffer) return;
    void startOutgoingCall();
  }, [incomingOffer, startOutgoingCall, visible]);

  useEffect(() => {
    if (!visible) return;
    return realtimeService.onCallSignal((signal) => {
      if (signal.conversationId !== conversationId || signal.callId !== callIdRef.current) return;
      if (signal.type === 'answer' && signal.sdp) {
        void peerConnectionRef.current?.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
          .then(() => {
            markCallAnswered();
            return flushPendingCandidates();
          })
          .catch(() => undefined);
        return;
      }
      if (signal.type === 'candidate' && signal.candidate) {
        void addIceCandidateSafely(signal.candidate);
        return;
      }
      if (signal.type === 'hangup' || signal.type === 'reject') {
        cleanup();
        setStatus('ended');
        reportClose();
      }
    });
  }, [addIceCandidateSafely, cleanup, conversationId, flushPendingCandidates, markCallAnswered, reportClose, visible]);

  const title =
    status === 'error'
      ? labels.unavailable
      : status === 'connected'
      ? labels.connected
      : status === 'connecting'
        ? labels.connecting
        : incomingOffer
          ? labels.incoming
          : labels.calling;
  const hint = status === 'error' ? errorHint ?? labels.microphoneError : status === 'ended' ? labels.ended : peerName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void closeCall()}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        <View style={[{ width: '100%', maxWidth: 360, borderRadius: radius.xl, backgroundColor: theme.colors.surface, padding: spacing.xl, alignItems: 'center', gap: spacing.md }, shadow.lg]}>
          {React.createElement('audio', { ref: remoteAudioRef, autoPlay: true }) as React.ReactNode}
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${accentColor}1A`, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="call-outline" size={34} color={accentColor} />
          </View>
          <Text variant="title" center>{title}</Text>
          <Text variant="body" color="textSecondary" center>{hint}</Text>
          {incomingOffer && !acceptedIncomingRef.current ? (
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              <Pressable onPress={() => void closeCall('reject')} style={{ minWidth: 112, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: theme.colors.surfaceAlt }}>
                <Text variant="bodyStrong" color="textSecondary">{labels.reject}</Text>
              </Pressable>
              <Pressable onPress={() => void acceptIncomingCall()} style={{ minWidth: 112, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: accentColor }}>
                <Text variant="bodyStrong" color="textInverse">{labels.accept}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => void closeCall()} style={{ minWidth: 180, borderRadius: radius.pill, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm, backgroundColor: theme.colors.danger }}>
              <Text variant="bodyStrong" color="textInverse">{labels.hangup}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}
