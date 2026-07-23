import axios from 'axios';

import { resolveReachableApiBaseUrl } from '@/lib/backendProbe';
import { AuthResponse } from '@/types';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/** Routes that must not trigger token refresh or session clearing on 401. */
export const PUBLIC_AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/resend-code',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/users/exists'
] as const;

export function isPublicAuthRoute(url?: string): boolean {
  if (!url) return false;
  if (PUBLIC_AUTH_ROUTES.some((route) => url.includes(route))) return true;
  return false;
}

const REFRESH_SKEW_MS = 60_000;
/** Refresh access token when less than 5 minutes remain. */
const PROACTIVE_REFRESH_WINDOW_MS = 5 * 60_000;
const AUTH_HTTP_TIMEOUT_MS = 15_000;

const authHttp = axios.create({
  timeout: AUTH_HTTP_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
});

authHttp.interceptors.request.use(async (config) => {
  config.baseURL = await resolveReachableApiBaseUrl();
  return config;
});

let refreshPromise: Promise<string> | null = null;
type SessionListener = () => void;
const sessionClearListeners = new Set<SessionListener>();
const sessionRefreshListeners = new Set<SessionListener>();

export function onSessionCleared(listener: SessionListener): () => void {
  sessionClearListeners.add(listener);
  return () => sessionClearListeners.delete(listener);
}

export function onSessionRefreshed(listener: SessionListener): () => void {
  sessionRefreshListeners.add(listener);
  return () => sessionRefreshListeners.delete(listener);
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    if (typeof atob !== 'function') return null;
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

export function getAccessTokenExpiryMs(accessToken: string): number | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isAccessTokenExpired(
  accessToken: string,
  skewMs = REFRESH_SKEW_MS,
): boolean {
  const expMs = getAccessTokenExpiryMs(accessToken);
  if (!expMs) return true;
  return Date.now() >= expMs - skewMs;
}

export function shouldProactivelyRefreshAccessToken(accessToken: string | null): boolean {
  if (!accessToken) return true;
  const expMs = getAccessTokenExpiryMs(accessToken);
  if (!expMs) return true;
  return Date.now() >= expMs - PROACTIVE_REFRESH_WINDOW_MS;
}

export async function persistAuthResponse(res: AuthResponse): Promise<void> {
  await storage.set(STORAGE_KEYS.accessToken, res.accessToken);
  await storage.set(STORAGE_KEYS.refreshToken, res.refreshToken);
  const expMs =
    getAccessTokenExpiryMs(res.accessToken) ?? Date.now() + (res.expiresIn ?? 900) * 1000;
  await storage.set(STORAGE_KEYS.accessTokenExpiresAt, String(expMs));
}

export async function clearStoredSession(): Promise<void> {
  await storage.remove(STORAGE_KEYS.accessToken);
  await storage.remove(STORAGE_KEYS.refreshToken);
  await storage.remove(STORAGE_KEYS.accessTokenExpiresAt);
  await storage.remove(STORAGE_KEYS.user);
  await storage.remove(STORAGE_KEYS.activeRole);
  sessionClearListeners.forEach((listener) => listener());
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await storage.get(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const { data } = await authHttp.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    await persistAuthResponse(data);
    sessionRefreshListeners.forEach((listener) => listener());
    return data.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Returns a valid access token, refreshing silently when expired or near expiry.
 */
export async function ensureValidAccessToken(forceRefresh = false): Promise<string | null> {
  const refreshToken = await storage.get(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  const accessToken = await storage.get(STORAGE_KEYS.accessToken);
  if (
    !forceRefresh &&
    accessToken &&
    !shouldProactivelyRefreshAccessToken(accessToken)
  ) {
    return accessToken;
  }

  try {
    return await refreshAccessToken();
  } catch {
    return null;
  }
}
