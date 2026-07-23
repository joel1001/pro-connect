import axios from 'axios';

import { getApiBaseCandidates, getApiBaseUrl } from '@/constants/config';

const PROBE_TIMEOUT_MS = 2500;
/** How long a successfully verified URL remains cached before re-probing. */
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const probeHttp = axios.create({
  timeout: PROBE_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
});

let resolvedBaseUrl: string | null = null;
let resolvedAt = 0;
let resolvingPromise: Promise<string> | null = null;

function isCacheValid(): boolean {
  return resolvedBaseUrl !== null && Date.now() - resolvedAt < CACHE_TTL_MS;
}

/** Clear the cached URL so the next request re-probes the backend. */
export function invalidateProbeCache(): void {
  resolvedBaseUrl = null;
  resolvedAt = 0;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function probeWithRetry(): Promise<string> {
  const candidates = getApiBaseCandidates();
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const candidate of candidates) {
      try {
        const response = await probeHttp.get('/', {
          baseURL: candidate,
          validateStatus: () => true,
        });
        if (response.status >= 500) {
          throw new Error(`HTTP ${response.status}`);
        }
        // Successfully reached the backend — cache it
        resolvedBaseUrl = candidate;
        resolvedAt = Date.now();
        return candidate;
      } catch (error) {
        lastError = error;
      }
    }

    // Wait before retrying (exponential backoff: 800ms, 1600ms, 3200ms)
    if (attempt < MAX_RETRIES - 1) {
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
    }
  }

  // All retries exhausted — use the default URL but do NOT cache it
  // so the next request will re-probe and potentially succeed.
  if (__DEV__ && lastError) {
    // eslint-disable-next-line no-console
    console.warn('[ProConnect] backend probe failed after', MAX_RETRIES, 'attempts');
  }
  return getApiBaseUrl();
}

export async function resolveReachableApiBaseUrl(): Promise<string> {
  if (isCacheValid()) return resolvedBaseUrl!;
  if (resolvingPromise) return resolvingPromise;

  resolvingPromise = probeWithRetry().finally(() => {
    resolvingPromise = null;
  });

  return resolvingPromise;
}

export async function probeBackendReachable(): Promise<void> {
  await resolveReachableApiBaseUrl();
}
