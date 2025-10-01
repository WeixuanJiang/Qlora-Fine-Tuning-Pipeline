import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Theme configuration - Enforce light mode for clean, professional UI
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Modern, clean color palette - Blue primary with neutral grays
const colors = {
  // Primary: Professional Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  // Secondary: Neutral Gray (for backgrounds and text)
  secondary: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  // Accent: Emerald Green
  accent: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  // Success: Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  // Warning: Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  // Error: Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  // Info: Sky Blue
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
};

// Typography configuration - Clean, readable fonts
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  mono: `'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace`,
};

const fontSizes = {
  xs: '0.7rem',
  sm: '0.85rem',
  md: '1rem',
  lg: '1.15rem',
  xl: '1.35rem',
  '2xl': '1.65rem',
  '3xl': '2.1rem',
  '4xl': '2.8rem',
  '5xl': '3.6rem',
  '6xl': '4.5rem',
  '7xl': '5.5rem',
};

const fontWeights = {
  hairline: 100,
  thin: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Consistent spacing scale
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
};

// Clean, modern border radius
const radii = {
  none: '0',
  xs: '0.125rem',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

// Subtle, professional shadows
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06)',
  base: '0 1px 4px 0 rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
  outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.04)',
};

// Component style overrides - Modern, clean design
// Global styles - Optimized for light theme
const styles = {
  global: {
    body: {
      lineHeight: 1.6,
      fontSize: 'md',
      color: 'secondary.800',
      bg: 'gray.50',
    },
    '*::placeholder': {
      color: 'secondary.400',
    },
    '*, *::before, &::after': {
      borderColor: 'secondary.200',
    },
  },
};

// Breakpoints for responsive design
const breakpoints = {
  base: '0em',
  sm: '30em',
  md: '48em', // 768px from requirements
  lg: '64em', // 1024px from requirements
  xl: '80em',
  '2xl': '96em',
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  fontWeights,
  space,
  radii,
  shadows,
  breakpoints,
  styles,
});

export default theme;
export { colors, fonts, fontSizes, fontWeights, space, radii, shadows };
