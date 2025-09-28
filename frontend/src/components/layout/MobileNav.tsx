import React from 'react';
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Icon,
  Badge,
  useColorModeValue,
  Divider,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPlay,
  FiEdit3,
  FiBarChart3,
  FiGitMerge,
  FiBriefcase,
  FiSettings,
  FiActivity,
  FiTrendingUp,
  FiTarget,
} from 'react-icons/fi';
import { useAppStore } from '@/stores/appStore';
import { useJobStore } from '@/stores/jobStore';
import ThemeToggle from '@/components/common/ThemeToggle';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: FiHome,
  },
  {
    name: 'Train',
    path: '/train',
    icon: FiPlay,
  },
  {
    name: 'Generate',
    path: '/generate',
    icon: FiEdit3,
  },
  {
    name: 'Evaluate',
    path: '/evaluate',
    icon: FiBarChart3,
    children: [
      {
        name: 'New Evaluation',
        path: '/evaluate',
        icon: FiTarget,
      },
      {
        name: 'Results',
        path: '/evaluate/results',
        icon: FiTrendingUp,
      },
      {
        name: 'Benchmarks',
        path: '/evaluate/benchmarks',
        icon: FiActivity,
      },
    ],
  },
  {
    name: 'Merge',
    path: '/merge',
    icon: FiGitMerge,
  },
  {
    name: 'Jobs',
    path: '/jobs',
    icon: FiBriefcase,
    badge: 'runningJobs',
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: FiSettings,
  },
];

const MobileNavItem: React.FC<{
  item: NavItem;
  onClose: () => void;
  level?: number;
}> = ({ item, onClose, level = 0 }) => {
  const location = useLocation();
  const { runningJobs } = useJobStore();
  const isActive = location.pathname === item.path;
  
  const activeBg = useColorModeValue('primary.50', 'primary.900');
  const activeColor = useColorModeValue('primary.600', 'primary.200');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  const getBadgeValue = (badgeKey: string) => {
    switch (badgeKey) {
      case 'runningJobs':
        return runningJobs.length > 0 ? runningJobs.length.toString() : undefined;
      default:
        return undefined;
    }
  };
  
  const badgeValue = item.badge ? getBadgeValue(item.badge) : undefined;
  
  return (
    <VStack spacing={0} align="stretch">
      <Box
        as={RouterLink}
        to={item.path}
        onClick={onClose}
        display="flex"
        alignItems="center"
        p={3}
        pl={level * 4 + 3}
        borderRadius="lg"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          textDecoration: 'none',
        }}
        transition="all 0.2s"
        fontWeight={isActive ? 'semibold' : 'medium'}
      >
        <HStack spacing={3} flex={1}>
          <Icon as={item.icon} boxSize={5} />
          <Text>{item.name}</Text>
          <Spacer />
          {badgeValue && (
            <Badge
              colorScheme="red"
              variant="solid"
              borderRadius="full"
              fontSize="xs"
              minW={5}
              h={5}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {badgeValue}
            </Badge>
          )}
        </HStack>
      </Box>
      
      {item.children && (
        <VStack spacing={0} align="stretch">
          {item.children.map((child) => (
            <MobileNavItem
              key={child.path}
              item={child}
              onClose={onClose}
              level={level + 1}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
};

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { apiStatus } = useAppStore();
  const drawerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'yellow';
      case 'disconnected':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg={drawerBg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <VStack spacing={3} align="stretch">
            {/* Brand */}
            <HStack spacing={3}>
              <Box
                w={8}
                h={8}
                bg="primary.500"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontWeight="bold" fontSize="sm">
                  Q
                </Text>
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">
                  QLoRA
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Fine-Tuning Pipeline
                </Text>
              </VStack>
            </HStack>
            
            {/* Theme Toggle */}
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg={`${getStatusColor(apiStatus)}.500`}
                />
                <Text fontSize="sm" color="gray.500">
                  API {apiStatus}
                </Text>
              </HStack>
              <ThemeToggle size="sm" showTooltip={false} />
            </Flex>
          </VStack>
        </DrawerHeader>
        
        <DrawerBody p={0}>
          <VStack spacing={1} align="stretch" p={4}>
            {NAV_ITEMS.map((item) => (
              <MobileNavItem key={item.path} item={item} onClose={onClose} />
            ))}
          </VStack>
          
          <Divider />
          
          {/* Footer */}
          <Box p={4}>
            <VStack spacing={2} align="start">
              <Text fontSize="xs" color="gray.500">
                QLoRA Fine-Tuning Pipeline
              </Text>
              <Text fontSize="xs" color="gray.400">
                Version 1.2.3 • Build 20240115.1
              </Text>
            </VStack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileNav;