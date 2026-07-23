import { apiClient } from './client';

export const professionalMeApi = {
  getSettings: () =>
    apiClient
      .get<{ emergencyHireEnabled: boolean; available: boolean }>('/professionals/me/settings')
      .then((r) => r.data),
  setEmergencyHire: (enabled: boolean) =>
    apiClient
      .patch<{ emergencyHireEnabled: boolean; professionalIds: string[] }>('/professionals/me/emergency-hire', { enabled })
      .then((r) => r.data),
};
