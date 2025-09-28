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
  keyframes,
} from '@chakra-ui/react';
import {
  PlayIcon,
  ActivityIcon,
  CheckIcon,
  ClockIcon,
  XIcon,
  PauseIcon,
  AlertIcon,
  CpuIcon,
  HardDriveIcon,
  TrendingUpIcon,
  ServerIcon,
  DatabaseIcon,
} from '@/components/icons/GeometricIcons';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobStore } from '@/stores/jobStore';
import { useAppStore } from '@/stores/appStore';
import { LoadingOverlay } from '@/components/common/LoadingSpinner';

// Motion components
const MotionCard = motion(Card);
const MotionBox = motion(Box);
const MotionVStack = motion(VStack);
const MotionSimpleGrid = motion(SimpleGrid);
const MotionGrid = motion(Grid);
const MotionHStack = motion(HStack);

// Keyframes for animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(1deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

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
  value: number;
  change?: number;
  icon: React.ElementType;
  colorScheme: string;
  index?: number;
}> = ({ label, value, change, icon, colorScheme, index = 0 }) => {
  return (
    <MotionCard
      bg="rgba(255, 255, 255, 0.08)"
      backdropFilter="blur(20px)"
      borderRadius="3xl"
      border="2px solid"
      borderColor="rgba(255, 255, 255, 0.15)"
      boxShadow="0 12px 40px rgba(0, 0, 0, 0.15)"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        scale: 1.05,
        y: -8,
        boxShadow: "0 25px 80px rgba(0, 0, 0, 0.3)",
        borderColor: "rgba(255, 255, 255, 0.3)",
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: `linear(135deg, ${colorScheme}.400, ${colorScheme}.600)`,
        opacity: 0.05,
        borderRadius: '3xl',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        animation: `${shimmer} 3s infinite`,
        animationDelay: `${index * 0.5}s`,
      }}
    >
      <CardBody p={8}>
        <MotionVStack 
          align="start" 
          spacing={4}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 + index * 0.1 }}
        >
          <MotionHStack justify="space-between" w="full">
            <MotionBox
              p={3}
              bgGradient={`linear(135deg, ${colorScheme}.400, ${colorScheme}.600)`}
              borderRadius="2xl"
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
              whileHover={{ 
                rotate: [0, -10, 10, 0],
                scale: 1.1,
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)"
              }}
              animation={`${float} 6s ease-in-out infinite`}
              animationDelay={`${index * 0.8}s`}
            >
              <Icon as={icon} color="white" boxSize={6} />
            </MotionBox>
            <AnimatePresence>
              {change && (
                <MotionBox
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Badge
                    variant="gradient"
                    colorScheme={change > 0 ? 'green' : 'red'}
                    px={3}
                    py={1}
                    borderRadius="xl"
                    fontWeight="bold"
                    animation={`${pulse} 2s ease-in-out infinite`}
                  >
                    <HStack spacing={1}>
                      <Icon as={change > 0 ? TrendingUpIcon : TrendingUpIcon} boxSize={3} />
                      <Text fontSize="xs">{Math.abs(change)}%</Text>
                    </HStack>
                  </Badge>
                </MotionBox>
              )}
            </AnimatePresence>
          </MotionHStack>
          <VStack align="start" spacing={2}>
            <Text 
              fontSize="4xl" 
              fontWeight="black" 
              color="white"
              fontFamily="heading"
              lineHeight="none"
            >
              {value}
            </Text>
            <Text 
              fontSize="sm" 
              color="whiteAlpha.700"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              {label}
            </Text>
          </VStack>
        </MotionVStack>
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
  const progressColor = usage > 80 ? 'red' : usage > 60 ? 'orange' : 'primary';

  return (
    <MotionCard
      bg="rgba(255, 255, 255, 0.05)"
      backdropFilter="blur(10px)"
      borderRadius="2xl"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.1)"
      whileHover={{ 
        y: -4,
        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.1)"
      }}
      transition={{ duration: 0.2 }}
    >
      <CardBody p={6}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Box
                p={2}
                bgGradient="linear(135deg, primary.400, secondary.400)"
                borderRadius="lg"
              >
                <Icon as={icon} boxSize={4} color="white" />
              </Box>
              <Text fontWeight="bold" color="white" fontFamily="heading">{title}</Text>
            </HStack>
            <Text fontSize="lg" color="whiteAlpha.800" fontWeight="bold">
              {usage}%
            </Text>
          </HStack>
          <Box position="relative">
            <Progress
              value={usage}
              colorScheme={progressColor}
              borderRadius="full"
              size="md"
              bg="whiteAlpha.200"
            />
          </Box>
          <Text fontSize="sm" color="whiteAlpha.600" fontFamily="mono">
            {details}
          </Text>
        </VStack>
      </CardBody>
    </MotionCard>
  );
};

