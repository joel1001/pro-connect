import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { AuthLegalFooter, ErrorBanner } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { getApiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/theme';

export default function Login() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ redirectTo?: string | string[] }>();
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      const redirectTo = Array.isArray(params.redirectTo) ? params.redirectTo[0] : params.redirectTo;
      router.replace((redirectTo || '/') as never);
    } catch (e) {
      setError(getApiErrorMessage(e, t('login.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('login.title')} subtitle={t('login.subtitle')} showBack>
      <View style={{ gap: spacing.md }}>
        <Input
          label={t('login.identifier')}
          placeholder={t('login.identifierPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          iconLeft="person-outline"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <Input
          label={t('login.password')}
          placeholder="••••••••"
          secure
          iconLeft="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
        />
        <Link href="/(auth)/forgot-password" style={{ alignSelf: 'flex-end' }}>
          <Text variant="caption" color="primary">
            {t('login.forgot')}
          </Text>
        </Link>
        {error ? (
          <ErrorBanner
            message={error}
            retryLabel={t('common.retry')}
            onRetry={onSubmit}
            onDismiss={() => setError(null)}
          />
        ) : null}
        <Button label={t('common.login')} loading={loading} onPress={onSubmit} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text variant="caption" color="textSecondary">
          {t('login.noAccount')}
        </Text>
        <Link href="/(auth)/role-select">
          <Text variant="caption" color="primary">
            {t('login.register')}
          </Text>
        </Link>
      </View>
      <AuthLegalFooter termsLabel={t('profile.terms')} />
    </AuthLayout>
  );
}
