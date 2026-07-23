import { View } from 'react-native';

import { Text } from '@/components/atoms';
import { spacing } from '@/theme';

type Props = {
  current: number;
  total: number;
  label?: string;
};

export function ProgressBar({ current, total, label }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      )}
      <View style={{ height: 8, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: 999 }} />
      </View>
    </View>
  );
}
