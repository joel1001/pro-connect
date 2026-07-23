import { apiClient } from './client';
import { Review } from '@/types';

export const reviewsApi = {
  listByProfessional: (professionalId: string) =>
    apiClient.get<Review[]>(`/reviews/professional/${professionalId}`).then((r) => r.data),
  listByClient: (clientId: string) =>
    apiClient.get<Review[]>(`/reviews/client/${clientId}`).then((r) => r.data),
  create: (payload: {
    professionalId?: string;
    clientId?: string;
    targetUserId?: string;
    targetRole?: string;
    contractId?: string;
    rating: number;
    comment?: string;
  }) => apiClient.post<Review>('/reviews', payload).then((r) => r.data),
};
