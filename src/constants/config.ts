import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

function isStaleTunnelUrl(url: string): boolean {
  // Allow tunnels (localtunnel, ngrok) to be candidates and let resolveReachableApiBaseUrl dynamically probe them.
  return false;
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

function isPhysicalDevice(): boolean {
  return Device.isDevice === true;
}

function resolveDevHost(): string {
  if (Platform.OS === 'ios' && Device.isDevice === false) {
    return 'localhost';
  }
  if (Platform.OS === 'android' && Device.isDevice === false) {
    return '10.0.2.2';
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants.manifest2 as { debuggerHost?: string } | null)?.debuggerHost ??
    (Constants.manifest as { debuggerHost?: string } | null)?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(':')[0]?.trim();
    if (host && !isLoopbackHost(host)) {
      return host;
    }
  }

  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured && !isStaleTunnelUrl(configured)) {
    try {
      const host = new URL(configured.replace(/^ws/i, 'http')).hostname;
      if (host && !isLoopbackHost(host)) return host;
    } catch {
      /* ignore */
    }
  }

  return 'localhost';
}

function apiUrlForHost(host: string): string {
  return `http://${host}:8080/api/v1`;
}

function wsUrlForHost(host: string): string {
  return `ws://${host}:8080/api/v1/ws/chat`;
}

function webUrlForHost(host: string): string {
  return `http://${host}:8081`;
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function rewriteLoopbackForPhysicalDevice(url: string, kind: 'http' | 'ws'): string {
  if (!isPhysicalDevice()) return url;
  try {
    const parsed = new URL(url.replace(/^ws/i, 'http'));
    if (!isLoopbackHost(parsed.hostname)) return url;
    const devHost = resolveDevHost();
    const port = parsed.port || '8080';
    if (kind === 'http') return `http://${devHost}:${port}/api/v1`;
    return `ws://${devHost}:${port}/api/v1/ws/chat`;
  } catch {
    return url;
  }
}

function resolveApiBaseUrl(): string {
  if (__DEV__ && !isPhysicalDevice()) {
    if (Platform.OS === 'ios') return 'http://localhost:8080/api/v1';
    if (Platform.OS === 'android') return 'http://10.0.2.2:8080/api/v1';
  }

  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured && !isStaleTunnelUrl(configured)) {
    return rewriteLoopbackForPhysicalDevice(configured.replace(/\/$/, ''), 'http');
  }

  // Physical device: same host Expo Go uses for Metro (avoids stale .env LAN IP → timeout).
  if (__DEV__ && isPhysicalDevice()) {
    const host = resolveDevHost();
    if (host && !isLoopbackHost(host)) {
      return apiUrlForHost(host);
    }
  }

  if (__DEV__ && configured && isStaleTunnelUrl(configured)) {
    // eslint-disable-next-line no-console
    console.warn('[ProConnect] Ignorando túnel caducado → LAN/localhost');
  }
  return apiUrlForHost(resolveDevHost());
}

export function getApiBaseCandidates(): string[] {
  const candidates: string[] = [];
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (__DEV__ && !isPhysicalDevice()) {
    if (Platform.OS === 'ios') pushUnique(candidates, 'http://localhost:8080/api/v1');
    if (Platform.OS === 'android') pushUnique(candidates, 'http://10.0.2.2:8080/api/v1');
  }

  if (configured && !isStaleTunnelUrl(configured)) {
    const normalized = configured.replace(/\/$/, '');
    pushUnique(candidates, rewriteLoopbackForPhysicalDevice(normalized, 'http'));
    try {
      const host = new URL(normalized.replace(/^ws/i, 'http')).hostname;
      if (host) {
        pushUnique(candidates, apiUrlForHost(host));
      }
    } catch {
      /* ignore malformed env values */
    }
  }

  const host = resolveDevHost();
  if (host && !isLoopbackHost(host)) {
    pushUnique(candidates, apiUrlForHost(host));
  }

  if (__DEV__ && configured && isStaleTunnelUrl(configured)) {
    // eslint-disable-next-line no-console
    console.warn('[ProConnect] Ignorando túnel caducado → LAN/localhost');
  }

  if (!candidates.length) {
    pushUnique(candidates, apiUrlForHost(resolveDevHost()));
  }
  pushUnique(candidates, apiUrlForHost(resolveDevHost()));
  return candidates;
}

function resolveWsChatUrl(): string {
  if (__DEV__ && !isPhysicalDevice()) {
    if (Platform.OS === 'ios') return 'ws://localhost:8080/api/v1/ws/chat';
    if (Platform.OS === 'android') return 'ws://10.0.2.2:8080/api/v1/ws/chat';
  }

  const configured = process.env.EXPO_PUBLIC_WS_URL?.trim();
  if (configured && !isStaleTunnelUrl(configured)) {
    if (configured.endsWith('/ws/chat')) {
      return rewriteLoopbackForPhysicalDevice(configured, 'ws');
    }
    if (configured.endsWith('/ws')) {
      return rewriteLoopbackForPhysicalDevice(`${configured}/chat`, 'ws');
    }
    return rewriteLoopbackForPhysicalDevice(configured, 'ws');
  }

  if (__DEV__ && isPhysicalDevice()) {
    const host = resolveDevHost();
    if (host && !isLoopbackHost(host)) {
      return wsUrlForHost(host);
    }
  }

  return wsUrlForHost(resolveDevHost());
}

export function getWsChatCandidates(): string[] {
  const apiCandidates = getApiBaseCandidates();
  return apiCandidates.map((baseUrl) => baseUrl.replace(/\/api\/v1$/, '/api/v1/ws/chat').replace(/^http:/, 'ws:'));
}

/** Resolve on each call — required on Expo Go device (debuggerHost not ready at import). */
export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function getWsChatUrl(): string {
  return resolveWsChatUrl();
}

export function getWebAppUrl(path = ''): string {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  const base =
    configured?.replace(/\/$/, '') ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : webUrlForHost(resolveDevHost()));
  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export const API_BASE_URL = getApiBaseUrl();
export const WS_CHAT_URL = getWsChatUrl();
export const WS_BASE_URL = WS_CHAT_URL;

export const APP_NAME = 'ProConnect';
export const APP_TAGLINE = 'Profesionales cerca de ti';

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('[ProConnect] API →', getApiBaseUrl());
  // eslint-disable-next-line no-console
  console.log('[ProConnect] WS  →', getWsChatUrl());
}
