import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon, Text } from '@/components/atoms';
import { spacing } from '@/theme';
import { urgentHireColors } from '@/theme/urgentHire';

export function EmergencyHireDisclaimer() {
  const { t } = useTranslation();

  return (
    <Card
      style={{
        backgroundColor: urgentHireColors.surface,
        borderWidth: 1,
        borderColor: urgentHireColors.border,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: urgentHireColors.iconBg,
            marginTop: 1,
          }}
        >
          <Icon name="alert-circle-outline" size={22} color={urgentHireColors.icon} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ color: urgentHireColors.body, lineHeight: 22 }}>
            {t('emergencyHire.disclaimerBody')}
          </Text>
        </View>
      </View>
    </Card>
  );
}
