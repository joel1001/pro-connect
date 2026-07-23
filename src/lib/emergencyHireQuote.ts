import { EmergencyHireNegotiation } from '@/types';

/** True when the professional explicitly sent this quote for the active urgent hire request. */
export function isProfessionalQuoteForClient(
  negotiation: EmergencyHireNegotiation,
  clientUserId?: string | null,
  activeRequestId?: string | null,
): boolean {
  if (!clientUserId || clientUserId !== negotiation.clientId) return false;
  if (activeRequestId && negotiation.requestId !== activeRequestId) return false;
  if (negotiation.proposedBy !== negotiation.professionalId) return false;
  return !!negotiation.messageId;
}

export function isPendingProfessionalQuoteForClient(
  negotiation: EmergencyHireNegotiation,
  clientUserId?: string | null,
  activeRequestId?: string | null,
): boolean {
  return (
    negotiation.status === 'PENDING' &&
    isProfessionalQuoteForClient(negotiation, clientUserId, activeRequestId)
  );
}

export function findPendingProfessionalQuoteForClient(
  negotiations: EmergencyHireNegotiation[],
  clientUserId?: string | null,
  activeRequestId?: string | null,
): EmergencyHireNegotiation | undefined {
  return negotiations.find((n) => isPendingProfessionalQuoteForClient(n, clientUserId, activeRequestId));
}

export function filterNegotiationsForRequest(
  negotiations: EmergencyHireNegotiation[],
  activeRequestId?: string | null,
): EmergencyHireNegotiation[] {
  if (!activeRequestId) return [];
  return negotiations.filter((n) => n.requestId === activeRequestId);
}
