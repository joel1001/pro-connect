import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, BackButton, Card } from '@/components/atoms';
import { ProfessionalListItem } from '@/components/client';
import { HierarchicalLocationField, SearchBar } from '@/components/molecules';
import { useMarketplaceProfessionals } from '@/hooks/useMarketplaceProfessionals';
import { useTheme } from '@/hooks/useTheme';
import { filterMarketplace } from '@/lib/marketplace';
import {
  getMarketplaceDefaultLocationPath,
  getMarketplaceLocationTree,
  MarketplaceLocationNode,
} from '@/lib/marketplaceLocationTree';
import { resolveMarketplaceDeviceLocationPath } from '@/lib/resolveMarketplaceDeviceLocationPath';
import { radius, spacing } from '@/theme';

function resolveLocationLabels(options: MarketplaceLocationNode[], path: string[]) {
  const labels: string[] = [];
  let currentOptions = options;

  for (const value of path) {
    const match = currentOptions.find((option) => option.value === value);
    if (!match) break;
    labels.push(match.label);
    currentOptions = match.children ?? [];
    if (currentOptions.length === 0) break;
  }

  return labels;
}

export default function ClientProfessionalsList() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { professionals, loading } = useMarketplaceProfessionals();
  const [query, setQuery] = useState('');
  const [locationPath, setLocationPath] = useState<string[]>([]);
  const [deviceLocationPath, setDeviceLocationPath] = useState<string[]>(
    () => getMarketplaceDefaultLocationPath(),
  );
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const locationTree = useMemo(() => getMarketplaceLocationTree(), []);
  const activeLocationPath = locationPath.length > 0 ? locationPath : deviceLocationPath;
  const locationLabels = useMemo(
    () => resolveLocationLabels(locationTree, activeLocationPath),
    [activeLocationPath, locationTree],
  );
  const locationTerms = useMemo(() => {
    const terms = locationLabels.slice(1);
    return terms.filter(Boolean).map((term) => term.toLowerCase());
  }, [locationLabels]);

  const filtered = useMemo(
    () =>
      filterMarketplace(
        professionals.filter((professional) => {
          const place = professional.place?.toLowerCase() ?? '';
          if (locationTerms.length === 0) return true;
          return locationTerms.every((term) => place.includes(term));
        }),
        query,
        false,
      ),
    [professionals, query, locationTerms],
  );

  useEffect(() => {
    let alive = true;

    void resolveMarketplaceDeviceLocationPath().then((nextPath) => {
      if (alive) setDeviceLocationPath(nextPath);
    });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <BackButton compact style={{ marginBottom: spacing.sm }} />
        <Text variant="h2" style={{ marginBottom: spacing.md }}>
          {t('client.listTitle')}
        </Text>

        <SearchBar value={query} onChangeText={setQuery} placeholder={t('client.searchPlaceholder')} />

        <Card style={{ marginTop: spacing.md, marginBottom: spacing.md, gap: spacing.md }}>
          <HierarchicalLocationField
            label="Ubicación"
            valuePath={locationPath}
            options={locationTree}
            onChangePath={setLocationPath}
            placeholder="Selecciona país o lugar"
          />
          <Text variant="caption" color="textMuted">
            {locationTerms.length > 0
              ? `Filtrando por: ${locationTerms.join(' / ')}`
              : 'Filtrado por país del dispositivo'}
          </Text>
        </Card>

        <Text variant="caption" color="textMuted" style={{ marginBottom: spacing.md }}>
          {loading ? t('common.loading') : t('client.listCount', { count: filtered.length })}
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md,
            ...theme.shadow.sm,
          }}
        >
          {filtered.map((p) => (
            <ProfessionalListItem
              key={p.id}
              professional={p}
              favorited={favorites.has(p.id)}
              availableLabel={t('emergencyHire.online')}
              fromPriceLabel={t('client.fromPrice')}
              perHourLabel={t('client.perHour')}
              distanceLabel={t('client.distanceKm')}
              bookLabel={t('appointments.bookShort')}
              chatLabel={t('client.chat')}
              onToggleFavorite={() =>
                setFavorites((prev) => {
                  const next = new Set(prev);
                  if (next.has(p.id)) next.delete(p.id);
                  else next.add(p.id);
                  return next;
                })
              }
              onPress={() => router.push(`/shared/professional/${p.id}` as never)}
              onBook={() => router.push(`/client/appointments/book/${p.id}` as never)}
              onChat={() =>
                router.push({
                  pathname: '/shared/chat',
                  params: { professionalId: p.id },
                } as never)
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
