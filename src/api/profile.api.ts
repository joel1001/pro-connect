import { apiClient } from './client';
import type { UserRole } from '@/types';

export interface ProfileAddress {
  country: string;
  province: string;
  canton: string;
  district: string;
  streetLine: string;
}

export interface ProfileMe {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
  phone: string;
  address: string;
  locationAddress: ProfileAddress;
}

export interface UpdateProfilePayload {
  displayName: string;
  phone: string;
  locationAddress: ProfileAddress;
}

export const profileApi = {
  me: () => apiClient.get<ProfileMe>('/profile/me').then((r) => r.data),
  update: (payload: UpdateProfilePayload) =>
    apiClient.patch<ProfileMe>('/profile/me', payload).then((r) => r.data),
};
