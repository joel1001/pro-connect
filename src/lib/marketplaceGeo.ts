import type { Region } from 'react-native-maps';

/** Default map zoom on first load (km radius around the user). */
export const DEVICE_SEARCH_RADIUS_KM = 10;

/** Max professionals kept in memory from search (avoids huge lists on dense areas). */
export const MAX_MARKETPLACE_FETCH = 80;

/** Max markers rendered on the map at once (custom views are expensive on native maps). */
export const MAX_MAP_MARKERS = 35;

export const MAX_SEARCH_RADIUS_KM = 50;
export const MIN_SEARCH_RADIUS_KM = 2;

export type MapCenter = { latitude: number; longitude: number };

/** San José, CR — fallback when location is unavailable. */
export const MARKETPLACE_CENTER: MapCenter = {
  latitude: 9.9281,
  longitude: -84.0907,
};

const KM_PER_DEG_LAT = 111.32;

/** Map region that frames a circle of `radiusKm` around a point. */
export function regionForRadiusKm(
  latitude: number,
  longitude: number,
  radiusKm: number,
): Region {
  const diameterKm = radiusKm * 2;
  const latitudeDelta = diameterKm / KM_PER_DEG_LAT;
  const longitudeDelta =
    diameterKm / (KM_PER_DEG_LAT * Math.cos((latitude * Math.PI) / 180));
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const DEFAULT_MAP_REGION: Region = regionForRadiusKm(
  MARKETPLACE_CENTER.latitude,
  MARKETPLACE_CENTER.longitude,
  DEVICE_SEARCH_RADIUS_KM,
);

export function coordsFromDistanceKm(
  distanceKm: number,
  bearingDeg: number,
  center: MapCenter = MARKETPLACE_CENTER,
): { latitude: number; longitude: number } {
  const latRad = (center.latitude * Math.PI) / 180;
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos(latRad);
  const br = (bearingDeg * Math.PI) / 180;
  return {
    latitude: center.latitude + (distanceKm / KM_PER_DEG_LAT) * Math.cos(br),
    longitude: center.longitude + (distanceKm / kmPerDegLng) * Math.sin(br),
  };
}

/** Search radius (km) for a map viewport — used when zooming/panning. */
export function searchRadiusFromRegion(region: Region): number {
  return Math.min(
    MAX_SEARCH_RADIUS_KM,
    Math.max(MIN_SEARCH_RADIUS_KM, Math.round(regionRadiusKm(region) * 1.15)),
  );
}

/** Approximate search radius from the visible map region (km). */
export function regionRadiusKm(region: Region): number {
  const latKm = (region.latitudeDelta / 2) * KM_PER_DEG_LAT;
  const lngKm =
    (region.longitudeDelta / 2) * KM_PER_DEG_LAT * Math.cos((region.latitude * Math.PI) / 180);
  return Math.max(0.5, Math.sqrt(latKm * latKm + lngKm * lngKm));
}

export function isCoordinateInRegion(
  latitude: number,
  longitude: number,
  region: Region,
  paddingFactor = 1.05,
): boolean {
  const latPad = (region.latitudeDelta / 2) * paddingFactor;
  const lngPad = (region.longitudeDelta / 2) * paddingFactor;
  return (
    latitude >= region.latitude - latPad &&
    latitude <= region.latitude + latPad &&
    longitude >= region.longitude - lngPad &&
    longitude <= region.longitude + lngPad
  );
}

export function zoomRegion(region: Region, factor: number): Region {
  const nextLat = Math.max(0.002, Math.min(2, region.latitudeDelta * factor));
  const nextLng = Math.max(0.002, Math.min(2, region.longitudeDelta * factor));
  return {
    ...region,
    latitudeDelta: nextLat,
    longitudeDelta: nextLng,
  };
}
