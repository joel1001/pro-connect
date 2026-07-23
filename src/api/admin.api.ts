import { apiClient } from './client';
import { AppSettings, Category, UserSummary } from '@/types';

export type AdminCountryOption = {
  code: string;
  name: string;
  configured: boolean;
};

export const adminApi = {
  getSettings: () => apiClient.get<AppSettings>('/admin/settings').then((r) => r.data),
  updateSettings: (settings: AppSettings) =>
    apiClient.put<AppSettings>('/admin/settings', settings).then((r) => r.data),
  listCountries: () => apiClient.get<AdminCountryOption[]>('/admin/countries').then((r) => r.data),
  listUsers: (params?: { country?: string; role?: string; q?: string; limit?: number }) =>
    apiClient.get<UserSummary[]>('/admin/users', { params }).then((r) => r.data),
  listUserCountries: () => apiClient.get<string[]>('/admin/users/countries').then((r) => r.data),
  createUser: (payload: { email: string; password: string; phone: string; role: string }) =>
    apiClient.post<UserSummary>('/admin/users', payload).then((r) => r.data),
  createCategory: (payload: { name: string; slug: string; description?: string; sortOrder?: number }) =>
    apiClient.post<Category>('/categories', payload).then((r) => r.data),
};
