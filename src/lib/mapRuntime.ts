import Constants from 'expo-constants';

/** True when running inside the Expo Go host app (much tighter memory budget). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function getMapMarkerLimit(): number {
  return isExpoGo() ? 10 : 30;
}

export function getMarketplaceFetchLimit(): number {
  return isExpoGo() ? 24 : 60;
}
