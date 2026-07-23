import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export function Divider({ vertical }: { vertical?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: theme.colors.border }
          : { height: 1, alignSelf: 'stretch', backgroundColor: theme.colors.border, marginVertical: spacing.sm }
      }
    />
  );
}
