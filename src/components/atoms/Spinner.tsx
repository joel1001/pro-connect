import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function Spinner({ fullscreen }: { fullscreen?: boolean }) {
  const theme = useTheme();
  if (fullscreen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return <ActivityIndicator color={theme.colors.primary} />;
}
