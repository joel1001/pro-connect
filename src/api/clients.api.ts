import { apiClient } from './client';
import { ClientUser } from '@/types';

export const clientsApi = {
  getById: (id: string) =>
    apiClient.get<ClientUser>(`/clients/${id}`).then((r) => r.data),
};
