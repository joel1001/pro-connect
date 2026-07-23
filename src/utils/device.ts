import { Platform } from 'react-native';

import { storage } from './storage';

const DEVICE_ID_KEY = 'pc.deviceId';

/** Returns a stable per-install device id, generating one on first use. */
export async function getDeviceId(): Promise<string> {
  const existing = await storage.get(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = `${Platform.OS}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  await storage.set(DEVICE_ID_KEY, id);
  return id;
}

export function getDeviceName(): string {
  return Platform.select({
    ios: 'iOS Device',
    android: 'Android Device',
    web: 'Web Browser',
    default: 'Unknown Device',
  }) as string;
}
