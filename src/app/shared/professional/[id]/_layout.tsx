import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function ProfessionalProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="section" options={{ headerShown: false }} />
    </Stack>
  );
}
