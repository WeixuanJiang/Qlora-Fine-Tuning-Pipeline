import React from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Container,
  Divider,
} from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { motion, AnimatePresence } from 'framer-motion';

// Theme and stores
import theme from '@/theme';
import useAppStore from '@/stores/appStore';
import { useTheme } from '@/hooks/useTheme';
import { useHealthCheck } from '@/hooks/useApi';

// Components
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NotificationToast from '@/components/common/NotificationToast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import TrainPage from '@/pages/TrainPage';
import GeneratePage from '@/pages/GeneratePage';
import EvaluatePage from '@/pages/EvaluatePage';
import EvaluationDashboardPage from '@/pages/EvaluationDashboardPage';
import MergePage from '@/pages/MergePage';
import JobsPage from '@/pages/JobsPage';
import SettingsPage from '@/pages/SettingsPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Motion components
const MotionBox = motion(Box);

// Skip link component for accessibility
const SkipLink: React.FC = () => (
  <Box
    as="a"
    href="#main-content"
    position="absolute"
    top="-40px"
    left="6px"
    zIndex="skipLink"
    bg="primary.600"
    color="white"
    px={4}
    py={2}
    borderRadius="md"
    textDecoration="none"
    fontSize="sm"
    fontWeight="semibold"
    _focus={{
      top: "6px",
      outline: "2px solid",
      outlineColor: "primary.300",
    }}
  >
    Skip to main content
  </Box>
);

// Theme toggle component
const ThemeToggle: React.FC = () => {
  const { toggleColorMode, isDark } = useTheme();

  return (
    <IconButton
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
      color="gray.500"
      _hover={{
        color: 'primary.500',
        bg: 'gray.100',
        _dark: { bg: 'gray.700' },
      }}
    />
  );
};

// Mobile navigation component
const MobileNav: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  if (!isMobile) return null;

  return (
    <>
      <IconButton
        aria-label="Open navigation menu"
        icon={<HamburgerIcon />}
        onClick={onOpen}
        variant="ghost"
        size="sm"
        color="gray.500"
        _hover={{
          color: 'primary.500',
          bg: 'gray.100',
          _dark: { bg: 'gray.700' },
        }}
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack spacing={3}>
              <Box
                w={8}
                h={8}
                bg="primary.500"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="lg"
                fontWeight="bold"
              >
                Q
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">
                  QLoRA Copilot
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Custom language models
                </Text>
              </VStack>
            </HStack>
          </DrawerHeader>
          <DrawerBody p={0}>
            <Sidebar isMobile onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Main app layout component
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  return (
    <Flex minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <SkipLink />
      
      {/* Desktop Sidebar */}
      {!isMobile && (
        <MotionBox
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Sidebar />
        </MotionBox>
      )}

      {/* Main Content Area */}
      <Flex direction="column" flex={1} overflow="hidden">
        {/* Top Navigation Bar */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
          px={6}
          py={4}
          position="sticky"
          top={0}
          zIndex="sticky"
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <MobileNav />
              {isMobile && (
                <HStack spacing={3}>
                  <Box
                    w={8}
                    h={8}
                    bg="primary.500"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="lg"
                    fontWeight="bold"
                  >
                    Q
                  </Box>
                  <Text fontWeight="bold" fontSize="lg">
                    QLoRA Copilot
                  </Text>
                </HStack>
              )}
            </HStack>
            <HStack spacing={2}>
              <ThemeToggle />
            </HStack>
          </Flex>
        </Box>

        {/* Page Header */}
        <Header />

        {/* Main Content */}
        <Box as="main" id="main-content" flex={1} overflow="auto">
          <Container maxW="7xl" py={8}>
            <AnimatePresence mode="wait">
              <MotionBox
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </MotionBox>
            </AnimatePresence>
          </Container>
        </Box>

        {/* Footer */}
        <Footer />
      </Flex>
    </Flex>
  );
};

// Main App component
const App: React.FC = () => {
  // Initialize health check
  useHealthCheck();

  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/train" element={<TrainPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/evaluate" element={<EvaluatePage />} />
              <Route path="/evaluate/dashboard" element={<EvaluationDashboardPage />} />
              <Route path="/merge" element={<MergePage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppLayout>
          <NotificationToast />
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;