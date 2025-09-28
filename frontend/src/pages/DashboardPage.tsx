import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Badge,
  HStack,
  VStack,
  Icon,
  Button,
  useColorModeValue,
  Flex,
  Divider,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiCpu,
  FiHardDrive,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiTrendingUp,
  FiServer,
  FiDatabase,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useJobStore } from '@/stores/jobStore';
import { useAppStore } from '@/stores/appStore';
import { LoadingOverlay } from '@/components/common/LoadingSpinner';

// Motion components
const MotionCard = motion(Card);
const MotionBox = motion(Box);

// Mock system metrics (in a real app, this would come from an API)
const SYSTEM_METRICS = {
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, unit: 'GB' },
  gpu: { usage: 78, memory: 6.2, total: 8, unit: 'GB' },
  storage: { used: 245, total: 500, unit: 'GB' },
};

const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'training_started',
    message: 'Training job "llama-2-7b-chat" started',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'info',
  },
  {
    id: '2',
    type: 'training_completed',
    message: 'Training job "gpt-3.5-finetune" completed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '3',
    type: 'evaluation_started',
    message: 'Model evaluation started for "custom-model-v2"',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'info',
  },
  {
    id: '4',
    type: 'training_failed',
    message: 'Training job "bert-large" failed due to memory error',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    status: 'error',
  },
];

