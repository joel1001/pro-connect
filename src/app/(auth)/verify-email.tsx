import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { AuthLayout } from '@/components/templates';
import { authApi } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/client';
import { spacing } from '@/theme';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyEmail(email, code.trim());
      router.replace('/(auth)/register-address' as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('verify.invalid')));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) return;
    setInfo(null);
    setError(null);
    try {
      await authApi.resendCode(email);
      setInfo(t('verify.resent'));
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  };

  return (
    <AuthLayout title={t('verify.title')} subtitle={t('verify.subtitle', { email: email ?? '—' })}>
      <View style={{ gap: spacing.md }}>
        <Input
          label={t('verify.code')}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          iconLeft="keypad-outline"
          value={code}
          onChangeText={setCode}
        />
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        {info && (
          <Text variant="caption" color="success">
            {info}
          </Text>
        )}
        <Button label={t('verify.verify')} loading={loading} onPress={onVerify} />
        <Button label={t('verify.resend')} variant="ghost" onPress={onResend} />
      </View>
    </AuthLayout>
  );
}
