import { View } from 'react-native';

import { Button, Text } from '@/components/atoms';
import { spacing } from '@/theme';

type Props = {
  hint: string;
  onContinue: () => void;
  onSkip: () => void;
  continueLabel: string;
  skipLabel: string;
  loading?: boolean;
  continueDisabled?: boolean;
};

/** Footer actions for optional credential steps (recommended, not required). */
export function CredentialStepActions({
  hint,
  onContinue,
  onSkip,
  continueLabel,
  skipLabel,
  loading,
  continueDisabled,
}: Props) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color="textMuted" center>
        {hint}
      </Text>
      <Button label={continueLabel} loading={loading} disabled={continueDisabled} onPress={onContinue} />
      <Button label={skipLabel} variant="ghost" disabled={loading} onPress={onSkip} />
    </View>
  );
}
