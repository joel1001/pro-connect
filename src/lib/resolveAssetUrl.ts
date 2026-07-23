import { getApiBaseUrl } from '@/constants/config';

/**
 * Resolves asset URLs from the API (absolute or relative /assets/ paths).
 */
export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/assets/') || url.startsWith('/onboarding/files/')) {
    const base = getApiBaseUrl().replace(/\/+$/, '');
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return url;
}
