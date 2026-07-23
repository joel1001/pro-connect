import { Notification } from '@/types';

function parseChatConversationId(link?: string) {
  if (!link) return null;
  const query = link.split('?')[1];
  if (!query) return null;
  return new URLSearchParams(query).get('conversationId');
}

export function getNotificationChatConversationId(notification: Notification) {
  return (
    notification.metadata?.conversationId ??
    parseChatConversationId(notification.link) ??
    (notification.type === 'CHAT' ? notification.referenceId : null)
  );
}

export function internalHrefFromNotificationLink(link?: string) {
  if (!link) return null;
  if (link.startsWith('/')) return link;
  if (!link.startsWith('proconnect://')) return null;
  try {
    const url = new URL(link);
    const path = `${url.hostname ? `/${url.hostname}` : ''}${url.pathname}`;
    return `${path}${url.search || ''}`;
  } catch {
    return null;
  }
}
