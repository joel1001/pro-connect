import { apiClient } from './client';
import { Service, ServiceEntryInput } from '@/types';

export type ServicePayload = ServiceEntryInput & {
  professionalId: string;
  categoryId: string;
  active?: boolean;
};

export const servicesApi = {
  list: (params?: { professionalId?: string; categoryId?: string }) =>
    apiClient.get<Service[]>('/services', { params }).then((r) => r.data),
  create: (payload: ServicePayload) =>
    apiClient.post<Service>('/services', payload).then((r) => r.data),
  update: (id: string, payload: Partial<ServicePayload>) =>
    apiClient.patch<Service>(`/services/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    apiClient.delete<void>(`/services/${id}`).then(() => undefined),
};
