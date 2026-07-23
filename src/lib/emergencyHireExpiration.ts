import { EmergencyHireRequest } from '@/types';

const FALLBACK_TTL_MS = 48 * 60 * 60 * 1000;

export function resolveEmergencyExpiresAt(request: EmergencyHireRequest): Date | null {
  if (request.expiresAt) {
    const parsed = new Date(request.expiresAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (request.createdAt) {
    const created = new Date(request.createdAt);
    if (!Number.isNaN(created.getTime())) {
      return new Date(created.getTime() + FALLBACK_TTL_MS);
    }
  }
  return null;
}

export function formatEmergencyTimeRemaining(expiresAt: Date, now = new Date()): string {
  const diffMs = expiresAt.getTime() - now.getTime();
  if (diffMs <= 0) return '0s';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function isEmergencyExpired(request: EmergencyHireRequest): boolean {
  if (request.status === 'EXPIRED') return true;
  const expiresAt = resolveEmergencyExpiresAt(request);
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}

export function emergencyStatusLabelKey(status: EmergencyHireRequest['status']): string {
  const map: Record<string, string> = {
    OPEN: 'emergencyHire.status.open',
    NEGOTIATING: 'emergencyHire.status.negotiating',
    QUOTE_SENT: 'emergencyHire.status.quoteSent',
    QUOTE_DECLINED: 'emergencyHire.status.quoteDeclined',
    QUOTE_ACCEPTED: 'emergencyHire.status.quoteAccepted',
    CONTRACT_PENDING: 'emergencyHire.status.contractPending',
    CONTRACT_SIGNED: 'emergencyHire.status.contractSigned',
    EXPIRED: 'emergencyHire.status.expired',
    CANCELLED: 'emergencyHire.status.cancelled',
    AWAITING_RESPONSES: 'emergencyHire.status.open',
    SEARCHING_PROFESSIONALS: 'emergencyHire.status.open',
    PROFESSIONAL_ACCEPTED: 'emergencyHire.status.negotiating',
    PROFESSIONAL_SELECTED: 'emergencyHire.status.negotiating',
    CONVERTED_TO_APPOINTMENT: 'emergencyHire.status.contractSigned',
    COMPLETED: 'emergencyHire.status.contractSigned',
    DECLINED: 'emergencyHire.status.cancelled',
  };
  return map[status] ?? 'emergencyHire.status.negotiating';
}
