import { View } from 'react-native';

import { Badge, Card, Icon, ScreenContainer, Text } from '@/components/atoms';
import { ListRow, SectionHeader } from '@/components/molecules';
import { moduleByKey } from '@/config/adminModules';
import { useTheme } from '@/hooks/useTheme';
import { roleAccent, spacing } from '@/theme';
import { UserRole } from '@/types';
import { useTranslation } from 'react-i18next';

export function AdminModuleScreen({ moduleKey, role }: { moduleKey: string; role: Extract<UserRole, 'ADMIN' | 'SUPER_ADMIN'> }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accent = role === 'SUPER_ADMIN' ? roleAccent.superAdmin : roleAccent.admin;
  const module = moduleByKey(moduleKey);

  if (!module) {
    return (
      <ScreenContainer>
        <SectionHeader title={t('admin.moduleUnavailable')} />
      </ScreenContainer>
    );
  }

  const canAccess = module.roles.includes(role);
  const superAdminOnly = module.roles.length === 1 && module.roles[0] === 'SUPER_ADMIN';

  return (
    <ScreenContainer style={{ gap: spacing.lg }}>
      <SectionHeader title={t(module.titleKey)} subtitle={t(module.descriptionKey)} />

      <Card style={{ gap: spacing.md, borderColor: `${accent}24`, backgroundColor: theme.colors.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              backgroundColor: `${accent}14`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={module.icon} color={accent} size={25} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="title">{t(module.titleKey)}</Text>
            <Text variant="caption" color="textSecondary">
              {canAccess ? t('admin.moduleReady') : t('admin.moduleRestricted')}
            </Text>
          </View>
          <Badge label={superAdminOnly ? t('admin.superAdminOnly') : t('admin.permissionBased')} tone={superAdminOnly ? 'warning' : 'info'} />
        </View>
      </Card>

      <SectionHeader title={t('admin.permissions')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        {module.permissions.map((permission) => (
          <ListRow
            key={permission}
            title={permission}
            subtitle={t(`admin.permissionDescriptions.${permission}`)}
            icon="key-outline"
            accent={accent}
            right={<Badge label={canAccess ? t('admin.allowed') : t('admin.requiresApproval')} tone={canAccess ? 'success' : 'warning'} />}
          />
        ))}
      </Card>

      <SectionHeader title={t('admin.workflow')} />
      <Card padded={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xs }}>
        <ListRow title={t('admin.workflowSteps.reason')} subtitle={t('admin.workflowSteps.reasonHint')} icon="document-text-outline" accent={accent} />
        <ListRow title={t('admin.workflowSteps.audit')} subtitle={t('admin.workflowSteps.auditHint')} icon="reader-outline" accent={accent} />
        <ListRow
          title={module.critical ? t('admin.workflowSteps.superApproval') : t('admin.workflowSteps.adminAction')}
          subtitle={module.critical ? t('admin.workflowSteps.superApprovalHint') : t('admin.workflowSteps.adminActionHint')}
          icon={module.critical ? 'shield-checkmark-outline' : 'checkmark-circle-outline'}
          accent={accent}
        />
      </Card>
    </ScreenContainer>
  );
}
