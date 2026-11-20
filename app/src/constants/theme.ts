/**
 * Colores, tipografías y espaciados de StudyMate (modo claro y oscuro).
 * Usa `useTheme()` para leer la paleta activa desde un componente.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    primary: '#2563EB',
    primarySoft: '#DBEAFE',
    onPrimary: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#DCFCE7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0B1120',
    backgroundElement: '#162033',
    backgroundSelected: '#22304A',
    border: '#22304A',
    primary: '#60A5FA',
    primarySoft: '#1E3A5F',
    onPrimary: '#0B1120',
    success: '#4ADE80',
    successSoft: '#14532D',
    danger: '#F87171',
    dangerSoft: '#7F1D1D',
    warning: '#FBBF24',
    warningSoft: '#78350F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Palette = (typeof Colors)['light' | 'dark'];

/** Colores que el usuario puede asignar a una materia. */
export const SubjectColors = [
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#0D9488',
] as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 20,
  pill: 999,
} as const;

export const MaxContentWidth = 800;

/** Espacio inferior para que el contenido no quede debajo de la barra de pestañas. */
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 96 }) ?? 0;
