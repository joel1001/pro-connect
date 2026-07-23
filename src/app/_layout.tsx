import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Spinner } from '@/components/atoms';
import { GlobalCallManager } from '@/components/organisms';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { useThemeStore } from '@/store/themeStore';
import { InAppNotificationBanner } from '@/components/molecules/InAppNotificationBanner';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { useTheme } from '@/hooks/useTheme';
import { onSessionCleared } from '@/lib/authSession';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: Platform.OS === 'web' ? 0 : 450,
  fade: true,
});

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapLanguage = useLanguageStore((s) => s.bootstrap);
  const bootstrapRegistrationRole = useRegistrationRoleStore((s) => s.bootstrap);
  const bootstrapTheme = useThemeStore((s) => s.bootstrap);
  const languageReady = useLanguageStore((s) => s.ready);
  const registrationRoleReady = useRegistrationRoleStore((s) => s.ready);
  const themeReady = useThemeStore((s) => s.ready);
  const authStatus = useAuthStore((s) => s.status);
  const theme = useTheme();
  const [splashReleased, setSplashReleased] = useState(false);

  useSessionRefresh();
  usePresenceHeartbeat();
  useRealtimeConnection();

  useEffect(() => {
    return onSessionCleared(() => {
      useAuthStore.getState().handleSessionExpired();
    });
  }, []);

  useEffect(() => {
    void Promise.all([bootstrapLanguage(), bootstrap(), bootstrapRegistrationRole(), bootstrapTheme()]);
  }, [bootstrap, bootstrapLanguage, bootstrapRegistrationRole, bootstrapTheme]);

  useEffect(() => {
    const bootstrapsReady = languageReady && registrationRoleReady && themeReady;
    const authReady = authStatus !== 'loading';
    if (bootstrapsReady && authReady) {
      void SplashScreen.hideAsync().finally(() => setSplashReleased(true));
      return;
    }

    const fallback = setTimeout(() => {
      void SplashScreen.hideAsync().finally(() => setSplashReleased(true));
    }, 5000);

    return () => clearTimeout(fallback);
  }, [languageReady, registrationRoleReady, themeReady, authStatus]);

  if (!splashReleased && (!languageReady || !registrationRoleReady || !themeReady || authStatus === 'loading')) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Spinner fullscreen />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={theme.isDark || theme.colors.background === '#07111F' ? 'light' : 'dark'} />
        {authStatus === 'authenticated' ? <InAppNotificationBanner /> : null}
        {authStatus === 'authenticated' ? <GlobalCallManager /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: Platform.OS === 'web' ? 'fade' : 'default',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="client" />
          <Stack.Screen name="professional" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="super-admin" />
          <Stack.Screen
            name="shared"
            options={{
              presentation: 'card',
              animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
