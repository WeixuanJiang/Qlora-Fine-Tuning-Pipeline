import React, { Children, ReactNode, createContext, isValidElement, useContext, useMemo } from 'react';
import {
  Box,
  BoxProps,
  HStack,
  Icon,
  IconProps,
  Text,
  TextProps,
  VStack,
} from '@chakra-ui/react';
import {
  InfoIcon,
  AlertIcon as WarningIcon,
  CheckIcon,
  XIcon,
} from '@/components/icons/GeometricIcons';

export type AlertStatus = 'info' | 'warning' | 'success' | 'error';

interface AlertContextValue {
  status: AlertStatus;
}

const AlertContext = createContext<AlertContextValue>({ status: 'info' });

const STATUS_STYLES: Record<AlertStatus, { bg: string; borderColor: string; iconColor: string; textColor: string; Icon: React.ElementType }>
  = {
    info: {
      bg: 'blue.50',
      borderColor: 'blue.200',
      iconColor: 'blue.500',
      textColor: 'blue.900',
      Icon: InfoIcon,
    },
    warning: {
      bg: 'orange.50',
      borderColor: 'orange.200',
      iconColor: 'orange.500',
      textColor: 'orange.900',
      Icon: WarningIcon,
    },
    success: {
      bg: 'green.50',
      borderColor: 'green.200',
      iconColor: 'green.500',
      textColor: 'green.900',
      Icon: CheckIcon,
    },
    error: {
      bg: 'red.50',
      borderColor: 'red.200',
      iconColor: 'red.500',
      textColor: 'red.900',
      Icon: XIcon,
    },
  };

export interface AlertProps extends BoxProps {
  status?: AlertStatus;
}

export const Alert: React.FC<AlertProps> = ({ status = 'info', children, ...rest }) => {
  const styles = useMemo(() => STATUS_STYLES[status], [status]);
  const childArray = Children.toArray(children);

  let iconElement: ReactNode | null = null;
  const contentElements: ReactNode[] = [];

  childArray.forEach((child) => {
    if (iconElement == null && isValidElement(child) && child.type === AlertIcon) {
      iconElement = child;
    } else {
      contentElements.push(child);
    }
  });

  return (
    <AlertContext.Provider value={{ status }}>
      <Box
        role="alert"
        px={4}
        py={3}
        borderWidth="1px"
        borderRadius="md"
        borderColor={styles.borderColor}
        bg={styles.bg}
        color={styles.textColor}
        {...rest}
      >
        <HStack align="start" spacing={3}>
          {iconElement}
          <VStack align="start" spacing={1} flex={1}>
            {contentElements}
          </VStack>
        </HStack>
      </Box>
    </AlertContext.Provider>
  );
};

export const AlertIcon: React.FC<IconProps> = (props) => {
  const { status } = useContext(AlertContext);
  const styles = STATUS_STYLES[status];
  return (
    <Icon
      as={styles.Icon}
      color={styles.iconColor}
      boxSize={5}
      mt={1}
      flexShrink={0}
      {...props}
    />
  );
};

export const AlertTitle: React.FC<TextProps> = ({ children, ...rest }) => (
  <Text fontWeight="semibold" fontSize="sm" lineHeight="short" mt={0.5} {...rest}>
    {children}
  </Text>
);

export const AlertDescription: React.FC<TextProps> = ({ children, ...rest }) => (
  <Text fontSize="sm" lineHeight="short" {...rest}>
    {children}
  </Text>
);

export default Alert;
