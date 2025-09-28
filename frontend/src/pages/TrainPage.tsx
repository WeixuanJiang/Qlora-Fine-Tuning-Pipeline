import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  FormControl,
  FormLabel,
  FormHelperText,
  FormErrorMessage,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Button,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Badge,
  Tooltip,
  Icon,
  useColorModeValue,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
} from '@chakra-ui/react';
import {
  PlayIcon,
  UploadIcon,
  SettingsIcon,
  InfoIcon,
  AlertIcon,
  CpuIcon,
  DatabaseIcon,
  ZapIcon,
} from '@/components/icons/GeometricIcons';
import { motion } from 'framer-motion';
import { useJobStore } from '@/stores/jobStore';
import { useModelStore } from '@/stores/modelStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);

interface TrainingFormData {
  jobName: string;
  baseModel: string;
  datasetPath: string;
  outputDir: string;
  epochs: number;
  batchSize: number;
  learningRate: number;
  loraRank: number;
  loraAlpha: number;
  loraDropout: number;
  maxSeqLength: number;
  warmupSteps: number;
  saveSteps: number;
  loggingSteps: number;
  gradientAccumulation: number;
  fp16: boolean;
  bf16: boolean;
  useGradientCheckpointing: boolean;
  useDeepSpeed: boolean;
  resumeFromCheckpoint: string;
  description: string;
}

const DEFAULT_FORM_DATA: TrainingFormData = {
  jobName: '',
  baseModel: 'meta-llama/Llama-2-7b-hf',
  datasetPath: '',
  outputDir: './output',
  epochs: 3,
  batchSize: 4,
  learningRate: 2e-4,
  loraRank: 16,
  loraAlpha: 32,
  loraDropout: 0.1,
  maxSeqLength: 2048,
  warmupSteps: 100,
  saveSteps: 500,
  loggingSteps: 10,
  gradientAccumulation: 4,
  fp16: true,
  bf16: false,
  useGradientCheckpointing: true,
  useDeepSpeed: false,
  resumeFromCheckpoint: '',
  description: '',
};

const BASE_MODELS = [
  { value: 'meta-llama/Llama-2-7b-hf', label: 'Llama 2 7B' },
  { value: 'meta-llama/Llama-2-13b-hf', label: 'Llama 2 13B' },
  { value: 'microsoft/DialoGPT-medium', label: 'DialoGPT Medium' },
  { value: 'microsoft/DialoGPT-large', label: 'DialoGPT Large' },
  { value: 'facebook/opt-1.3b', label: 'OPT 1.3B' },
  { value: 'facebook/opt-2.7b', label: 'OPT 2.7B' },
  { value: 'EleutherAI/gpt-j-6b', label: 'GPT-J 6B' },
  { value: 'bigscience/bloom-1b7', label: 'BLOOM 1.7B' },
];

const FormSection: React.FC<{
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}> = ({ title, description, icon, children, defaultExpanded = true }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  
  return (
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
      <Accordion defaultIndex={defaultExpanded ? [0] : []} allowToggle>
        <AccordionItem border="none">
          <AccordionButton p={6} _hover={{ bg: 'transparent' }}>
            <HStack flex={1} spacing={3} align="center">
              <Icon as={icon} color="primary.500" boxSize={5} />
              <VStack align="start" spacing={1}>
                <Heading size="md" textAlign="left">
                  {title}
                </Heading>
                {description && (
                  <Text fontSize="sm" color="gray.500" textAlign="left">
                    {description}
                  </Text>
                )}
              </VStack>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6} px={6}>
            {children}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
};

