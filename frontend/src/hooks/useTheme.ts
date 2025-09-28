import { useColorMode } from '@chakra-ui/react';
import { useAppStore } from '@/stores/appStore';
import { useEffect } from 'react';

export const useTheme = () => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  const { theme, setTheme } = useAppStore();

  // Sync Chakra UI color mode with app store
  useEffect(() => {
    if (theme !== colorMode) {
      setColorMode(theme);
    }
  }, [theme, colorMode, setColorMode]);

  const handleToggleColorMode = () => {
    const newTheme = colorMode === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    toggleColorMode();
  };

  return {
    colorMode,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',
    toggleColorMode: handleToggleColorMode,
    setColorMode: (mode: 'light' | 'dark') => {
      setTheme(mode);
      setColorMode(mode);
    },
  };
};

export default useTheme;