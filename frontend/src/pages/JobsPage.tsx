import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Button,
  Badge,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Code,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  TrashIcon,
  MoreVerticalIcon,
  RefreshIcon,
  EyeIcon,
  DownloadIcon,
  SearchIcon,
  FilterIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  AlertIcon,
  ActivityIcon,
  ChartIcon,
} from '@/components/icons/GeometricIcons';
import { motion } from 'framer-motion';
import { useJobStore } from '@/stores/jobStore';
import { Job } from '@/types';
import { LoadingOverlay } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);
const MotionTr = motion(Tr);

const JobsPage: React.FC = () => {
  const {
    jobs,
    loading,
    filters,
    setFilters,
    refreshJobs,
    stopJob,
    deleteJob,
  } = useJobStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableBg = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'paused': return 'orange';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return PlayIcon;
      case 'completed': return CheckIcon;
      case 'failed': return XIcon;
      case 'paused': return PauseIcon;
      case 'pending': return ClockIcon;
      default: return AlertIcon;
    }
  };
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.status === 'all' || job.status === filters.status;
    return matchesSearch && matchesStatus;
  });
  
  const jobStats = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };
  
  const handleJobAction = async (action: string, jobId: string) => {
    try {
      switch (action) {
        case 'stop':
          await stopJob(jobId);
          toast({
            title: 'Job Stopped',
            description: 'Training job has been stopped',
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
          break;
        case 'delete':
          await deleteJob(jobId);
          toast({
            title: 'Job Deleted',
            description: 'Training job has been deleted',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} job`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diff = end.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  
  const JobDetailsModal: React.FC<{ job: Job }> = ({ job }) => {
    const StatusIcon = getStatusIcon(job.status);
    
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={StatusIcon} color={`${getStatusColor(job.status)}.500`} />
              <Text>{job.name}</Text>
              <Badge colorScheme={getStatusColor(job.status)} variant="subtle">
                {job.status}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>Parameters</Tab>
                <Tab>Metrics</Tab>
                <Tab>Logs</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <Stat>
                        <StatLabel>Model</StatLabel>
                        <StatNumber fontSize="lg">{job.model}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Dataset</StatLabel>
                        <StatNumber fontSize="lg">{job.dataset}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Progress</StatLabel>
                        <StatNumber fontSize="lg">{job.progress}%</StatNumber>
                        <Progress value={job.progress} colorScheme={getStatusColor(job.status)} mt={2} />
                      </Stat>
                      <Stat>
                        <StatLabel>Duration</StatLabel>
                        <StatNumber fontSize="lg">
                          {formatDuration(job.startTime, job.endTime)}
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                    
                    <Divider />
                    
                    <Box>
                      <Text fontWeight="semibold" mb={3}>Timeline</Text>
                      <VStack spacing={3} align="stretch">
                        <HStack>
                          <Icon as={PlayIcon} color="blue.500" />
                          <Text fontSize="sm">
                            Started: {job.startTime.toLocaleString()}
                          </Text>
                        </HStack>
                        {job.endTime && (
                          <HStack>
                            <Icon as={CheckIcon} color="green.500" />
                            <Text fontSize="sm">
                              Ended: {job.endTime.toLocaleString()}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
                
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {Object.entries(job.parameters).map(([key, value]) => (
                      <Box key={key} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Code fontSize="sm">{String(value)}</Code>
                      </Box>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    {Object.entries(job.metrics).map(([key, value]) => (
                      <Stat key={key}>
                        <StatLabel>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</StatLabel>
                        <StatNumber>{typeof value === 'number' ? value.toFixed(4) : value}</StatNumber>
                      </Stat>
                    ))}
                  </SimpleGrid>
                </TabPanel>
                
                <TabPanel>
                  <Box
                    bg={useColorModeValue('gray.50', 'gray.900')}
                    p={4}
                    borderRadius="md"
                    maxH="400px"
                    overflowY="auto"
                  >
                    {job.logs.length > 0 ? (
                      <VStack spacing={2} align="stretch">
                        {job.logs.map((log, index) => (
                          <HStack key={index} spacing={3} fontSize="sm">
                            <Text color="gray.500" minW="20">
                              {log.timestamp.toLocaleTimeString()}
                            </Text>
                            <Badge size="sm" colorScheme={log.level === 'error' ? 'red' : log.level === 'warning' ? 'orange' : 'blue'}>
                              {log.level}
                            </Badge>
                            <Text>{log.message}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        <Text>No logs available</Text>
                      </Alert>
                    )}
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };
  
  return (
    <LoadingOverlay isLoading={loading} message="Loading jobs...">
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              Training Jobs
            </Heading>
            <Text color="gray.500">
              Monitor and manage your QLoRA fine-tuning jobs
            </Text>
          </Box>
          <Button
            leftIcon={<RefreshIcon />}
            onClick={refreshJobs}
            isLoading={loading}
            colorScheme="primary"
            variant="outline"
          >
            Refresh
          </Button>
        </Flex>
        
        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
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
              <Stat>
                <StatLabel>Total Jobs</StatLabel>
                <StatNumber>{jobStats.total}</StatNumber>
                <StatHelpText>
                  <Icon as={ActivityIcon} mr={1} />
                  All time
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
          
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
              <Stat>
                <StatLabel>Running</StatLabel>
                <StatNumber color="blue.500">{jobStats.running}</StatNumber>
                <StatHelpText>
                  <Icon as={PlayIcon} mr={1} />
                  Active now
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
          
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
              <Stat>
                <StatLabel>Completed</StatLabel>
                <StatNumber color="green.500">{jobStats.completed}</StatNumber>
                <StatHelpText>
                  <Icon as={CheckIcon} mr={1} />
                  Successful
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
          
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
              <Stat>
                <StatLabel>Failed</StatLabel>
                <StatNumber color="red.500">{jobStats.failed}</StatNumber>
                <StatHelpText>
                  <Icon as={XIcon} mr={1} />
                  Errors
                </StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>
        
        {/* Filters and Search */}
        <MotionCard
          bg={cardBg}
          shadow="sm"
          borderRadius="xl"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardBody p={6}>
            <HStack spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={SearchIcon} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <Select
                maxW="200px"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                icon={<FilterIcon />}
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="paused">Paused</option>
                <option value="pending">Pending</option>
              </Select>
              
              <Spacer />
              
              <Text fontSize="sm" color="gray.500">
                {filteredJobs.length} of {jobs.length} jobs
              </Text>
            </HStack>
          </CardBody>
        </MotionCard>
        
        {/* Jobs Table */}
        <MotionCard
          bg={cardBg}
          shadow="sm"
          borderRadius="xl"
          border="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Job Name</Th>
                    <Th>Status</Th>
                    <Th>Model</Th>
                    <Th>Progress</Th>
                    <Th>Duration</Th>
                    <Th>Started</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredJobs.map((job, index) => {
                    const StatusIcon = getStatusIcon(job.status);
                    return (
                      <MotionTr
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                        cursor="pointer"
                        onClick={() => {
                          setSelectedJob(job);
                          onOpen();
                        }}
                      >
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">{job.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {job.dataset}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Icon as={StatusIcon} color={`${getStatusColor(job.status)}.500`} />
                            <Badge colorScheme={getStatusColor(job.status)} variant="subtle">
                              {job.status}
                            </Badge>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{job.model}</Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="sm">{job.progress}%</Text>
                            <Progress
                              value={job.progress}
                              size="sm"
                              colorScheme={getStatusColor(job.status)}
                              w="100px"
                            />
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {formatDuration(job.startTime, job.endTime)}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {job.startTime.toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MoreVerticalIcon />}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <MenuList>
                              <MenuItem
                                icon={<EyeIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedJob(job);
                                  onOpen();
                                }}
                              >
                                View Details
                              </MenuItem>
                              {job.status === 'running' && (
                                <MenuItem
                                  icon={<StopIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleJobAction('stop', job.id);
                                  }}
                                >
                                  Stop Job
                                </MenuItem>
                              )}
                              <MenuItem
                                icon={<DownloadIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle download logs
                                }}
                              >
                                Download Logs
                              </MenuItem>
                              <MenuItem
                                icon={<TrashIcon />}
                                color="red.500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleJobAction('delete', job.id);
                                }}
                              >
                                Delete Job
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </MotionTr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
            
            {filteredJobs.length === 0 && (
              <Box p={8} textAlign="center">
                <Icon as={ChartIcon} boxSize={12} color="gray.400" mb={4} />
                <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
                  No jobs found
                </Text>
                <Text color="gray.400">
                  {searchTerm || filters.status !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start your first training job to see it here'}
                </Text>
              </Box>
            )}
          </CardBody>
        </MotionCard>
        
        {/* Job Details Modal */}
        {selectedJob && (
          <JobDetailsModal job={selectedJob} />
        )}
      </VStack>
    </LoadingOverlay>
  );
};

export default JobsPage;