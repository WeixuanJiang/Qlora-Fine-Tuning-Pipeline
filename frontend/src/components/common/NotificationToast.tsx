import React, { useEffect, useMemo, useRef } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Icon,
  Portal,
} from '@chakra-ui/react';
import {
  CheckIcon,
    InfoIcon,
  CloseIcon,
} from '@/components/icons/GeometricIcons';
import { useAppStore } from '@/stores/appStore';
import type { Notification } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckIcon;
    case 'error':
      return AlertIcon;
    case 'warning':
      return AlertIcon;
    case 'info':
    default:
      return InfoIcon;
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
      borderRadius="lg"
      boxShadow="lg"
      border="1px"
      borderColor={`${colorScheme}.200`}
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
            color="gray.600"
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

const MotionBox = motion(Box);

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification, markNotificationAsRead } = useAppStore();
  const timersRef = useRef<Record<string, number>>({});

  // Track active notifications to manage timers without mutating array identities unnecessarily
  const activeNotifications = useMemo(() => notifications.slice().reverse(), [notifications]);

  useEffect(() => {
    activeNotifications.forEach((notification) => {
      if (!notification.isRead) {
        markNotificationAsRead(notification.id);
      }

      if (timersRef.current[notification.id] != null) {
        return;
      }

      const timeout = window.setTimeout(() => {
        removeNotification(notification.id);
        window.clearTimeout(timersRef.current[notification.id]!);
        delete timersRef.current[notification.id];
      }, notification.duration ?? 5000);

      timersRef.current[notification.id] = timeout;
    });

    Object.keys(timersRef.current).forEach((id) => {
      if (!activeNotifications.some((notification) => notification.id === id)) {
        window.clearTimeout(timersRef.current[id]!);
        delete timersRef.current[id];
      }
    });
  }, [activeNotifications, markNotificationAsRead, removeNotification]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timeout) => window.clearTimeout(timeout));
      timersRef.current = {};
    };
  }, []);

  if (activeNotifications.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Box
        position="fixed"
        top={4}
        right={4}
        zIndex="toast"
        display="flex"
        flexDirection="column"
        alignItems="flex-end"
        gap={3}
        pointerEvents="none"
      >
        <AnimatePresence initial={false}>
          {activeNotifications.map((notification) => (
            <MotionBox
              key={notification.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              pointerEvents="auto"
            >
              <CustomToast
                notification={notification}
                onClose={() => {
                  if (timersRef.current[notification.id] != null) {
                    window.clearTimeout(timersRef.current[notification.id]!);
                    delete timersRef.current[notification.id];
                  }
                  removeNotification(notification.id);
                }}
              />
            </MotionBox>
          ))}
        </AnimatePresence>
      </Box>
    </Portal>
  );
};

export default NotificationToast;
