import { Link } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/atoms';
import { spacing } from '@/theme';

type Props = {
  termsLabel: string;
  privacyLabel?: string;
};

export function AuthLegalFooter({ termsLabel, privacyLabel }: Props) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
      <Link href="/shared/terms">
        <Text variant="caption" color="primary">
          {termsLabel}
        </Text>
      </Link>
      {privacyLabel ? (
        <Text variant="caption" color="textMuted">
          {privacyLabel}
        </Text>
      ) : null}
    </View>
  );
}
