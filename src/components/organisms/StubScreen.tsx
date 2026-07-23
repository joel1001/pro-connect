import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon, IconName, ScreenContainer, Text } from '@/components/atoms';
import { SectionHeader } from '@/components/molecules';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export interface StubScreenProps {
  title: string;
  subtitle?: string;
  icon: IconName;
  accent?: string;
  /** Bullet list of features planned for this screen (from the UI designs). */
  planned?: string[];
}

/**
 * Reusable placeholder for screens that are scaffolded but not yet implemented.
 * Keeps navigation fully functional while we fill each view to match the designs.
 */
export function StubScreen({ title, subtitle, icon, accent, planned }: StubScreenProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const color = theme.colors.primary;

  return (
    <ScreenContainer>
      <SectionHeader title={title} subtitle={subtitle} />

      <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: `${color}1A`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={34} color={color} />
        </View>
        <Badge label={t('stub.underConstruction')} tone="warning" icon="construct-outline" />
        <Text variant="caption" color="textSecondary" center style={{ maxWidth: 360 }}>
          {t('stub.routedReady')}
        </Text>
      </Card>

      {planned && planned.length > 0 && (
        <Card style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">{t('stub.plannedContent')}</Text>
          {planned.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Icon name="ellipse" size={7} color={color} />
              <Text variant="body" color="textSecondary" style={{ flex: 1 }}>
                {item}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScreenContainer>
  );
}
