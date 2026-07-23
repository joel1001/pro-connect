import * as Location from 'expo-location';
import type { Region } from 'react-native-maps';
import { create } from 'zustand';

import { catalogApi } from '@/api/catalog.api';
import { getMarketplaceFetchLimit, isExpoGo } from '@/lib/mapRuntime';
import { marketplaceFromApi, MarketplaceProfessional } from '@/lib/marketplace';
import { realtimeService } from '@/services/realtime';
import {
  DEFAULT_MAP_REGION,
  DEVICE_SEARCH_RADIUS_KM,
  haversineKm,
  MapCenter,
  MARKETPLACE_CENTER,
  regionForRadiusKm,
  regionRadiusKm,
  searchRadiusFromRegion,
} from '@/lib/marketplaceGeo';
import * as Device from 'expo-device';

type LastSearch = { latitude: number; longitude: number; radiusKm: number };

interface MarketplaceState {
  professionals: MarketplaceProfessional[];
  loading: boolean;
  deviceLocation: MapCenter | null;
  visibleRegion: Region;
  recenterRegion: Region | null;
  visibleRadiusKm: number;
  locationGranted: boolean;
  defaultRadiusKm: number;
  scheduleRegionSearch: (region: Region) => void;
  recenterOnDevice: () => void;
}
const DEV_SIMULATOR_LOCATION: MapCenter = {
  latitude: 10.0163,
  longitude: -84.2116,
};
const REGION_DEBOUNCE_MS = 450;
const MIN_CENTER_SHIFT_KM = 0.25;
const MIN_RADIUS_SHIFT_KM = 0.5;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let requestSeq = 0;
let lastSearch: LastSearch | null = null;
let initialLoadDone = false;
let initStarted = false;
let availabilityListenerAttached = false;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

const fetchLimit = getMarketplaceFetchLimit();

function shouldRefetch(region: Region): boolean {
  const radiusKm = searchRadiusFromRegion(region);
  if (!lastSearch) return true;
  const centerShift = haversineKm(
    lastSearch.latitude,
    lastSearch.longitude,
    region.latitude,
    region.longitude,
  );
  const radiusShift = Math.abs(lastSearch.radiusKm - radiusKm);
  return centerShift >= MIN_CENTER_SHIFT_KM || radiusShift >= MIN_RADIUS_SHIFT_KM;
}

function loadForRegion(region: Region, force = false) {
  const center: MapCenter = { latitude: region.latitude, longitude: region.longitude };
  const searchRadiusKm = searchRadiusFromRegion(region);
  if (!force && !shouldRefetch(region)) return;

  const searchKey: LastSearch = {
    latitude: center.latitude,
    longitude: center.longitude,
    radiusKm: searchRadiusKm,
  };

  const requestId = ++requestSeq;
  useMarketplaceStore.setState({
    loading: true,
    visibleRadiusKm: Math.round(regionRadiusKm(region)),
  });

  catalogApi
    .searchNearby({
      latitude: center.latitude,
      longitude: center.longitude,
      radiusKm: searchRadiusKm,
    })
    .then((items) => {
      if (requestId !== requestSeq) return;
      lastSearch = searchKey;
      useMarketplaceStore.setState({
        professionals: marketplaceFromApi(items, center, searchRadiusKm, fetchLimit),
      });
    })
    .catch(() => {
      if (requestId !== requestSeq) return;
      useMarketplaceStore.setState({
        professionals: [],
      });
    })
    .finally(() => {
      if (requestId === requestSeq) {
        useMarketplaceStore.setState({ loading: false });
      }
    });
}

function refreshCurrentRegion() {
  const region = useMarketplaceStore.getState().visibleRegion;
  lastSearch = null;
  loadForRegion(region, true);
}

function setInitialView(center: MapCenter) {
  const region = regionForRadiusKm(center.latitude, center.longitude, DEVICE_SEARCH_RADIUS_KM);
  lastSearch = null;
  useMarketplaceStore.setState({
    deviceLocation: center,
    visibleRegion: region,
    recenterRegion: region,
    visibleRadiusKm: DEVICE_SEARCH_RADIUS_KM,
  });
  loadForRegion(region);
  initialLoadDone = true;
}

async function ensureMarketplaceInitialized() {
  if (initStarted) return;
  initStarted = true;
  if (!availabilityListenerAttached) {
    availabilityListenerAttached = true;
    realtimeService.onEmergencyHireAvailabilityChange(() => {
      if (!initialLoadDone) return;
      refreshCurrentRegion();
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    useMarketplaceStore.setState({ locationGranted: false });
    setInitialView(MARKETPLACE_CENTER);
    return;
  }

  useMarketplaceStore.setState({ locationGranted: true });

  if (!refreshInterval) {
    refreshInterval = setInterval(() => {
      if (initialLoadDone) {
        refreshCurrentRegion();
      }
    }, 15_000);
  }

  try {
    if (__DEV__ && !Device.isDevice) {
      console.log('Using forced simulator location (Alajuela)');
      setInitialView(DEV_SIMULATOR_LOCATION);
      return;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setInitialView({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });

    if (!isExpoGo()) {
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 400,
          timeInterval: 30_000,
        },
        (update) => {
          useMarketplaceStore.setState({
            deviceLocation: {
              latitude: update.coords.latitude,
              longitude: update.coords.longitude,
            },
          });
        },
      );
    }
  } catch {
    setInitialView(MARKETPLACE_CENTER);
  }
}

export const useMarketplaceStore = create<MarketplaceState>(() => ({
  professionals: [],
  loading: true,
  deviceLocation: null,
  visibleRegion: DEFAULT_MAP_REGION,
  recenterRegion: null,
  visibleRadiusKm: DEVICE_SEARCH_RADIUS_KM,
  locationGranted: false,
  defaultRadiusKm: DEVICE_SEARCH_RADIUS_KM,

  scheduleRegionSearch: (region) => {
    useMarketplaceStore.setState({
      visibleRegion: region,
      visibleRadiusKm: Math.round(regionRadiusKm(region)),
    });
    if (!initialLoadDone) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadForRegion(region), REGION_DEBOUNCE_MS);
  },

  recenterOnDevice: () => {
    const center = useMarketplaceStore.getState().deviceLocation ?? MARKETPLACE_CENTER;
    const region = regionForRadiusKm(center.latitude, center.longitude, DEVICE_SEARCH_RADIUS_KM);
    lastSearch = null;
    useMarketplaceStore.setState({
      recenterRegion: region,
      visibleRegion: region,
      visibleRadiusKm: DEVICE_SEARCH_RADIUS_KM,
    });
    loadForRegion(region);
  },
}));

export { ensureMarketplaceInitialized };
