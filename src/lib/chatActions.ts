import { Alert } from 'react-native';
import { TFunction } from 'i18next';

import { chatApi } from '@/api/chat.api';
import { Conversation } from '@/types';

export function confirmDeleteConversation(
  conversation: Conversation,
  t: TFunction,
  onDeleted: () => void,
) {
  Alert.alert(t('client.chatActions.delete'), t('client.chatActions.deleteConfirm'), [
    { text: t('client.chatActions.cancel'), style: 'cancel' },
    {
      text: t('client.chatActions.delete'),
      style: 'destructive',
      onPress: () => {
        void chatApi.deleteConversation(conversation.id).then(onDeleted);
      },
    },
  ]);
}

export function confirmBlockPeer(
  conversation: Conversation,
  peerName: string,
  t: TFunction,
  onBlocked: () => void,
  onError: (message: string) => void,
) {
  const peerUserId = conversation.peer?.userId;
  if (!peerUserId) return;

  Alert.alert(
    t('client.chatActions.block'),
    t('client.chatActions.blockConfirm', { name: peerName }),
    [
      { text: t('client.chatActions.cancel'), style: 'cancel' },
      {
        text: t('client.chatActions.block'),
        style: 'destructive',
        onPress: () => {
          void chatApi
            .blockPeer(peerUserId)
            .then(onBlocked)
            .catch((e) => onError(e instanceof Error ? e.message : t('client.chatError')));
        },
      },
    ],
  );
}

export function openInboxConversationActions(
  conversation: Conversation,
  peerName: string,
  t: TFunction,
  onChanged: () => void,
) {
  Alert.alert(t('client.chatActions.title'), undefined, [
    {
      text: t('client.chatActions.delete'),
      style: 'destructive',
      onPress: () => confirmDeleteConversation(conversation, t, onChanged),
    },
    {
      text: t('client.chatActions.block'),
      style: 'destructive',
      onPress: () =>
        confirmBlockPeer(conversation, peerName, t, onChanged, () => undefined),
    },
    { text: t('client.chatActions.cancel'), style: 'cancel' },
  ]);
}
