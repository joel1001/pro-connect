import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { AuthLayout } from '@/components/templates';
import { authApi } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/client';
import { spacing } from '@/theme';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: email.trim() },
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('forgot.title')} subtitle={t('forgot.subtitle')}>
      <View style={{ gap: spacing.md }}>
        <Input
          label={t('login.email')}
          placeholder="maria@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          iconLeft="mail-outline"
          value={email}
          onChangeText={setEmail}
        />
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Button label={t('forgot.submit')} loading={loading} onPress={onSubmit} />
        <Button label={t('forgot.backToLogin')} variant="ghost" onPress={() => router.back()} />
      </View>
    </AuthLayout>
  );
}
