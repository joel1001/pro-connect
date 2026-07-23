import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Input, Text } from '@/components/atoms';
import { AuthLegalFooter, PasswordRulesHint } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { termsApi } from '@/api/terms.api';
import { getApiErrorMessage } from '@/api/client';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { useAuthStore } from '@/store/authStore';
import { isPasswordPolicyMet } from '@/utils/passwordPolicy';
import { spacing } from '@/theme';
import { authApi } from '@/api/auth.api';

export default function Register() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role ?? 'CLIENT').toUpperCase();
  const register = useAuthStore((s) => s.register);
  const setRegistrationRole = useRegistrationRoleStore((s) => s.setRole);

  useEffect(() => {
    void setRegistrationRole('CLIENT');
  }, [setRegistrationRole]);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsVersion, setTermsVersion] = useState('2026.1');

  useEffect(() => {
    termsApi.current().then((doc) => setTermsVersion(doc.version)).catch(() => undefined);
  }, []);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
  
    const emailRegex =
      /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{0,62}[a-zA-Z0-9])?@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  
    if (!emailRegex.test(normalizedEmail)) {
      setError(null);
      return;
    }
  
    let cancelled = false;
  
    const timeout = setTimeout(async () => {
      try {
        const exists = await authApi.userExists(normalizedEmail);
  
        if (!cancelled) {
          setError(exists ? t('register.emailExists') : null);
        }
      } catch (error) {
        console.error('Error validating email existence:', error);
  
        if (!cancelled) {
          setError(t('common.unexpectedError'));
        }
      }
    }, 500);
  
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [email, t]);

  const passwordsMatch = password === confirmPassword;
  const passwordValid = isPasswordPolicyMet(password);
  const canSubmit = email.trim() && phone.trim() && passwordValid && passwordsMatch && termsAccepted;

  const onSubmit = async () => {
    if (!passwordValid) {
      setError(t('register.passwordInvalid'));
      return;
    }
    if (!passwordsMatch) {
      setError(t('register.passwordMismatch'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        acceptTerms: true,
        termsVersion,
      });
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: email.trim() },
      });
    } catch (e) {
      setError(getApiErrorMessage(e, t('register.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('register.title')} subtitle={t('register.subtitle')}>
      <View style={{ gap: spacing.md }}>
        <Input label={t('register.email')} placeholder="maria@example.com" autoCapitalize="none" keyboardType="email-address" iconLeft="mail-outline" value={email} onChangeText={setEmail} />
        <Input label={t('register.phone')} placeholder="+506 8888 1234" keyboardType="phone-pad" iconLeft="call-outline" value={phone} onChangeText={setPhone} />
        <Input label={t('register.password')} placeholder={t('register.passwordHint')} secure iconLeft="lock-closed-outline" value={password} onChangeText={setPassword} autoComplete="new-password" />
        <PasswordRulesHint password={password} />
        <Input
          label={t('register.confirmPassword')}
          placeholder={t('register.passwordHint')}
          secure
          iconLeft="lock-closed-outline"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={confirmPassword.length > 0 && !passwordsMatch ? t('register.passwordMismatch') : undefined}
          autoComplete="new-password"
        />
        {error && (
          <Text variant="caption" color="danger">
            {error}
          </Text>
        )}
        <Pressable
          onPress={() => setTermsAccepted((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: termsAccepted ? '#28B463' : '#ccc',
              backgroundColor: termsAccepted ? '#28B463' : 'transparent',
              marginTop: 2,
            }}
          />
          <Text variant="caption" color="textSecondary" style={{ flex: 1, lineHeight: 20 }}>
            {t('register.acceptTermsPrefix')}{' '}
            <Link href="/shared/terms">
              <Text variant="caption" color="primary">
                {t('profile.terms')}
              </Text>
            </Link>
          </Text>
        </Pressable>
        <Button label={t('common.continue')} loading={loading} disabled={!canSubmit} onPress={onSubmit} />
      </View>

      <AuthLegalFooter termsLabel={t('profile.terms')} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
        <Text variant="caption" color="textSecondary">
          {t('register.hasAccount')}
        </Text>
        <Link href="/(auth)/login">
          <Text variant="caption" color="primary">
            {t('register.login')}
          </Text>
        </Link>
      </View>
    </AuthLayout>
  );
}
