import type { Region } from 'react-native-maps';

import { ProfessionalUser } from '@/types';

import {
  coordsFromDistanceKm,
  DEVICE_SEARCH_RADIUS_KM,
  haversineKm,
  isCoordinateInRegion,
  MapCenter,
  MARKETPLACE_CENTER,
  MAX_MARKETPLACE_FETCH,
} from './marketplaceGeo';
import { getMapMarkerLimit } from './mapRuntime';
import { resolveProfessionalAvatarUrl } from './professionalAvatar';

export type MarketplaceProfessional = {
  id: string;
  name: string;
  profession: string;
  place?: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  distanceKm: number;
  priceFrom: number;
  jobs: number;
  yearsExp: number;
  responseMin: number;
  verified: string[];
  bio: string;
  available: boolean;
  emergencyHireEnabled: boolean;
  online: boolean;
  avatarUrl?: string;
  latitude: number;
  longitude: number;
};

function apiProfessionalToMarketplace(
  p: ProfessionalUser,
  index: number,
  center: MapCenter,
): MarketplaceProfessional {
  const name = p.displayName ?? p.headline?.split('·').map((part) => part.trim())[0] ?? p.headline ?? 'Profesional';
  const profession = p.headline?.split('·').map((part) => part.trim())[1] ?? p.credentials?.professionalTitle ?? 'Profesional';
  const place = p.address?.trim();

  let latitude = center.latitude;
  let longitude = center.longitude;
  let distanceFromCenter = 1 + index * 0.8;

  const coords = p.location?.coordinates;
  if (coords && coords.length >= 2) {
    longitude = coords[0];
    latitude = coords[1];
    distanceFromCenter = haversineKm(center.latitude, center.longitude, latitude, longitude);
  } else {
    const bearing = (index * 67 + 15) % 360;
    const offset = coordsFromDistanceKm(1.2 + index * 0.7, bearing, center);
    latitude = offset.latitude;
    longitude = offset.longitude;
    distanceFromCenter = haversineKm(center.latitude, center.longitude, latitude, longitude);
  }

  return {
    id: p.id,
    name,
    profession,
    place,
    rating: p.rating ?? 0,
    reviewCount: p.totalReviews ?? 0,
    trustScore: p.trustScore ?? 0,
    distanceKm: distanceFromCenter,
    priceFrom: p.startingPrice ?? 30,
    jobs: p.completedJobs ?? 0,
    yearsExp: 5,
    responseMin: 15,
    verified: p.credentials?.verificationBadges?.length ? p.credentials.verificationBadges : ['ID'],
    bio: p.bio ?? '',
    available: p.available ?? false,
    emergencyHireEnabled: p.emergencyHireEnabled ?? true,
    online: p.online ?? false,
    avatarUrl: resolveProfessionalAvatarUrl({ id: p.id, name, avatarUrl: p.avatarUrl }, index),
    latitude,
    longitude,
  };
}

/** Map API professional to card/map model (no radius filter — for profile detail). */
export function professionalProfileFromApi(
  p: ProfessionalUser,
  center: MapCenter = MARKETPLACE_CENTER,
): MarketplaceProfessional {
  return apiProfessionalToMarketplace(p, 0, center);
}

export function marketplaceFromApi(
  items: ProfessionalUser[],
  center: MapCenter = MARKETPLACE_CENTER,
  radiusKm = DEVICE_SEARCH_RADIUS_KM,
  maxResults = MAX_MARKETPLACE_FETCH,
): MarketplaceProfessional[] {
  const mapped = items.map((p, i) => apiProfessionalToMarketplace(p, i, center));
  return mapped
    .map((p) => ({
      ...p,
      distanceKm: haversineKm(center.latitude, center.longitude, p.latitude, p.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults);
}

export function filterMarketplace(
  items: MarketplaceProfessional[],
  query: string,
  onlyAvailable: boolean,
): MarketplaceProfessional[] {
  const q = query.trim().toLowerCase();
  return items.filter((p) => {
    if (onlyAvailable && !p.available) return false;
    if (!q) return true;
    return matchesMarketplaceQuery(p, q);
  });
}

function matchesMarketplaceQuery(p: MarketplaceProfessional, q: string): boolean {
  const place = p.place?.toLowerCase() ?? '';
  return (
    p.name.toLowerCase().includes(q) ||
    p.profession.toLowerCase().includes(q) ||
    p.bio.toLowerCase().includes(q) ||
    place.includes(q)
  );
}

export function matchesMarketplaceCountry(
  professional: MarketplaceProfessional,
  countryCode: string,
  countryName: string,
): boolean {
  if (!countryCode) return true;

  const place = professional.place?.toLowerCase() ?? '';
  if (!place) return true;

  const code = countryCode.toLowerCase();
  const name = countryName.toLowerCase();
  if (code === 'cr') {
    return place.includes('costa rica') || place.includes('cr');
  }
  return place.includes(code) || place.includes(name);
}

export function marketplaceSearchSuggestions(
  items: MarketplaceProfessional[],
  query: string,
): MarketplaceProfessional[] {
  const q = query.trim().toLowerCase();
  const matched = q ? items.filter((p) => matchesMarketplaceQuery(p, q)) : items;
  return [...matched].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.distanceKm - b.distanceKm;
  });
}

export function marketplaceCategoryChips(items: MarketplaceProfessional[]): string[] {
  const fromData = [...new Set(items.map((p) => p.profession))];
  const defaults = ['Electricista', 'Plomero', 'Carpintero', 'Pintor', 'Jardinería'];
  return [...new Set([...fromData, ...defaults])].slice(0, 6);
}

/** Professionals whose coordinates fall inside the current map viewport. */
export function filterVisibleOnMap(
  items: MarketplaceProfessional[],
  region: Region,
): MarketplaceProfessional[] {
  return items.filter((p) => isCoordinateInRegion(p.latitude, p.longitude, region));
}

/** Cap map markers (closest first) while keeping the selected pin visible. */
export function pickMapProfessionals(
  items: MarketplaceProfessional[],
  selectedId?: string | null,
  max = getMapMarkerLimit(),
): MarketplaceProfessional[] {
  const sorted = [...items].sort((a, b) => a.distanceKm - b.distanceKm);
  if (sorted.length <= max) return sorted;

  const limited = sorted.slice(0, max);
  if (!selectedId || limited.some((p) => p.id === selectedId)) return limited;

  const selected = items.find((p) => p.id === selectedId);
  if (!selected) return limited;
  return [selected, ...limited.slice(0, max - 1)];
}

/** @deprecated Prefer pickMapProfessionals — viewport filter hid pins after pinch/pan. */
export function limitMapMarkers(
  items: MarketplaceProfessional[],
  region: Region,
  max = getMapMarkerLimit(),
  selectedId?: string | null,
): MarketplaceProfessional[] {
  const visible = filterVisibleOnMap(items, region);
  const sorted = [...visible].sort((a, b) => a.distanceKm - b.distanceKm);
  if (sorted.length <= max) return sorted;

  const limited = sorted.slice(0, max);
  if (!selectedId || limited.some((p) => p.id === selectedId)) return limited;

  const selected = items.find((p) => p.id === selectedId);
  if (!selected || !isCoordinateInRegion(selected.latitude, selected.longitude, region)) {
    return limited;
  }
  return [selected, ...limited.slice(0, max - 1)];
}
