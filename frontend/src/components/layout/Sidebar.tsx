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
  
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPlay,
  FiEdit3,
  FiBarChart2,
  FiGitMerge,
  FiList,
  FiSettings,
  FiActivity,
  FiDatabase,
  FiCheckCircle,
} from 'react-icons/fi';
import { useAppStore } from '@/stores/appStore';
import { useJobStore } from '@/stores/jobStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  description?: string;
  category?: string;
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
    category: 'Main',
  },
  {
    name: 'Datasets',
    href: '/datasets',
    icon: FiDatabase,
    description: 'Manage training datasets',
    category: 'Data',
  },
  {
    name: 'Train',
    href: '/train',
    icon: FiPlay,
    description: 'Fine-tune language models',
    category: 'Workflow',
  },
  {
    name: 'Generate',
    href: '/generate',
    icon: FiEdit3,
    description: 'Test models with prompts',
    category: 'Workflow',
  },
  {
    name: 'Evaluate',
    href: '/evaluate',
    icon: FiBarChart2,
    description: 'Measure model performance',
    category: 'Workflow',
  },
  {
    name: 'Merge',
    href: '/merge',
    icon: FiGitMerge,
    description: 'Merge model adapters',
    category: 'Workflow',
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: FiList,
    description: 'Training job management',
    category: 'Management',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: FiSettings,
    description: 'Application configuration',
    category: 'Management',
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClose?: () => void;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({ item, isActive, onClose }) => {
  const activeBg = 'gray.100';
  const activeColor = 'secondary.700';
  const hoverBg = 'gray.50';
  const textColor = 'secondary.600';
  const mutedColor = 'secondary.500';

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
      openDelay={300}
    >
      <Link
        as={RouterLink}
        to={item.href}
        onClick={handleClick}
        display="block"
        px={3}
        py={3}
        borderRadius="lg"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        borderLeft={isActive ? '3px solid' : '3px solid transparent'}
        borderColor={isActive ? 'secondary.700' : 'transparent'}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          textDecoration: 'none',
          transform: 'translateX(2px)',
        }}
        transition="all 0.2s"
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
        fontWeight={isActive ? '600' : '500'}
      >
        <HStack spacing={3}>
          <Icon
            as={item.icon}
            boxSize={5}
            color={isActive ? activeColor : mutedColor}
            transition="color 0.2s"
          />
          <Text fontSize="sm" flex={1}>
            {item.name}
          </Text>
          {item.badge && (
            <Badge
              colorScheme="primary"
              borderRadius="full"
              fontSize="xs"
              minW={5}
              h={5}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {item.badge}
            </Badge>
          )}
        </HStack>
      </Link>
    </Tooltip>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false, onClose }) => {
  const location = useLocation();
  const { apiStatus } = useAppStore();
  const { jobs } = useJobStore();

  const bgColor = 'white';
  const borderColor = 'gray.200';
  const brandColor = 'primary.600';

  // Count running jobs for badge
  const runningJobs = jobs.filter(job => job.status === 'running').length;

  // Update nav items with dynamic badges
  const navItemsWithBadges = NAV_ITEMS.map(item => {
    if (item.href === '/jobs' && runningJobs > 0) {
      return { ...item, badge: runningJobs };
    }
    return item;
  });

  // Group nav items by category
  const groupedItems = navItemsWithBadges.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const isItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green.500';
      case 'error': return 'red.500';
      default: return 'yellow.500';
    }
  };

  const categoryOrder = ['Main', 'Data', 'Workflow', 'Management'];

  return (
    <Box
      as="nav"
      w={isMobile ? 'full' : '280px'}
      h={isMobile ? 'auto' : '100vh'}
      bg={bgColor}
      borderRightWidth={isMobile ? 0 : '1px'}
      borderRightColor={borderColor}
      position={isMobile ? 'relative' : 'sticky'}
      top={0}
      overflowY="auto"
      boxShadow={isMobile ? 'none' : 'sm'}
      css={{
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#CBD5E0',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#A0AEC0',
        },
      }}
    >
      <VStack spacing={0} align="stretch" h="full">
        {/* Brand Header - Only show on desktop */}
        {!isMobile && (
          <Box
            p={6}
            borderBottomWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={3}>
              <Box
                w={12}
                h={12}
                bgGradient="linear(135deg, primary.500, primary.600)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="2xl"
                fontWeight="bold"
                boxShadow="md"
              >
                Q
              </Box>
              <VStack align="start" spacing={0}>
                <Text
                  fontWeight="700"
                  fontSize="lg"
                  color="secondary.600"
                  lineHeight="short"
                >
                  QLoRA Copilot
                </Text>
                <Text fontSize="xs" color="secondary.500" lineHeight="short">
                  Fine-tuning platform
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* API Status Indicator */}
        <Box
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor={borderColor}
          bg="gray.50"
        >
          <HStack spacing={3} justify="space-between">
            <HStack spacing={2}>
              <Box
                w={2.5}
                h={2.5}
                borderRadius="full"
                bg={getStatusColor(apiStatus)}
                boxShadow={`0 0 10px ${getStatusColor(apiStatus)}`}
                animation={apiStatus === 'connected' ? 'none' : 'pulse 2s infinite'}
              />
              <Text fontSize="xs" color="secondary.600" fontWeight="600" textTransform="uppercase">
                API Status
              </Text>
            </HStack>
            <Badge
              colorScheme={apiStatus === 'connected' ? 'green' : 'red'}
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
            >
              {apiStatus === 'connected' ? 'Online' : 'Offline'}
            </Badge>
          </HStack>
        </Box>

        {/* Navigation Items */}
        <VStack
          flex={1}
          py={4}
          px={3}
          spacing={4}
          align="stretch"
          role="menu"
          aria-label="Main navigation"
        >
          {categoryOrder.map((category) => {
            const items = groupedItems[category];
            if (!items || items.length === 0) return null;

            return (
              <Box key={category}>
                {category !== 'Main' && (
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color="secondary.500"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    px={3}
                    mb={2}
                  >
                    {category}
                  </Text>
                )}
                <VStack spacing={1} align="stretch">
                  {items.map((item) => (
                    <NavItemComponent
                      key={item.name}
                      item={item}
                      isActive={isItemActive(item.href)}
                      onClose={onClose}
                    />
                  ))}
                </VStack>
              </Box>
            );
          })}
        </VStack>

        {/* Footer */}
        <Box
          p={4}
          borderTopWidth="1px"
          borderColor={borderColor}
          bg="gray.50"
        >
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xs" color="secondary.500" fontWeight="500">
                Version
              </Text>
              <Text fontSize="xs" color="secondary.600" fontWeight="600">
                v1.0.0
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs" color="secondary.500" fontWeight="500">
                Active Jobs
              </Text>
              <Badge colorScheme="primary" fontSize="xs" borderRadius="md">
                {runningJobs}
              </Badge>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default Sidebar;