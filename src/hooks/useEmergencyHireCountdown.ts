import { useEffect, useState } from 'react';

import {
  formatEmergencyTimeRemaining,
  isEmergencyExpired,
  resolveEmergencyExpiresAt,
} from '@/lib/emergencyHireExpiration';
import { EmergencyHireRequest } from '@/types';

/** Live countdown for urgent hire expiration (updates every second). */
export function useEmergencyHireCountdown(request: EmergencyHireRequest | null) {
  const [now, setNow] = useState(() => Date.now());
  const expired = request ? isEmergencyExpired(request) : false;
  const expiresAt = request ? resolveEmergencyExpiresAt(request) : null;

  useEffect(() => {
    if (!request || expired || !expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [request?.id, request?.status, request?.expiresAt, expired, expiresAt?.getTime()]);

  const remaining =
    expiresAt && !expired ? formatEmergencyTimeRemaining(expiresAt, new Date(now)) : null;

  return { expired, expiresAt, remaining };
}
