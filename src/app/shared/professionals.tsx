import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, Card, ScreenContainer } from '@/components/atoms';
import { EmptyState, ListRow, SearchBar, SectionHeader } from '@/components/molecules';
import { catalogApi } from '@/api/catalog.api';
import { ProfessionalUser } from '@/types';
import { realtimeService } from '@/services/realtime';
import { roleAccent, spacing } from '@/theme';

export default function Professionals() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [pros, setPros] = useState<ProfessionalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = roleAccent.client;

  const loadProfessionals = useCallback(() => {
    return catalogApi
      .searchNearby({ latitude: 9.9281, longitude: -84.0907, radiusKm: 50 })
      .then(setPros)
      .catch(() => setPros([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadProfessionals();
  }, [loadProfessionals]);

  useEffect(() => realtimeService.onEmergencyHireAvailabilityChange(() => {
    setLoading(true);
    void loadProfessionals();
  }), [loadProfessionals]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoading(true);
      void loadProfessionals();
    }, 15_000);

    return () => clearInterval(interval);
  }, [loadProfessionals]);

  const filtered = pros.filter(
    (p) =>
      (!query ||
        p.headline.toLowerCase().includes(query.toLowerCase()) ||
        p.bio?.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <ScreenContainer>
      <SearchBar value={query} onChangeText={setQuery} placeholder={t('client.searchPlaceholder')} />
      <SectionHeader title={t('client.nearbyTitle')} subtitle={`${filtered.length} ${t('common.available')}`} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {loading ? (
          <EmptyState icon="hourglass-outline" title={t('common.loading')} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="people-outline" title={t('client.noResults')} message={t('client.noResultsMsg')} />
        ) : (
          filtered.map((p) => (
            <ListRow
              key={p.id}
              avatarName={p.headline}
              avatarUri={p.avatarUrl}
              title={p.headline}
              subtitle={`${p.rating?.toFixed(1) ?? '—'} ★ · Trust ${p.trustScore} · ${t('client.fromPrice')} $${p.startingPrice}${t('client.perHour')}`}
              right={<Badge label={String(p.trustScore)} tone="success" />}
              showChevron
              onPress={() => router.push(`/shared/professional/${p.id}` as never)}
            />
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}
