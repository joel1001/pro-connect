import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { Conversation } from '@/types';
import { Avatar, Card, CountBadge, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState } from '@/components/molecules';
import { useConversationInbox } from '@/hooks/useConversationInbox';
import { openInboxConversationActions } from '@/lib/chatActions';
import { resolveProfessionalAvatarUrl } from '@/lib/professionalAvatar';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

type InboxRole = 'client' | 'professional';
type InboxFilter = 'all' | 'unread' | 'peers' | 'archived';

function formatLastMessageAt(value: string | undefined, locale: string, yesterdayLabel: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return yesterdayLabel;
  }

  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function peerName(conversation: Conversation, fallback: string) {
  return conversation.peer?.displayName?.trim() || fallback;
}

function conversationAvatarUri(conversation: Conversation, name: string, role: InboxRole) {
  if (!conversation.peer?.avatarUrl) return undefined;
  if (role === 'client') {
    return resolveProfessionalAvatarUrl({
      id: conversation.peer.userId,
      name,
      avatarUrl: conversation.peer.avatarUrl,
    });
  }
  return conversation.peer.avatarUrl;
}

export function ConversationInboxView({ role, accent }: { role: InboxRole; accent: string }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { conversations, loading, reload } = useConversationInbox();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const fallbackName = role === 'professional' ? t('messages.defaultClient') : t('messages.defaultProfessional');

  const filters = [
    { key: 'all', label: t('screens.all') },
    { key: 'unread', label: t('screens.unread') },
    { key: 'peers', label: role === 'professional' ? t('messages.clients') : t('messages.professionals') },
    { key: 'archived', label: t('messages.archived') },
  ] satisfies { key: InboxFilter; label: string }[];

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const name = peerName(conversation, fallbackName);
      const preview = conversation.lastMessagePreview ?? conversation.peer?.headline ?? '';
      const matchesQuery =
        !normalizedQuery ||
        name.toLowerCase().includes(normalizedQuery) ||
        preview.toLowerCase().includes(normalizedQuery);

      if (!matchesQuery) return false;
      if (filter === 'unread') return (conversation.unreadCount ?? 0) > 0;
      if (filter === 'archived') return false;
      return true;
    });
  }, [conversations, fallbackName, filter, query]);

  if (loading) return <Spinner fullscreen />;

  return (
    <ScreenContainer style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="h1">{t('nav.messages')}</Text>
          <Text variant="body" color="textSecondary">
            {role === 'professional' ? t('messages.professionalSubtitle') : t('messages.clientSubtitle')}
          </Text>
        </View>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 22,
            backgroundColor: `${accent}10`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="people" size={27} color={accent} />
        </View>
      </View>

      <View
        style={{
          minHeight: 58,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Icon name="search" size={24} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('messages.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={{
            flex: 1,
            color: theme.colors.text,
            fontSize: 16,
            paddingVertical: spacing.md,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {filters.map((item) => {
          const active = item.key === filter;
          return (
            <Pressable
              key={item.key}
              onPress={() => setFilter(item.key)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: active ? `${accent}18` : theme.colors.border,
                backgroundColor: active ? `${accent}12` : theme.colors.surface,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text variant="bodyStrong" numberOfLines={1} style={{ color: active ? accent : theme.colors.textSecondary }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card padded={false} style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
        {filteredConversations.length === 0 ? (
          <EmptyState icon="chatbubbles-outline" title={t('client.noResults')} />
        ) : (
          filteredConversations.map((conversation, index) => {
            const name = peerName(conversation, fallbackName);
            const avatarUri = conversationAvatarUri(conversation, name, role);
            const unread = conversation.unreadCount ?? 0;
            const preview = conversation.lastMessagePreview ?? conversation.peer?.headline ?? t('messages.noPreview');
            const lastAt = formatLastMessageAt(conversation.lastMessageAt, i18n.language, t('messages.yesterday'));

            return (
              <Pressable
                key={conversation.id}
                onPress={() =>
                  router.push({
                    pathname: '/shared/chat',
                    params: { conversationId: conversation.id, otherUserId: conversation.peer?.userId },
                  } as never)
                }
                onLongPress={() => openInboxConversationActions(conversation, name, t, reload)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.86 : 1,
                  backgroundColor: theme.colors.surface,
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.lg,
                    borderBottomWidth: index === filteredConversations.length - 1 ? 0 : 1,
                    borderBottomColor: theme.colors.border,
                  }}
                >
                  <View>
                    <Avatar uri={avatarUri} name={name} size={58} accentColor={accent} />
                    {unread > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 2,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: theme.colors.success,
                          borderWidth: 2,
                          borderColor: theme.colors.surface,
                        }}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {name}
                    </Text>
                    <Text variant="body" color="textSecondary" numberOfLines={2}>
                      {preview}
                    </Text>
                  </View>
                  <View style={{ minWidth: 54, alignItems: 'flex-end', gap: spacing.sm }}>
                    {lastAt ? (
                      <Text variant="caption" color="textSecondary" numberOfLines={1}>
                        {lastAt}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      {unread > 0 ? <CountBadge count={unread} color={accent} size="sm" /> : null}
                      <Icon name="chevron-forward" size={22} color={theme.colors.textMuted} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </Card>
    </ScreenContainer>
  );
}
