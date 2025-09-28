import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useColorModeValue,
  HStack,
  Icon,
  keyframes,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionHStack = motion(HStack);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);

// Keyframes for animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;
import {
  HomeIcon,
  PlayIcon,
  EditIcon,
  ChartIcon,
  MergeIcon,
  ListIcon,
  SettingsIcon,
  ActivityIcon,
  ChevronRightIcon,
} from '@/components/icons/GeometricIcons';

interface PageMeta {
  path: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

const PAGE_META: PageMeta[] = [
  {
    path: '/',
    title: 'Dashboard',
    subtitle: 'Overview of your QLoRA fine-tuning pipeline',
    icon: HomeIcon,
    breadcrumbs: [{ label: 'Dashboard' }],
  },
  {
    path: '/train',
    title: 'Train Model',
    subtitle: 'Fine-tune language models with QLoRA',
    icon: PlayIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Train' },
    ],
  },
  {
    path: '/generate',
    title: 'Generate Text',
    subtitle: 'Test your fine-tuned models',
    icon: EditIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Generate' },
    ],
  },
  {
    path: '/evaluate',
    title: 'Evaluate Model',
    subtitle: 'Run comprehensive model evaluations',
    icon: ChartIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Evaluate' },
    ],
  },
  {
    path: '/evaluate/dashboard',
    title: 'Evaluation Dashboard',
    subtitle: 'View and analyze evaluation results',
    icon: ActivityIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Evaluate', href: '/evaluate' },
      { label: 'Dashboard' },
    ],
  },
  {
    path: '/merge',
    title: 'Merge Adapters',
    subtitle: 'Combine and merge model adapters',
    icon: MergeIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Merge' },
    ],
  },
  {
    path: '/jobs',
    title: 'Training Jobs',
    subtitle: 'Monitor and manage training jobs',
    icon: ListIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Jobs' },
    ],
  },
  {
    path: '/settings',
    title: 'Settings',
    subtitle: 'Configure application preferences',
    icon: SettingsIcon,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Settings' },
    ],
  },
];

const Header: React.FC = () => {
  const location = useLocation();
  const bgColor = useColorModeValue(
    'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.95) 100%)',
    'linear-gradient(135deg, rgba(88,28,135,0.2) 0%, rgba(131,24,67,0.2) 100%)'
  );
  const titleColor = useColorModeValue('gray.900', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.300');
  const iconColor = useColorModeValue('primary.500', 'primary.300');

  // Find current page meta
  const currentPage = PAGE_META.find(page => {
    if (page.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === page.path;
  }) || PAGE_META[0]; // Default to dashboard

  return (
    <MotionBox
      background={bgColor}
      backdropFilter="blur(20px)"
      borderBottomWidth="2px"
      borderBottomColor={useColorModeValue('primary.200', 'primary.700')}
      px={8}
      py={6}
      position="relative"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      _after={{
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 50%, var(--chakra-colors-accent-400) 100%)',
        backgroundSize: '200% 100%',
        animation: `${shimmer} 3s ease-in-out infinite`,
      }}
    >
      <MotionFlex 
        direction="column" 
        gap={4}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Breadcrumbs */}
        {currentPage.breadcrumbs && currentPage.breadcrumbs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Breadcrumb
              spacing={3}
              separator={
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ChevronRightIcon color="primary.400" boxSize={4} />
                </motion.div>
              }
              fontSize="sm"
            >
              {currentPage.breadcrumbs.map((crumb, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                >
                  <BreadcrumbItem
                    isCurrentPage={index === currentPage.breadcrumbs!.length - 1}
                  >
                    {crumb.href ? (
                      <BreadcrumbLink
                        as={RouterLink}
                        to={crumb.href}
                        color="gray.500"
                        fontWeight="medium"
                        px={2}
                        py={1}
                        borderRadius="lg"
                        _hover={{ 
                          color: 'primary.600',
                          background: 'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(219,39,119,0.1) 100%)',
                          transform: 'scale(1.05)'
                        }}
                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <Text 
                        color="primary.600" 
                        _dark={{ color: 'primary.300' }} 
                        fontWeight="bold"
                        fontFamily="heading"
                        px={2}
                        py={1}
                      >
                        {crumb.label}
                      </Text>
                    )}
                  </BreadcrumbItem>
                </motion.div>
              ))}
            </Breadcrumb>
          </motion.div>
        )}

        {/* Page Title and Icon */}
        <MotionHStack 
          spacing={6} 
          align="center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <MotionBox
            p={4}
            background={useColorModeValue(
              'linear-gradient(135deg, rgba(147,51,234,0.1) 0%, rgba(219,39,119,0.1) 100%)',
              'linear-gradient(135deg, rgba(147,51,234,0.3) 0%, rgba(219,39,119,0.3) 100%)'
            )}
            borderRadius="2xl"
            border="2px solid"
            borderColor={useColorModeValue('primary.200', 'primary.600')}
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            whileHover={{ 
              scale: 1.1, 
              rotate: 5,
              boxShadow: '0 10px 30px rgba(147,51,234,0.3)'
            }}
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0]
            }}
            transition={{
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              hover: { type: 'spring', stiffness: 300 }
            }}
            _before={{
              content: '""',
              position: 'absolute',
              top: '-2px',
              left: '-2px',
              right: '-2px',
              bottom: '-2px',
              background: 'linear-gradient(135deg, var(--chakra-colors-primary-400) 0%, var(--chakra-colors-secondary-400) 50%, var(--chakra-colors-accent-400) 100%)',
              borderRadius: '2xl',
              zIndex: -1,
              backgroundSize: '200% 200%',
              animation: `${shimmer} 4s ease-in-out infinite`,
            }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Icon
                as={currentPage.icon}
                boxSize={7}
                color={iconColor}
              />
            </motion.div>
          </MotionBox>
          <MotionBox
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <MotionHeading
              size="xl"
              color={titleColor}
              fontWeight="bold"
              fontFamily="heading"
              lineHeight="shorter"
              background={useColorModeValue(
                'linear-gradient(135deg, var(--chakra-colors-primary-600) 0%, var(--chakra-colors-secondary-600) 100%)',
                'linear-gradient(135deg, var(--chakra-colors-primary-300) 0%, var(--chakra-colors-secondary-300) 100%)'
              )}
              bgClip="text"
              _webkit-background-clip="text"
              _webkit-text-fill-color="transparent"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {currentPage.title}
            </MotionHeading>
            {currentPage.subtitle && (
              <MotionText
                color={subtitleColor}
                fontSize="lg"
                mt={2}
                lineHeight="short"
                fontFamily="body"
                fontWeight="medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                whileHover={{ x: 5 }}
              >
                {currentPage.subtitle}
              </MotionText>
            )}
          </MotionBox>
         </MotionHStack>
       </MotionFlex>
     </MotionBox>
  );
};

export default Header;