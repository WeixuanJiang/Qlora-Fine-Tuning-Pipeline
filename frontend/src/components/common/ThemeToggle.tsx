import React from 'react';
import {
  IconButton,
  useColorMode,
  useColorModeValue,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  showTooltip?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  variant = 'ghost',
  showTooltip = true,
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const buttonBg = useColorModeValue('gray.100', 'gray.700');
  const hoverBg = useColorModeValue('gray.200', 'gray.600');
  
  const button = (
    <IconButton
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      icon={
        <MotionBox
          initial={false}
          animate={{
            rotate: isDark ? 180 : 0,
            scale: isDark ? 0.8 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </MotionBox>
      }
      onClick={toggleColorMode}
      size={size}
      variant={variant}
      bg={variant === 'solid' ? buttonBg : undefined}
      _hover={{
        bg: variant === 'ghost' ? hoverBg : undefined,
        transform: 'scale(1.05)',
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      transition="all 0.2s"
      borderRadius="full"
    />
  );
  
  if (!showTooltip) {
    return button;
  }
  
  return (
    <Tooltip
      label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      placement="bottom"
      hasArrow
    >
      {button}
    </Tooltip>
  );
};

export default ThemeToggle;