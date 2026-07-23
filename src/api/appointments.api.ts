import { apiClient } from './client';
import { Appointment, AppointmentSnapshot } from '@/types';

export const appointmentsApi = {
  list: () => apiClient.get<Appointment[]>('/appointments').then((r) => r.data),
  get: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
  create: (payload: {
    professionalId: string;
    serviceIds: string[];
    scheduledDate: string;
    scheduledTime: string;
    durationMinutes?: number;
    notes?: string;
    locationAddress?: string;
    latitude?: number;
    longitude?: number;
  }) => apiClient.post<Appointment>('/appointments', payload).then((r) => r.data),
  accept: (id: string) => apiClient.post<Appointment>(`/appointments/${id}/accept`).then((r) => r.data),
  propose: (id: string, payload: Partial<AppointmentSnapshot> & { message?: string }) =>
    apiClient.post<Appointment>(`/appointments/${id}/propose`, payload).then((r) => r.data),
  acceptProposal: (id: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/accept-proposal`).then((r) => r.data),
  rejectProposal: (id: string, message?: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/reject-proposal`, { message }).then((r) => r.data),
  cancel: (id: string, message?: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/cancel`, { message }).then((r) => r.data),
  decline: (id: string, message?: string) =>
    apiClient.post<Appointment>(`/appointments/${id}/decline`, { message }).then((r) => r.data),
  complete: (id: string) => apiClient.post<Appointment>(`/appointments/${id}/complete`).then((r) => r.data),
};
