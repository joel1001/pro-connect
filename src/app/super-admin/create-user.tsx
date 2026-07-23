import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Card, Input, ScreenContainer, Text } from '@/components/atoms';
import { PasswordRulesHint, SectionHeader } from '@/components/molecules';
import { adminApi } from '@/api/admin.api';
import { getApiErrorMessage } from '@/api/client';
import { isPasswordPolicyMet } from '@/utils/passwordPolicy';
import { roleAccent, spacing } from '@/theme';
import { UserRole } from '@/types';

const ROLES: UserRole[] = ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];

export default function CreateUser() {
  const { t } = useTranslation();
  const accent = roleAccent.superAdmin;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!isPasswordPolicyMet(password)) {
      setError(t('register.passwordInvalid'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await adminApi.createUser({ email: email.trim(), phone: phone.trim(), password, role });
      router.back();
    } catch (e) {
      setError(getApiErrorMessage(e, t('register.error')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <SectionHeader title={t('screens.createUser')} subtitle="Crea usuarios de cualquier rol vía API /admin/users" />
      <Input label={t('screens.fullName')} placeholder="Juan Pérez" value={name} onChangeText={setName} iconLeft="person-outline" />
      <Input label={t('login.email')} placeholder="usuario@proconnect.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" iconLeft="mail-outline" />
      <Input label={t('register.phone')} placeholder="+506 7000 0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" iconLeft="call-outline" />
      <Input label={t('login.password')} placeholder={t('register.passwordHint')} value={password} onChangeText={setPassword} secure iconLeft="lock-closed-outline" />
      <PasswordRulesHint password={password} />

      <Text variant="bodyStrong">{t('screens.userRole')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {ROLES.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: role === r ? accent : '#E2E8E5',
              backgroundColor: role === r ? `${accent}14` : 'transparent',
            }}
          >
            <Text variant="caption" weight="600" style={{ color: role === r ? accent : undefined }}>{r.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>

      {error && (
        <Card style={{ backgroundColor: '#FEE2E2' }}>
          <Text variant="caption" color="danger">{error}</Text>
        </Card>
      )}

      <Button label={t('screens.save')} accentColor={accent} loading={loading} onPress={onSave} disabled={!email || !password || !phone} />
    </ScreenContainer>
  );
}
