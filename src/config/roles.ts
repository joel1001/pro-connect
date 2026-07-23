import { IconName } from '@/components/atoms';
import { palette, roleAccent } from '@/theme';
import { UserRole } from '@/types';

export interface NavItem {
  /** expo-router href relative to the role group, e.g. "/client/contracts" */
  href: string;
  label: string;
  icon: IconName;
  /** Extra routes that should highlight this tab (e.g. hub screens). */
  activePrefixes?: string[];
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  accent: string;
  icon: IconName;
  /** Route group segment used by expo-router, e.g. "(client)". */
  group: string;
  /** Full navigation (sidebar on desktop). */
  nav: NavItem[];
  /** Bottom tabs on mobile; defaults to `nav` when omitted. */
  tabNav?: NavItem[];
}

export const ROLE_ORDER: UserRole[] = ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];

/** Professional sections in Profile on mobile (removed from bottom tabs). */
export const PROFESSIONAL_PROFILE_LINKS: NavItem[] = [
  { href: '/professional/emergency-hire', label: 'nav.emergencyHire', icon: 'flash-outline' },
  { href: '/shared/settings?section=services', label: 'nav.services', icon: 'construct-outline' },
  { href: '/professional/finances', label: 'nav.finances', icon: 'wallet-outline' },
  { href: '/professional/reviews', label: 'nav.reviews', icon: 'star-outline' },
];

/** Client sections shown inside Profile on mobile. */
export const CLIENT_PROFILE_LINKS: NavItem[] = [];

/**
 * `label`/`description`/nav `label` hold i18n keys (resolved with t() at render
 * time) so navigation and role metadata stay translatable.
 */