const ActivityItem: React.FC<{ activity: typeof RECENT_ACTIVITY[0]; index?: number }> = ({ activity, index = 0 }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'orange';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckIcon;
      case 'error': return AlertIcon;
      default: return ClockIcon;
    }
  };

  const StatusIcon = getStatusIcon(activity.status);
  const statusColor = getStatusColor(activity.status);

  return (
    <MotionHStack 
      spacing={4} 
      align="start" 
      p={4} 
      borderRadius="2xl"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ 
        bg: 'rgba(255, 255, 255, 0.15)',
        x: 8,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      whileTap={{ scale: 0.98 }}
      cursor="pointer"
    >
      <MotionBox
        p={2}
        bgGradient={`linear(135deg, ${statusColor}.400, ${statusColor}.600)`}
        borderRadius="xl"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
        whileHover={{
          rotate: [0, -5, 5, 0],
          scale: 1.1,
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)"
        }}
        animation={`${pulse} 3s ease-in-out infinite`}
        animationDelay={`${index * 0.3}s`}
      >
        <Icon as={StatusIcon} color="white" boxSize={4} />
      </MotionBox>
      <VStack align="start" spacing={1} flex={1}>
        <Text 
          fontSize="sm" 
          fontWeight="semibold" 
          lineHeight="short"
          color="white"
        >
          {activity.message}
        </Text>
        <Text 
          fontSize="xs" 
          color="whiteAlpha.600"
          fontFamily="mono"
        >
          {activity.timestamp.toLocaleString()}
        </Text>
      </VStack>
    </MotionHStack>
  );
};

