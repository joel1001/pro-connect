import { apiClient } from './client';
import { ProfessionalUser } from '@/types';

export const professionalsApi = {
  getById: (id: string) =>
    apiClient.get<ProfessionalUser>(`/professionals/${id}`).then((r) => r.data),
};
