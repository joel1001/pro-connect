import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { ensureValidAccessToken } from '@/lib/authSession';
import { useAuthStore } from '@/store/authStore';

const BACKGROUND_CHECK_MS = 10 * 60_000;

/**
 * Keeps the mobile session alive while the app is open or returns from background.
 * Access tokens are refreshed silently using the refresh token (valid ~7 days).
 */
export function useSessionRefresh() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (Platform.OS === 'web' || status !== 'authenticated') return;

    const syncTokens = () => {
      void ensureValidAccessToken();
    };

    syncTokens();

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') syncTokens();
    });

    const interval = setInterval(syncTokens, BACKGROUND_CHECK_MS);

    return () => {
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [status]);
}
