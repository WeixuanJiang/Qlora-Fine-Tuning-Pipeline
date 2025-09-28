import React from 'react';
import {
  Box,
  Flex,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  keyframes,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  fullScreen?: boolean;
  color?: string;
  thickness?: string;
}

// Custom pulse animation
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// Motion components
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
  color,
  thickness = '4px',
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const overlayBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)');
  
  const spinnerColor = color || useColorModeValue('primary.500', 'primary.300');
  
  const sizeMap = {
    sm: { spinner: 'sm', text: 'sm' },
    md: { spinner: 'md', text: 'md' },
    lg: { spinner: 'lg', text: 'lg' },
    xl: { spinner: 'xl', text: 'xl' },
  };

  const spinnerSize = sizeMap[size].spinner;
  const textSize = sizeMap[size].text;

  const content = (
    <MotionVStack
      spacing={4}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MotionBox
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Spinner
          size={spinnerSize}
          color={spinnerColor}
          thickness={thickness}
          speed="0.8s"
          emptyColor="gray.200"
          _dark={{ emptyColor: 'gray.600' }}
        />
      </MotionBox>
      
      {message && (
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Text
            fontSize={textSize}
            color={textColor}
            textAlign="center"
            fontWeight="medium"
            animation={`${pulse} 2s ease-in-out infinite`}
          >
            {message}
          </Text>
        </MotionBox>
      )}
    </MotionVStack>
  );

  if (fullScreen) {
    return (
      <Flex
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={overlayBg}
        backdropFilter="blur(4px)"
        zIndex="overlay"
        align="center"
        justify="center"
        direction="column"
      >
        <Box
          bg={bgColor}
          borderRadius="xl"
          p={8}
          boxShadow="xl"
          border="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.600' }}
        >
          {content}
        </Box>
      </Flex>
    );
  }

  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      p={4}
      minH="200px"
    >
      {content}
    </Flex>
  );
};

// Inline loading spinner for smaller components
export const InlineSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  color?: string;
}> = ({ size = 'sm', color }) => {
  const spinnerColor = color || useColorModeValue('primary.500', 'primary.300');
  
  return (
    <Spinner
      size={size}
      color={spinnerColor}
      thickness="2px"
      speed="0.8s"
      emptyColor="gray.200"
      _dark={{ emptyColor: 'gray.600' }}
    />
  );
};

// Loading overlay for specific components
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}> = ({ isLoading, message, children }) => {
  const overlayBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)');
  
  return (
    <Box position="relative">
      {children}
      {isLoading && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={overlayBg}
          backdropFilter="blur(2px)"
          zIndex="overlay"
          align="center"
          justify="center"
          borderRadius="inherit"
        >
          <LoadingSpinner message={message} size="md" />
        </Flex>
      )}
    </Box>
  );
};

export default LoadingSpinner;