const StatCard: React.FC<{
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  colorScheme?: string;
}> = ({ label, value, change, icon, colorScheme = 'primary' }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const iconBg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const iconColor = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.300`);

  return (
    <MotionCard
      bg={cardBg}
      shadow="sm"
      borderRadius="xl"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      whileHover={{ y: -2, shadow: 'md' }}
      transition={{ duration: 0.2 }}
    >
      <CardBody p={6}>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={1}>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {label}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" lineHeight="shorter">
              {value}
            </Text>
            {change !== undefined && (
              <HStack spacing={1}>
                <StatArrow type={change >= 0 ? 'increase' : 'decrease'} />
                <Text fontSize="sm" color={change >= 0 ? 'green.500' : 'red.500'}>
                  {Math.abs(change)}%
                </Text>
              </HStack>
            )}
          </VStack>
          <Box
            p={3}
            bg={iconBg}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={icon} boxSize={6} color={iconColor} />
          </Box>
        </HStack>
      </CardBody>
    </MotionCard>
  );
};

const SystemMetricCard: React.FC<{
  title: string;
  usage: number;
  details: string;
  icon: React.ElementType;
  colorScheme?: string;
}> = ({ title, usage, details, icon, colorScheme = 'blue' }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const progressColor = usage > 80 ? 'red' : usage > 60 ? 'orange' : colorScheme;

  return (
    <MotionCard
      bg={cardBg}
      shadow="sm"
      borderRadius="xl"
      border="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <CardBody p={6}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon as={icon} boxSize={5} color={`${colorScheme}.500`} />
              <Text fontWeight="semibold">{title}</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {usage}%
            </Text>
          </HStack>
          <Progress
            value={usage}
            colorScheme={progressColor}
            borderRadius="full"
            size="sm"
          />
          <Text fontSize="sm" color="gray.500">
            {details}
          </Text>
        </VStack>
      </CardBody>
    </MotionCard>
  );
};

const ActivityItem: React.FC<{ activity: typeof RECENT_ACTIVITY[0] }> = ({ activity }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      default: return 'blue';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return FiCheckCircle;
      case 'error': return FiAlertCircle;
      default: return FiClock;
    }
  };

  const StatusIcon = getStatusIcon(activity.status);
  const statusColor = getStatusColor(activity.status);

  return (
    <HStack spacing={3} align="start" p={3} borderRadius="md" _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}>
      <Icon as={StatusIcon} color={`${statusColor}.500`} boxSize={4} mt={0.5} />
      <VStack align="start" spacing={1} flex={1}>
        <Text fontSize="sm" fontWeight="medium" lineHeight="short">
          {activity.message}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {activity.timestamp.toLocaleString()}
        </Text>
      </VStack>
    </HStack>
  );
};

const DashboardPage: React.FC = () => {
  const { jobs, loading } = useJobStore();
  const { apiStatus } = useAppStore();

  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Calculate job statistics
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  return (
    <LoadingOverlay isLoading={loading} message="Loading dashboard...">
      <VStack spacing={8} align="stretch">
        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            label="Total Jobs"
            value={totalJobs}
            change={12}
            icon={FiActivity}
            colorScheme="primary"
          />
          <StatCard
            label="Running Jobs"
            value={runningJobs}
            icon={FiPlay}
            colorScheme="green"
          />
          <StatCard
            label="Completed Jobs"
            value={completedJobs}
            change={8}
            icon={FiCheckCircle}
            colorScheme="blue"
          />
          <StatCard
            label="Failed Jobs"
            value={failedJobs}
            icon={FiAlertCircle}
            colorScheme="red"
          />
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* System Metrics */}
          <GridItem>
            <MotionCard
              bg={cardBg}
              shadow="sm"
              borderRadius="xl"
              border="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CardHeader pb={4}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Icon as={FiServer} color="primary.500" boxSize={5} />
                    <Heading size="md">System Resources</Heading>
                  </HStack>
                  <Badge
                    colorScheme={apiStatus === 'connected' ? 'green' : 'red'}
                    variant="subtle"
                  >
                    {apiStatus === 'connected' ? 'Online' : 'Offline'}
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <SystemMetricCard
                    title="CPU Usage"
                    usage={SYSTEM_METRICS.cpu.usage}
                    details={`${SYSTEM_METRICS.cpu.cores} cores available`}
                    icon={FiCpu}
                    colorScheme="blue"
                  />
                  <SystemMetricCard
                    title="Memory"
                    usage={Math.round((SYSTEM_METRICS.memory.used / SYSTEM_METRICS.memory.total) * 100)}
                    details={`${SYSTEM_METRICS.memory.used}/${SYSTEM_METRICS.memory.total} ${SYSTEM_METRICS.memory.unit}`}
                    icon={FiDatabase}
                    colorScheme="green"
                  />
                  <SystemMetricCard
                    title="GPU Memory"
                    usage={Math.round((SYSTEM_METRICS.gpu.memory / SYSTEM_METRICS.gpu.total) * 100)}
                    details={`${SYSTEM_METRICS.gpu.memory}/${SYSTEM_METRICS.gpu.total} ${SYSTEM_METRICS.gpu.unit}`}
                    icon={FiActivity}
                    colorScheme="purple"
                  />
                  <SystemMetricCard
                    title="Storage"
                    usage={Math.round((SYSTEM_METRICS.storage.used / SYSTEM_METRICS.storage.total) * 100)}
                    details={`${SYSTEM_METRICS.storage.used}/${SYSTEM_METRICS.storage.total} ${SYSTEM_METRICS.storage.unit}`}
                    icon={FiHardDrive}
                    colorScheme="orange"
                  />
                </SimpleGrid>
              </CardBody>
            </MotionCard>
          </GridItem>

          {/* Recent Activity */}
          <GridItem>
            <MotionCard
              bg={cardBg}
              shadow="sm"
              borderRadius="xl"
              border="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              h="fit-content"
            >
              <CardHeader pb={4}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Icon as={FiClock} color="primary.500" boxSize={5} />
                    <Heading size="md">Recent Activity</Heading>
                  </HStack>
                  <Button
                    as={RouterLink}
                    to="/jobs"
                    size="sm"
                    variant="ghost"
                    colorScheme="primary"
                  >
                    View All
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={0} align="stretch">
                  {RECENT_ACTIVITY.map((activity, index) => (
                    <Box key={activity.id}>
                      <ActivityItem activity={activity} />
                      {index < RECENT_ACTIVITY.length - 1 && <Divider />}
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </MotionCard>
          </GridItem>
        </Grid>

        {/* Quick Actions */}
        <MotionCard
          bg={cardBg}
          shadow="sm"
          borderRadius="xl"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CardHeader>
            <HStack spacing={3}>
              <Icon as={FiTrendingUp} color="primary.500" boxSize={5} />
              <Heading size="md">Quick Actions</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button
                as={RouterLink}
                to="/train"
                size="lg"
                colorScheme="primary"
                leftIcon={<FiPlay />}
                h={16}
              >
                Start Training
              </Button>
              <Button
                as={RouterLink}
                to="/generate"
                size="lg"
                variant="outline"
                colorScheme="primary"
                leftIcon={<FiActivity />}
                h={16}
              >
                Generate Text
              </Button>
              <Button
                as={RouterLink}
                to="/evaluate"
                size="lg"
                variant="outline"
                colorScheme="primary"
                leftIcon={<FiCheckCircle />}
                h={16}
              >
                Evaluate Model
              </Button>
            </SimpleGrid>
          </CardBody>
        </MotionCard>
      </VStack>
    </LoadingOverlay>
  );
};

export default DashboardPage;