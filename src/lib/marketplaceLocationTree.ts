import * as Device from 'expo-device';
import type { LocationGeocodedAddress } from 'expo-location';

import { COSTA_RICA_COUNTRY_CODE, COSTA_RICA_COUNTRY_NAME, getCostaRicaProvinces } from './costaRicaLocations';
import { getMarketplaceCountry } from './deviceCountry';

export type MarketplaceLocationNode = {
  value: string;
  label: string;
  children?: MarketplaceLocationNode[];
};

function mapCantonNode(canton: { name: string; children: { name: string }[] }): MarketplaceLocationNode {
  return {
    value: canton.name,
    label: canton.name,
    children: canton.children.map((district) => ({
      value: district.name,
      label: district.name,
    })),
  };
}

function mapProvinceNode(province: { name: string; children: { name: string; children: { name: string }[] }[] }): MarketplaceLocationNode {
  return {
    value: province.name,
    label: province.name,
    children: province.children.map(mapCantonNode),
  };
}

function normalizeLocationText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function findChildByLabel(options: MarketplaceLocationNode[], labels: Array<string | null | undefined>) {
  for (const label of labels) {
    if (!label) continue;
    const normalizedLabel = normalizeLocationText(label);
    const match = options.find((option) => normalizeLocationText(option.label) === normalizedLabel);
    if (match) return match;
  }

  return null;
}

export function getMarketplaceLocationTree(): MarketplaceLocationNode[] {
  const country = getMarketplaceCountry();
  if (country.code === COSTA_RICA_COUNTRY_CODE || (__DEV__ && Device.isDevice === false)) {
    return [
      {
        value: COSTA_RICA_COUNTRY_CODE,
        label: COSTA_RICA_COUNTRY_NAME,
        children: getCostaRicaProvinces().map(mapProvinceNode),
      },
    ];
  }

  return [{ value: country.code, label: country.name, children: [] }];
}

export function getMarketplaceDefaultLocationPath(): string[] {
  if (__DEV__ && Device.isDevice === false) {
    return [COSTA_RICA_COUNTRY_CODE, 'Alajuela', 'Central', 'Alajuela'];
  }

  const country = getMarketplaceCountry();
  return [country.code];
}

export function getMarketplaceLocationPathFromPlacemark(
  placemark: LocationGeocodedAddress | null | undefined,
): string[] {
  const country = getMarketplaceCountry();
  if (country.code !== COSTA_RICA_COUNTRY_CODE) {
    return [country.code];
  }

  if (!placemark) {
    return getMarketplaceDefaultLocationPath();
  }

  const provinceOptions = getCostaRicaProvinces();
  const province = findChildByLabel(provinceOptions, [
    placemark.region,
    placemark.subregion,
    placemark.city,
    placemark.district,
  ]);

  if (!province) {
    return [COSTA_RICA_COUNTRY_CODE];
  }

  const path = [COSTA_RICA_COUNTRY_CODE, province.label];
  const canton = findChildByLabel(province.children ?? [], [
    placemark.city,
    placemark.subregion,
    placemark.district,
  ]);
  if (!canton) {
    return path;
  }

  path.push(canton.label);
  const district = findChildByLabel(canton.children ?? [], [
    placemark.district,
    placemark.name,
    placemark.street,
  ]);
  if (district) {
    path.push(district.label);
  }

  return path;
}
