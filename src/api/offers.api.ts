import { apiClient } from './client';
import { PriceOffer } from '@/types';

export const offersApi = {
  create: (payload: {
    professionalId: string;
    serviceId: string;
    offeredAmount: number;
    currency?: string;
    note?: string;
  }) => apiClient.post<PriceOffer>('/offers', payload).then((r) => r.data),
  listByConversation: (conversationId: string) =>
    apiClient.get<PriceOffer[]>(`/offers/conversation/${conversationId}`).then((r) => r.data),
  accept: (id: string) => apiClient.post<PriceOffer>(`/offers/${id}/accept`).then((r) => r.data),
  decline: (id: string) => apiClient.post<PriceOffer>(`/offers/${id}/decline`).then((r) => r.data),
};
