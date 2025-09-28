import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Color palette based on requirements
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#1e40af', // Primary color from requirements
    700: '#1d4ed8',
    800: '#1e3a8a',
    900: '#1e293b',
  },
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669', // Success color from requirements
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Secondary color from requirements
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706', // Warning color from requirements
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
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
};

// Typography configuration
const fonts = {
  heading: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
};

const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem', // 16px base size from requirements
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
  '5xl': '3rem',
  '6xl': '3.75rem',
};

// Spacing configuration (24px grid from requirements)
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
  6: '1.5rem', // 24px base spacing
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

// Border radius (8px from requirements)
const radii = {
  none: '0',
  sm: '0.125rem',
  base: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem', // 8px from requirements
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
};

// Shadows configuration
const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  inner: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)',
};

// Component style overrides
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
    },
    variants: {
      solid: {
        bg: 'primary.600',
        color: 'white',
        _hover: {
          bg: 'primary.700',
          transform: 'translateY(-1px)',
          boxShadow: 'md',
        },
        _active: {
          bg: 'primary.800',
          transform: 'translateY(0)',
        },
      },
      ghost: {
        color: 'primary.600',
        _hover: {
          bg: 'primary.50',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'base',
        border: '1px solid',
        borderColor: 'gray.200',
        _dark: {
          borderColor: 'gray.700',
        },
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderRadius: 'lg',
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
          },
        },
      },
    },
  },
};

// Global styles
const styles = {
  global: {
    body: {
      lineHeight: 1.5, // 1.5 line height from requirements
      fontSize: 'md',
    },
    '*::placeholder': {
      color: 'gray.400',
    },
    '*, *::before, &::after': {
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.700',
      },
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
  space,
  radii,
  shadows,
  components,
  styles,
  breakpoints,
});

export default theme;
export { colors, fonts, fontSizes, space, radii, shadows };