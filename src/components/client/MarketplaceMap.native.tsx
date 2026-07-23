import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { InteractionManager, Platform, Pressable, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { Region } from 'react-native-maps';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { MarketplaceProfessional } from '@/lib/marketplace';
import { isExpoGo } from '@/lib/mapRuntime';
import { regionForRadiusKm } from '@/lib/marketplaceGeo';
import { roleAccent, radius, spacing } from '@/theme';

export type MarketplaceMapRef = {
  centerOn: (latitude: number, longitude: number) => void;
};

type Props = {
  professionals: MarketplaceProfessional[];
  selectedId: string | null;
  initialRegion: Region;
  recenterRegion: Region | null;
  defaultRadiusKm: number;
  visibleRadiusKm: number;
  showsUserLocation?: boolean;
  /** Unmount native map (e.g. while search is open) to free memory in Expo Go. */
  paused?: boolean;
  /** Optional tap on map canvas (e.g. dismiss search overlay). */
  onMapPress?: () => void;
  onSelect: (id: string) => void;
  onRegionChange: (region: Region) => void;
  onRecenterDevice: () => void;
};

const PIN_SELECTED = roleAccent.client;
const PIN_DEFAULT = '#94A3B8';

function MapPlaceholder({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#D8E8DC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
      }}
    >
      <Icon name="map-outline" size={40} color={theme.colors.primary} />
      <Text variant="caption" color="textSecondary" center style={{ marginTop: spacing.sm }}>
        {message}
      </Text>
    </View>
  );
}

export const MarketplaceMap = forwardRef<MarketplaceMapRef, Props>(function MarketplaceMap(
  {
    professionals,
    selectedId,
    initialRegion,
    recenterRegion,
    defaultRadiusKm,
    visibleRadiusKm,
    showsUserLocation = false,
    paused = false,
    onMapPress,
    onSelect,
    onRegionChange,
    onRecenterDevice,
  },
  ref,
) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(initialRegion);
  const [mapMounted, setMapMounted] = useState(!isExpoGo());

  useEffect(() => {
    regionRef.current = initialRegion;
  }, [initialRegion]);

  useEffect(() => {
    if (paused) {
      setMapMounted(false);
      return;
    }
    if (!isExpoGo()) {
      setMapMounted(true);
      return;
    }
    const task = InteractionManager.runAfterInteractions(() => setMapMounted(true));
    return () => task.cancel();
  }, [paused]);

  useEffect(() => {
    if (!recenterRegion || paused || !mapMounted) return;
    regionRef.current = recenterRegion;
    mapRef.current?.animateToRegion(recenterRegion, 450);
  }, [recenterRegion, paused, mapMounted]);

  useImperativeHandle(ref, () => ({
    centerOn: (latitude: number, longitude: number) => {
      const next = regionForRadiusKm(latitude, longitude, defaultRadiusKm);
      regionRef.current = next;
      if (mapMounted && !paused) {
        mapRef.current?.animateToRegion(next, 450);
      }
      onRegionChange(next);
    },
  }));

  const handleRegionChange = useCallback(
    (next: Region) => {
      regionRef.current = next;
      onRegionChange(next);
    },
    [onRegionChange],
  );

  if (Platform.OS === 'web') {
    return <MapPlaceholder message="Mapa interactivo disponible en iOS y Android" />;
  }

  if (paused || !mapMounted) {
    return <MapPlaceholder message={paused ? 'Mapa en pausa mientras buscas' : 'Cargando mapa…'} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        onPress={onMapPress}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        scrollEnabled
        zoomEnabled
        zoomTapEnabled
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        loadingEnabled={!isExpoGo()}
      >
        {professionals.map((p) => (
          <Marker
            key={p.id}
            identifier={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            pinColor={p.id === selectedId ? PIN_SELECTED : PIN_DEFAULT}
            onPress={(e) => {
              e.stopPropagation?.();
              onSelect(p.id);
            }}
            zIndex={p.id === selectedId ? 2 : 1}
          />
        ))}
      </MapView>

      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', right: spacing.md, top: '38%' }}
      >
        <Pressable
          onPress={onRecenterDevice}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadow.sm,
          }}
          accessibilityLabel="Centrar en mi ubicación"
        >
          <Icon name="locate" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: spacing.md,
          bottom: spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          ...theme.shadow.sm,
        }}
      >
        <Text variant="caption" color="textSecondary">
          Vista ~{visibleRadiusKm} km · {professionals.length} pins
        </Text>
      </View>
    </View>
  );
});
