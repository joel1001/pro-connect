import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Icon, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SectionHeader } from '@/components/molecules';
import { roleAccent, spacing } from '@/theme';

const CHECKLIST = [
  { key: 'id', label: 'Documento de identidad', done: true },
  { key: 'selfie', label: 'Selfie en vivo', done: true },
  { key: 'bio', label: 'Verificación biométrica', done: false },
  { key: 'title', label: 'Título profesional', done: true },
  { key: 'college', label: 'Colegio profesional', done: true },
  { key: 'linkedin', label: 'LinkedIn (opcional)', done: false },
];

export default function IdentityVerification() {
  const { t } = useTranslation();
  const accent = roleAccent.professional;
  const completed = CHECKLIST.filter((c) => c.done).length;
  const pct = Math.round((completed / CHECKLIST.length) * 100);

  return (
    <ScreenContainer scroll showBack>
      <SectionHeader title="Verificación de identidad" subtitle={`${pct}% completado`} />
      <Card style={{ gap: spacing.sm }}>
        <View style={{ height: 8, backgroundColor: '#E2E8E5', borderRadius: 4 }}>
          <View style={{ width: `${pct}%`, height: 8, backgroundColor: accent, borderRadius: 4 }} />
        </View>
        <Text variant="caption" color="textSecondary">{completed} de {CHECKLIST.length} pasos</Text>
      </Card>
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {CHECKLIST.map((item) => (
          <ListRow
            key={item.key}
            title={item.label}
            icon={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            accent={item.done ? accent : undefined}
            right={!item.done ? <Icon name="chevron-forward" size={18} color="#9AA8A1" /> : undefined}
            onPress={!item.done ? () => router.push('/shared/biometric' as never) : undefined}
          />
        ))}
      </Card>
      <Button label={t('screens.startVerification')} accentColor={accent} onPress={() => router.push('/professional/onboarding' as never)} />
    </ScreenContainer>
  );
}
