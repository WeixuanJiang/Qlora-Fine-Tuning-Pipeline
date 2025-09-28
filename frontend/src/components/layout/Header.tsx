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
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
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
    icon: FiHome,
    breadcrumbs: [{ label: 'Dashboard' }],
  },
  {
    path: '/train',
    title: 'Train Model',
    subtitle: 'Fine-tune language models with QLoRA',
    icon: FiPlay,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Train' },
    ],
  },
  {
    path: '/generate',
    title: 'Generate Text',
    subtitle: 'Test your fine-tuned models',
    icon: FiEdit3,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Generate' },
    ],
  },
  {
    path: '/evaluate',
    title: 'Evaluate Model',
    subtitle: 'Run comprehensive model evaluations',
    icon: FiBarChart3,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Evaluate' },
    ],
  },
  {
    path: '/evaluate/dashboard',
    title: 'Evaluation Dashboard',
    subtitle: 'View and analyze evaluation results',
    icon: FiActivity,
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
    icon: FiGitMerge,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Merge' },
    ],
  },
  {
    path: '/jobs',
    title: 'Training Jobs',
    subtitle: 'Monitor and manage training jobs',
    icon: FiList,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Jobs' },
    ],
  },
  {
    path: '/settings',
    title: 'Settings',
    subtitle: 'Configure application preferences',
    icon: FiSettings,
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Settings' },
    ],
  },
];

const Header: React.FC = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
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
    <Box
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={8}
      py={6}
    >
      <Flex direction="column" gap={4}>
        {/* Breadcrumbs */}
        {currentPage.breadcrumbs && currentPage.breadcrumbs.length > 1 && (
          <Breadcrumb
            spacing={2}
            separator={<ChevronRightIcon color="gray.400" boxSize={3} />}
            fontSize="sm"
          >
            {currentPage.breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem
                key={index}
                isCurrentPage={index === currentPage.breadcrumbs!.length - 1}
              >
                {crumb.href ? (
                  <BreadcrumbLink
                    as={RouterLink}
                    to={crumb.href}
                    color="gray.500"
                    _hover={{ color: 'primary.500' }}
                    transition="color 0.2s"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <Text color="gray.700" _dark={{ color: 'gray.300' }} fontWeight="medium">
                    {crumb.label}
                  </Text>
                )}
              </BreadcrumbItem>
            ))}
          </Breadcrumb>
        )}

        {/* Page Title and Icon */}
        <HStack spacing={4} align="center">
          <Box
            p={3}
            bg="primary.50"
            _dark={{ bg: 'primary.900' }}
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              as={currentPage.icon}
              boxSize={6}
              color={iconColor}
            />
          </Box>
          <Box>
            <Heading
              size="lg"
              color={titleColor}
              fontWeight="bold"
              lineHeight="shorter"
            >
              {currentPage.title}
            </Heading>
            {currentPage.subtitle && (
              <Text
                color={subtitleColor}
                fontSize="md"
                mt={1}
                lineHeight="short"
              >
                {currentPage.subtitle}
              </Text>
            )}
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;