import { EmergencyHireRequest } from '@/types';

export type EmergencyHireRealtimeUpdate = {
  event: 'EMERGENCY_HIRE_UPDATED';
  requestId: string;
  action: string;
  status?: EmergencyHireRequest['status'];
  expiresAt?: string;
};

export type EmergencyHireAvailabilityRealtimeUpdate = {
  event: 'PROFESSIONAL_EMERGENCY_HIRE_VISIBILITY_CHANGED';
  professionalId: string;
  enabled: boolean;
};

export function normalizeEmergencyHireUpdate(raw: unknown): EmergencyHireRealtimeUpdate | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload.event !== 'EMERGENCY_HIRE_UPDATED') return null;
  if (typeof payload.requestId !== 'string' || typeof payload.action !== 'string') return null;
  return {
    event: 'EMERGENCY_HIRE_UPDATED',
    requestId: payload.requestId,
    action: payload.action,
    status: typeof payload.status === 'string' ? (payload.status as EmergencyHireRequest['status']) : undefined,
    expiresAt: typeof payload.expiresAt === 'string' ? payload.expiresAt : undefined,
  };
}

export function normalizeEmergencyHireAvailabilityUpdate(
  raw: unknown,
): EmergencyHireAvailabilityRealtimeUpdate | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  if (payload.event !== 'PROFESSIONAL_EMERGENCY_HIRE_VISIBILITY_CHANGED') return null;
  if (typeof payload.professionalId !== 'string' || typeof payload.enabled !== 'boolean') return null;
  return {
    event: 'PROFESSIONAL_EMERGENCY_HIRE_VISIBILITY_CHANGED',
    professionalId: payload.professionalId,
    enabled: payload.enabled,
  };
}

export function applyEmergencyHireRealtimeUpdate(
  request: EmergencyHireRequest,
  update: EmergencyHireRealtimeUpdate,
): EmergencyHireRequest {
  if (update.requestId !== request.id) return request;
  return {
    ...request,
    status: update.status ?? (update.action === 'EXPIRED' ? 'EXPIRED' : request.status),
    expiresAt: update.expiresAt ?? request.expiresAt,
  };
}
