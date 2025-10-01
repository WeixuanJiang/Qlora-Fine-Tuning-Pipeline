import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  
  HStack,
  Icon,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { Link as RouterLink, useLocation } from 'react-router-dom';
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
  const bgColor = 'white';
  const borderColor = 'secondary.200';
  const titleColor = 'secondary.600';
  const subtitleColor = 'secondary.500';
  const iconBg = 'primary.50';
  const iconColor = 'primary.600';

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
      borderBottomColor={borderColor}
      px={{ base: 4, md: 8 }}
      py={6}
      boxShadow="sm"
    >
      <Flex direction="column" gap={3}>
        {/* Breadcrumbs */}
        {currentPage.breadcrumbs && currentPage.breadcrumbs.length > 1 && (
          <Breadcrumb
            spacing={2}
            separator={<ChevronRightIcon color="secondary.400" />}
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
                    color="secondary.500"
                    fontWeight="500"
                    _hover={{
                      color: 'primary.600',
                      textDecoration: 'none',
                    }}
                    transition="color 0.15s"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <Text
                    color="secondary.600"
                    fontWeight="600"
                  >
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
            bg={iconBg}
            borderRadius="lg"
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
              fontWeight="700"
              lineHeight="shorter"
            >
              {currentPage.title}
            </Heading>
            {currentPage.subtitle && (
              <Text
                color={subtitleColor}
                fontSize="sm"
                mt={1}
                lineHeight="short"
                fontWeight="500"
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