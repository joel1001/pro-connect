import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { appointmentsApi } from '@/api/appointments.api';
import { realtimeService } from '@/services/realtime';
import { Appointment } from '@/types';

export function useRealtimeAppointments(enabled = true) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(enabled);
  const requestSeq = useRef(0);

  const reload = useCallback(async (silent = false) => {
    if (!enabled) return;
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    if (!silent) setLoading(true);
    try {
      const items = await appointmentsApi.list();
      if (seq !== requestSeq.current) return;
      setAppointments(items);
    } catch {
      if (seq !== requestSeq.current) return;
      setAppointments([]);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) return undefined;
    return realtimeService.onAppointmentUpdate(() => {
      void reload(true);
    });
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) return undefined;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void reload(true);
      }
    });
    return () => subscription.remove();
  }, [enabled, reload]);

  return { appointments, loading, reload };
}
