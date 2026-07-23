import { apiClient } from './client';
import { ProfessionalAvailability } from '@/types';

export const availabilityApi = {
  get: (professionalId: string) =>
    apiClient.get<ProfessionalAvailability>(`/professionals/${professionalId}/availability`).then((r) => r.data),
  slots: (professionalId: string, date: string) =>
    apiClient
      .get<{ slots: string[] }>(`/professionals/${professionalId}/availability/slots`, { params: { date } })
      .then((r) => r.data.slots),
  saveMine: (body: ProfessionalAvailability) =>
    apiClient.put<ProfessionalAvailability>('/professionals/me/availability', body).then((r) => r.data),
};
