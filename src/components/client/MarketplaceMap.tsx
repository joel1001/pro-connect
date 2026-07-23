import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { MarketplaceProfessional } from '@/lib/marketplace';
import { regionForRadiusKm } from '@/lib/marketplaceGeo';
import { radius, roleAccent, spacing } from '@/theme';

export type MarketplaceMapRef = {
  centerOn: (latitude: number, longitude: number) => void;
};

type RegionLike = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Props = {
  professionals: MarketplaceProfessional[];
  selectedId: string | null;
  initialRegion: RegionLike;
  recenterRegion: RegionLike | null;
  defaultRadiusKm: number;
  visibleRadiusKm: number;
  showsUserLocation?: boolean;
  paused?: boolean;
  onMapPress?: () => void;
  onSelect: (id: string) => void;
  onRegionChange: (region: RegionLike) => void;
  onRecenterDevice: () => void;
};

export const MarketplaceMap = forwardRef<MarketplaceMapRef, Props>(function MarketplaceMap(
  {
    professionals,
    selectedId,
    defaultRadiusKm,
    visibleRadiusKm,
    onSelect,
    onRegionChange,
    onRecenterDevice,
    onMapPress,
  },
  ref,
) {
  const theme = useTheme();
  const accent = roleAccent.client;

  useImperativeHandle(ref, () => ({
    centerOn: (latitude: number, longitude: number) => {
      onRegionChange(regionForRadiusKm(latitude, longitude, defaultRadiusKm));
    },
  }));

  return (
    <Pressable
      onPress={onMapPress}
      style={{
        flex: 1,
        backgroundColor: theme.colors.primarySurface,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 560,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: `${accent}24`,
          backgroundColor: theme.colors.surface,
          padding: spacing.xl,
          gap: spacing.lg,
          ...theme.shadow.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              backgroundColor: `${accent}14`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="map-outline" size={26} color={accent} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="title">Mapa disponible en iOS y Android</Text>
            <Text variant="caption" color="textSecondary">
              En web se muestra una lista interactiva para evitar cargar módulos nativos.
            </Text>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          {professionals.slice(0, 8).map((professional) => {
            const selected = professional.id === selectedId;
            return (
              <Pressable
                key={professional.id}
                onPress={() => onSelect(professional.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: selected ? accent : theme.colors.border,
                  backgroundColor: selected ? `${accent}10` : theme.colors.surfaceAlt,
                  opacity: pressed ? 0.86 : 1,
                })}
              >
                <Icon name="location-outline" size={20} color={selected ? accent : theme.colors.textMuted} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {professional.name}
                  </Text>
                  <Text variant="caption" color="textSecondary" numberOfLines={1}>
                    {professional.profession}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onRecenterDevice}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.pill,
            backgroundColor: `${accent}12`,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="locate" size={18} color={accent} />
          <Text variant="caption" style={{ color: accent }}>
            Vista ~{visibleRadiusKm} km · {professionals.length} pins
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
});
