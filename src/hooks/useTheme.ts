import { useColorScheme } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useRegistrationRoleStore } from '@/store/registrationRoleStore';
import { useThemeStore } from '@/store/themeStore';
import { darkTheme, lightTheme, Theme } from '@/theme';
import { applyAppThemePalette } from '@/theme/palettes';
import { colorsForRole } from '@/theme/roleColors';

/**
 * Active theme driven by role:
 * - Logged in → activeRole (Cliente / Profesional / Admin / Super Admin)
 * - Registro → rol elegido en role-select (persiste en el flujo auth)
 * - Antes de elegir rol → verde marca ProConnect
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const activeRole = useAuthStore((s) => s.activeRole);
  const registrationRole = useRegistrationRoleStore((s) => s.role);
  const palette = useThemeStore((s) => s.palette);

  const base = isDark ? darkTheme : lightTheme;
  const role = activeRole ?? registrationRole;
  const roleColors = colorsForRole(role, isDark);
  return { ...base, colors: applyAppThemePalette(roleColors, palette, isDark) };
}

export function useRoleAccentColor(): string {
  return useTheme().colors.primary;
}
