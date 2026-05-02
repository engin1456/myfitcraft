/**
 * MyFitCraft renk paleti.
 * Marka kimliği: "vücudunu zanaatla işle" - örs, sıcak demir, forge alevi.
 * - Koyu (workshop / gym vibe) ana tema
 * - Açık tema da destekleniyor
 * - Accent: forge orange (sıcak demir tonu), sportif + zanaatkar vurgu
 */

export const palette = {
  // Brand
  brand500: '#FF6B35', // primary accent (energy orange)
  brand400: '#FF8559',
  brand600: '#E85528',
  brand700: '#C84618',

  // Success / progress
  success500: '#22C55E',
  success400: '#4ADE80',

  // Danger / warning
  danger500: '#EF4444',
  warning500: '#F59E0B',

  // Neutrals - Dark
  neutral950: '#0A0A0F',
  neutral900: '#111118',
  neutral850: '#1A1A24',
  neutral800: '#22222E',
  neutral700: '#2E2E3D',
  neutral600: '#444456',
  neutral500: '#6B6B80',
  neutral400: '#8E8EA3',
  neutral300: '#B5B5C5',
  neutral200: '#D5D5DD',
  neutral100: '#EBEBF0',
  neutral50: '#F7F7FA',
  white: '#FFFFFF',
  black: '#000000',

  // Muscle-group accent (raporlarda/filtrelerde kullanılacak)
  muscle: {
    chest: '#EF4444',
    back: '#3B82F6',
    shoulders: '#F59E0B',
    biceps: '#A855F7',
    triceps: '#EC4899',
    legs: '#10B981',
    core: '#FB923C',
    cardio: '#06B6D4',
  },
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryContrast: string;
  success: string;
  danger: string;
  warning: string;
  overlay: string;
  cardShadow: string;
}

export const darkColors: ThemeColors = {
  background: palette.neutral950,
  surface: palette.neutral900,
  surfaceElevated: palette.neutral850,
  border: palette.neutral800,
  text: palette.neutral50,
  textMuted: palette.neutral300,
  textSubtle: palette.neutral500,
  primary: palette.brand500,
  primaryContrast: palette.white,
  success: palette.success500,
  danger: palette.danger500,
  warning: palette.warning500,
  overlay: 'rgba(0,0,0,0.6)',
  cardShadow: 'rgba(0,0,0,0.4)',
};

export const lightColors: ThemeColors = {
  background: palette.neutral50,
  surface: palette.white,
  surfaceElevated: palette.white,
  border: palette.neutral200,
  text: palette.neutral900,
  textMuted: palette.neutral600,
  textSubtle: palette.neutral400,
  primary: palette.brand500,
  primaryContrast: palette.white,
  success: palette.success500,
  danger: palette.danger500,
  warning: palette.warning500,
  overlay: 'rgba(0,0,0,0.4)',
  cardShadow: 'rgba(0,0,0,0.08)',
};
