import { useEffect } from 'react';

import { EmergencyHireRealtimeUpdate } from '@/lib/emergencyHireRealtime';
import { realtimeService } from '@/services/realtime';

/** Subscribe to urgent hire WebSocket updates for a specific request. */
export function useEmergencyHireRealtime(
  requestId: string | null | undefined,
  onUpdate: (update: EmergencyHireRealtimeUpdate) => void,
) {
  useEffect(() => {
    if (!requestId) return;
    return realtimeService.onEmergencyHireUpdate((update) => {
      if (update.requestId === requestId) onUpdate(update);
    });
  }, [requestId, onUpdate]);
}

/** Subscribe to all urgent hire WebSocket updates (e.g. pro inbox). */
export function useEmergencyHireRealtimeAll(onUpdate: (update: EmergencyHireRealtimeUpdate) => void) {
  useEffect(() => realtimeService.onEmergencyHireUpdate(onUpdate), [onUpdate]);
}
