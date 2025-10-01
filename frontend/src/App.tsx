import React from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  HStack,
  Text,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Container,
  VStack,
  IconButton,
} from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuIcon } from '@/components/icons/GeometricIcons';

// Theme and stores
import theme from '@/theme';
import { useHealthCheck } from '@/hooks/useApi';

// Components
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import NotificationToast from '@/components/common/NotificationToast';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import TrainPage from '@/pages/TrainPage';
import GeneratePage from '@/pages/GeneratePage';
import EvaluatePage from '@/pages/EvaluatePage';
import EvaluationDashboardPage from '@/pages/EvaluationDashboardPage';
import MergePage from '@/pages/MergePage';
import JobsPage from '@/pages/JobsPage';
import SettingsPage from '@/pages/SettingsPage';
import DatasetPage from '@/pages/DatasetPage';

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

// Mobile navigation component
const MobileNav: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  if (!isMobile) return null;

  return (
    <>
      <IconButton
        aria-label="Open navigation menu"
        icon={<MenuIcon />}
        onClick={onOpen}
        variant="ghost"
        size="sm"
        colorScheme="gray"
        _hover={{
          bg: 'gray.100',
        }}
      />
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="gray.200" bg="white">
            <HStack spacing={3}>
              <Box
                w={10}
                h={10}
                bgGradient="linear(135deg, primary.500, primary.600)"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                fontSize="lg"
                fontWeight="bold"
                boxShadow="sm"
              >
                Q
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm" color="secondary.600">
                  QLoRA Copilot
                </Text>
                <Text fontSize="xs" color="secondary.500">
                  Fine-tuning platform
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
    <Flex minH="100vh" bg="gray.50">
      <SkipLink />

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Main Content Area */}
      <Flex direction="column" flex={1}>
        {/* Top Navigation Bar - Mobile Only */}
        {isMobile && (
          <Box
            bg="white"
            borderBottomWidth="1px"
            borderColor="gray.200"
            px={4}
            py={3}
            position="sticky"
            top={0}
            zIndex="sticky"
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <MobileNav />
                <Box
                  w={8}
                  h={8}
                  bgGradient="linear(135deg, primary.500, primary.600)"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="lg"
                  fontWeight="bold"
                  boxShadow="sm"
                >
                  Q
                </Box>
                <Text fontWeight="700" fontSize="md" color="secondary.600">
                  QLoRA Copilot
                </Text>
              </HStack>
            </Flex>
          </Box>
        )}

        {/* Main Content */}
        <Box as="main" id="main-content" flex={1} overflow="auto">
          <Container maxW="7xl" py={8} px={{ base: 4, md: 8 }}>
            {children}
          </Container>
        </Box>

        {/* Footer */}
        <Footer />
      </Flex>
    </Flex>
  );
};

// App content component (inside providers)
const AppContent: React.FC = () => {
  // Initialize health check (now inside QueryClientProvider)
  useHealthCheck();

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/train" element={<TrainPage />} />
          <Route path="/datasets" element={<DatasetPage />} />
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
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ChakraProvider>
  );
};

export default App;
