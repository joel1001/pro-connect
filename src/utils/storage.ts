import AsyncStorage from '@react-native-async-storage/async-storage';

/** Thin async key/value wrapper so the rest of the app never imports AsyncStorage directly. */
export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // no-op
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // no-op
    }
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },
};

export const STORAGE_KEYS = {
  accessToken: 'pc.accessToken',
  refreshToken: 'pc.refreshToken',
  accessTokenExpiresAt: 'pc.accessTokenExpiresAt',
  user: 'pc.user',
  activeRole: 'pc.activeRole',
  onboardingSeen: 'pc.onboardingSeen',
  language: 'pc.language',
  registrationRole: 'pc.registrationRole',
  themePalette: 'pc.themePalette',
  paymentMethods: 'pc.paymentMethods',
} as const;
