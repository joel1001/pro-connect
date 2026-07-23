/**
 * ProConnect color system.
 * Brand is a vivid marketplace green; each role has its own accent used to
 * theme its template (badges, dashboards, active states).
 */

export const palette = {
  // Brand green scale
  green50: '#E9FBF0',
  green100: '#C9F4DA',
  green200: '#97E9BA',
  green300: '#5FD894',
  green400: '#2FC472',
  green500: '#16A34A', // primary
  green600: '#12863D',
  green700: '#0F6A31',
  green800: '#0C4F25',
  green900: '#08361A',

  // Neutrals
  white: '#FFFFFF',
  black: '#0A0F0C',
  gray50: '#F7F9F8',
  gray100: '#EEF2F0',
  gray200: '#E2E8E5',
  gray300: '#CBD5D0',
  gray400: '#9AA8A1',
  gray500: '#6B7A72',
  gray600: '#4B5750',
  gray700: '#333D38',
  gray800: '#1F2723',
  gray900: '#131815',

  // Status
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Role accents (see roleColors.ts — design board palettes)
  client: '#28B463',
  professional: '#2E86C1',
  admin: '#F39C12',
  superAdmin: '#8E44AD',
} as const;

export const lightColors = {
  primary: palette.green500,
  primaryDark: palette.green600,
  primaryLight: palette.green100,
  primarySurface: palette.green50,
  onPrimary: palette.white,

  background: palette.white,
  surface: palette.white,
  surfaceAlt: palette.gray50,
  surfaceSunken: palette.gray100,

  border: palette.gray200,
  borderStrong: palette.gray300,

  text: palette.gray900,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,
  textInverse: palette.white,

  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  overlay: 'rgba(10, 15, 12, 0.45)',
};

export type AppColors = { [K in keyof typeof lightColors]: string };

export const darkColors: AppColors = {
  primary: palette.green400,
  primaryDark: palette.green500,
  primaryLight: palette.green800,
  primarySurface: palette.green900,
  onPrimary: palette.black,

  background: palette.gray900,
  surface: palette.gray800,
  surfaceAlt: palette.gray700,
  surfaceSunken: palette.gray900,

  border: palette.gray700,
  borderStrong: palette.gray600,

  text: palette.gray50,
  textSecondary: palette.gray300,
  textMuted: palette.gray400,
  textInverse: palette.gray900,

  success: palette.green400,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,

  overlay: 'rgba(0, 0, 0, 0.6)',
};
