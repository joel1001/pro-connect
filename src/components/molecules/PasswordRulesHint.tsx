import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { getPasswordRuleChecks } from '@/utils/passwordPolicy';
import { spacing } from '@/theme';

type Props = {
  password: string;
};

type RuleState = 'pending' | 'ok' | 'fail';

function Rule({ state, label }: { state: RuleState; label: string }) {
  const theme = useTheme();

  if (state === 'pending') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="caption" color="textMuted" style={{ width: 16, textAlign: 'center' }}>
          –
        </Text>
        <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
          {label}
        </Text>
      </View>
    );
  }

  const passed = state === 'ok';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Icon
        name={passed ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={passed ? theme.colors.success : theme.colors.danger}
      />
      <Text variant="caption" color={passed ? 'success' : 'danger'} style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function ruleState(hasInput: boolean, ok: boolean): RuleState {
  if (!hasInput) return 'pending';
  return ok ? 'ok' : 'fail';
}

export function PasswordRulesHint({ password }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'register' });
  const checks = getPasswordRuleChecks(password);
  const hasInput = password.length > 0;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="caption" color="textSecondary">
        {t('passwordRulesTitle')}
      </Text>
      <Rule state={ruleState(hasInput, checks.minLength)} label={t('passwordRuleMinLength')} />
      <Rule state={ruleState(hasInput, checks.uppercase)} label={t('passwordRuleUppercase')} />
      <Rule state={ruleState(hasInput, checks.number)} label={t('passwordRuleNumber')} />
      <Rule state={ruleState(hasInput, checks.special)} label={t('passwordRuleSpecial')} />
    </View>
  );
}
