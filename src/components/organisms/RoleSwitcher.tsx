import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Card, Icon, Text } from '@/components/atoms';
import { getRoleConfig, ROLE_ORDER, roleHome } from '@/config/roles';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { spacing } from '@/theme';
import { UserRole } from '@/types';

/**
 * Lets a multi-role account switch the active template. Only the roles the
 * account actually has are shown. A dev preview button can unlock all four
 * templates when testing without a multi-role backend account.
 */
export function RoleSwitcher() {
  const theme = useTheme();
  const color = theme.colors.primary;
  const { t } = useTranslation();
  const { availableRoles, activeRole, setActiveRole, enableAllRolesPreview } = useAuthStore();

  const onSelect = async (role: UserRole) => {
    await setActiveRole(role);
    router.replace(roleHome(role) as never);
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">{t('profile.changeRole')}</Text>
        <Badge label={`${availableRoles.length} ${t('common.available')}`} tone="primary" />
      </View>

      <View style={{ gap: spacing.sm }}>
        {availableRoles.map((role) => {
          const cfg = getRoleConfig(role);
          const active = role === activeRole;
          return (
            <Pressable
              key={role}
              onPress={() => onSelect(role)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: active ? color : theme.colors.border,
                backgroundColor: active ? theme.colors.primarySurface : theme.colors.surface,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: theme.colors.primarySurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={cfg.icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{t(cfg.label)}</Text>
                <Text variant="caption" color="textSecondary">
                  {t(cfg.description)}
                </Text>
              </View>
              {active && <Icon name="checkmark-circle" size={22} color={color} />}
            </Pressable>
          );
        })}
      </View>

      {availableRoles.length < ROLE_ORDER.length && (
        <Pressable onPress={enableAllRolesPreview} hitSlop={6} style={{ alignSelf: 'flex-start' }}>
          <Text variant="caption" color="primary">
            {t('profile.previewAll')}
          </Text>
        </Pressable>
      )}
    </Card>
  );
}
