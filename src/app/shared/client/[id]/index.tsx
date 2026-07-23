import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { clientsApi } from '@/api/clients.api';
import { reviewsApi } from '@/api/reviews.api';
import { Avatar, Button, Card, Input, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, SectionHeader } from '@/components/molecules';
import { professionalReviewAuthorName, resolveProfessionalReviewAuthorNames } from '@/lib/reviewDisplay';
import { useAuthStore } from '@/store/authStore';
import { ClientUser, Review } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function ClientPublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [client, setClient] = useState<ClientUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const accent = roleAccent.professional;

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      clientsApi.getById(id),
      reviewsApi.listByClient(id).catch(() => []),
    ])
      .then(([nextClient, nextReviews]) => {
        setClient(nextClient);
        setReviews(nextReviews);
        return resolveProfessionalReviewAuthorNames(nextReviews);
      })
      .then(setReviewerNames)
      .catch(() => {
        setClient(null);
        setReviews([]);
        setReviewerNames({});
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const submitFeedback = async () => {
    if (!id || user?.role !== 'PROFESSIONAL') return;
    setSubmitting(true);
    try {
      await reviewsApi.create({
        clientId: id,
        rating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      await Promise.resolve(load());
      Alert.alert(t('reviews.feedback'), t('reviews.feedbackSaved'));
    } catch {
      Alert.alert(t('reviews.feedback'), t('reviews.feedbackError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner fullscreen />;

  if (!client) {
    return (
      <ScreenContainer showBack>
        <EmptyState icon="person-outline" title={t('reviews.clientProfileUnavailable')} />
      </ScreenContainer>
    );
  }

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  return (
    <ScreenContainer scroll showBack>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={client.displayName ?? client.email ?? 'C'} uri={client.avatarUrl} size={64} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="title">{client.displayName ?? client.email ?? t('roles.clientLabel')}</Text>
          <Text variant="caption" color="textSecondary">
            {client.address ?? client.email ?? client.id}
          </Text>
        </View>
      </Card>

      <SectionHeader title={t('reviews.reputation')} subtitle={reviews.length ? `${average.toFixed(1)} ★ · ${reviews.length}` : t('reviews.noFeedback')} />
      <Card style={{ gap: spacing.md }}>
        {reviews.length ? (
          reviews.map((review) => (
            <View key={review.id} style={{ gap: spacing.xs, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#E2E8E5' }}>
              <Text variant="bodyStrong">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
              {review.comment ? <Text variant="body" color="textSecondary">{review.comment}</Text> : null}
              <Text variant="caption" color="textMuted">
                {professionalReviewAuthorName(review, reviewerNames, t('roles.professionalLabel'))}
              </Text>
            </View>
          ))
        ) : (
          <EmptyState icon="star-outline" title={t('reviews.noFeedback')} />
        )}
      </Card>

      {user?.role === 'PROFESSIONAL' ? (
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyStrong">{t('reviews.leaveFeedback')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                label={`${value} ★`}
                size="sm"
                fullWidth={false}
                variant={rating === value ? 'primary' : 'outline'}
                accentColor={accent}
                onPress={() => setRating(value)}
              />
            ))}
          </View>
          <Input label={t('reviews.comment')} value={comment} onChangeText={setComment} multiline />
          <Button label={t('reviews.submitFeedback')} loading={submitting} accentColor={accent} onPress={submitFeedback} />
        </Card>
      ) : null}
    </ScreenContainer>
  );
}
