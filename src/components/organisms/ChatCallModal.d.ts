import { ChatCallSignal } from '@/services/realtime';

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

export function ChatCallModal(props: ChatCallModalProps): JSX.Element;
