import { Platform } from 'react-native';

import { AppColors, darkColors, lightColors, palette } from './colors';

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.bold, lineHeight: 44 },
  h1: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, lineHeight: 38 },
  h2: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, lineHeight: 32 },
  h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: 28 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, lineHeight: 24 },
  body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, lineHeight: 22 },
  bodyStrong: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, lineHeight: 22 },
  caption: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, lineHeight: 18 },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, lineHeight: 16 },
} as const;

export const shadow = {
  none: {},
  sm: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(10,15,12,0.06)' },
    default: {
      shadowColor: palette.black,
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
  }) as object,
  md: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(10,15,12,0.08)' },
    default: {
      shadowColor: palette.black,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  }) as object,
  lg: Platform.select({
    web: { boxShadow: '0 12px 32px rgba(10,15,12,0.12)' },
    default: {
      shadowColor: palette.black,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  }) as object,
} as const;

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export const layout = {
  maxContentWidth: 1200,
  sidebarWidth: 264,
  authCardWidth: 440,
} as const;

export interface Theme {
  colors: AppColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  typography: typeof typography;
  shadow: typeof shadow;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  typography,
  shadow,
  isDark: false,
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: darkColors,
  isDark: true,
};

export { palette } from './colors';
export { appThemePalettes } from './palettes';
export type { AppThemePaletteKey } from './palettes';
export { roleAccent, roleColorScale, userRoleToKey } from './roleColors';
export type { RoleKey } from './roleColors';
