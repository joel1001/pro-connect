import { apiClient } from './client';
import { Notification } from '@/types';

async function resolveUnreadCount(): Promise<number> {
  try {
    const { count } = await apiClient
      .get<{ count: number }>('/notifications/unread-count')
      .then((r) => r.data);
    return count;
  } catch {
    const unread = await apiClient
      .get<Notification[]>('/notifications', { params: { unreadOnly: true } })
      .then((r) => r.data);
    return unread.length;
  }
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    apiClient
      .get<Notification[]>('/notifications', { params: { unreadOnly } })
      .then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Notification>(`/notifications/${id}`).then((r) => r.data),
  unreadCount: () => resolveUnreadCount().then((count) => ({ count })),
  markRead: (id: string) =>
    apiClient.post<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markConversationRead: (conversationId: string) =>
    apiClient.post<void>(`/conversations/${conversationId}/read`).then(() => undefined),
};
