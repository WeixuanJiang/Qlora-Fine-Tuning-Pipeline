import React from 'react';
import {
  Badge,
  Box,
  Button,
  Box as Card,
  
  
  Grid,
  GridItem,
  HStack,
  Heading,
  Icon,
  Progress,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/common/Alert';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import {
  FiPlay,
  FiActivity,
  FiCheckCircle,
  FiClock,
  FiX,
  FiAlertCircle,
  FiCpu,
  FiHardDrive,
  FiTrendingUp,
  FiServer,
  FiDatabase,
  FiArrowRight,
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useJobStore } from '@/stores/jobStore';
import { useAppStore } from '@/stores/appStore';
import { useModelStore } from '@/stores/modelStore';

// Mock system metrics (in a real app, this would come from an API)
const SYSTEM_METRICS = {
  cpu: { usage: 45, cores: 8 },
  memory: { used: 12.4, total: 32, unit: 'GB' },
  gpu: { usage: 78, memory: 6.2, total: 8, unit: 'GB' },
  storage: { used: 245, total: 500, unit: 'GB' },
};

const StatCard: React.FC<{
  label: string;
  value: number;
  change?: number;
  icon: React.ElementType;
  colorScheme: string;
}> = ({ label, value, change, icon, colorScheme }) => {
  return (
    <Card bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200" variant="elevated">
      <Box>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Box
              p={3}
              bg={`${colorScheme}.50`}
              borderRadius="lg"
              border="1px solid"
              borderColor={`${colorScheme}.100`}
            >
              <Icon as={icon} boxSize={6} color={`${colorScheme}.600`} />
            </Box>
            {change !== undefined && (
              <Badge
                colorScheme={change > 0 ? 'green' : 'red'}
                borderRadius="md"
                px={2}
                py={1}
              >
                <HStack spacing={1}>
                  <Icon as={FiTrendingUp} boxSize={3} />
                  <Text fontSize="xs" fontWeight="semibold">{Math.abs(change)}%</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
          <VStack align="start" spacing={1}>
            <Text fontSize="3xl" fontWeight="bold" color="secondary.600">
              {value}
            </Text>
            <Text fontSize="sm" color="secondary.500" fontWeight="medium">
              {label}
            </Text>
          </VStack>
        </VStack>
      </Box>
    </Card>
  );
};

const SystemMetricCard: React.FC<{
  title: string;
  usage: number;
  details: string;
  icon: React.ElementType;
}> = ({ title, usage, details, icon }) => {
  const progressColor = usage > 80 ? 'red' : usage > 60 ? 'orange' : 'primary';

  return (
    <Card bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
      <Box>
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon as={icon} boxSize={5} color="primary.600" />
              <Text fontWeight="semibold" fontSize="sm">{title}</Text>
            </HStack>
            <Text fontSize="md" color="secondary.600" fontWeight="bold">
              {usage}%
            </Text>
          </HStack>
          <Progress
            value={usage}
            colorScheme={progressColor}
            borderRadius="full"
            size="sm"
          />
          <Text fontSize="xs" color="secondary.600">
            {details}
          </Text>
        </VStack>
      </Box>
    </Card>
  );
};

const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  colorScheme: string;
}> = ({ title, description, icon, href, colorScheme }) => {
  return (
    <Card
      as={RouterLink}
      to={href}
      bg="white"
      borderRadius="xl"
      shadow="sm"
      border="1px"
      borderColor="gray.200"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        borderColor: `${colorScheme}.200`,
      }}
      transition="all 0.2s"
      cursor="pointer"
    >
      <Box p={6}>
        <VStack align="start" spacing={4}>
          <Box
            p={3}
            bg={`${colorScheme}.50`}
            borderRadius="lg"
            border="1px solid"
            borderColor={`${colorScheme}.100`}
          >
            <Icon as={icon} boxSize={6} color={`${colorScheme}.600`} />
          </Box>
          <VStack align="start" spacing={2}>
            <Heading size="md" color="secondary.600">{title}</Heading>
            <Text fontSize="sm" color="secondary.600">
              {description}
            </Text>
          </VStack>
          <HStack color={`${colorScheme}.600`} fontWeight="semibold" fontSize="sm">
            <Text>Get started</Text>
            <Icon as={FiArrowRight} />
          </HStack>
        </VStack>
      </Box>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { jobs } = useJobStore();
  const { apiStatus } = useAppStore();
  const { adapters } = useModelStore();

  // Calculate job statistics
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  // Get recent jobs (last 5)
  const recentJobs = jobs.slice(0, 5);

  return (
    <VStack spacing={8} align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="xl" mb={2} color="secondary.600">
          Dashboard
        </Heading>
        <Text color="secondary.600" fontSize="lg">
          Welcome to QLoRA Control Center. Monitor your training pipeline and system resources.
        </Text>
      </Box>

      {/* API Status Alert */}
      {apiStatus !== 'connected' && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Backend Connection Issue</AlertTitle>
            <AlertDescription>
              Unable to connect to the backend API at http://localhost:8000
            </AlertDescription>
          </Box>
        </Alert>
      )}

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
          colorScheme="blue"
        />
        <StatCard
          label="Completed Jobs"
          value={completedJobs}
          change={8}
          icon={FiCheckCircle}
          colorScheme="green"
        />
        <StatCard
          label="Available Adapters"
          value={adapters?.length || 0}
          icon={FiDatabase}
          colorScheme="purple"
        />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* System Resources */}
        <GridItem>
          <Card bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
            <Box>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Icon as={FiServer} boxSize={5} color="primary.600" />
                  <Heading size="md" color="secondary.600">System Resources</Heading>
                </HStack>
                <Badge
                  colorScheme={apiStatus === 'connected' ? 'green' : 'red'}
                  px={3}
                  py={1}
                  borderRadius="md"
                  textTransform="uppercase"
                  fontSize="xs"
                >
                  {apiStatus === 'connected' ? 'Online' : 'Offline'}
                </Badge>
              </HStack>
            </Box>
            <Box pt={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <SystemMetricCard
                  title="CPU Usage"
                  usage={SYSTEM_METRICS.cpu.usage}
                  details={`${SYSTEM_METRICS.cpu.cores} cores available`}
                  icon={FiCpu}
                />
                <SystemMetricCard
                  title="Memory"
                  usage={Math.round((SYSTEM_METRICS.memory.used / SYSTEM_METRICS.memory.total) * 100)}
                  details={`${SYSTEM_METRICS.memory.used}/${SYSTEM_METRICS.memory.total} ${SYSTEM_METRICS.memory.unit}`}
                  icon={FiDatabase}
                />
                <SystemMetricCard
                  title="GPU Memory"
                  usage={Math.round((SYSTEM_METRICS.gpu.memory / SYSTEM_METRICS.gpu.total) * 100)}
                  details={`${SYSTEM_METRICS.gpu.memory}/${SYSTEM_METRICS.gpu.total} ${SYSTEM_METRICS.gpu.unit}`}
                  icon={FiActivity}
                />
                <SystemMetricCard
                  title="Storage"
                  usage={Math.round((SYSTEM_METRICS.storage.used / SYSTEM_METRICS.storage.total) * 100)}
                  details={`${SYSTEM_METRICS.storage.used}/${SYSTEM_METRICS.storage.total} ${SYSTEM_METRICS.storage.unit}`}
                  icon={FiHardDrive}
                />
              </SimpleGrid>
            </Box>
          </Card>
        </GridItem>

        {/* Recent Jobs */}
        <GridItem>
          <Card bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200" h="full">
            <Box>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Icon as={FiClock} boxSize={5} color="primary.600" />
                  <Heading size="md" color="secondary.600">Recent Activity</Heading>
                </HStack>
                <Button
                  as={RouterLink}
                  to="/jobs"
                  size="sm"
                  variant="ghost"
                  colorScheme="primary"
                  rightIcon={<FiArrowRight />}
                >
                  View All
                </Button>
              </HStack>
            </Box>
            <Box pt={0}>
              {recentJobs.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Icon as={FiActivity} boxSize={12} color="secondary.300" mb={3} />
                  <Text color="secondary.500" fontSize="sm">
                    No jobs yet. Start training to see activity here.
                  </Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {recentJobs.map((job) => (
                    <Box
                      key={job.id}
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="secondary.100"
                      _hover={{ bg: 'secondary.50' }}
                      transition="all 0.2s"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="semibold" color="secondary.600">
                          {job.name}
                        </Text>
                        <Badge
                          colorScheme={
                            job.status === 'completed' ? 'green' :
                            job.status === 'running' ? 'blue' :
                            job.status === 'failed' ? 'red' : 'gray'
                          }
                          fontSize="xs"
                        >
                          {job.status}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="secondary.600">
                        {new Date(job.created_at).toLocaleString()}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Card>
        </GridItem>
      </Grid>

      {/* Quick Actions */}
      <Box>
        <Heading size="lg" mb={4} color="secondary.600">
          Quick Actions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <QuickActionCard
            title="Start Training"
            description="Upload a dataset and begin fine-tuning your model"
            icon={FiPlay}
            href="/train"
            colorScheme="primary"
          />
          <QuickActionCard
            title="Generate Text"
            description="Test your fine-tuned models with custom prompts"
            icon={FiActivity}
            href="/generate"
            colorScheme="blue"
          />
          <QuickActionCard
            title="Evaluate Model"
            description="Measure model performance and accuracy metrics"
            icon={FiCheckCircle}
            href="/evaluate"
            colorScheme="green"
          />
        </SimpleGrid>
      </Box>

      {/* Registered Adapters */}
      {adapters && adapters.length > 0 && (
        <Card bg="white" p={6} borderRadius="xl" shadow="sm" border="1px" borderColor="gray.200">
          <Box>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={FiDatabase} boxSize={5} color="primary.600" />
                <Heading size="md" color="secondary.600">Registered Adapters</Heading>
              </HStack>
              <Button
                as={RouterLink}
                to="/merge"
                size="sm"
                variant="ghost"
                colorScheme="primary"
                rightIcon={<FiArrowRight />}
              >
                Manage
              </Button>
            </HStack>
          </Box>
          <Box pt={0}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Path</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {adapters.slice(0, 5).map((adapter) => (
                    <Tr key={adapter.name}>
                      <Td fontWeight="medium" color="secondary.600">{adapter.name}</Td>
                      <Td fontSize="xs" color="secondary.600">{adapter.path}</Td>
                      <Td fontSize="xs" color="secondary.600">
                        {adapter.created_date ? new Date(adapter.created_date).toLocaleDateString() : 'N/A'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Card>
      )}
    </VStack>
  );
};

export default DashboardPage;
