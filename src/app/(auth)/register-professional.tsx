import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Button, Card, Icon, Input, Text } from '@/components/atoms';
import { AuthLegalFooter, PasswordRulesHint } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { termsApi } from '@/api/terms.api';
import { getApiErrorMessage } from '@/api/client';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { useAuthStore } from '@/store/authStore';
import { isPasswordPolicyMet } from '@/utils/passwordPolicy';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme';

const stepKeys = [
  'registerPro.step1',
  'registerPro.step2',
  'registerPro.step3',
  'registerPro.step4',
  'registerPro.step5',
  'registerPro.step6',
  'registerPro.step7',
  'registerPro.step8',
];

export default function RegisterProfessional() {
  const { t } = useTranslation();
  const theme = useTheme();
  const register = useAuthStore((s) => s.register);
  const setRegistrationRole = useRegistrationRoleStore((s) => s.setRole);

  useEffect(() => {
    void setRegistrationRole('PROFESSIONAL');
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
        role: 'PROFESSIONAL',
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
    <AuthLayout title={t('registerPro.title')} subtitle={t('registerPro.subtitle')}>
      <View style={{ gap: spacing.md }}>
        <Input label={t('register.email')} placeholder="juan@example.com" autoCapitalize="none" keyboardType="email-address" iconLeft="mail-outline" value={email} onChangeText={setEmail} />
        <Input label={t('register.phone')} placeholder="+506 7000 9999" keyboardType="phone-pad" iconLeft="call-outline" value={phone} onChangeText={setPhone} />
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
              borderColor: termsAccepted ? theme.colors.primary : theme.colors.border,
              backgroundColor: termsAccepted ? theme.colors.primary : 'transparent',
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

      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="bodyStrong">{t('registerPro.verificationTitle')}</Text>
          <Badge label={t('registerPro.stepsBadge')} tone="info" />
        </View>
        {stepKeys.map((step) => (
          <View key={step} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="ellipse-outline" size={14} color={theme.colors.primary} />
            <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
              {t(step)}
            </Text>
          </View>
        ))}
      </Card>
      <AuthLegalFooter termsLabel={t('profile.terms')} />
    </AuthLayout>
  );
}
