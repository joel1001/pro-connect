import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Card, Icon, ScreenContainer, Spinner, Text } from '@/components/atoms';
import { EmptyState, SectionHeader } from '@/components/molecules';
import { professionalsApi } from '@/api/professionals.api';
import { reviewsApi } from '@/api/reviews.api';
import { resolveClientReviewAuthorNames, reviewAuthorName } from '@/lib/reviewDisplay';
import { useAuthStore } from '@/store/authStore';
import { Review } from '@/types';
import { roleAccent, spacing } from '@/theme';

export default function ProfessionalReviews() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.professional;

  useEffect(() => {
    if (!user?.userId) return;
    professionalsApi
      .getById(user.userId)
      .then((pro) => reviewsApi.listByProfessional(pro.id))
      .then((items) => {
        setReviews(items);
        return resolveClientReviewAuthorNames(items);
      })
      .then(setReviewerNames)
      .catch(() => {
        setReviews([]);
        setReviewerNames({});
      })
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) {
    return (
      <ScreenContainer showBack>
        <Spinner />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer showBack>
      <SectionHeader title="Reputación" subtitle="Rating, comentarios y feedback recibido" />
      <Card style={{ flexDirection: 'row', gap: spacing.xl, alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <Text variant="display" style={{ color: accent }}>{avg.toFixed(1)}</Text>
          <Text variant="caption" color="textSecondary">{reviews.length} reseñas</Text>
        </View>
      </Card>
      <Card style={{ gap: spacing.md }}>
        {reviews.length === 0 ? (
          <EmptyState icon="star-outline" title={t('client.noResults')} />
        ) : (
          reviews.map((r) => (
            <Pressable
              key={r.id}
              onPress={r.clientId ? () => router.push(`/shared/client/${r.clientId}` as never) : undefined}
              style={{ gap: 4, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#E2E8E5' }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyStrong">{reviewAuthorName(r, reviewerNames, 'Cliente')}</Text>
                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Icon key={i} name="star" size={14} color={accent} />
                  ))}
                </View>
              </View>
              {r.comment && <Text variant="body" color="textSecondary">{r.comment}</Text>}
            </Pressable>
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}
