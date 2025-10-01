import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Box as Card,
  
  
  Code,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Divider,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Spacer,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/common/Alert';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import {
  SettingsIcon,
  SaveIcon,
  RefreshIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  ServerIcon,
  DatabaseIcon,
  CpuIcon,
  HardDriveIcon,
  WifiIcon,
  ShieldIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
  AlertIcon as WarningTriangleIcon,
  GlobeIcon,
  MailIcon,
  BellIcon,
  KeyIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
    CheckIcon,
  FolderIcon,
  EditIcon,
} from '@/components/icons/GeometricIcons';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);

interface SystemInfo {
  version: string;
  buildNumber: string;
  pythonVersion: string;
  torchVersion: string;
  cudaVersion: string;
  gpuInfo: string;
  totalMemory: string;
  availableMemory: string;
  diskSpace: string;
  uptime: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    desktop: boolean;
    jobComplete: boolean;
    jobFailed: boolean;
    systemAlerts: boolean;
  };
  autoSave: boolean;
  maxConcurrentJobs: number;
  defaultOutputPath: string;
  logLevel: string;
}

interface APIConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  enableCaching: boolean;
  cacheTimeout: number;
}

const SettingsPage: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { theme, setTheme } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resetType, setResetType] = useState<'settings' | 'data' | 'all'>('settings');
  
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.2.3',
    buildNumber: '20240115.1',
    pythonVersion: '3.9.16',
    torchVersion: '2.1.0',
    cudaVersion: '11.8',
    gpuInfo: 'NVIDIA RTX 4090 (24GB)',
    totalMemory: '32 GB',
    availableMemory: '18.5 GB',
    diskSpace: '1.2 TB / 2 TB',
    uptime: '5 days, 12 hours',
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      desktop: true,
      jobComplete: true,
      jobFailed: true,
      systemAlerts: true,
    },
    autoSave: true,
    maxConcurrentJobs: 3,
    defaultOutputPath: '/models/output',
    logLevel: 'info',
  });
  
  const [apiConfig, setApiConfig] = useState<APIConfig>({
    baseUrl: 'http://localhost:8000',
    timeout: 30000,
    retryAttempts: 3,
    enableCaching: true,
    cacheTimeout: 300000,
  });
  
  const [apiKey, setApiKey] = useState('sk-1234567890abcdef...');
  const [tempApiKey, setTempApiKey] = useState('');
  
  const toast = useToast();
  const cardBg = 'white';
  
  useEffect(() => {
    // Load system info
    loadSystemInfo();
  }, []);
  
  const loadSystemInfo = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // System info would be loaded from API
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load system information',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleReset = async () => {
    try {
      // Simulate reset operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (resetType === 'settings' || resetType === 'all') {
        setPreferences({
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            desktop: true,
            jobComplete: true,
            jobFailed: true,
            systemAlerts: true,
          },
          autoSave: true,
          maxConcurrentJobs: 3,
          defaultOutputPath: '/models/output',
          logLevel: 'info',
        });
      }
      
      toast({
        title: 'Reset Complete',
        description: `${resetType === 'all' ? 'All data' : resetType} has been reset successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleExportSettings = () => {
    const settings = {
      preferences,
      apiConfig,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qlora-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Settings Exported',
      description: 'Settings have been exported successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  const ResetModal: React.FC = () => {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={WarningTriangleIcon} color="red.500" />
              <Text>Reset Data</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>This action cannot be undone. Please select what you want to reset:</Text>
              </Alert>
              
              <RadioGroup value={resetType} onChange={(value) => setResetType(value as any)}>
                <Stack spacing={3}>
                  <Radio value="settings">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Settings Only</Text>
                      <Text fontSize="sm" color="gray.500">
                        Reset user preferences and configuration
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="data">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Data Only</Text>
                      <Text fontSize="sm" color="gray.500">
                        Clear jobs, models, and training data
                      </Text>
                    </VStack>
                  </Radio>
                  <Radio value="all">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Everything</Text>
                      <Text fontSize="sm" color="gray.500">
                        Reset all settings and clear all data
                      </Text>
                    </VStack>
                  </Radio>
                </Stack>
              </RadioGroup>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleReset}>
              Reset {resetType === 'all' ? 'Everything' : resetType}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  if (isLoading) {
    return <LoadingSpinner message="Loading system information..." />;
  }
  
  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="lg" mb={2}>
            Settings
          </Heading>
          <Text color="gray.500">
            Configure your QLoRA Fine-Tuning Pipeline preferences and system settings
          </Text>
        </Box>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<DownloadIcon />}
            variant="outline"
            onClick={handleExportSettings}
          >
            Export
          </Button>
          <Button
            leftIcon={<SaveIcon />}
            colorScheme="primary"
            onClick={handleSaveSettings}
            isLoading={isSaving}
            loadingText="Saving..."
          >
            Save Settings
          </Button>
        </HStack>
      </Flex>
      
      <Tabs variant="enclosed" colorScheme="primary">
        <TabList>
          <Tab>General</Tab>
          <Tab>API & Security</Tab>
          <Tab>System Info</Tab>
          <Tab>Advanced</Tab>
        </TabList>
        
        <TabPanels>
          {/* General Settings Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Appearance */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={colorMode === 'light' ? SunIcon : MoonIcon} color="primary.500" />
                    <Heading size="md">Appearance</Heading>
                  </HStack>
                </Box>
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Theme</FormLabel>
                      <RadioGroup
                        value={preferences.theme}
                        onChange={(value) => setPreferences(prev => ({ ...prev, theme: value as any }))}
                      >
                        <Stack direction="row" spacing={6}>
                          <Radio value="light">
                            <HStack spacing={2}>
                              <Icon as={SunIcon} />
                              <Text>Light</Text>
                            </HStack>
                          </Radio>
                          <Radio value="dark">
                            <HStack spacing={2}>
                              <Icon as={MoonIcon} />
                              <Text>Dark</Text>
                            </HStack>
                          </Radio>
                          <Radio value="system">
                            <HStack spacing={2}>
                              <Icon as={MonitorIcon} />
                              <Text>System</Text>
                            </HStack>
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Language</FormLabel>
                      <Select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                        <option value="Asia/Shanghai">Shanghai</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </Box>
              </MotionCard>
              
              {/* Notifications */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={BellIcon} color="primary.500" />
                    <Heading size="md">Notifications</Heading>
                  </HStack>
                </Box>
                <Box>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Email Notifications</Text>
                        <Text fontSize="sm" color="gray.500">
                          Receive notifications via email
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={preferences.notifications.email}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: e.target.checked }
                        }))}
                        colorScheme="primary"
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Desktop Notifications</Text>
                        <Text fontSize="sm" color="gray.500">
                          Show browser notifications
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={preferences.notifications.desktop}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, desktop: e.target.checked }
                        }))}
                        colorScheme="primary"
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Job Completion</Text>
                        <Text fontSize="sm" color="gray.500">
                          Notify when training jobs complete
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={preferences.notifications.jobComplete}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, jobComplete: e.target.checked }
                        }))}
                        colorScheme="primary"
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Job Failures</Text>
                        <Text fontSize="sm" color="gray.500">
                          Notify when training jobs fail
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={preferences.notifications.jobFailed}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, jobFailed: e.target.checked }
                        }))}
                        colorScheme="primary"
                      />
                    </HStack>
                    
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">System Alerts</Text>
                        <Text fontSize="sm" color="gray.500">
                          Notify about system issues and updates
                        </Text>
                      </VStack>
                      <Switch
                        isChecked={preferences.notifications.systemAlerts}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, systemAlerts: e.target.checked }
                        }))}
                        colorScheme="primary"
                      />
                    </HStack>
                  </VStack>
                </Box>
              </MotionCard>
              
              {/* General Preferences */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={SettingsIcon} color="primary.500" />
                    <Heading size="md">General Preferences</Heading>
                  </HStack>
                </Box>
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Default Output Path</FormLabel>
                      <Input
                        value={preferences.defaultOutputPath}
                        onChange={(e) => setPreferences(prev => ({ ...prev, defaultOutputPath: e.target.value }))}
                        placeholder="/models/output"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Max Concurrent Jobs: {preferences.maxConcurrentJobs}</FormLabel>
                      <Slider
                        value={preferences.maxConcurrentJobs}
                        onChange={(value) => setPreferences(prev => ({ ...prev, maxConcurrentJobs: value }))}
                        min={1}
                        max={8}
                        step={1}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Log Level</FormLabel>
                      <Select
                        value={preferences.logLevel}
                        onChange={(e) => setPreferences(prev => ({ ...prev, logLevel: e.target.value }))}
                      >
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </Select>
                    </FormControl>
                    
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Auto Save</Text>
                          <Text fontSize="sm" color="gray.500">
                            Automatically save work in progress
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={preferences.autoSave}
                          onChange={(e) => setPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                          colorScheme="primary"
                        />
                      </HStack>
                    </VStack>
                  </SimpleGrid>
                </Box>
              </MotionCard>
            </VStack>
          </TabPanel>
          
          {/* API & Security Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* API Configuration */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={ServerIcon} color="primary.500" />
                    <Heading size="md">API Configuration</Heading>
                  </HStack>
                </Box>
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Base URL</FormLabel>
                      <Input
                        value={apiConfig.baseUrl}
                        onChange={(e) => setApiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                        placeholder="http://localhost:8000"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Timeout (ms)</FormLabel>
                      <NumberInput
                        value={apiConfig.timeout}
                        onChange={(_, value) => setApiConfig(prev => ({ ...prev, timeout: value }))}
                        min={1000}
                        max={300000}
                        step={1000}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Retry Attempts</FormLabel>
                      <NumberInput
                        value={apiConfig.retryAttempts}
                        onChange={(_, value) => setApiConfig(prev => ({ ...prev, retryAttempts: value }))}
                        min={0}
                        max={10}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Cache Timeout (ms)</FormLabel>
                      <NumberInput
                        value={apiConfig.cacheTimeout}
                        onChange={(_, value) => setApiConfig(prev => ({ ...prev, cacheTimeout: value }))}
                        min={0}
                        max={3600000}
                        step={60000}
                        isDisabled={!apiConfig.enableCaching}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                  
                  <Divider my={6} />
                  
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">Enable Caching</Text>
                      <Text fontSize="sm" color="gray.500">
                        Cache API responses to improve performance
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={apiConfig.enableCaching}
                      onChange={(e) => setApiConfig(prev => ({ ...prev, enableCaching: e.target.checked }))}
                      colorScheme="primary"
                    />
                  </HStack>
                </Box>
              </MotionCard>
              
              {/* Security */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={ShieldIcon} color="primary.500" />
                    <Heading size="md">Security</Heading>
                  </HStack>
                </Box>
                <Box>
                  <VStack spacing={6} align="stretch">
                    <FormControl>
                      <FormLabel>API Key</FormLabel>
                      <HStack spacing={3}>
                        <Input
                          type={showApiKey ? 'text' : 'password'}
                          value={showApiKey ? apiKey : '••••••••••••••••'}
                          onChange={(e) => setTempApiKey(e.target.value)}
                          placeholder="Enter your API key"
                        />
                        <IconButton
                          icon={showApiKey ? <EyeOffIcon /> : <EyeIcon />}
                          onClick={() => setShowApiKey(!showApiKey)}
                          variant="outline"
                        />
                      </HStack>
                    </FormControl>
                    
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">API Key Security</Text>
                        <Text fontSize="sm" mt={1}>
                          Your API key is encrypted and stored securely. It's only used for authentication with the backend services.
                        </Text>
                      </Box>
                    </Alert>
                  </VStack>
                </Box>
              </MotionCard>
            </VStack>
          </TabPanel>
          
          {/* System Info Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* System Information */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3} justify="space-between">
                    <HStack spacing={3}>
                      <Icon as={InfoIcon} color="primary.500" />
                      <Heading size="md">System Information</Heading>
                    </HStack>
                    <Button
                      leftIcon={<RefreshIcon />}
                      size="sm"
                      variant="outline"
                      onClick={loadSystemInfo}
                      isLoading={isLoading}
                    >
                      Refresh
                    </Button>
                  </HStack>
                </Box>
                <Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Stat>
                      <StatLabel>Application Version</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.version}</StatNumber>
                      <StatHelpText>Build {systemInfo.buildNumber}</StatHelpText>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>Python Version</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.pythonVersion}</StatNumber>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>PyTorch Version</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.torchVersion}</StatNumber>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>CUDA Version</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.cudaVersion}</StatNumber>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>GPU Information</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.gpuInfo}</StatNumber>
                    </Stat>
                    
                    <Stat>
                      <StatLabel>System Uptime</StatLabel>
                      <StatNumber fontSize="lg">{systemInfo.uptime}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                  
                  <Divider my={6} />
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box>
                      <Text fontWeight="medium" mb={3}>Memory Usage</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Total Memory</Text>
                          <Text fontSize="sm" fontWeight="medium">{systemInfo.totalMemory}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontSize="sm">Available</Text>
                          <Text fontSize="sm" fontWeight="medium" color="green.500">
                            {systemInfo.availableMemory}
                          </Text>
                        </HStack>
                        <Progress value={42} colorScheme="blue" size="sm" />
                      </VStack>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium" mb={3}>Disk Usage</Text>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm">Storage</Text>
                          <Text fontSize="sm" fontWeight="medium">{systemInfo.diskSpace}</Text>
                        </HStack>
                        <Progress value={60} colorScheme="orange" size="sm" />
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </Box>
              </MotionCard>
            </VStack>
          </TabPanel>
          
          {/* Advanced Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Advanced Settings */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor={'gray.200'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={SettingsIcon} color="primary.500" />
                    <Heading size="md">Advanced Settings</Heading>
                  </HStack>
                </Box>
                <Box>
                  <Accordion allowToggle>
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">Performance Tuning</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel>Worker Threads</FormLabel>
                            <NumberInput defaultValue={4} min={1} max={16}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                          
                          <FormControl>
                            <FormLabel>Memory Buffer (GB)</FormLabel>
                            <NumberInput defaultValue={2} min={1} max={32}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">Debug Options</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Text>Enable Debug Mode</Text>
                            <Switch colorScheme="primary" />
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text>Verbose Logging</Text>
                            <Switch colorScheme="primary" />
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text>Performance Metrics</Text>
                            <Switch colorScheme="primary" />
                          </HStack>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                    
                    <AccordionItem>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">Data Management</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">Auto Cleanup</Text>
                              <Text fontSize="sm" color="gray.500">
                                Automatically clean up old logs and temporary files
                              </Text>
                            </VStack>
                            <Switch colorScheme="primary" />
                          </HStack>
                          
                          <FormControl>
                            <FormLabel>Cleanup Interval (days)</FormLabel>
                            <NumberInput defaultValue={7} min={1} max={30}>
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </MotionCard>
              
              {/* Danger Zone */}
              <MotionCard
                bg={cardBg}
                shadow="sm"
                borderRadius="xl"
                border="1px"
                borderColor="red.200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Box>
                  <HStack spacing={3}>
                    <Icon as={WarningTriangleIcon} color="red.500" />
                    <Heading size="md" color="red.500">Danger Zone</Heading>
                  </HStack>
                </Box>
                <Box>
                  <VStack spacing={4} align="stretch">
                    <Alert status="warning">
                      <AlertIcon />
                      <Text>These actions are irreversible. Please proceed with caution.</Text>
                    </Alert>
                    
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Reset Application Data</Text>
                        <Text fontSize="sm" color="gray.500">
                          Clear all settings, jobs, and cached data
                        </Text>
                      </VStack>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<TrashIcon />}
                        onClick={onOpen}
                      >
                        Reset
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </MotionCard>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Reset Modal */}
      <ResetModal />
    </VStack>
  );
};

export default SettingsPage;
