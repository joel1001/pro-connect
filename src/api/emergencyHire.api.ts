import { apiClient } from './client';
import {
  EmergencyHireAvailableProfessional,
  EmergencyHireNegotiation,
  EmergencyHireRequest,
  EmergencyHireResponse,
} from '@/types';

export const emergencyHireApi = {
  list: () => apiClient.get<EmergencyHireRequest[]>('/emergency-hire').then((r) => r.data),
  get: (id: string) => apiClient.get<EmergencyHireRequest>(`/emergency-hire/${id}`).then((r) => r.data),
  availableProfessionals: (params: { categoryId: string; latitude: number; longitude: number }) =>
    apiClient
      .get<EmergencyHireAvailableProfessional[]>('/emergency-hire/available-professionals', { params })
      .then((r) => r.data),
  create: (payload: {
    categoryId: string;
    preferredProfessionalId?: string;
    description: string;
    latitude: number;
    longitude: number;
    locationLabel?: string;
    attachmentUrls?: string[];
    preferredDate?: string;
    preferredTime?: string;
  }) => apiClient.post<EmergencyHireRequest>('/emergency-hire', payload).then((r) => r.data),
  responses: (id: string) =>
    apiClient.get<EmergencyHireResponse[]>(`/emergency-hire/${id}/responses`).then((r) => r.data),
  openChat: (requestId: string) =>
    apiClient
      .post<{ conversationId: string; requestId: string; professionalId: string }>(
        `/emergency-hire/${requestId}/open-chat`,
      )
      .then((r) => r.data),
  contact: (requestId: string, professionalId: string) =>
    apiClient
      .post<{ conversationId: string; requestId: string; professionalId: string }>(
        `/emergency-hire/${requestId}/contact/${professionalId}`,
      )
      .then((r) => r.data),
  selectProfessional: (id: string, professionalId: string) =>
    apiClient
      .post<EmergencyHireRequest>(`/emergency-hire/${id}/select/${professionalId}`)
      .then((r) => r.data),
  cancel: (id: string) => apiClient.post<EmergencyHireRequest>(`/emergency-hire/${id}/cancel`).then((r) => r.data),
  accept: (id: string, message?: string) =>
    apiClient.post(`/emergency-hire/${id}/responses/accept`, { message }).then((r) => r.data),
  counter: (id: string, payload: { proposedDate: string; proposedTime: string; message?: string }) =>
    apiClient.post(`/emergency-hire/${id}/responses/counter`, payload).then((r) => r.data),
  decline: (id: string, message?: string) =>
    apiClient.post(`/emergency-hire/${id}/responses/decline`, { message }).then((r) => r.data),
  listNegotiations: (conversationId: string) =>
    apiClient
      .get<EmergencyHireNegotiation[]>(`/emergency-hire/conversations/${conversationId}/negotiations`)
      .then((r) => r.data),
  propose: (
    requestId: string,
    payload: {
      conversationId: string;
      serviceDate: string;
      serviceTime: string;
      estimatedArrivalTime?: string;
      price: number;
      currency?: string;
      serviceIds?: string[];
      notes?: string;
      estimatedDurationMinutes?: number;
    },
  ) =>
    apiClient.post<EmergencyHireNegotiation>(`/emergency-hire/${requestId}/negotiations`, payload).then((r) => r.data),
  acceptNegotiation: (negotiationId: string) =>
    apiClient.post<EmergencyHireNegotiation>(`/emergency-hire/negotiations/${negotiationId}/accept`).then((r) => r.data),
  rejectNegotiation: (negotiationId: string) =>
    apiClient.post<EmergencyHireNegotiation>(`/emergency-hire/negotiations/${negotiationId}/reject`).then((r) => r.data),
  getStandardPrice: (requestId: string, conversationId: string) =>
    apiClient
      .get<{
        serviceId: string;
        serviceName: string;
        price: number;
        currency: string;
        durationMinutes: number;
      }>(`/emergency-hire/${requestId}/standard-price`, { params: { conversationId } })
      .then((r) => r.data),
};