const TrainPage: React.FC = () => {
  const [formData, setFormData] = useState<TrainingFormData>(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<TrainingFormData>>({});
  
  const { startJob } = useJobStore();
  const { models } = useModelStore();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const handleInputChange = (field: keyof TrainingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<TrainingFormData> = {};
    
    if (!formData.jobName.trim()) {
      newErrors.jobName = 'Job name is required';
    }
    
    if (!formData.datasetPath.trim()) {
      newErrors.datasetPath = 'Dataset path is required';
    }
    
    if (formData.epochs < 1) {
      newErrors.epochs = 'Epochs must be at least 1';
    }
    
    if (formData.batchSize < 1) {
      newErrors.batchSize = 'Batch size must be at least 1';
    }
    
    if (formData.learningRate <= 0) {
      newErrors.learningRate = 'Learning rate must be positive';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await startJob({
        id: `job_${Date.now()}`,
        name: formData.jobName,
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        model: formData.baseModel,
        dataset: formData.datasetPath,
        parameters: {
          epochs: formData.epochs,
          batch_size: formData.batchSize,
          learning_rate: formData.learningRate,
          lora_rank: formData.loraRank,
          lora_alpha: formData.loraAlpha,
          lora_dropout: formData.loraDropout,
          max_seq_length: formData.maxSeqLength,
          warmup_steps: formData.warmupSteps,
          save_steps: formData.saveSteps,
          logging_steps: formData.loggingSteps,
          gradient_accumulation_steps: formData.gradientAccumulation,
          fp16: formData.fp16,
          bf16: formData.bf16,
          gradient_checkpointing: formData.useGradientCheckpointing,
          deepspeed: formData.useDeepSpeed,
        },
        logs: [],
        metrics: {
          loss: 0,
          learning_rate: formData.learningRate,
          epoch: 0,
          step: 0,
          eval_loss: 0,
          eval_accuracy: 0,
          perplexity: 0,
          bleu_score: 0,
        },
      });
      
      toast({
        title: 'Training Started',
        description: `Job "${formData.jobName}" has been started successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Reset form
      setFormData(DEFAULT_FORM_DATA);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start training job',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Start Training Job
        </Heading>
        <Text color="gray.500">
          Configure and start a new QLoRA fine-tuning job
        </Text>
      </Box>
      
      {/* Basic Configuration */}
      <FormSection
        title="Basic Configuration"
        description="Essential settings for your training job"
        icon={SettingsIcon}
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <FormControl isRequired isInvalid={!!errors.jobName}>
            <FormLabel>Job Name</FormLabel>
            <Input
              value={formData.jobName}
              onChange={(e) => handleInputChange('jobName', e.target.value)}
              placeholder="Enter a descriptive name for this job"
            />
            <FormErrorMessage>{errors.jobName}</FormErrorMessage>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Base Model</FormLabel>
            <Select
              value={formData.baseModel}
              onChange={(e) => handleInputChange('baseModel', e.target.value)}
            >
              {BASE_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </Select>
            <FormHelperText>
              Choose the pre-trained model to fine-tune
            </FormHelperText>
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.datasetPath}>
            <FormLabel>Dataset Path</FormLabel>
            <Input
              value={formData.datasetPath}
              onChange={(e) => handleInputChange('datasetPath', e.target.value)}
              placeholder="/path/to/your/dataset.json"
            />
            <FormErrorMessage>{errors.datasetPath}</FormErrorMessage>
          </FormControl>
          
          <FormControl>
            <FormLabel>Output Directory</FormLabel>
            <Input
              value={formData.outputDir}
              onChange={(e) => handleInputChange('outputDir', e.target.value)}
              placeholder="./output"
            />
            <FormHelperText>
              Directory to save the trained model
            </FormHelperText>
          </FormControl>
        </SimpleGrid>
        
        <FormControl mt={6}>
          <FormLabel>Description (Optional)</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Add a description for this training job..."
            rows={3}
          />
        </FormControl>
      </FormSection>
      
      {/* Training Parameters */}
      <FormSection
        title="Training Parameters"
        description="Core hyperparameters for the training process"
        icon={ZapIcon}
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <FormControl isInvalid={!!errors.epochs}>
            <FormLabel>Epochs</FormLabel>
            <NumberInput
              value={formData.epochs}
              onChange={(_, value) => handleInputChange('epochs', value || 1)}
              min={1}
              max={100}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>Number of training epochs</FormHelperText>
            <FormErrorMessage>{errors.epochs}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.batchSize}>
            <FormLabel>Batch Size</FormLabel>
            <NumberInput
              value={formData.batchSize}
              onChange={(_, value) => handleInputChange('batchSize', value || 1)}
              min={1}
              max={64}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>Training batch size</FormHelperText>
            <FormErrorMessage>{errors.batchSize}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={!!errors.learningRate}>
            <FormLabel>Learning Rate</FormLabel>
            <NumberInput
              value={formData.learningRate}
              onChange={(_, value) => handleInputChange('learningRate', value || 0.0001)}
              min={0.00001}
              max={0.01}
              step={0.00001}
              format={(val) => val.toExponential(1)}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>Optimizer learning rate</FormHelperText>
            <FormErrorMessage>{errors.learningRate}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>
      </FormSection>
      
      {/* LoRA Configuration */}
      <FormSection
        title="LoRA Configuration"
        description="Low-Rank Adaptation specific parameters"
        icon={CpuIcon}
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          <FormControl>
            <FormLabel>LoRA Rank</FormLabel>
            <Box px={3}>
              <Slider
                value={formData.loraRank}
                onChange={(value) => handleInputChange('loraRank', value)}
                min={1}
                max={64}
                step={1}
              >
                <SliderMark value={1} mt={2} fontSize="sm">1</SliderMark>
                <SliderMark value={32} mt={2} ml={-2} fontSize="sm">32</SliderMark>
                <SliderMark value={64} mt={2} ml={-4} fontSize="sm">64</SliderMark>
                <SliderMark
                  value={formData.loraRank}
                  textAlign="center"
                  bg="primary.500"
                  color="white"
                  mt={-10}
                  ml={-5}
                  w={10}
                  fontSize="sm"
                  borderRadius="md"
                >
                  {formData.loraRank}
                </SliderMark>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
            <FormHelperText mt={4}>Rank of the adaptation</FormHelperText>
          </FormControl>
          
          <FormControl>
            <FormLabel>LoRA Alpha</FormLabel>
            <NumberInput
              value={formData.loraAlpha}
              onChange={(_, value) => handleInputChange('loraAlpha', value || 16)}
              min={1}
              max={128}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText>LoRA scaling parameter</FormHelperText>
          </FormControl>
          
          <FormControl>
            <FormLabel>LoRA Dropout</FormLabel>
            <NumberInput
              value={formData.loraDropout}
              onChange={(_, value) => handleInputChange('loraDropout', value || 0.1)}
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
            <FormHelperText>Dropout probability for LoRA layers</FormHelperText>
          </FormControl>
        </SimpleGrid>
      </FormSection>
      
      {/* Advanced Settings */}
      <FormSection
        title="Advanced Settings"
        description="Additional configuration options"
        icon={DatabaseIcon}
        defaultExpanded={false}
      >
        <VStack spacing={6} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <FormControl>
              <FormLabel>Max Sequence Length</FormLabel>
              <NumberInput
                value={formData.maxSeqLength}
                onChange={(_, value) => handleInputChange('maxSeqLength', value || 512)}
                min={128}
                max={4096}
                step={128}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <FormControl>
              <FormLabel>Warmup Steps</FormLabel>
              <NumberInput
                value={formData.warmupSteps}
                onChange={(_, value) => handleInputChange('warmupSteps', value || 0)}
                min={0}
                max={1000}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            
            <FormControl>
              <FormLabel>Save Steps</FormLabel>
              <NumberInput
                value={formData.saveSteps}
                onChange={(_, value) => handleInputChange('saveSteps', value || 500)}
                min={1}
                max={10000}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>
          
          <Divider />
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>FP16 Training</FormLabel>
                <Switch
                  isChecked={formData.fp16}
                  onChange={(e) => handleInputChange('fp16', e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>BF16 Training</FormLabel>
                <Switch
                  isChecked={formData.bf16}
                  onChange={(e) => handleInputChange('bf16', e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
            </VStack>
            
            <VStack spacing={4} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Gradient Checkpointing</FormLabel>
                <Switch
                  isChecked={formData.useGradientCheckpointing}
                  onChange={(e) => handleInputChange('useGradientCheckpointing', e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>DeepSpeed</FormLabel>
                <Switch
                  isChecked={formData.useDeepSpeed}
                  onChange={(e) => handleInputChange('useDeepSpeed', e.target.checked)}
                  colorScheme="primary"
                />
              </FormControl>
            </VStack>
          </SimpleGrid>
        </VStack>
      </FormSection>
      
      {/* Submit Section */}
      <MotionCard
        bg={cardBg}
        shadow="sm"
        borderRadius="xl"
        border="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <CardBody p={6}>
          <VStack spacing={4}>
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Ready to start training!</AlertTitle>
                <AlertDescription>
                  Make sure your dataset is properly formatted and accessible at the specified path.
                </AlertDescription>
              </Box>
            </Alert>
            
            <HStack spacing={4} w="full" justify="center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setFormData(DEFAULT_FORM_DATA)}
                isDisabled={isSubmitting}
              >
                Reset Form
              </Button>
              <Button
                size="lg"
                colorScheme="primary"
                leftIcon={isSubmitting ? <LoadingSpinner size="sm" /> : <PlayIcon />}
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="Starting..."
                minW={40}
              >
                Start Training
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </MotionCard>
    </VStack>
  );
};

export default TrainPage;