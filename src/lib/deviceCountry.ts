import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';

import { COSTA_RICA_COUNTRY_CODE, COSTA_RICA_COUNTRY_NAME } from '@/lib/costaRicaLocations';

export interface DeviceCountry {
  code: string;
  name: string;
}

/** ISO region from the device locale (e.g. CR, US). Falls back to Costa Rica. */
export function getDeviceCountry(): DeviceCountry {
  const locales = getLocales();
  const primary = locales[0];
  const code =
    primary?.regionCode?.toUpperCase() ??
    primary?.languageTag?.split('-')[1]?.toUpperCase() ??
    COSTA_RICA_COUNTRY_CODE;

  const languageTag = primary?.languageTag ?? 'es-CR';
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames([languageTag], { type: 'region' }).of(code);
  } catch {
    name = undefined;
  }

  return {
    code,
    name: name ?? (code === COSTA_RICA_COUNTRY_CODE ? COSTA_RICA_COUNTRY_NAME : code),
  };
}

/** Country used for marketplace filtering. Simulator/dev falls back to CR. */
export function getMarketplaceCountry(): DeviceCountry {
  if (__DEV__ && Device.isDevice === false) {
    return {
      code: COSTA_RICA_COUNTRY_CODE,
      name: COSTA_RICA_COUNTRY_NAME,
    };
  }
  return getDeviceCountry();
}
