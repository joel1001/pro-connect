import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { PasswordRulesHint } from '@/components/molecules/PasswordRulesHint';
import { AuthLayout } from '@/components/templates';
import { authApi } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/client';
import { isPasswordPolicyMet } from '@/utils/passwordPolicy';
import { spacing } from '@/theme';

export default function ResetPassword() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email) return;
    if (!isPasswordPolicyMet(password)) {
      setError(t('register.passwordInvalid'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authApi.resetPassword(email, code.trim(), password);
      router.replace('/(auth)/login');
    } catch (e) {
      setError(getApiErrorMessage(e, t('reset.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('reset.title')} subtitle={t('reset.subtitle', { email: email ?? '—' })}>
      <View style={{ gap: spacing.md }}>
        <Input label={t('reset.code')} placeholder="000000" keyboardType="number-pad" maxLength={6} iconLeft="keypad-outline" value={code} onChangeText={setCode} />
        <Input label={t('reset.newPassword')} placeholder={t('register.passwordHint')} secure iconLeft="lock-closed-outline" value={password} onChangeText={setPassword} />
        <PasswordRulesHint password={password} />
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Button label={t('reset.submit')} loading={loading} onPress={onSubmit} />
      </View>
    </AuthLayout>
  );
}
