import React, { useState, useEffect } from 'react';
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
  keyframes,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  PlayIcon,
  EditIcon,
  ChartIcon,
  MergeIcon,
  ListIcon,
  SettingsIcon,
  ActivityIcon,
} from '@/components/icons/GeometricIcons';
import { useAppStore } from '@/stores/appStore';
import { useJobStore } from '@/stores/jobStore';

// Create motion components
const MotionBox = motion(Box);
const MotionLink = motion(Link);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

// Keyframes for floating animation
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-2px) rotate(1deg); }
  50% { transform: translateY(-4px) rotate(0deg); }
  75% { transform: translateY(-2px) rotate(-1deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

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
    icon: HomeIcon,
    description: 'Overview and system status',
  },
  {
    name: 'Train',
    href: '/train',
    icon: PlayIcon,
    description: 'Fine-tune language models',
  },
  {
    name: 'Generate',
    href: '/generate',
    icon: EditIcon,
    description: 'Generate text with models',
  },
  {
    name: 'Evaluate',
    href: '/evaluate',
    icon: ChartIcon,
    description: 'Model performance metrics',
    children: [
      {
        name: 'Run Evaluation',
        href: '/evaluate',
        icon: ActivityIcon,
        description: 'Start new evaluation',
      },
      {
        name: 'Dashboard',
        href: '/evaluate/dashboard',
        icon: ChartIcon,
        description: 'View evaluation results',
      },
    ],
  },
  {
    name: 'Merge',
    href: '/merge',
    icon: MergeIcon,
    description: 'Merge model adapters',
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: ListIcon,
    description: 'Training job management',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
    description: 'Application configuration',
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isChild?: boolean;
  onClose?: () => void;
  index?: number;
}

const NavItemComponent: React.FC<NavItemComponentProps> = ({ item, isActive, isChild = false, onClose, index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const hoverBg = useColorModeValue(
    'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(219,39,119,0.1) 100%)',
    'linear-gradient(135deg, rgba(147,51,234,0.2) 0%, rgba(219,39,119,0.2) 100%)'
  );
  const activeBg = useColorModeValue(
    'linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(219,39,119,0.15) 100%)',
    'linear-gradient(135deg, rgba(147,51,234,0.3) 0%, rgba(219,39,119,0.3) 100%)'
  );
  const activeColor = useColorModeValue('primary.600', 'primary.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20, 
      scale: 0.95,
      filter: 'blur(4px)'
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.1
      }
    },
    hover: {
      x: 8,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: 'spring',
        stiffness: 600,
        damping: 30
      }
    }
  };

  return (
    <MotionBox
      variants={itemVariants}
      initial="hidden"
      animate={hasAnimated ? "visible" : "hidden"}
      whileHover="hover"
      whileTap="tap"
    >
      <Tooltip
        label={item.description}
        placement="right"
        hasArrow
        bg="primary.600"
        color="white"
        isDisabled={!item.description}
        openDelay={300}
      >
        <MotionLink
          as={RouterLink}
          to={item.href}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          display="block"
          px={isChild ? 6 : 4}
          py={4}
          mx={2}
          borderRadius="2xl"
          background={isActive ? activeBg : 'transparent'}
          color={isActive ? activeColor : textColor}
          border={isActive ? '2px solid' : '2px solid transparent'}
          borderColor={isActive ? 'primary.300' : 'transparent'}
          _hover={{
            background: hoverBg,
            textDecoration: 'none',
            borderColor: 'primary.200',
            boxShadow: '0 8px 32px rgba(147, 51, 234, 0.25), 0 0 0 1px rgba(147, 51, 234, 0.1)',
          }}
          transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          position="relative"
          role="menuitem"
          aria-current={isActive ? 'page' : undefined}
          overflow="hidden"
          _before={isActive ? {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '60%',
            background: 'linear-gradient(180deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 100%)',
            borderRadius: '0 2px 2px 0',
            animation: `${pulse} 2s ease-in-out infinite`,
          } : {}}
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            transition: 'left 0.6s ease-in-out',
            ...(isHovered && {
              left: '100%'
            })
          }}
        >
          <MotionHStack spacing={3}>
            <MotionBox
              animate={{
                rotate: isHovered ? [0, -10, 10, 0] : 0,
                scale: isActive ? [1, 1.1, 1] : 1,
              }}
              transition={{
                rotate: { duration: 0.5, ease: "easeInOut" },
                scale: { duration: 2, repeat: isActive ? Infinity : 0, repeatType: "reverse" }
              }}
            >
              <Icon
                as={item.icon}
                boxSize={isChild ? 4 : 5}
                color={isActive ? activeColor : mutedColor}
                filter={isActive ? 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))' : 'none'}
                transition="all 0.3s ease"
              />
            </MotionBox>
            <VStack align="start" spacing={0} flex={1}>
              <MotionBox
                animate={{
                  y: isHovered ? [-1, 1, -1] : 0,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isHovered ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <Text
                  fontSize={isChild ? 'sm' : 'md'}
                  fontWeight={isActive ? 'bold' : 'medium'}
                  fontFamily="heading"
                  lineHeight="short"
                  bgGradient={isActive ? 'linear(to-r, primary.400, secondary.400)' : 'none'}
                  bgClip={isActive ? 'text' : 'none'}
                  transition="all 0.3s ease"
                >
                  {item.name}
                </Text>
              </MotionBox>
              {item.description && !isChild && (
                <Text fontSize="xs" color={mutedColor} lineHeight="short">
                  {item.description}
                </Text>
              )}
            </VStack>
            <AnimatePresence>
              {item.badge && (
                <MotionBox
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 25
                  }}
                >
                  <Badge
                    size="sm"
                    variant="gradient"
                    borderRadius="full"
                    animation={`${pulse} 2s ease-in-out infinite`}
                  >
                    {item.badge}
                  </Badge>
                </MotionBox>
              )}
            </AnimatePresence>
          </MotionHStack>
        </MotionLink>
      </Tooltip>
    </MotionBox>
  );
}

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

  const sidebarVariants = {
    hidden: { 
      x: -280, 
      opacity: 0,
      filter: 'blur(10px)'
    },
    visible: { 
      x: 0, 
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <MotionBox
      as="nav"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      w={isMobile ? 'full' : '280px'}
      h={isMobile ? 'auto' : '100vh'}
      background={useColorModeValue(
        'linear-gradient(180deg, rgba(147,51,234,0.05) 0%, rgba(219,39,119,0.05) 50%, rgba(234,88,12,0.05) 100%)',
        'linear-gradient(180deg, rgba(88,28,135,0.3) 0%, rgba(131,24,67,0.3) 50%, rgba(154,52,18,0.3) 100%)'
      )}
      backdropFilter="blur(20px)"
      borderRightWidth={isMobile ? 0 : '2px'}
      borderRightColor={useColorModeValue('primary.200', 'primary.700')}
      position={isMobile ? 'relative' : 'sticky'}
      top={0}
      overflowY="auto"
      boxShadow="0 8px 32px rgba(147, 51, 234, 0.15)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '2px',
        height: '100%',
        background: 'linear-gradient(180deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 50%, var(--chakra-colors-accent-400) 100%)',
        animation: `${pulse} 3s ease-in-out infinite`,
      }}
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
          <MotionBox 
            p={6} 
            borderBottomWidth="1px" 
            borderColor={borderColor}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
          >
            <MotionHStack 
              spacing={3}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <MotionBox
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
                whileHover={{ 
                  rotate: [0, -10, 10, 0],
                  scale: 1.1,
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.6)'
                }}
                transition={{ duration: 0.5 }}
                animation={`${float} 6s ease-in-out infinite`}
                bgGradient="linear(45deg, primary.400, secondary.400, accent.400)"
                backgroundSize="200% 200%"
                _hover={{
                  backgroundPosition: '100% 100%'
                }}
              >
                Q
              </MotionBox>
              <VStack align="start" spacing={0}>
                <MotionBox
                  whileHover={{ x: 2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Text 
                    fontWeight="bold" 
                    fontSize="lg" 
                    color={brandColor}
                    bgGradient="linear(to-r, primary.400, secondary.400)"
                    bgClip="text"
                  >
                    QLoRA Copilot
                  </Text>
                </MotionBox>
                <Text fontSize="sm" color="gray.500">
                  Custom language models
                </Text>
              </VStack>
            </MotionHStack>
          </MotionBox>
        )}

        {/* API Status Indicator */}
        <MotionBox 
          px={4} 
          py={3}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <MotionHStack 
            spacing={2}
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <MotionBox
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
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              boxShadow={`0 0 10px ${apiStatus === 'connected' ? 'rgba(72, 187, 120, 0.6)' : apiStatus === 'error' ? 'rgba(245, 101, 101, 0.6)' : 'rgba(236, 201, 75, 0.6)'}`}
            />
            <Text fontSize="xs" color="gray.500">
              API {apiStatus === 'connected' ? 'Connected' : apiStatus === 'error' ? 'Error' : 'Connecting'}
            </Text>
          </MotionHStack>
        </MotionBox>

        <Divider />

        {/* Navigation Items */}
        <MotionBox 
          flex={1} 
          py={4} 
          role="menu" 
          aria-label="Main navigation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <MotionVStack 
            spacing={1} 
            align="stretch"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="visible"
          >
            {navItemsWithBadges.map((item, index) => {
              const isActive = isItemActive(item.href);
              
              return (
                <Box key={item.name}>
                  <NavItemComponent
                    item={item}
                    isActive={isActive && !item.children}
                    onClose={onClose}
                    index={index}
                  />
                  <AnimatePresence>
                    {item.children && (
                      <MotionVStack 
                        spacing={1} 
                        align="stretch" 
                        mt={1}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.children.map((child, childIndex) => (
                          <NavItemComponent
                            key={child.name}
                            item={child}
                            isActive={isItemActive(child.href)}
                            isChild
                            onClose={onClose}
                            index={index + childIndex + 1}
                          />
                        ))}
                      </MotionVStack>
                    )}
                  </AnimatePresence>
                </Box>
              );
            })}
          </MotionVStack>
        </MotionBox>

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