const DashboardPage: React.FC = () => {
  const { jobs, loading } = useJobStore();
  const { apiStatus } = useAppStore();
  
  // Calculate job statistics
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.status === 'running').length;
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const failedJobs = jobs.filter(job => job.status === 'failed').length;

  return (
    <LoadingOverlay isLoading={loading} message="Loading dashboard...">
      <MotionVStack 
        spacing={8} 
        align="stretch"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Quick Stats */}
        <MotionSimpleGrid 
          columns={{ base: 1, md: 2, lg: 4 }} 
          spacing={6}
          variants={containerVariants}
        >
          <StatCard
            label="Total Jobs"
            value={totalJobs}
            change={12}
            icon={ActivityIcon}
            colorScheme="primary"
            index={0}
          />
          <StatCard
            label="Running Jobs"
            value={runningJobs}
            icon={PlayIcon}
            colorScheme="green"
            index={1}
          />
          <StatCard
            label="Completed Jobs"
            value={completedJobs}
            change={8}
            icon={CheckIcon}
            colorScheme="blue"
            index={2}
          />
          <StatCard
            label="Failed Jobs"
            value={failedJobs}
            icon={AlertIcon}
            colorScheme="red"
            index={3}
          />
        </MotionSimpleGrid>

        <MotionGrid 
          templateColumns={{ base: '1fr', lg: '2fr 1fr' }} 
          gap={8}
          variants={containerVariants}
        >
          {/* System Metrics */}
          <GridItem>
            <MotionCard
              bg="rgba(255, 255, 255, 0.08)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="2px solid"
              borderColor="rgba(255, 255, 255, 0.15)"
              boxShadow="0 12px 40px rgba(0, 0, 0, 0.15)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgGradient: 'linear(135deg, primary.400, secondary.400)',
                opacity: 0.05,
                borderRadius: '3xl',
              }}
            >
              <CardHeader pb={6}>
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box
                      p={3}
                      bgGradient="linear(135deg, primary.400, secondary.400)"
                      borderRadius="2xl"
                      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    >
                      <Icon as={ServerIcon} color="white" boxSize={6} />
                    </Box>
                    <Heading 
                      size="lg" 
                      color="white" 
                      fontFamily="heading"
                      fontWeight="black"
                    >
                      System Resources
                    </Heading>
                  </HStack>
                  <Badge
                    variant="gradient"
                    colorScheme={apiStatus === 'connected' ? 'green' : 'red'}
                    px={4}
                    py={2}
                    borderRadius="2xl"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {apiStatus === 'connected' ? 'Online' : 'Offline'}
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <MotionSimpleGrid 
                  columns={{ base: 1, md: 2 }} 
                  spacing={4}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <SystemMetricCard
                    title="CPU Usage"
                    usage={SYSTEM_METRICS.cpu.usage}
                    details={`${SYSTEM_METRICS.cpu.cores} cores available`}
                    icon={CpuIcon}
                    colorScheme="blue"
                  />
                  <SystemMetricCard
                    title="Memory"
                    usage={Math.round((SYSTEM_METRICS.memory.used / SYSTEM_METRICS.memory.total) * 100)}
                    details={`${SYSTEM_METRICS.memory.used}/${SYSTEM_METRICS.memory.total} ${SYSTEM_METRICS.memory.unit}`}
                    icon={DatabaseIcon}
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
                    icon={HardDriveIcon}
                    colorScheme="orange"
                  />
                </MotionSimpleGrid>
              </CardBody>
            </MotionCard>
          </GridItem>

          {/* Recent Activity */}
          <GridItem>
            <MotionCard
              bg="rgba(255, 255, 255, 0.08)"
              backdropFilter="blur(20px)"
              borderRadius="3xl"
              border="2px solid"
              borderColor="rgba(255, 255, 255, 0.15)"
              boxShadow="0 12px 40px rgba(0, 0, 0, 0.15)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              h="fit-content"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgGradient: 'linear(135deg, accent.400, primary.400)',
                opacity: 0.05,
                borderRadius: '3xl',
              }}
            >
              <CardHeader pb={6}>
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box
                      p={3}
                      bgGradient="linear(135deg, accent.400, primary.400)"
                      borderRadius="2xl"
                      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    >
                      <Icon as={FiClock} color="white" boxSize={6} />
                    </Box>
                    <Heading 
                      size="lg" 
                      color="white" 
                      fontFamily="heading"
                      fontWeight="black"
                    >
                      Recent Activity
                    </Heading>
                  </HStack>
                  <Button
                    as={RouterLink}
                    to="/jobs"
                    variant="gradient"
                    size="md"
                    borderRadius="2xl"
                    px={6}
                  >
                    View All
                  </Button>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <MotionVStack 
                  spacing={0} 
                  align="stretch"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {RECENT_ACTIVITY.map((activity, index) => (
                      <MotionBox 
                        key={activity.id}
                        variants={cardVariants}
                      >
                        <ActivityItem activity={activity} index={index} />
                        {index < RECENT_ACTIVITY.length - 1 && (
                          <Divider 
                            borderColor="rgba(255, 255, 255, 0.1)" 
                            my={2}
                          />
                        )}
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </MotionVStack>
              </CardBody>
            </MotionCard>
          </GridItem>
        </Grid>

        {/* Quick Actions */}
        <MotionCard
          bg="rgba(255, 255, 255, 0.08)"
          backdropFilter="blur(20px)"
          borderRadius="3xl"
          border="2px solid"
          borderColor="rgba(255, 255, 255, 0.15)"
          boxShadow="0 12px 40px rgba(0, 0, 0, 0.15)"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgGradient: 'linear(135deg, secondary.400, accent.400)',
            opacity: 0.05,
            borderRadius: '3xl',
          }}
        >
          <CardHeader pb={6}>
            <HStack spacing={4}>
              <Box
                p={3}
                bgGradient="linear(135deg, secondary.400, accent.400)"
                borderRadius="2xl"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
              >
                <Icon as={TrendingUpIcon} color="white" boxSize={6} />
              </Box>
              <Heading 
                size="lg" 
                color="white" 
                fontFamily="heading"
                fontWeight="black"
              >
                Quick Actions
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <MotionSimpleGrid 
              columns={{ base: 1, md: 3 }} 
              spacing={6}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <MotionBox variants={cardVariants}>
                <Button
                  as={RouterLink}
                  to="/train"
                  variant="gradient"
                  size="xl"
                  leftIcon={<FiPlay />}
                  h={20}
                  borderRadius="3xl"
                  fontSize="lg"
                  fontWeight="black"
                  w="full"
                  position="relative"
                  overflow="hidden"
                  _hover={{
                    transform: 'translateY(-6px) scale(1.02)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
                  }}
                  _active={{
                    transform: 'translateY(-2px) scale(0.98)'
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    animation: `${shimmer} 2s infinite`,
                  }}
                >
                  Start Training
                </Button>
              </MotionBox>
              <MotionBox variants={cardVariants}>
                <Button
                  as={RouterLink}
                  to="/generate"
                  variant="glass"
                  size="xl"
                  leftIcon={<FiActivity />}
                  h={20}
                  borderRadius="3xl"
                  fontSize="lg"
                  fontWeight="black"
                  color="white"
                  border="2px solid"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  w="full"
                  _hover={{
                    transform: 'translateY(-6px) scale(1.02)',
                    bg: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
                  }}
                  _active={{
                    transform: 'translateY(-2px) scale(0.98)'
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  Generate Text
                </Button>
              </MotionBox>
              <MotionBox variants={cardVariants}>
                <Button
                  as={RouterLink}
                  to="/evaluate"
                  variant="glass"
                  size="xl"
                  leftIcon={<FiCheckCircle />}
                  h={20}
                  borderRadius="3xl"
                  fontSize="lg"
                  fontWeight="black"
                  color="white"
                  border="2px solid"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  w="full"
                  _hover={{
                    transform: 'translateY(-6px) scale(1.02)',
                    bg: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)'
                  }}
                  _active={{
                    transform: 'translateY(-2px) scale(0.98)'
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  Evaluate Model
                </Button>
              </MotionBox>
            </MotionSimpleGrid>
          </CardBody>
        </MotionCard>
      </VStack>
    </LoadingOverlay>
  );
};

export default DashboardPage;