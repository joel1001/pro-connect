import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';
import type { IdentityDocumentData } from '@/api/onboarding.api';

type Props = {
  data: IdentityDocumentData;
  provider?: string;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="caption" weight="600" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export function IdentityDataCard({ data, provider }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View
      style={{
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        backgroundColor: '#F0FDF4',
      }}
    >
      <Text variant="caption" weight="700" color="success">
        {t('registerFlow.idDataExtracted', { provider: provider ?? 'OCR' })}
      </Text>
      <Row label={t('registerFlow.idFieldFullName')} value={data.fullName} />
      <Row label={t('registerFlow.idFieldNumber')} value={data.idNumber} />
      <Row label={t('registerFlow.idFieldBirthDate')} value={data.birthDate} />
      <Row label={t('registerFlow.idFieldExpiryDate')} value={data.expiryDate} />
      <Row label={t('registerFlow.idFieldNationality')} value={data.nationality} />
      <Row label={t('registerFlow.idFieldType')} value={data.documentType} />
    </View>
  );
}
