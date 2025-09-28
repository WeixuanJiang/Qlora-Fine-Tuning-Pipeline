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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Input,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Divider,
  Code,
  Flex,
  Spacer,
  IconButton,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from '@chakra-ui/react';
import {
  PlayIcon,
  DownloadIcon,
  RefreshIcon,
  ChartIcon,
  TargetIcon,
  TrendingUpIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  FileTextIcon,
  SettingsIcon,
  InfoIcon,
  CopyIcon,
  EyeIcon,
} from '@/components/icons/GeometricIcons';
import { motion } from 'framer-motion';
import { useModelStore } from '@/stores/modelStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

interface EvaluationResult {
  id: string;
  name: string;
  model: string;
  dataset: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  metrics: {
    perplexity: number;
    bleu_score: number;
    rouge_l: number;
    accuracy: number;
    f1_score: number;
  };
  samples: Array<{
    input: string;
    expected: string;
    generated: string;
    score: number;
  }>;
}

const EvaluatePage: React.FC = () => {
  const { models, adapters, refreshModels } = useModelStore();
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedAdapter, setSelectedAdapter] = useState('');
  const [evaluationDataset, setEvaluationDataset] = useState('');
  const [customPrompts, setCustomPrompts] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<EvaluationResult | null>(null);
  const [evaluationConfig, setEvaluationConfig] = useState({
    max_samples: 100,
    temperature: 0.7,
    max_tokens: 512,
    use_custom_prompts: false,
    include_perplexity: true,
    include_bleu: true,
    include_rouge: true,
  });
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  
  useEffect(() => {
    refreshModels();
    // Load mock evaluation results
    setEvaluationResults([
      {
        id: '1',
        name: 'QLoRA Evaluation #1',
        model: 'llama-2-7b',
        dataset: 'alpaca-cleaned',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 1800000),
        metrics: {
          perplexity: 12.45,
          bleu_score: 0.78,
          rouge_l: 0.82,
          accuracy: 0.85,
          f1_score: 0.83,
        },
        samples: [
          {
            input: 'Explain the concept of machine learning',
            expected: 'Machine learning is a subset of artificial intelligence...',
            generated: 'Machine learning is a method of data analysis...',
            score: 0.87,
          },
        ],
      },
      {
        id: '2',
        name: 'QLoRA Evaluation #2',
        model: 'llama-2-13b',
        dataset: 'dolly-15k',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 1800000),
        metrics: {
          perplexity: 0,
          bleu_score: 0,
          rouge_l: 0,
          accuracy: 0,
          f1_score: 0,
        },
        samples: [],
      },
    ]);
  }, [refreshModels]);
  
  const handleStartEvaluation = async () => {
    if (!selectedModel || !evaluationDataset) {
      toast({
        title: 'Missing Information',
        description: 'Please select a model and evaluation dataset',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsEvaluating(true);
    
    try {
      // Simulate evaluation start
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newEvaluation: EvaluationResult = {
        id: Date.now().toString(),
        name: `Evaluation ${evaluationResults.length + 1}`,
        model: selectedModel,
        dataset: evaluationDataset,
        status: 'running',
        progress: 0,
        startTime: new Date(),
        metrics: {
          perplexity: 0,
          bleu_score: 0,
          rouge_l: 0,
          accuracy: 0,
          f1_score: 0,
        },
        samples: [],
      };
      
      setEvaluationResults(prev => [newEvaluation, ...prev]);
      
      toast({
        title: 'Evaluation Started',
        description: 'Model evaluation has been started successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start evaluation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsEvaluating(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return ClockIcon;
      case 'completed': return CheckIcon;
      case 'failed': return XIcon;
      default: return ClockIcon;
    }
  };
  
  const formatMetric = (value: number, type: string) => {
    if (value === 0) return 'N/A';
    if (type === 'perplexity') return value.toFixed(2);
    return (value * 100).toFixed(1) + '%';
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };
  
  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Model Evaluation
        </Heading>
        <Text color="gray.500">
          Evaluate your fine-tuned models with comprehensive metrics and analysis
        </Text>
      </Box>
      
      <Tabs variant="enclosed" colorScheme="primary">
        <TabList>
          <Tab>New Evaluation</Tab>
          <Tab>Results History</Tab>
          <Tab>Benchmarks</Tab>
        </TabList>
        
        <TabPanels>
          {/* New Evaluation Tab */}
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
                    <Icon as={SettingsIcon} color="primary.500" />
                    <Heading size="md">Evaluation Configuration</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel>Model</FormLabel>
                      <Select
                        placeholder="Select model to evaluate"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        {models.map(model => (
                          <option key={model.id} value={model.name}>
                            {model.name} ({model.size})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Adapter (Optional)</FormLabel>
                      <Select
                        placeholder="Select adapter"
                        value={selectedAdapter}
                        onChange={(e) => setSelectedAdapter(e.target.value)}
                      >
                        {adapters.map(adapter => (
                          <option key={adapter.id} value={adapter.name}>
                            {adapter.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Evaluation Dataset</FormLabel>
                      <Select
                        placeholder="Select evaluation dataset"
                        value={evaluationDataset}
                        onChange={(e) => setEvaluationDataset(e.target.value)}
                      >
                        <option value="alpaca-cleaned">Alpaca Cleaned</option>
                        <option value="dolly-15k">Dolly 15k</option>
                        <option value="oasst1">OpenAssistant</option>
                        <option value="custom">Custom Dataset</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Max Samples</FormLabel>
                      <NumberInput
                        value={evaluationConfig.max_samples}
                        onChange={(_, value) => setEvaluationConfig(prev => ({ ...prev, max_samples: value }))}
                        min={10}
                        max={1000}
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
                  
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Generation Parameters</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Temperature: {evaluationConfig.temperature}</FormLabel>
                        <Slider
                          value={evaluationConfig.temperature}
                          onChange={(value) => setEvaluationConfig(prev => ({ ...prev, temperature: value }))}
                          min={0.1}
                          max={2.0}
                          step={0.1}
                        >
                          <SliderTrack>
                            <SliderFilledTrack />
                          </SliderTrack>
                          <SliderThumb />
                        </Slider>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Max Tokens</FormLabel>
                        <NumberInput
                          value={evaluationConfig.max_tokens}
                          onChange={(_, value) => setEvaluationConfig(prev => ({ ...prev, max_tokens: value }))}
                          min={50}
                          max={2048}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                  
                  <Divider my={6} />
                  
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Evaluation Metrics</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <HStack justify="space-between">
                        <Text>Include Perplexity</Text>
                        <Switch
                          isChecked={evaluationConfig.include_perplexity}
                          onChange={(e) => setEvaluationConfig(prev => ({ ...prev, include_perplexity: e.target.checked }))}
                        />
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text>Include BLEU Score</Text>
                        <Switch
                          isChecked={evaluationConfig.include_bleu}
                          onChange={(e) => setEvaluationConfig(prev => ({ ...prev, include_bleu: e.target.checked }))}
                        />
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text>Include ROUGE-L</Text>
                        <Switch
                          isChecked={evaluationConfig.include_rouge}
                          onChange={(e) => setEvaluationConfig(prev => ({ ...prev, include_rouge: e.target.checked }))}
                        />
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text>Use Custom Prompts</Text>
                        <Switch
                          isChecked={evaluationConfig.use_custom_prompts}
                          onChange={(e) => setEvaluationConfig(prev => ({ ...prev, use_custom_prompts: e.target.checked }))}
                        />
                      </HStack>
                    </SimpleGrid>
                    
                    {evaluationConfig.use_custom_prompts && (
                      <FormControl>
                        <FormLabel>Custom Prompts (one per line)</FormLabel>
                        <Textarea
                          placeholder="Enter custom prompts for evaluation..."
                          value={customPrompts}
                          onChange={(e) => setCustomPrompts(e.target.value)}
                          rows={6}
                        />
                      </FormControl>
                    )}
                  </VStack>
                  
                  <Flex mt={8} justify="flex-end">
                    <Button
                      leftIcon={<PlayIcon />}
                      colorScheme="primary"
                      size="lg"
                      onClick={handleStartEvaluation}
                      isLoading={isEvaluating}
                      loadingText="Starting Evaluation..."
                    >
                      Start Evaluation
                    </Button>
                  </Flex>
                </CardBody>
              </MotionCard>
            </VStack>
          </TabPanel>
          
          {/* Results History Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Results Overview */}
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
                      <StatLabel>Total Evaluations</StatLabel>
                      <StatNumber>{evaluationResults.length}</StatNumber>
                      <StatHelpText>
                        <Icon as={ChartIcon} mr={1} />
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
                        {evaluationResults.filter(r => r.status === 'running').length}
                      </StatNumber>
                      <StatHelpText>
                        <Icon as={ClockIcon} mr={1} />
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
                        {evaluationResults.filter(r => r.status === 'completed').length}
                      </StatNumber>
                      <StatHelpText>
                        <Icon as={CheckIcon} mr={1} />
                        Finished
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </MotionCard>
              </SimpleGrid>
              
              {/* Results Table */}
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
                          <Th>Evaluation</Th>
                          <Th>Status</Th>
                          <Th>Model</Th>
                          <Th>Dataset</Th>
                          <Th>Progress</Th>
                          <Th>Perplexity</Th>
                          <Th>BLEU</Th>
                          <Th>ROUGE-L</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {evaluationResults.map((result, index) => {
                          const StatusIcon = getStatusIcon(result.status);
                          return (
                            <Tr key={result.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{result.name}</Text>
                                  <Text fontSize="sm" color="gray.500">
                                    {result.startTime.toLocaleDateString()}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Icon as={StatusIcon} color={`${getStatusColor(result.status)}.500`} />
                                  <Badge colorScheme={getStatusColor(result.status)} variant="subtle">
                                    {result.status}
                                  </Badge>
                                </HStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{result.model}</Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">{result.dataset}</Text>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm">{result.progress}%</Text>
                                  <Progress
                                    value={result.progress}
                                    size="sm"
                                    colorScheme={getStatusColor(result.status)}
                                    w="80px"
                                  />
                                </VStack>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {formatMetric(result.metrics.perplexity, 'perplexity')}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {formatMetric(result.metrics.bleu_score, 'percentage')}
                                </Text>
                              </Td>
                              <Td>
                                <Text fontSize="sm">
                                  {formatMetric(result.metrics.rouge_l, 'percentage')}
                                </Text>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <Tooltip label="View Details">
                                    <IconButton
                                      icon={<EyeIcon />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSelectedResult(result)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Download Report">
                                    <IconButton
                                      icon={<DownloadIcon />}
                                      size="sm"
                                      variant="ghost"
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
                  
                  {evaluationResults.length === 0 && (
                    <Box p={8} textAlign="center">
                      <Icon as={TargetIcon} boxSize={12} color="gray.400" mb={4} />
                      <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
                        No evaluations yet
                      </Text>
                      <Text color="gray.400">
                        Start your first model evaluation to see results here
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </MotionCard>
              
              {/* Detailed Results */}
              {selectedResult && (
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
                    <HStack justify="space-between">
                      <HStack spacing={3}>
                        <Icon as={FileTextIcon} color="primary.500" />
                        <Heading size="md">{selectedResult.name} - Detailed Results</Heading>
                      </HStack>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedResult(null)}>
                        Close
                      </Button>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
                      <Stat>
                        <StatLabel>Perplexity</StatLabel>
                        <StatNumber>{formatMetric(selectedResult.metrics.perplexity, 'perplexity')}</StatNumber>
                        <StatHelpText>Lower is better</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>BLEU Score</StatLabel>
                        <StatNumber>{formatMetric(selectedResult.metrics.bleu_score, 'percentage')}</StatNumber>
                        <StatHelpText>Higher is better</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>ROUGE-L</StatLabel>
                        <StatNumber>{formatMetric(selectedResult.metrics.rouge_l, 'percentage')}</StatNumber>
                        <StatHelpText>Higher is better</StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Accuracy</StatLabel>
                        <StatNumber>{formatMetric(selectedResult.metrics.accuracy, 'percentage')}</StatNumber>
                        <StatHelpText>Higher is better</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                    
                    {selectedResult.samples.length > 0 && (
                      <Box>
                        <Heading size="sm" mb={4}>Sample Outputs</Heading>
                        <VStack spacing={4} align="stretch">
                          {selectedResult.samples.map((sample, index) => (
                            <Box
                              key={index}
                              p={4}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                            >
                              <VStack spacing={3} align="stretch">
                                <Box>
                                  <HStack justify="space-between" mb={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.500">
                                      Input
                                    </Text>
                                    <IconButton
                                        icon={<CopyIcon />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(sample.input)}
                                      />
                                  </HStack>
                                  <Code p={2} w="full" fontSize="sm">
                                    {sample.input}
                                  </Code>
                                </Box>
                                
                                <Box>
                                  <HStack justify="space-between" mb={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.500">
                                      Expected Output
                                    </Text>
                                    <IconButton
                                        icon={<CopyIcon />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(sample.expected)}
                                      />
                                  </HStack>
                                  <Code p={2} w="full" fontSize="sm">
                                    {sample.expected}
                                  </Code>
                                </Box>
                                
                                <Box>
                                  <HStack justify="space-between" mb={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.500">
                                      Generated Output
                                    </Text>
                                    <HStack spacing={2}>
                                      <Badge colorScheme={sample.score > 0.8 ? 'green' : sample.score > 0.6 ? 'orange' : 'red'}>
                                        Score: {(sample.score * 100).toFixed(1)}%
                                      </Badge>
                                      <IconButton
                                        icon={<CopyIcon />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(sample.generated)}
                                      />
                                    </HStack>
                                  </HStack>
                                  <Code p={2} w="full" fontSize="sm">
                                    {sample.generated}
                                  </Code>
                                </Box>
                              </VStack>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </CardBody>
                </MotionCard>
              )}
            </VStack>
          </TabPanel>
          
          {/* Benchmarks Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>
                  Benchmark comparisons will be available after completing evaluations.
                  Compare your models against standard benchmarks and other fine-tuned models.
                </Text>
              </Alert>
              
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
                <CardBody p={8} textAlign="center">
                  <Icon as={TrendingUpIcon} boxSize={12} color="gray.400" mb={4} />
                  <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
                    Benchmark Comparisons Coming Soon
                  </Text>
                  <Text color="gray.400">
                    This feature will allow you to compare your models against industry benchmarks
                  </Text>
                </CardBody>
              </MotionCard>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default EvaluatePage;