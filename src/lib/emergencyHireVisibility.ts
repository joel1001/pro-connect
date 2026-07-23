import type { EmergencyHireAvailabilityRealtimeUpdate } from '@/lib/emergencyHireRealtime';

const emergencyHireVisibilityOverrides = new Map<string, boolean>();

export function applyEmergencyHireVisibilityUpdate(update: EmergencyHireAvailabilityRealtimeUpdate) {
  emergencyHireVisibilityOverrides.set(update.professionalId, update.enabled);
  return update;
}

export function applyEmergencyHireVisibilityUpdates(professionalIds: string[], enabled: boolean) {
  professionalIds.forEach((professionalId) => {
    emergencyHireVisibilityOverrides.set(professionalId, enabled);
  });
}

export function syncEmergencyHireVisibilityFromServer(professionalId: string, enabled = true) {
  emergencyHireVisibilityOverrides.delete(professionalId);
}

export function isEmergencyHireVisible(professionalId: string, enabled = true): boolean {
  const override = emergencyHireVisibilityOverrides.get(professionalId);
  if (override !== undefined) return override;
  return enabled;
}
