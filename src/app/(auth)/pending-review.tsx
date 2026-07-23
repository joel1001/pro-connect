import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Card, Icon, ScreenContainer, Text } from '@/components/atoms';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { spacing } from '@/theme';
import { UserRole } from '@/types';

function dashboardRouteFor(role: UserRole | null): '/client' | '/professional' {
  return role === 'CLIENT' ? '/client' : '/professional';
}

export default function PendingReview() {
  const { t } = useTranslation();
  const theme = useTheme();
  const activeRole = useAuthStore((s) => s.activeRole);
  const registrationRole = useRegistrationRoleStore((s) => s.role);
  const role = activeRole ?? registrationRole;
  const dashboardRoute = dashboardRouteFor(role);

  return (
    <ScreenContainer scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xl }}>
        <Card style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="checkmark" size={40} color={theme.colors.onPrimary} />
          </View>
          <Text variant="title" center>
            {t('screens.profileUnderReview')}
          </Text>
          <Text variant="body" center color="textSecondary">
            {t('screens.reviewEta')}
          </Text>
        </Card>
        <Button
          label={t('screens.goDashboard')}
          onPress={() => router.replace(dashboardRoute as never)}
        />
        <Button
          label={t('screens.exitApp')}
          variant="ghost"
          onPress={() => router.replace('/(auth)/login' as never)}
        />
      </View>
    </ScreenContainer>
  );
}
