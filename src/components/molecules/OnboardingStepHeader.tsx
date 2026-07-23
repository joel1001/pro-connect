import { View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { spacing } from '@/theme';

type Props = {
  step: number;
  total?: number;
  title: string;
  badge?: string;
};

export function OnboardingStepHeader({ step, total, title, badge }: Props) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#16A34A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" weight="700" style={{ color: '#fff' }}>
            {step}
          </Text>
        </View>
        <Text variant="bodyStrong">{title}</Text>
        {total != null && (
          <Text variant="caption" color="textMuted" style={{ marginLeft: 'auto' }}>
            {step}/{total}
          </Text>
        )}
      </View>
      {badge ? (
        <Text variant="caption" color="textMuted">
          {badge}
        </Text>
      ) : null}
    </View>
  );
}
