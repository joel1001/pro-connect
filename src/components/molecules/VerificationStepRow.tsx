import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, IconName, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

export type VerificationStepStatus = 'pending' | 'done' | 'skipped';

type Props = {
  icon: IconName;
  label: string;
  status: VerificationStepStatus;
  optional?: boolean;
  onPress?: () => void;
};

export function VerificationStepRow({ icon, label, status, optional, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const statusIcon =
    status === 'done'
      ? { name: 'checkmark-circle' as const, color: theme.colors.success ?? '#16A34A' }
      : status === 'skipped'
        ? { name: 'play-skip-forward' as const, color: theme.colors.textMuted }
        : { name: 'ellipse-outline' as const, color: '#CBD5E1' };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#F1F5F3',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={18} color="#334155" />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {optional ? (
          <Text variant="caption" color="textMuted">
            {status === 'skipped' ? t('registerFlow.stepSkipped') : t('registerFlow.stepOptional')}
          </Text>
        ) : null}
      </View>
      <Icon name={statusIcon.name} size={22} color={statusIcon.color} />
    </Pressable>
  );
}

export function credentialStepStatus(done?: boolean, skipped?: boolean): VerificationStepStatus {
  if (done) return 'done';
  if (skipped) return 'skipped';
  return 'pending';
}
