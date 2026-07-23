import { apiClient } from './client';
import { Category, ProfessionalUser } from '@/types';

export const catalogApi = {
  listCategories: () => apiClient.get<Category[]>('/categories').then((r) => r.data),

  searchNearby: (params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
    categoryId?: string;
    minRating?: number;
    minTrustScore?: number;
  }) =>
    apiClient
      .get<ProfessionalUser[]>('/professionals/search/nearby', { params })
      .then((r) => r.data),
};
