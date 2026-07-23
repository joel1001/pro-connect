import { AppColors, darkColors, lightColors, palette } from './colors';
import { UserRole } from '@/types';

/** Design-board role palettes (Cliente=verde, Profesional=azul, Admin=naranja, Super Admin=morado). */
export type RoleKey = 'client' | 'professional' | 'admin' | 'superAdmin';

export interface RoleColorScale {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySurface: string;
}

export const roleColorScale: Record<RoleKey, RoleColorScale> = {
  client: {
    primary: '#28B463',
    primaryDark: '#1E8449',
    primaryLight: '#D5F5E3',
    primarySurface: '#E9FBF0',
  },
  professional: {
    primary: '#2E86C1',
    primaryDark: '#21618C',
    primaryLight: '#D6EAF8',
    primarySurface: '#EBF5FB',
  },
  admin: {
    primary: '#F39C12',
    primaryDark: '#D68910',
    primaryLight: '#FDEBD0',
    primarySurface: '#FEF5E7',
  },
  superAdmin: {
    primary: '#8E44AD',
    primaryDark: '#6C3483',
    primaryLight: '#E8DAEF',
    primarySurface: '#F4ECF7',
  },
};

export const roleAccent: Record<RoleKey, string> = {
  client: roleColorScale.client.primary,
  professional: roleColorScale.professional.primary,
  admin: roleColorScale.admin.primary,
  superAdmin: roleColorScale.superAdmin.primary,
};

export type RegistrationRole = 'CLIENT' | 'PROFESSIONAL';

export function userRoleToKey(role: UserRole | RegistrationRole): RoleKey {
  switch (role) {
    case 'CLIENT':
      return 'client';
    case 'PROFESSIONAL':
      return 'professional';
    case 'ADMIN':
      return 'admin';
    case 'SUPER_ADMIN':
      return 'superAdmin';
    default:
      return 'client';
  }
}

export function applyRoleColors(base: AppColors, roleKey: RoleKey): AppColors {
  const scale = roleColorScale[roleKey];
  return {
    ...base,
    primary: scale.primary,
    primaryDark: scale.primaryDark,
    primaryLight: scale.primaryLight,
    primarySurface: scale.primarySurface,
  };
}

/** Default brand theme (onboarding / login before role is chosen). */
export function defaultBrandColors(isDark: boolean): AppColors {
  const base = isDark ? darkColors : lightColors;
  return {
    ...base,
    primary: palette.green500,
    primaryDark: palette.green600,
    primaryLight: palette.green100,
    primarySurface: palette.green50,
  };
}

export function colorsForRole(role: UserRole | RegistrationRole | null, isDark: boolean): AppColors {
  const base = isDark ? darkColors : lightColors;
  if (!role) return defaultBrandColors(isDark);
  return applyRoleColors(base, userRoleToKey(role));
}
