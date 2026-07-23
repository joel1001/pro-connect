import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { resolveReachableApiBaseUrl, invalidateProbeCache } from '@/lib/backendProbe';
import {
  clearStoredSession,
  isPublicAuthRoute,
  refreshAccessToken,
} from '@/lib/authSession';
import { storage, STORAGE_KEYS } from '@/utils/storage';

/**
 * Shared axios instance.
 * - Attaches the bearer access token on every request.
 * - On 401 (protected routes), refreshes once and replays the request.
 */
export const apiClient: AxiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
});

let isRefreshing = false;
let pendingQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  pendingQueue = [];
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.baseURL = await resolveReachableApiBaseUrl();
  if (isPublicAuthRoute(config.url)) return config;

  const token = await storage.get(STORAGE_KEYS.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // On network failures, invalidate the probe cache so the next request
    // re-discovers the backend instead of hitting a dead URL.
    if (isNetworkFailure(error)) {
      invalidateProbeCache();
    }

    if (status !== 401 || original?._retry || isPublicAuthRoute(original?.url)) {
      return Promise.reject(error);
    }

    const refreshToken = await storage.get(STORAGE_KEYS.refreshToken);
    if (!refreshToken) {
      await clearStoredSession();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;
    try {
      const accessToken = await refreshAccessToken();
      flushQueue(null, accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      // Only clear the session if the server explicitly rejected the refresh token
      // (401/403). Do NOT clear on network errors (timeout, 502, etc.) — those are
      // transient and the user should stay logged in.
      const isAuthRejection =
        axios.isAxiosError(refreshError) &&
        (refreshError.response?.status === 401 || refreshError.response?.status === 403);
      if (isAuthRejection) {
        await clearStoredSession();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/** Maps backend auth error messages to user-friendly Spanish copy. */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Correo o contraseña incorrectos.',
  'Account is not active': 'Tu cuenta no está activa. Verifica tu correo o contacta soporte.',
  'Session expired or revoked': 'Sesión expirada. Inicia sesión de nuevo.',
  'Session expired. Please sign in again.': 'Sesión expirada. Inicia sesión de nuevo.',
  'Invalid refresh token': 'Sesión expirada. Inicia sesión de nuevo.',
  'Session not found': 'Sesión expirada. Inicia sesión de nuevo.',
  'You blocked this user': 'Bloqueaste a este usuario.',
  'This user blocked you': 'Este usuario te bloqueó.',
  'Cannot block yourself': 'No puedes bloquearte a ti mismo.',
  'Decline reason is required': 'Ingresa una razón antes de rechazar.',
};

function translateAuthMessage(message: string): string {
  return AUTH_ERROR_MESSAGES[message] ?? message;
}

function isSessionExpiredMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('session') && (lower.includes('expired') || lower.includes('revoked'));
}

const CONNECTION_ERROR = 'No se pudo conectar con el servidor.';

export function isConnectionError(message: string): boolean {
  return message === CONNECTION_ERROR || message.toLowerCase().includes('network error');
}

function isNetworkFailure(error: AxiosError): boolean {
  if (!error.response) {
    return isTimeoutError(error) || error.message === 'Network Error';
  }
  const status = error.response.status;
  return status === 502 || status === 503 || status === 504;
}

function isTimeoutError(error: AxiosError): boolean {
  return error.code === 'ECONNABORTED' || /timeout/i.test(error.message);
}

/** Extracts a human-readable message from a backend ErrorResponse. */
export function getApiErrorMessage(error: unknown, fallback = 'Algo salió mal'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    const status = error.response?.status;
    const backendMessage = data?.message?.trim();

    if (backendMessage) {
      return translateAuthMessage(backendMessage);
    }

    if (isNetworkFailure(error) || isTimeoutError(error)) {
      return CONNECTION_ERROR;
    }

    if (status === 401 || status === 403) {
      return 'Sesión expirada. Inicia sesión de nuevo.';
    }

    return error.message ?? fallback;
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    const backendMessage = resp?.data?.message?.trim();
    if (backendMessage) {
      return translateAuthMessage(backendMessage);
    }
    if (resp?.status === 401 || resp?.status === 403) {
      return 'Sesión expirada. Inicia sesión de nuevo.';
    }
    if (resp?.status === 502 || resp?.status === 503 || resp?.status === 504) {
      return CONNECTION_ERROR;
    }
  }
  if (error instanceof Error && error.message) {
    if (isSessionExpiredMessage(error.message)) {
      return 'Sesión expirada. Inicia sesión de nuevo.';
    }
    if (error.message === 'Network Error') {
      return CONNECTION_ERROR;
    }
    return error.message;
  }
  return fallback;
}
