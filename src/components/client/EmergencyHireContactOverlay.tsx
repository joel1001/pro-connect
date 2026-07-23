import { ActivityIndicator, Modal, View } from 'react-native';

import { Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, shadow, spacing } from '@/theme';

export type EmergencyHireContactStep = 'publishing' | 'connecting' | 'messaging' | 'opening';

type Props = {
  visible: boolean;
  step: EmergencyHireContactStep;
  professionalName?: string;
  labels: Record<EmergencyHireContactStep, string>;
  hint?: string;
  accentColor: string;
};

export function EmergencyHireContactOverlay({
  visible,
  step,
  professionalName,
  labels,
  hint,
  accentColor,
}: Props) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: radius.lg,
            padding: spacing.xl,
            alignItems: 'center',
            gap: spacing.md,
            minWidth: 280,
            maxWidth: 340,
            ...shadow.md,
          }}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text variant="bodyStrong" center>
            {labels[step]}
          </Text>
          {professionalName ? (
            <Text variant="caption" color="textSecondary" center>
              {professionalName}
            </Text>
          ) : null}
          {hint ? (
            <Text variant="caption" color="textMuted" center style={{ lineHeight: 20 }}>
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
