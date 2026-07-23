import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Icon, ScreenContainer, Text } from '@/components/atoms';
import { roleAccent, spacing } from '@/theme';

export default function Biometric() {
  const { t } = useTranslation();
  const accent = roleAccent.professional;

  return (
    <ScreenContainer>
      <Card style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginVertical: spacing.xxl }}>
        <View style={{ width: 220, height: 220, borderRadius: 110, borderWidth: 3, borderColor: accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Icon name="person-outline" size={80} color={accent} />
        </View>
        <Text variant="title" center>Parpadea lentamente</Text>
        <Text variant="body" color="textSecondary" center>Mantén el rostro dentro del círculo con buena iluminación</Text>
        <Button label="Continuar" accentColor={accent} />
      </Card>
    </ScreenContainer>
  );
}
