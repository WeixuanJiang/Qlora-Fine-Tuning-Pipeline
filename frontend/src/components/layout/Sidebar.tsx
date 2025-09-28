import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Link,
  Badge,
  Divider,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPlay,
  FiEdit3,
  FiBarChart3,
  FiGitMerge,
  FiList,
  FiSettings,
  FiActivity,
} from 'react-icons/fi';
import { useAppStore } from '@/stores/appStore';
import { useJobStore } from '@/stores/jobStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  description?: string;
  children?: NavItem[];
}

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: FiHome,
    description: 'Overview and system status',
  },
  {
    name: 'Train',
    href: '/train',
    icon: FiPlay,
    description: 'Fine-tune language models',
  },
  {
    name: 'Generate',
    href: '/generate',
    icon: FiEdit3,
    description: 'Generate text with models',
  },
  {
    name: 'Evaluate',
    href: '/evaluate',
    icon: FiBarChart3,
    description: 'Model performance metrics',
    children: [
      {
        name: 'Run Evaluation',
        href: '/evaluate',
        icon: FiActivity,
        description: 'Start new evaluation',
      },
      {
        name: 'Dashboard',
        href: '/evaluate/dashboard',
        icon: FiBarChart3,
        description: 'View evaluation results',
      },
    ],
  },
  {
    name: 'Merge',
    href: '/merge',
    icon: FiGitMerge,
    description: 'Merge model adapters',
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: FiList,
    description: 'Training job management',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: FiSettings,
    description: 'Application configuration',
  },
];

const NavItemComponent: React.FC<{
  item: NavItem;
  isActive: boolean;
  isChild?: boolean;
  onClose?: () => void;
}> = ({ item, isActive, isChild = false, onClose }) => {
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeBg = useColorModeValue('primary.50', 'primary.900');
  const activeColor = useColorModeValue('primary.600', 'primary.200');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const handleClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Tooltip
      label={item.description}
      placement="right"
      hasArrow
      isDisabled={!item.description}
    >
      <Link
        as={RouterLink}
        to={item.href}
        onClick={handleClick}
        display="block"
        px={isChild ? 6 : 4}
        py={3}
        mx={2}
        borderRadius="lg"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          textDecoration: 'none',
          transform: 'translateX(2px)',
        }}
        transition="all 0.2s ease"
        position="relative"
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
      >
        <HStack spacing={3}>
          <Icon
            as={item.icon}
            boxSize={isChild ? 4 : 5}
            color={isActive ? activeColor : mutedColor}
          />
          <VStack align="start" spacing={0} flex={1}>
            <Text
              fontSize={isChild ? 'sm' : 'md'}
              fontWeight={isActive ? 'semibold' : 'medium'}
              lineHeight="short"
            >
              {item.name}
            </Text>
            {item.description && !isChild && (
              <Text fontSize="xs" color={mutedColor} lineHeight="short">
                {item.description}
              </Text>
            )}
          </VStack>
          {item.badge && (
            <Badge
              size="sm"
              colorScheme={isActive ? 'primary' : 'gray'}
              variant="subtle"
            >
              {item.badge}
            </Badge>
          )}
        </HStack>
        {isActive && (
          <Box
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            w={1}
            bg={activeColor}
            borderRadius="full"
          />
        )}
      </Link>
    </Tooltip>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const location = useLocation();
  const { apiStatus } = useAppStore();
  const { jobs } = useJobStore();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('primary.600', 'primary.200');
  
  // Count running jobs for badge
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  
  // Update nav items with dynamic badges
  const navItemsWithBadges = NAV_ITEMS.map(item => {
    if (item.href === '/jobs' && runningJobs > 0) {
      return { ...item, badge: runningJobs };
    }
    return item;
  });

  const isItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Box
      w={isMobile ? 'full' : '280px'}
      h={isMobile ? 'auto' : '100vh'}
      bg={bgColor}
      borderRightWidth={isMobile ? 0 : '1px'}
      borderColor={borderColor}
      position={isMobile ? 'relative' : 'sticky'}
      top={0}
      overflowY="auto"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('#CBD5E0', '#4A5568'),
          borderRadius: '2px',
        },
      }}
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Brand Header - Only show on desktop */}
        {!isMobile && (
          <Box p={6} borderBottomWidth="1px" borderColor={borderColor}>
            <HStack spacing={3}>
              <Box
                w={10}
                h={10}
                bg="primary.500"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="xl"
                fontWeight="bold"
                shadow="md"
              >
                Q
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg" color={brandColor}>
                  QLoRA Copilot
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Custom language models
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* API Status Indicator */}
        <Box px={4} py={3}>
          <HStack spacing={2}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={
                apiStatus === 'connected'
                  ? 'green.400'
                  : apiStatus === 'error'
                  ? 'red.400'
                  : 'yellow.400'
              }
            />
            <Text fontSize="xs" color="gray.500">
              API {apiStatus === 'connected' ? 'Connected' : apiStatus === 'error' ? 'Error' : 'Connecting'}
            </Text>
          </HStack>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <Box flex={1} py={4} role="menu" aria-label="Main navigation">
          <VStack spacing={1} align="stretch">
            {navItemsWithBadges.map((item) => {
              const isActive = isItemActive(item.href);
              
              return (
                <Box key={item.name}>
                  <NavItemComponent
                    item={item}
                    isActive={isActive && !item.children}
                    onClose={onClose}
                  />
                  {item.children && (
                    <VStack spacing={1} align="stretch" mt={1}>
                      {item.children.map((child) => (
                        <NavItemComponent
                          key={child.name}
                          item={child}
                          isActive={isItemActive(child.href)}
                          isChild
                          onClose={onClose}
                        />
                      ))}
                    </VStack>
                  )}
                </Box>
              );
            })}
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            QLoRA Fine-Tuning Pipeline
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            v1.0.0
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;