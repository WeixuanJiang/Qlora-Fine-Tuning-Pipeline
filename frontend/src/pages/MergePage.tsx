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
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  IconButton,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Code,
  Flex,
  Spacer,
  Tooltip,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import {
  FiGitMerge,
  FiPlay,
  FiDownload,
  FiTrash2,
  FiEye,
  FiSettings,
  FiInfo,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiLayers,
  FiCpu,
  FiHardDrive,
  FiRefreshCw,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useModelStore } from '@/stores/modelStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);

interface MergeJob {
  id: string;
  name: string;
  baseModel: string;
  adapters: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  outputPath: string;
  mergeMethod: string;
  parameters: {
    density: number;
    weight: number;
    normalize: boolean;
  };
}

const MergePage: React.FC = () => {
  const { models, adapters, refreshModels } = useModelStore();
  const [selectedBaseModel, setSelectedBaseModel] = useState('');
  const [selectedAdapters, setSelectedAdapters] = useState<string[]>([]);
  const [mergeMethod, setMergeMethod] = useState('linear');
  const [outputName, setOutputName] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeJobs, setMergeJobs] = useState<MergeJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<MergeJob | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [mergeConfig, setMergeConfig] = useState({
    density: 0.5,
    weight: 1.0,
    normalize: true,
    use_gpu: true,
    batch_size: 1,
  });
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    refreshModels();
    // Load mock merge jobs
    setMergeJobs([
      {
        id: '1',
        name: 'QLoRA Merge #1',
        baseModel: 'llama-2-7b',
        adapters: ['alpaca-adapter', 'dolly-adapter'],
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 7200000),
        endTime: new Date(Date.now() - 3600000),
        outputPath: '/models/merged/llama-2-7b-merged',
        mergeMethod: 'linear',
        parameters: {
          density: 0.5,
          weight: 1.0,
          normalize: true,
        },
      },
      {
        id: '2',
        name: 'QLoRA Merge #2',
        baseModel: 'llama-2-13b',
        adapters: ['custom-adapter'],
        status: 'running',
        progress: 45,
        startTime: new Date(Date.now() - 1800000),
        outputPath: '/models/merged/llama-2-13b-custom',
        mergeMethod: 'slerp',
        parameters: {
          density: 0.7,
          weight: 0.8,
          normalize: false,
        },
      },
    ]);
  }, [refreshModels]);
  
  const handleAdapterToggle = (adapterId: string) => {
    setSelectedAdapters(prev => 
      prev.includes(adapterId)
        ? prev.filter(id => id !== adapterId)
        : [...prev, adapterId]
    );
  };
  
  const handleStartMerge = async () => {
    if (!selectedBaseModel || selectedAdapters.length === 0 || !outputName) {
      toast({
        title: 'Missing Information',
        description: 'Please select a base model, at least one adapter, and provide an output name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsMerging(true);
    
    try {
      // Simulate merge start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMergeJob: MergeJob = {
        id: Date.now().toString(),
        name: outputName,
        baseModel: selectedBaseModel,
        adapters: selectedAdapters,
        status: 'running',
        progress: 0,
        startTime: new Date(),
        outputPath: outputPath || `/models/merged/${outputName}`,
        mergeMethod,
        parameters: {
          density: mergeConfig.density,
          weight: mergeConfig.weight,
          normalize: mergeConfig.normalize,
        },
      };
      
      setMergeJobs(prev => [newMergeJob, ...prev]);
      
      // Reset form
      setSelectedBaseModel('');
      setSelectedAdapters([]);
      setOutputName('');
      setOutputPath('');
      
      toast({
        title: 'Merge Started',
        description: 'Model merge has been started successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start merge',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsMerging(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return FiClock;
      case 'completed': return FiCheckCircle;
      case 'failed': return FiXCircle;
      case 'pending': return FiClock;
      default: return FiClock;
    }
  };
  
  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diff = end.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  
  const MergeJobModal: React.FC<{ job: MergeJob }> = ({ job }) => {
    const StatusIcon = getStatusIcon(job.status);
    
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
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
            <VStack spacing={6} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Stat>
                  <StatLabel>Base Model</StatLabel>
                  <StatNumber fontSize="lg">{job.baseModel}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Merge Method</StatLabel>
                  <StatNumber fontSize="lg">{job.mergeMethod}</StatNumber>
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
                <Text fontWeight="semibold" mb={3}>Adapters</Text>
                <VStack spacing={2} align="stretch">
                  {job.adapters.map((adapter, index) => (
                    <HStack key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                      <Icon as={FiLayers} color="primary.500" />
                      <Text>{adapter}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              
              <Divider />
              
              <Box>
                <Text fontWeight="semibold" mb={3}>Parameters</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                      Density
                    </Text>
                    <Code fontSize="sm">{job.parameters.density}</Code>
                  </Box>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                      Weight
                    </Text>
                    <Code fontSize="sm">{job.parameters.weight}</Code>
                  </Box>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                      Normalize
                    </Text>
                    <Code fontSize="sm">{job.parameters.normalize ? 'Yes' : 'No'}</Code>
                  </Box>
                  <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                    <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={1}>
                      Output Path
                    </Text>
                    <Code fontSize="sm">{job.outputPath}</Code>
                  </Box>
                </SimpleGrid>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };
  
  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Model Merging
        </Heading>
        <Text color="gray.500">
          Merge your fine-tuned LoRA adapters with base models to create unified models
        </Text>
      </Box>
      
      <Tabs variant="enclosed" colorScheme="primary">
        <TabList>
          <Tab>New Merge</Tab>
          <Tab>Merge History</Tab>
        </TabList>
        
        <TabPanels>
          {/* New Merge Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Configuration Card */}
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
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={FiGitMerge} color="primary.500" />
                    <Heading size="md">Merge Configuration</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={6} align="stretch">
                    {/* Basic Configuration */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl isRequired>
                        <FormLabel>Base Model</FormLabel>
                        <Select
                          placeholder="Select base model"
                          value={selectedBaseModel}
                          onChange={(e) => setSelectedBaseModel(e.target.value)}
                        >
                          {models.map(model => (
                            <option key={model.id} value={model.name}>
                              {model.name} ({model.size})
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Output Name</FormLabel>
                        <Input
                          placeholder="Enter merged model name"
                          value={outputName}
                          onChange={(e) => setOutputName(e.target.value)}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Output Path (Optional)</FormLabel>
                        <Input
                          placeholder="Custom output path"
                          value={outputPath}
                          onChange={(e) => setOutputPath(e.target.value)}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Merge Method</FormLabel>
                        <RadioGroup value={mergeMethod} onChange={setMergeMethod}>
                          <Stack direction="column" spacing={2}>
                            <Radio value="linear">Linear Interpolation</Radio>
                            <Radio value="slerp">Spherical Linear Interpolation</Radio>
                            <Radio value="ties">TIES Merging</Radio>
                            <Radio value="dare">DARE Merging</Radio>
                          </Stack>
                        </RadioGroup>
                      </FormControl>
                    </SimpleGrid>
                    
                    <Divider />
                    
                    {/* Adapter Selection */}
                    <Box>
                      <FormLabel mb={4}>Select Adapters to Merge</FormLabel>
                      {adapters.length > 0 ? (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          {adapters.map(adapter => (
                            <Box
                              key={adapter.id}
                              p={4}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                              border="2px"
                              borderColor={selectedAdapters.includes(adapter.name) ? 'primary.500' : 'transparent'}
                              cursor="pointer"
                              onClick={() => handleAdapterToggle(adapter.name)}
                              _hover={{ borderColor: 'primary.300' }}
                            >
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{adapter.name}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {adapter.size} • {adapter.type}
                                  </Text>
                                </VStack>
                                <Switch
                                  isChecked={selectedAdapters.includes(adapter.name)}
                                  onChange={() => handleAdapterToggle(adapter.name)}
                                  colorScheme="primary"
                                />
                              </HStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      ) : (
                        <Alert status="warning">
                          <AlertIcon />
                          <Text>No adapters available. Please train some adapters first.</Text>
                        </Alert>
                      )}
                    </Box>
                    
                    <Divider />
                    
                    {/* Advanced Parameters */}
                    <Box>
                      <Heading size="sm" mb={4}>Advanced Parameters</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel>Density: {mergeConfig.density}</FormLabel>
                          <NumberInput
                            value={mergeConfig.density}
                            onChange={(_, value) => setMergeConfig(prev => ({ ...prev, density: value }))}
                            min={0}
                            max={1}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Weight: {mergeConfig.weight}</FormLabel>
                          <NumberInput
                            value={mergeConfig.weight}
                            onChange={(_, value) => setMergeConfig(prev => ({ ...prev, weight: value }))}
                            min={0}
                            max={2}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Batch Size</FormLabel>
                          <NumberInput
                            value={mergeConfig.batch_size}
                            onChange={(_, value) => setMergeConfig(prev => ({ ...prev, batch_size: value }))}
                            min={1}
                            max={8}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        
                        <VStack align="stretch" spacing={4}>
                          <HStack justify="space-between">
                            <Text>Normalize Weights</Text>
                            <Switch
                              isChecked={mergeConfig.normalize}
                              onChange={(e) => setMergeConfig(prev => ({ ...prev, normalize: e.target.checked }))}
                              colorScheme="primary"
                            />
                          </HStack>
                          
                          <HStack justify="space-between">
                            <Text>Use GPU</Text>
                            <Switch
                              isChecked={mergeConfig.use_gpu}
                              onChange={(e) => setMergeConfig(prev => ({ ...prev, use_gpu: e.target.checked }))}
                              colorScheme="primary"
                            />
                          </HStack>
                        </VStack>
                      </SimpleGrid>
                    </Box>
                    
                    <Divider />
                    
                    {/* Merge Info */}
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="medium">Merge Information</Text>
                        <Text fontSize="sm" mt={1}>
                          Selected adapters will be merged with the base model using {mergeMethod} method.
                          The process may take several minutes depending on model size.
                        </Text>
                      </Box>
                    </Alert>
                    
                    <Flex justify="flex-end">
                      <Button
                        leftIcon={<FiGitMerge />}
                        colorScheme="primary"
                        size="lg"
                        onClick={handleStartMerge}
                        isLoading={isMerging}
                        loadingText="Starting Merge..."
                        isDisabled={!selectedBaseModel || selectedAdapters.length === 0 || !outputName}
                      >
                        Start Merge
                      </Button>
                    </Flex>
                  </VStack>
                </CardBody>
              </MotionCard>
            </VStack>
          </TabPanel>
          
          {/* Merge History Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Stats */}
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
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
                      <StatLabel>Total Merges</StatLabel>
                      <StatNumber>{mergeJobs.length}</StatNumber>
                      <StatHelpText>
                        <Icon as={FiGitMerge} mr={1} />
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
                      <StatNumber color="blue.500">
                        {mergeJobs.filter(j => j.status === 'running').length}
                      </StatNumber>
                      <StatHelpText>
                        <Icon as={FiClock} mr={1} />
                        In progress
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
                      <StatNumber color="green.500">
                        {mergeJobs.filter(j => j.status === 'completed').length}
                      </StatNumber>
                      <StatHelpText>
                        <Icon as={FiCheckCircle} mr={1} />
                        Successful
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </MotionCard>
              </SimpleGrid>
              
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
                          <Th>Merge Name</Th>
                          <Th>Status</Th>
                          <Th>Base Model</Th>
                          <Th>Adapters</Th>
                          <Th>Method</Th>
                          <Th>Progress</Th>
                          <Th>Duration</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {mergeJobs.map((job, index) => {
                          const StatusIcon = getStatusIcon(job.status);
                          return (
                            <Tr key={job.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{job.name}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {job.startTime.toLocaleDateString()}
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
                                <Text fontSize="sm">{job.baseModel}</Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{job.adapters.length} adapter(s)</Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{job.mergeMethod}</Text>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm">{job.progress}%</Text>
                                  <Progress
                                    value={job.progress}
                                    size="sm"
                                    colorScheme={getStatusColor(job.status)}
                                    w="80px"
                                  />
                                </VStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {formatDuration(job.startTime, job.endTime)}
                                </Text>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <Tooltip label="View Details">
                                    <IconButton
                                      icon={<FiEye />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedJob(job);
                                        onOpen();
                                      }}
                                    />
                                  </Tooltip>
                                  {job.status === 'completed' && (
                                    <Tooltip label="Download Model">
                                      <IconButton
                                        icon={<FiDownload />}
                                        size="sm"
                                        variant="ghost"
                                      />
                                    </Tooltip>
                                  )}
                                  <Tooltip label="Delete">
                                    <IconButton
                                      icon={<FiTrash2 />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                    />
                                  </Tooltip>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  
                  {mergeJobs.length === 0 && (
                    <Box p={8} textAlign="center">
                      <Icon as={FiGitMerge} boxSize={12} color="gray.400" mb={4} />
                      <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
                        No merge jobs yet
                      </Text>
                      <Text color="gray.400">
                        Start your first model merge to see it here
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </MotionCard>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Job Details Modal */}
      {selectedJob && (
        <MergeJobModal job={selectedJob} />
      )}
    </VStack>
  );
};

export default MergePage;