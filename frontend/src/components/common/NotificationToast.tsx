import React, { useEffect } from 'react';
import {
  useToast,
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
} from 'react-icons/fi';
import { useAppStore } from '@/stores/appStore';
import type { Notification } from '@/types';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return FiCheckCircle;
    case 'error':
      return FiAlertCircle;
    case 'warning':
      return FiAlertTriangle;
    case 'info':
    default:
      return FiInfo;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'orange';
    case 'info':
    default:
      return 'blue';
  }
};

interface CustomToastProps {
  notification: Notification;
  onClose: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({ notification, onClose }) => {
  const IconComponent = getNotificationIcon(notification.type);
  const colorScheme = getNotificationColor(notification.type);

  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800' }}
      borderRadius="lg"
      boxShadow="lg"
      border="1px"
      borderColor={`${colorScheme}.200`}
      _dark={{ borderColor: `${colorScheme}.600` }}
      p={4}
      minW="300px"
      maxW="400px"
    >
      <HStack spacing={3} align="start">
        <Icon
          as={IconComponent}
          color={`${colorScheme}.500`}
          boxSize={5}
          mt={0.5}
          flexShrink={0}
        />
        <VStack align="start" spacing={1} flex={1}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            color="gray.900"
            _dark={{ color: 'white' }}
            lineHeight="short"
          >
            {notification.title}
          </Text>
          {notification.message && (
            <Text
              fontSize="sm"
              color="gray.600"
              _dark={{ color: 'gray.300' }}
              lineHeight="short"
            >
              {notification.message}
            </Text>
          )}
          {notification.timestamp && (
            <Text
              fontSize="xs"
              color="gray.500"
              _dark={{ color: 'gray.400' }}
            >
              {new Date(notification.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </VStack>
        <IconButton
          aria-label="Close notification"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          color="gray.400"
          _hover={{ color: 'gray.600' }}
          onClick={onClose}
          flexShrink={0}
        />
      </HStack>
    </Box>
  );
};

const NotificationToast: React.FC = () => {
  const toast = useToast();
  const { notifications, removeNotification, markNotificationAsRead } = useAppStore();

  useEffect(() => {
    // Show new notifications as toasts
    notifications
      .filter(notification => !notification.read)
      .forEach(notification => {
        // Mark as read immediately to prevent duplicate toasts
        markNotificationAsRead(notification.id);

        toast({
          duration: notification.duration || 5000,
          isClosable: true,
          position: 'top-right',
          render: ({ onClose }) => (
            <CustomToast
              notification={notification}
              onClose={() => {
                onClose();
                removeNotification(notification.id);
              }}
            />
          ),
        });
      });
  }, [notifications, toast, markNotificationAsRead, removeNotification]);

  // This component doesn't render anything visible
  // It only manages the toast notifications
  return null;
};

export default NotificationToast;