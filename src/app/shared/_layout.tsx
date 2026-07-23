import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function SharedLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: theme.colors.primary,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        headerBackTitle: t('common.back'),
        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="professionals" options={{ title: t('client.nearbyTitle') }} />
      <Stack.Screen name="professional/[id]" options={{ title: t('roles.professionalLabel'), headerShown: false }} />
      <Stack.Screen name="client/[id]/index" options={{ title: t('roles.clientLabel'), headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="notification/[id]" options={{ title: t('notifications.detailTitle'), headerShown: false }} />
      <Stack.Screen name="help-center" options={{ title: t('profile.helpCenter') }} />
      <Stack.Screen name="settings" options={{ title: t('profile.personalInfo') }} />
      <Stack.Screen name="payment-methods" options={{ title: t('profile.paymentMethods') }} />
      <Stack.Screen name="terms" options={{ title: t('profile.terms') }} />
      <Stack.Screen name="identity-verification" options={{ title: 'Verificación' }} />
      <Stack.Screen name="biometric" options={{ title: 'Biometría' }} />
    </Stack>
  );
}
