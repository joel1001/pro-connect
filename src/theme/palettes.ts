import { AppColors, darkColors, lightColors } from './colors';

export type AppThemePaletteKey = 'role' | 'forest' | 'ocean' | 'sunset' | 'amethyst' | 'rose' | 'midnight';

export interface AppThemePalette {
  key: AppThemePaletteKey;
  labelKey: string;
  descriptionKey: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySurface: string;
  background?: string;
  surface?: string;
  surfaceAlt?: string;
  surfaceSunken?: string;
  border?: string;
  text?: string;
  textSecondary?: string;
  textMuted?: string;
  textInverse?: string;
  onPrimary?: string;
}

export const appThemePalettes: AppThemePalette[] = [
  {
    key: 'role',
    labelKey: 'profile.themePaletteRole',
    descriptionKey: 'profile.themePaletteRoleDesc',
    primary: '#16A34A',
    primaryDark: '#12863D',
    primaryLight: '#C9F4DA',
    primarySurface: '#E9FBF0',
  },
  {
    key: 'forest',
    labelKey: 'profile.themePaletteForest',
    descriptionKey: 'profile.themePaletteForestDesc',
    primary: '#15803D',
    primaryDark: '#166534',
    primaryLight: '#BBF7D0',
    primarySurface: '#E9FBF0',
    background: '#F4FBF6',
    surface: '#FFFFFF',
    surfaceAlt: '#EDF8F1',
    surfaceSunken: '#E0F2E7',
    border: '#C7E9D2',
  },
  {
    key: 'ocean',
    labelKey: 'profile.themePaletteOcean',
    descriptionKey: 'profile.themePaletteOceanDesc',
    primary: '#0284C7',
    primaryDark: '#0369A1',
    primaryLight: '#BAE6FD',
    primarySurface: '#E8F6FD',
    background: '#F3FAFE',
    surface: '#FFFFFF',
    surfaceAlt: '#E8F4FB',
    surfaceSunken: '#DCEFF9',
    border: '#BFE0F1',
  },
  {
    key: 'sunset',
    labelKey: 'profile.themePaletteSunset',
    descriptionKey: 'profile.themePaletteSunsetDesc',
    primary: '#EA580C',
    primaryDark: '#C2410C',
    primaryLight: '#FED7AA',
    primarySurface: '#FFF1E3',
    background: '#FFF8F1',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF0E3',
    surfaceSunken: '#FFE5CC',
    border: '#F8D0AE',
  },
  {
    key: 'amethyst',
    labelKey: 'profile.themePaletteAmethyst',
    descriptionKey: 'profile.themePaletteAmethystDesc',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#DDD6FE',
    primarySurface: '#F1ECFF',
    background: '#F8F5FF',
    surface: '#FFFFFF',
    surfaceAlt: '#F0EBFA',
    surfaceSunken: '#E7DFF7',
    border: '#D5C6F1',
  },
  {
    key: 'rose',
    labelKey: 'profile.themePaletteRose',
    descriptionKey: 'profile.themePaletteRoseDesc',
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FFE4E6',
    primarySurface: '#FFF0F3',
    background: '#FFF7F8',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF0F3',
    surfaceSunken: '#FFE4E9',
    border: '#F6C8D0',
  },
  {
    key: 'midnight',
    labelKey: 'profile.themePaletteMidnight',
    descriptionKey: 'profile.themePaletteMidnightDesc',
    primary: '#38BDF8',
    primaryDark: '#0284C7',
    primaryLight: '#0F3A4F',
    primarySurface: '#082F49',
    background: '#07111F',
    surface: '#0F172A',
    surfaceAlt: '#111827',
    surfaceSunken: '#020617',
    border: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textInverse: '#020617',
    onPrimary: '#02131F',
  },
];

export function isAppThemePaletteKey(value: string | null | undefined): value is AppThemePaletteKey {
  return appThemePalettes.some((palette) => palette.key === value);
}

export function applyAppThemePalette(base: AppColors, key: AppThemePaletteKey, isDark: boolean): AppColors {
  if (key === 'role') return base;
  const palette = appThemePalettes.find((item) => item.key === key);
  if (!palette) return base;
  return {
    ...(isDark ? darkColors : lightColors),
    ...base,
    primary: palette.primary,
    primaryDark: palette.primaryDark,
    primaryLight: palette.primaryLight,
    primarySurface: palette.primarySurface,
    background: palette.background ?? base.background,
    surface: palette.surface ?? base.surface,
    surfaceAlt: palette.surfaceAlt ?? base.surfaceAlt,
    surfaceSunken: palette.surfaceSunken ?? base.surfaceSunken,
    border: palette.border ?? base.border,
    borderStrong: palette.border ?? base.borderStrong,
    text: palette.text ?? base.text,
    textSecondary: palette.textSecondary ?? base.textSecondary,
    textMuted: palette.textMuted ?? base.textMuted,
    textInverse: palette.textInverse ?? base.textInverse,
    onPrimary: palette.onPrimary ?? base.onPrimary,
  };
}
