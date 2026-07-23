import { apiClient } from './client';
import { Verification } from '@/types';

export const verificationsApi = {
  list: (status = 'PENDING') =>
    apiClient.get<Verification[]>('/verifications', { params: { status } }).then((r) => r.data),
  approve: (id: string) => apiClient.post<Verification>(`/verifications/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason?: string) =>
    apiClient
      .post<Verification>(`/verifications/${id}/reject`, null, { params: { reason } })
      .then((r) => r.data),
};
