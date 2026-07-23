import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/atoms';
import { RoleCard } from '@/components/molecules';
import { AuthLayout } from '@/components/templates';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { roleAccent, spacing } from '@/theme';

type RegisterRole = 'CLIENT' | 'PROFESSIONAL';

export default function RoleSelect() {
  const { t } = useTranslation();
  const setRegistrationRole = useRegistrationRoleStore((s) => s.setRole);
  const [role, setRole] = useState<RegisterRole>('CLIENT');

  useEffect(() => {
    void setRegistrationRole('CLIENT');
  }, [setRegistrationRole]);

  const pickRole = (next: RegisterRole) => {
    setRole(next);
    void setRegistrationRole(next);
  };

  const next = () => {
    void setRegistrationRole(role);
    if (role === 'PROFESSIONAL') router.push('/(auth)/register-professional');
    else router.push({ pathname: '/(auth)/register', params: { role } });
  };

  return (
    <AuthLayout title={t('roleSelect.title')} subtitle={t('roleSelect.subtitle')}>
      <View style={{ gap: spacing.md }}>
        <RoleCard
          title={t('roleSelect.clientTitle')}
          description={t('roleSelect.clientDesc')}
          icon="search-outline"
          accent={roleAccent.client}
          selected={role === 'CLIENT'}
          onPress={() => pickRole('CLIENT')}
        />
        <RoleCard
          title={t('roleSelect.proTitle')}
          description={t('roleSelect.proDesc')}
          icon="briefcase-outline"
          accent={roleAccent.professional}
          selected={role === 'PROFESSIONAL'}
          onPress={() => pickRole('PROFESSIONAL')}
        />
      </View>
      <Button label={t('common.continue')} iconRight="arrow-forward" onPress={next} />
    </AuthLayout>
  );
}
