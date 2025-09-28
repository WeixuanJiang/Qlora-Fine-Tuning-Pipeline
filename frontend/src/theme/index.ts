import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

// Vibrant gradient color palette - Purple/Pink/Orange theme
const colors = {
  // Primary: Purple gradient
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea', // Main purple
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Secondary: Pink gradient
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777', // Main pink
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  // Accent: Orange gradient
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c', // Main orange
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  // Success: Vibrant green
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
  // Warning: Bright yellow
  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  // Error: Vibrant red
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
  // Gradient combinations for backgrounds
  gradients: {
    primary: 'linear-gradient(135deg, #9333ea 0%, #db2777 50%, #ea580c 100%)',
    secondary: 'linear-gradient(135deg, #db2777 0%, #ea580c 100%)',
    accent: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    soft: 'linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%)',
    dark: 'linear-gradient(135deg, #581c87 0%, #831843 50%, #7c2d12 100%)',
  },
};

// Typography configuration - Modern geometric fonts
const fonts = {
  heading: `'Poppins', 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
  body: `'Nunito Sans', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`,
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

// Organic spacing system - flowing proportions
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.3rem',
  1.5: '0.45rem',
  2: '0.6rem',
  2.5: '0.8rem',
  3: '1rem',
  3.5: '1.2rem',
  4: '1.5rem',
  5: '1.8rem',
  6: '2.2rem',
  7: '2.6rem',
  8: '3.2rem',
  9: '3.8rem',
  10: '4.5rem',
  12: '5.5rem',
  14: '6.5rem',
  16: '8rem',
  20: '10rem',
  24: '12rem',
  28: '14rem',
  32: '16rem',
};

// Organic border radius - flowing shapes
const radii = {
  none: '0',
  xs: '0.2rem',
  sm: '0.4rem',
  base: '0.6rem',
  md: '0.9rem',
  lg: '1.3rem',
  xl: '1.8rem',
  '2xl': '2.5rem',
  '3xl': '3.5rem',
  '4xl': '5rem',
  blob: '30% 70% 70% 30% / 30% 30% 70% 70%',
  organic: '40% 60% 60% 40% / 60% 30% 70% 40%',
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

// Component style overrides - Vibrant organic design
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: '2xl',
      fontFamily: 'heading',
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    variants: {
      solid: {
        background: 'linear-gradient(135deg, var(--chakra-colors-primary-500) 0%, var(--chakra-colors-secondary-500) 100%)',
        color: 'white',
        border: 'none',
        _hover: {
          background: 'linear-gradient(135deg, var(--chakra-colors-primary-600) 0%, var(--chakra-colors-secondary-600) 100%)',
          transform: 'translateY(-3px) scale(1.02)',
          boxShadow: '0 10px 25px rgba(147, 51, 234, 0.4)',
        },
        _active: {
          transform: 'translateY(-1px) scale(1.01)',
        },
      },
      gradient: {
        background: 'linear-gradient(135deg, var(--chakra-colors-accent-400) 0%, var(--chakra-colors-accent-600) 100%)',
        color: 'white',
        _hover: {
          background: 'linear-gradient(135deg, var(--chakra-colors-accent-500) 0%, var(--chakra-colors-accent-700) 100%)',
          transform: 'translateY(-3px) scale(1.02)',
          boxShadow: '0 10px 25px rgba(234, 88, 12, 0.4)',
        },
      },
      ghost: {
        color: 'primary.600',
        borderRadius: 'xl',
        _hover: {
          bg: 'linear-gradient(135deg, var(--chakra-colors-primary-50) 0%, var(--chakra-colors-secondary-50) 100%)',
          transform: 'scale(1.05)',
        },
      },
      outline: {
        borderWidth: '2px',
        borderColor: 'primary.400',
        color: 'primary.600',
        background: 'transparent',
        _hover: {
          borderColor: 'secondary.400',
          color: 'secondary.600',
          background: 'linear-gradient(135deg, var(--chakra-colors-primary-50) 0%, var(--chakra-colors-secondary-50) 100%)',
          transform: 'translateY(-2px)',
        },
      },
    },
    sizes: {
      sm: {
        px: 6,
        py: 3,
        fontSize: 'sm',
      },
      md: {
        px: 8,
        py: 4,
        fontSize: 'md',
      },
      lg: {
        px: 10,
        py: 5,
        fontSize: 'lg',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: '2xl',
        boxShadow: '0 8px 32px rgba(147, 51, 234, 0.12)',
        border: '1px solid',
        borderColor: 'primary.100',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(250,245,255,0.8) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        _dark: {
          borderColor: 'primary.800',
          background: 'linear-gradient(135deg, rgba(88,28,135,0.2) 0%, rgba(131,24,67,0.2) 100%)',
        },
        _before: {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 50%, var(--chakra-colors-accent-400) 100%)',
        },
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: '0 20px 40px rgba(147, 51, 234, 0.2)',
          transform: 'translateY(-4px)',
        },
      },
      glass: {
        container: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        fontFamily: 'body',
      },
    },
    variants: {
      outline: {
        field: {
          borderRadius: 'xl',
          borderWidth: '2px',
          borderColor: 'primary.200',
          background: 'white',
          _hover: {
            borderColor: 'primary.300',
          },
          _focus: {
            borderColor: 'primary.500',
            boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.1)',
            background: 'linear-gradient(135deg, rgba(250,245,255,0.8) 0%, rgba(253,242,248,0.8) 100%)',
          },
          _dark: {
            background: 'gray.800',
            borderColor: 'primary.700',
          },
        },
      },
      filled: {
        field: {
          background: 'linear-gradient(135deg, var(--chakra-colors-primary-50) 0%, var(--chakra-colors-secondary-50) 100%)',
          borderRadius: 'xl',
          border: 'none',
          _focus: {
            background: 'white',
            boxShadow: '0 0 0 2px var(--chakra-colors-primary-400)',
          },
        },
      },
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: 'full',
      fontWeight: 'bold',
      fontSize: 'xs',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    variants: {
      solid: {
        background: 'linear-gradient(135deg, var(--chakra-colors-primary-500) 0%, var(--chakra-colors-secondary-500) 100%)',
        color: 'white',
      },
      gradient: {
        background: 'linear-gradient(135deg, var(--chakra-colors-accent-400) 0%, var(--chakra-colors-accent-600) 100%)',
        color: 'white',
      },
    },
  },
  Progress: {
    baseStyle: {
      track: {
        borderRadius: 'full',
        background: 'gray.100',
      },
      filledTrack: {
        background: 'linear-gradient(90deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 50%, var(--chakra-colors-accent-400) 100%)',
        borderRadius: 'full',
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