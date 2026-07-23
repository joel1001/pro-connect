import { apiClient } from './client';
import { AuthResponse, ResendCodeResponse, UserRole } from '@/types';
import { probeBackendReachable } from '@/lib/backendProbe';

export interface RegisterPayload {
  email: string;
  password: string;
  phone: string;
  role: string;
  deviceId: string;
  deviceName?: string;
  acceptTerms: boolean;
  termsVersion: string;
}

export interface LoginPayload {
  login: string;
  password: string;
  deviceId: string;
  deviceName?: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: string;
  roles?: UserRole[];
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    await probeBackendReachable();
    return apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data);
  },

  login: async (payload: LoginPayload) => {
    await probeBackendReachable();
    return apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data);
  },

  verifyEmail: (email: string, code: string) =>
    apiClient.post('/auth/verify-email', { email, code }),

  resendCode: (email: string) =>
    apiClient.post<ResendCodeResponse>('/auth/resend-code', { email }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<ResendCodeResponse>('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiClient.post('/auth/reset-password', { email, code, newPassword }),

  refresh: async (refreshToken: string) => {
    await probeBackendReachable();
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data);
  },

  switchRole: async (role: UserRole, deviceId: string, deviceName?: string) => {
    await probeBackendReachable();
    return apiClient.post<AuthResponse>('/auth/switch-role', { role, deviceId, deviceName }).then((r) => r.data);
  },

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),
};
