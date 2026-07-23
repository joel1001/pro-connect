import { apiClient } from './client';
import { Conversation, Message } from '@/types';

export const chatApi = {
  listConversations: () => apiClient.get<Conversation[]>('/conversations').then((r) => r.data),
  getConversation: (conversationId: string) =>
    apiClient.get<Conversation>(`/conversations/${conversationId}`).then((r) => r.data),
  openDirect: (otherUserId: string) =>
    apiClient.post<Conversation>('/conversations/direct', { otherUserId }).then((r) => r.data),
  getMessages: (conversationId: string) =>
    apiClient.get<Message[]>(`/conversations/${conversationId}/messages`).then((r) => r.data),
  sendMessage: (conversationId: string, message: string) =>
    apiClient
      .post<Message>(`/conversations/${conversationId}/messages`, { message })
      .then((r) => r.data),
  sendCallSummary: (conversationId: string, summary: string) =>
    apiClient
      .post<Message>(`/conversations/${conversationId}/calls`, { summary })
      .then((r) => r.data),
  markConversationRead: (conversationId: string) =>
    apiClient.post<void>(`/conversations/${conversationId}/read`).then(() => undefined),
  deleteConversation: (conversationId: string) =>
    apiClient.delete<void>(`/conversations/${conversationId}`).then(() => undefined),
  blockPeer: (peerUserId: string) =>
    apiClient.post<void>(`/conversations/peer/${peerUserId}/block`).then(() => undefined),
  unblockPeer: (peerUserId: string) =>
    apiClient.delete<void>(`/conversations/peer/${peerUserId}/block`).then(() => undefined),
};
