import * as Device from 'expo-device';
import * as Location from 'expo-location';

import {
  getMarketplaceDefaultLocationPath,
  getMarketplaceLocationPathFromPlacemark,
} from './marketplaceLocationTree';

export async function resolveMarketplaceDeviceLocationPath(): Promise<string[]> {
  if (__DEV__ && !Device.isDevice) {
    return getMarketplaceDefaultLocationPath();
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return getMarketplaceDefaultLocationPath();
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const places = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    return getMarketplaceLocationPathFromPlacemark(places[0]);
  } catch {
    return getMarketplaceDefaultLocationPath();
  }
}
