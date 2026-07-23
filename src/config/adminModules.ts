import { IconName } from '@/components/atoms';
import { UserRole } from '@/types';

export type AdminPermission =
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.suspend'
  | 'users.block'
  | 'users.ban'
  | 'users.delete'
  | 'professionals.verify'
  | 'support.manage'
  | 'disputes.manage'
  | 'payments.view'
  | 'refunds.review'
  | 'refunds.approve'
  | 'admins.manage'
  | 'settings.manage'
  | 'audit.view';

export interface AdminModule {
  key: string;
  route: string;
  titleKey: string;
  descriptionKey: string;
  icon: IconName;
  permissions: AdminPermission[];
  roles: UserRole[];
  critical?: boolean;
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    key: 'users',
    route: '/admin/users',
    titleKey: 'admin.modules.users.title',
    descriptionKey: 'admin.modules.users.description',
    icon: 'people-outline',
    permissions: ['users.view', 'users.create', 'users.edit', 'users.suspend', 'users.block', 'users.ban', 'users.delete'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'professionals',
    route: '/admin/professionals',
    titleKey: 'admin.modules.professionals.title',
    descriptionKey: 'admin.modules.professionals.description',
    icon: 'briefcase-outline',
    permissions: ['professionals.verify'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'payments',
    route: '/admin/payments',
    titleKey: 'admin.modules.payments.title',
    descriptionKey: 'admin.modules.payments.description',
    icon: 'card-outline',
    permissions: ['payments.view'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'refunds',
    route: '/admin/refunds',
    titleKey: 'admin.modules.refunds.title',
    descriptionKey: 'admin.modules.refunds.description',
    icon: 'return-down-back-outline',
    permissions: ['refunds.review'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'support',
    route: '/admin/support',
    titleKey: 'admin.modules.support.title',
    descriptionKey: 'admin.modules.support.description',
    icon: 'headset-outline',
    permissions: ['support.manage'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'disputes',
    route: '/admin/disputes',
    titleKey: 'admin.modules.disputes.title',
    descriptionKey: 'admin.modules.disputes.description',
    icon: 'alert-circle-outline',
    permissions: ['disputes.manage'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'verifications',
    route: '/admin/verifications',
    titleKey: 'admin.modules.verifications.title',
    descriptionKey: 'admin.modules.verifications.description',
    icon: 'checkmark-done-outline',
    permissions: ['professionals.verify'],
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    key: 'admins',
    route: '/super-admin/admins',
    titleKey: 'admin.modules.admins.title',
    descriptionKey: 'admin.modules.admins.description',
    icon: 'shield-outline',
    permissions: ['admins.manage'],
    roles: ['SUPER_ADMIN'],
    critical: true,
  },
  {
    key: 'audit',
    route: '/super-admin/audit',
    titleKey: 'admin.modules.audit.title',
    descriptionKey: 'admin.modules.audit.description',
    icon: 'reader-outline',
    permissions: ['audit.view'],
    roles: ['SUPER_ADMIN'],
    critical: true,
  },
  {
    key: 'settings',
    route: '/super-admin/settings',
    titleKey: 'admin.modules.settings.title',
    descriptionKey: 'admin.modules.settings.description',
    icon: 'settings-outline',
    permissions: ['settings.manage'],
    roles: ['SUPER_ADMIN'],
    critical: true,
  },
];

export function modulesForRole(role: UserRole) {
  return ADMIN_MODULES.filter((module) => module.roles.includes(role));
}

export function moduleByKey(key: string) {
  return ADMIN_MODULES.find((module) => module.key === key);
}
