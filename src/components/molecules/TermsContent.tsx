import { View } from 'react-native';

import { Spinner, Text } from '@/components/atoms';
import { TermsSection } from '@/api/terms.api';
import { spacing } from '@/theme';

type Props = {
  sections: TermsSection[];
  version?: string;
  effectiveLabel?: string;
};

export function TermsContent({ sections, version, effectiveLabel }: Props) {
  return (
    <View style={{ gap: spacing.lg }}>
      {version ? (
        <Text variant="caption" color="textSecondary">
          {effectiveLabel ?? 'Version'}: {version}
        </Text>
      ) : null}
      {sections.map((section) => (
        <View key={section.id} style={{ gap: spacing.xs }}>
          <Text variant="bodyStrong">{section.title}</Text>
          <Text variant="body" color="textSecondary" style={{ lineHeight: 22 }}>
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function TermsLoading() {
  return <Spinner />;
}
