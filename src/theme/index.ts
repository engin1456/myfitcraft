import { darkColors, lightColors, type ThemeColors, palette } from './colors';
import { spacing, radius } from './spacing';
import { fontFamily, fontSize, fontWeight, lineHeight } from './typography';

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  palette: typeof palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
  lineHeight: typeof lineHeight;
}

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: darkColors,
  palette,
  spacing,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  palette,
  spacing,
  radius,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
};

export type { ThemeColors } from './colors';
export { palette } from './colors';
export { spacing, radius } from './spacing';
export { fontFamily, fontSize, fontWeight, lineHeight } from './typography';
