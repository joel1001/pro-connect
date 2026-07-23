import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, View } from 'react-native';

import { Button, Card, Icon, IconName, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SearchBar, SectionHeader } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

type HelpTopic = 'account' | 'payments' | 'contracts' | 'verification' | 'disputes' | 'usingApp';

const TOPICS: { key: HelpTopic; icon: IconName }[] = [
  { key: 'account', icon: 'person-outline' },
  { key: 'payments', icon: 'card-outline' },
  { key: 'contracts', icon: 'document-text-outline' },
  { key: 'verification', icon: 'shield-checkmark-outline' },
  { key: 'disputes', icon: 'alert-circle-outline' },
  { key: 'usingApp', icon: 'help-circle-outline' },
];

const FAQS: { id: string; topic: HelpTopic; questionKey: string; answerKey: string }[] = [
  {
    id: 'server',
    topic: 'usingApp',
    questionKey: 'help.faq.server.question',
    answerKey: 'help.faq.server.answer',
  },
  {
    id: 'urgentHire',
    topic: 'usingApp',
    questionKey: 'help.faq.urgentHire.question',
    answerKey: 'help.faq.urgentHire.answer',
  },
  {
    id: 'payments',
    topic: 'payments',
    questionKey: 'help.faq.payments.question',
    answerKey: 'help.faq.payments.answer',
  },
  {
    id: 'contracts',
    topic: 'contracts',
    questionKey: 'help.faq.contracts.question',
    answerKey: 'help.faq.contracts.answer',
  },
  {
    id: 'verification',
    topic: 'verification',
    questionKey: 'help.faq.verification.question',
    answerKey: 'help.faq.verification.answer',
  },
  {
    id: 'disputes',
    topic: 'disputes',
    questionKey: 'help.faq.disputes.question',
    answerKey: 'help.faq.disputes.answer',
  },
  {
    id: 'profile',
    topic: 'account',
    questionKey: 'help.faq.profile.question',
    answerKey: 'help.faq.profile.answer',
  },
];

export default function HelpCenter() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('server');

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return FAQS.filter((faq) => {
      const matchesTopic = !selectedTopic || faq.topic === selectedTopic;
      const searchable = `${t(faq.questionKey)} ${t(faq.answerKey)} ${t(`help.topics.${faq.topic}`)}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      return matchesTopic && matchesQuery;
    });
  }, [query, selectedTopic, t]);

  const openSupportEmail = async () => {
    const subject = encodeURIComponent(t('help.supportEmailSubject'));
    const body = encodeURIComponent(t('help.supportEmailBody'));
    const url = `mailto:support@proconnect.com?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(t('help.supportUnavailableTitle'), t('help.supportUnavailableBody'));
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title={t('profile.helpCenter')} subtitle={t('help.subtitle')} />
      <SearchBar placeholder={t('help.searchPlaceholder')} value={query} onChangeText={setQuery} />

      <Card style={{ gap: spacing.md, backgroundColor: theme.colors.primarySurface, borderColor: theme.colors.primaryLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.surface,
            }}
          >
            <Icon name="headset-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="bodyStrong">{t('help.needHelpTitle')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('help.needHelpBody')}
            </Text>
          </View>
        </View>
        <Button label={t('screens.contactSupport')} iconLeft="mail-outline" onPress={openSupportEmail} />
      </Card>

      <SectionHeader title={t('help.quickActions')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        <ListRow
          title={t('help.actions.paymentMethods')}
          subtitle={t('help.actions.paymentMethodsHint')}
          icon="card-outline"
          showChevron
          onPress={() => router.push('/shared/payment-methods' as never)}
        />
        <ListRow
          title={t('help.actions.verification')}
          subtitle={t('help.actions.verificationHint')}
          icon="shield-checkmark-outline"
          showChevron
          onPress={() => router.push('/shared/identity-verification' as never)}
        />
        <ListRow
          title={t('help.actions.terms')}
          subtitle={t('help.actions.termsHint')}
          icon="document-text-outline"
          showChevron
          onPress={() => router.push('/shared/terms' as never)}
        />
      </Card>

      <SectionHeader title={t('help.topicsTitle')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {TOPICS.map((topic) => {
          const active = selectedTopic === topic.key;
          return (
            <Pressable
              key={topic.key}
              onPress={() => setSelectedTopic(active ? null : topic.key)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primarySurface : theme.colors.surface,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Icon name={topic.icon} size={16} color={active ? theme.colors.primary : theme.colors.textMuted} />
              <Text variant="caption" weight="600" style={{ color: active ? theme.colors.primary : theme.colors.text }}>
                {t(`help.topics.${topic.key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={t('help.faqTitle')} subtitle={t('help.faqSubtitle')} />
      {filteredFaqs.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm }}>
          <Icon name="search-outline" size={30} color={theme.colors.textMuted} />
          <Text variant="bodyStrong" center>
            {t('help.noResults')}
          </Text>
          <Text variant="caption" color="textSecondary" center>
            {t('help.noResultsHint')}
          </Text>
        </Card>
      ) : (
        <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
          {filteredFaqs.map((faq) => {
            const expanded = expandedFaqId === faq.id;
            return (
              <Pressable
                key={faq.id}
                onPress={() => setExpandedFaqId(expanded ? null : faq.id)}
                style={({ pressed }) => ({
                  gap: spacing.sm,
                  paddingVertical: spacing.md,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{t(faq.questionKey)}</Text>
                    <Text variant="caption" color="textSecondary">
                      {t(`help.topics.${faq.topic}`)}
                    </Text>
                  </View>
                  <Icon name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={18} color={theme.colors.textMuted} />
                </View>
                {expanded && (
                  <Text variant="caption" color="textSecondary" selectable>
                    {t(faq.answerKey)}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Card>
      )}
    </ScreenContainer>
  );
}
