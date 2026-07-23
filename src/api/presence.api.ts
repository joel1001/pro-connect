import { apiClient } from './client';
import { canonicalChatUserId } from '@/lib/chat';

export const presenceApi = {
  heartbeat: () => apiClient.post<{ online: boolean }>('/presence/heartbeat'),
  offline: () => apiClient.post<{ online: boolean }>('/presence/offline'),
  fetchStatus: (userIds: string[]) => {
    const ids = [...new Set(userIds.filter(Boolean).map((id) => canonicalChatUserId(id)))];
    if (ids.length === 0) return Promise.resolve({} as Record<string, boolean>);
    return apiClient
      .get<Record<string, boolean>>('/presence/status', { params: { ids: ids.join(',') } })
      .then((r) => r.data);
  },
};