export const roleConfig: Record<UserRole, RoleConfig> = {
  CLIENT: {
    role: 'CLIENT',
    label: 'roles.clientLabel',
    description: 'roles.clientDesc',
    accent: roleAccent.client,
    icon: 'search-outline',
    group: 'client',
    nav: [
      { href: '/client', label: 'nav.explore', icon: 'map-outline' },
      { href: '/client/notifications', label: 'nav.notifications', icon: 'notifications-outline' },
      { href: '/client/list', label: 'nav.lists', icon: 'list-outline' },
      { href: '/client/contracts?filter=active', label: 'nav.contracts', icon: 'document-text-outline' },
      { href: '/client/messages', label: 'nav.messages', icon: 'chatbubbles-outline' },
      { href: '/client/profile', label: 'nav.profile', icon: 'person-outline' },
    ],
    tabNav: [
      { href: '/client', label: 'nav.explore', icon: 'map-outline' },
      { href: '/client/list', label: 'nav.lists', icon: 'list-outline' },
      { href: '/client/messages', label: 'nav.messages', icon: 'chatbubbles-outline' },
      { href: '/client/contracts?filter=active', label: 'nav.contracts', icon: 'document-text-outline' },
      { href: '/client/notifications', label: 'nav.notifications', icon: 'notifications-outline' },
      {
        href: '/client/profile',
        label: 'nav.profile',
        icon: 'person-outline',
        activePrefixes: CLIENT_PROFILE_LINKS.map((item) => item.href),
      },
    ],
  },
  PROFESSIONAL: {
    role: 'PROFESSIONAL',
    label: 'roles.professionalLabel',
    description: 'roles.professionalDesc',
    accent: roleAccent.professional,
    icon: 'briefcase-outline',
    group: 'professional',
    nav: [
      { href: '/professional', label: 'nav.home', icon: 'grid-outline' },
      { href: '/professional/notifications', label: 'nav.notifications', icon: 'notifications-outline' },
      { href: '/professional/services', label: 'nav.services', icon: 'construct-outline' },
      { href: '/professional/agenda', label: 'nav.agenda', icon: 'calendar-outline' },
      { href: '/professional/messages', label: 'nav.messages', icon: 'chatbubbles-outline' },
      { href: '/professional/contracts?filter=active', label: 'nav.contracts', icon: 'document-text-outline' },
      { href: '/professional/finances', label: 'nav.finances', icon: 'wallet-outline' },
      { href: '/professional/reviews', label: 'nav.reviews', icon: 'star-outline' },
      { href: '/professional/profile', label: 'nav.profile', icon: 'person-outline' },
    ],
    tabNav: [
      { href: '/professional', label: 'nav.home', icon: 'grid-outline' },
      { href: '/professional/messages', label: 'nav.messages', icon: 'chatbubbles-outline' },
      { href: '/professional/agenda', label: 'nav.agenda', icon: 'calendar-outline' },
      { href: '/professional/contracts?filter=active', label: 'nav.contracts', icon: 'document-text-outline' },
      { href: '/professional/notifications', label: 'nav.notifications', icon: 'notifications-outline' },
      {
        href: '/professional/profile',
        label: 'nav.profile',
        icon: 'person-outline',
        activePrefixes: [
          ...PROFESSIONAL_PROFILE_LINKS.map((item) => item.href),
          '/professional/onboarding',
        ],
      },
    ],
  },
  ADMIN: {
    role: 'ADMIN',
    label: 'roles.adminLabel',
    description: 'roles.adminDesc',
    accent: roleAccent.admin,
    icon: 'shield-checkmark-outline',
    group: 'admin',
    nav: [
      { href: '/admin', label: 'nav.panel', icon: 'speedometer-outline' },
      { href: '/admin/users', label: 'nav.users', icon: 'people-outline' },
      { href: '/admin/professionals', label: 'nav.professionals', icon: 'briefcase-outline' },
      { href: '/admin/payments', label: 'nav.payments', icon: 'card-outline' },
      { href: '/admin/refunds', label: 'nav.refunds', icon: 'return-down-back-outline' },
      { href: '/admin/support', label: 'nav.support', icon: 'headset-outline' },
      { href: '/admin/disputes', label: 'nav.disputes', icon: 'alert-circle-outline' },
      { href: '/admin/verifications', label: 'nav.verifications', icon: 'checkmark-done-outline' },
      { href: '/admin/profile', label: 'nav.profile', icon: 'person-outline' },
    ],
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    label: 'roles.superAdminLabel',
    description: 'roles.superAdminDesc',
    accent: roleAccent.superAdmin,
    icon: 'planet-outline',
    group: 'super-admin',
    nav: [
      { href: '/super-admin', label: 'nav.panel', icon: 'speedometer-outline' },
      { href: '/super-admin/users', label: 'nav.users', icon: 'people-outline' },
      { href: '/super-admin/professionals', label: 'nav.professionals', icon: 'briefcase-outline' },
      { href: '/super-admin/payments', label: 'nav.payments', icon: 'card-outline' },
      { href: '/super-admin/refunds', label: 'nav.refunds', icon: 'return-down-back-outline' },
      { href: '/super-admin/support', label: 'nav.support', icon: 'headset-outline' },
      { href: '/super-admin/disputes', label: 'nav.disputes', icon: 'alert-circle-outline' },
      { href: '/super-admin/verifications', label: 'nav.verifications', icon: 'checkmark-done-outline' },
      { href: '/super-admin/admins', label: 'nav.admins', icon: 'shield-outline' },
      { href: '/super-admin/audit', label: 'nav.audit', icon: 'reader-outline' },
      { href: '/super-admin/settings', label: 'nav.settings', icon: 'settings-outline' },
      { href: '/super-admin/commissions', label: 'nav.commissions', icon: 'cash-outline' },
      { href: '/super-admin/plans', label: 'nav.plans', icon: 'pricetags-outline' },
      { href: '/super-admin/categories', label: 'nav.categories', icon: 'list-outline' },
      { href: '/super-admin/profile', label: 'nav.profile', icon: 'person-outline' },
    ],
  },
};

export function getRoleConfig(role: UserRole): RoleConfig {
  return roleConfig[role];
}

export function getTabNav(role: UserRole): NavItem[] {
  const cfg = roleConfig[role];
  return cfg.tabNav ?? cfg.nav;
}

/** Home route for a given role (used after login / role switch). */
export function roleHome(role: UserRole): string {
  return roleConfig[role].nav[0].href;
}

/** Messages inbox route for roles that have one. */
export function roleMessagesRoute(role: UserRole): string | null {
  return roleConfig[role].nav.find((item) => item.label === 'nav.messages')?.href ?? null;
}

export const brandColor = palette.green500;
