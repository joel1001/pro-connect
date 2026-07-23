import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/atoms';
import {
  MarketplaceSearchHeader,
  MarketplaceSearchHeaderRef,
  ProfessionalPreviewCard,
} from '@/components/client';
import { MarketplaceMap } from '@/components/client/MarketplaceMap';
import { useMarketplaceProfessionals } from '@/hooks/useMarketplaceProfessionals';
import { useTheme } from '@/hooks/useTheme';
import {
  filterMarketplace,
  MarketplaceProfessional,
  pickMapProfessionals,
} from '@/lib/marketplace';
import { radius, spacing } from '@/theme';

const SEARCH_BAR_HEIGHT = 48;
const URGENT_SURFACE = '#FFF7ED';
const URGENT_BORDER = '#FED7AA';
const URGENT_ICON_BG = '#FFEDD5';
const URGENT_ACCENT = '#C2410C';

export default function ClientExplore() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<{ centerOn: (latitude: number, longitude: number) => void }>(null);
  const searchRef = useRef<MarketplaceSearchHeaderRef>(null);
  const {
    professionals,
    loading,
    visibleRegion,
    recenterRegion,
    locationGranted,
    visibleRadiusKm,
    defaultRadiusKm,
    scheduleRegionSearch,
    recenterOnDevice,
  } = useMarketplaceProfessionals();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const textFiltered = useMemo(
    () => filterMarketplace(professionals, query, false),
    [professionals, query],
  );

  /** Map pins follow viewport only — text search must not re-render markers on each keystroke. */
  const mapProfessionals = useMemo(
    () => pickMapProfessionals(professionals, selectedId),
    [professionals, selectedId],
  );

  useEffect(() => {
    if (searchFocused) return;
    if (mapProfessionals.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) =>
      current && mapProfessionals.some((p) => p.id === current) ? current : mapProfessionals[0].id,
    );
  }, [mapProfessionals, searchFocused]);

  const handleSelectFromSearch = useCallback((professional: MarketplaceProfessional) => {
    setSelectedId(professional.id);
    mapRef.current?.centerOn(professional.latitude, professional.longitude);
  }, []);

  const dismissSearch = useCallback(() => {
    searchRef.current?.dismiss();
  }, []);

  const handleSearchFocusChange = useCallback((focused: boolean) => {
    setSearchFocused(focused);
  }, []);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return (
      textFiltered.find((p) => p.id === selectedId) ??
      professionals.find((p) => p.id === selectedId) ??
      null
    );
  }, [selectedId, textFiltered, professionals]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MarketplaceMap
        ref={mapRef}
        professionals={mapProfessionals}
        selectedId={selected?.id ?? null}
        initialRegion={recenterRegion ?? visibleRegion}
        recenterRegion={recenterRegion}
        defaultRadiusKm={defaultRadiusKm}
        visibleRadiusKm={visibleRadiusKm}
        showsUserLocation={locationGranted}
        onMapPress={searchFocused ? dismissSearch : undefined}
        onSelect={setSelectedId}
        onRegionChange={scheduleRegionSearch}
        onRecenterDevice={recenterOnDevice}
      />

      {!searchFocused ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + spacing.sm + SEARCH_BAR_HEIGHT + spacing.sm,
            left: spacing.md,
            right: spacing.md,
            zIndex: 15,
          }}
        >
          <Pressable
            onPress={() => router.push('/client/emergency-hire' as never)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              minHeight: 44,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: URGENT_SURFACE,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: URGENT_BORDER,
              opacity: pressed ? 0.92 : 1,
              ...theme.shadow.sm,
            })}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: URGENT_ICON_BG,
              }}
            >
              <Icon name="flash" size={17} color={URGENT_ACCENT} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="bodyStrong" style={{ color: URGENT_ACCENT, fontSize: 14 }}>
                {t('emergencyHire.homeCta')}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {t('emergencyHire.subtitle')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={URGENT_ACCENT} />
          </Pressable>
        </View>
      ) : null}

      {searchFocused ? (
        <Pressable
          accessibilityLabel={t('client.searchDismissMap')}
          onPress={dismissSearch}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.18)',
          }}
        />
      ) : null}

      <MarketplaceSearchHeader
        ref={searchRef}
        value={query}
        onChangeText={setQuery}
        placeholder={t('client.searchPlaceholder')}
        hint={t('client.searchHint')}
        suggestionsTitle={t('client.searchSuggestions')}
        resultsCountLabel={t('client.searchResultsCount')}
        noMatchLabel={t('client.searchNoMatch')}
        popularLabel={t('client.popularCategories')}
        cancelLabel={t('client.searchCancel')}
        professionals={textFiltered}
        onSelectProfessional={handleSelectFromSearch}
        onFilterPress={() => router.push('/client/list' as never)}
        onFocusChange={handleSearchFocusChange}
      />

      {!loading && !searchFocused && mapProfessionals.length === 0 && query.trim().length === 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '42%',
            left: spacing.lg,
            right: spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: spacing.md,
            ...theme.shadow.sm,
          }}
        >
          <Text variant="caption" center color="textSecondary">
            {t('client.noProsInArea', { km: visibleRadiusKm })}
          </Text>
        </View>
      ) : null}

      {selected && !searchFocused ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: spacing.md,
            right: spacing.md,
            bottom: spacing.sm,
          }}
        >
          <ProfessionalPreviewCard
            professional={selected}
            availableLabel={t('emergencyHire.online')}
            fromPriceLabel={t('client.fromPrice')}
            perHourLabel={t('client.perHour')}
            viewProfileLabel={t('client.viewProfile')}
            bookLabel={t('appointments.bookShort')}
            chatLabel={t('client.chat')}
            onViewProfile={() => router.push(`/shared/professional/${selected.id}` as never)}
            onBook={() => router.push(`/client/appointments/book/${selected.id}` as never)}
            onChat={() =>
              router.push({
                pathname: '/shared/chat',
                params: { professionalId: selected.id },
              } as never)
            }
          />
        </View>
      ) : null}
    </View>
  );
}
