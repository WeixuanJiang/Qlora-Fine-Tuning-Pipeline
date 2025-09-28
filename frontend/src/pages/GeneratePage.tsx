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
  Textarea,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Button,
  Divider,
  Badge,
  Icon,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  PlayIcon,
  CopyIcon,
  DownloadIcon,
  SettingsIcon,
  ZapIcon,
  TypeIcon,
} from '@/components/icons/GeometricIcons';
import { motion } from 'framer-motion';
import { useModelStore } from '@/stores/modelStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const MotionCard = motion(Card);

interface GenerationParams {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  topK: number;
  repetitionPenalty: number;
  doSample: boolean;
  numBeams: number;
  earlyStopping: boolean;
  padTokenId: number;
  eosTokenId: number;
}

const DEFAULT_PARAMS: GenerationParams = {
  prompt: '',
  model: 'meta-llama/Llama-2-7b-hf',
  maxTokens: 256,
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  repetitionPenalty: 1.1,
  doSample: true,
  numBeams: 1,
  earlyStopping: false,
  padTokenId: 0,
  eosTokenId: 2,
};

const SAMPLE_PROMPTS = [
  {
    title: 'Creative Writing',
    prompt: 'Write a short story about a robot who discovers emotions for the first time.',
  },
  {
    title: 'Code Generation',
    prompt: 'Write a Python function that calculates the fibonacci sequence using dynamic programming.',
  },
  {
    title: 'Question Answering',
    prompt: 'Explain the concept of machine learning in simple terms that a 10-year-old could understand.',
  },
  {
    title: 'Conversation',
    prompt: 'Human: What are the benefits of renewable energy?\nAssistant:',
  },
];

const AVAILABLE_MODELS = [
  { value: 'meta-llama/Llama-2-7b-hf', label: 'Llama 2 7B' },
  { value: 'meta-llama/Llama-2-13b-hf', label: 'Llama 2 13B' },
  { value: 'microsoft/DialoGPT-medium', label: 'DialoGPT Medium' },
  { value: 'custom-model-1', label: 'Custom Fine-tuned Model 1' },
  { value: 'custom-model-2', label: 'Custom Fine-tuned Model 2' },
];

const GeneratePage: React.FC = () => {
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<Array<{
    prompt: string;
    response: string;
    timestamp: Date;
    params: Partial<GenerationParams>;
  }>>([]);
  
  const { models } = useModelStore();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const codeBg = useColorModeValue('gray.50', 'gray.900');
  
  const handleParamChange = (field: keyof GenerationParams, value: any) => {
    setParams(prev => ({ ...prev, [field]: value }));
  };
  
  const handleGenerate = async () => {
    if (!params.prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponse = `This is a generated response to: "${params.prompt}". 

The model ${params.model} processed your request with the following parameters:
- Temperature: ${params.temperature}
- Max tokens: ${params.maxTokens}
- Top-p: ${params.topP}

This is a mock response for demonstration purposes. In a real implementation, this would be the actual model output.`;
      
      setGeneratedText(mockResponse);
      
      // Add to history
      setGenerationHistory(prev => [{
        prompt: params.prompt,
        response: mockResponse,
        timestamp: new Date(),
        params: {
          model: params.model,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
          topP: params.topP,
        },
      }, ...prev.slice(0, 9)]); // Keep last 10 generations
      
      toast({
        title: 'Generation Complete',
        description: 'Text generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate text',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
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
  
  const loadSamplePrompt = (prompt: string) => {
    setParams(prev => ({ ...prev, prompt }));
  };
  
  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>
          Text Generation
        </Heading>
        <Text color="gray.500">
          Generate text using fine-tuned models with customizable parameters
        </Text>
      </Box>
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
        {/* Input Section */}
        <VStack spacing={6} align="stretch">
          {/* Prompt Input */}
          <MotionCard
            bg={cardBg}
            shadow="sm"
            borderRadius="xl"
            border="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <HStack spacing={3}>
                <Icon as={TypeIcon} color="primary.500" boxSize={5} />
                <Heading size="md">Input Prompt</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Prompt</FormLabel>
                  <Textarea
                    value={params.prompt}
                    onChange={(e) => handleParamChange('prompt', e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={6}
                    resize="vertical"
                  />
                  <FormHelperText>
                    Enter the text you want the model to continue or respond to
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Model</FormLabel>
                  <Select
                    value={params.model}
                    onChange={(e) => handleParamChange('model', e.target.value)}
                  >
                    {AVAILABLE_MODELS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <Divider />
                
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3}>
                    Sample Prompts
                  </Text>
                  <SimpleGrid columns={1} spacing={2}>
                    {SAMPLE_PROMPTS.map((sample, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        h="auto"
                        p={3}
                        onClick={() => loadSamplePrompt(sample.prompt)}
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontSize="xs" fontWeight="bold" color="primary.500">
                            {sample.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500" noOfLines={2}>
                            {sample.prompt}
                          </Text>
                        </VStack>
                      </Button>
                    ))}
                  </SimpleGrid>
                </Box>
              </VStack>
            </CardBody>
          </MotionCard>
          
          {/* Generation Parameters */}
          <MotionCard
            bg={cardBg}
            shadow="sm"
            borderRadius="xl"
            border="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Accordion defaultIndex={[]} allowToggle>
              <AccordionItem border="none">
                <AccordionButton p={6}>
                  <HStack flex={1} spacing={3}>
                    <Icon as={SettingsIcon} color="primary.500" boxSize={5} />
                    <Heading size="md">Generation Parameters</Heading>
                  </HStack>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={6} px={6}>
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Max Tokens</FormLabel>
                        <NumberInput
                          value={params.maxTokens}
                          onChange={(_, value) => handleParamChange('maxTokens', value || 1)}
                          min={1}
                          max={2048}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Maximum number of tokens to generate</FormHelperText>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Number of Beams</FormLabel>
                        <NumberInput
                          value={params.numBeams}
                          onChange={(_, value) => handleParamChange('numBeams', value || 1)}
                          min={1}
                          max={10}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Beam search width (1 = greedy)</FormHelperText>
                      </FormControl>
                    </SimpleGrid>
                    
                    <FormControl>
                      <FormLabel>Temperature: {params.temperature}</FormLabel>
                      <Slider
                        value={params.temperature}
                        onChange={(value) => handleParamChange('temperature', value)}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                      >
                        <SliderMark value={0.1} mt={2} fontSize="xs">0.1</SliderMark>
                        <SliderMark value={1.0} mt={2} ml={-2} fontSize="xs">1.0</SliderMark>
                        <SliderMark value={2.0} mt={2} ml={-4} fontSize="xs">2.0</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                      <FormHelperText mt={4}>Controls randomness (lower = more focused)</FormHelperText>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Top-p (Nucleus): {params.topP}</FormLabel>
                      <Slider
                        value={params.topP}
                        onChange={(value) => handleParamChange('topP', value)}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                      >
                        <SliderMark value={0.1} mt={2} fontSize="xs">0.1</SliderMark>
                        <SliderMark value={0.5} mt={2} ml={-2} fontSize="xs">0.5</SliderMark>
                        <SliderMark value={1.0} mt={2} ml={-4} fontSize="xs">1.0</SliderMark>
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                      <FormHelperText mt={4}>Cumulative probability cutoff</FormHelperText>
                    </FormControl>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Top-k</FormLabel>
                        <NumberInput
                          value={params.topK}
                          onChange={(_, value) => handleParamChange('topK', value || 1)}
                          min={1}
                          max={100}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Limit to top-k tokens</FormHelperText>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Repetition Penalty</FormLabel>
                        <NumberInput
                          value={params.repetitionPenalty}
                          onChange={(_, value) => handleParamChange('repetitionPenalty', value || 1.0)}
                          min={1.0}
                          max={2.0}
                          step={0.1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>Penalty for repetition</FormHelperText>
                      </FormControl>
                    </SimpleGrid>
                    
                    <HStack spacing={8}>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb={0}>Sampling</FormLabel>
                        <Switch
                          isChecked={params.doSample}
                          onChange={(e) => handleParamChange('doSample', e.target.checked)}
                          colorScheme="primary"
                        />
                      </FormControl>
                      
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb={0}>Early Stopping</FormLabel>
                        <Switch
                          isChecked={params.earlyStopping}
                          onChange={(e) => handleParamChange('earlyStopping', e.target.checked)}
                          colorScheme="primary"
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </MotionCard>
        </VStack>
        
        {/* Output Section */}
        <VStack spacing={6} align="stretch">
          {/* Generate Button */}
          <MotionCard
            bg={cardBg}
            shadow="sm"
            borderRadius="xl"
            border="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardBody p={6}>
              <VStack spacing={4}>
                <Button
                  size="lg"
                  colorScheme="primary"
                  leftIcon={isGenerating ? <LoadingSpinner size="sm" /> : <PlayIcon />}
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  loadingText="Generating..."
                  w="full"
                  h={12}
                >
                  Generate Text
                </Button>
                
                {generatedText && (
                  <HStack spacing={2} w="full">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<CopyIcon />}
                      onClick={() => copyToClipboard(generatedText)}
                      flex={1}
                    >
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<DownloadIcon />}
                      onClick={() => {
                        const blob = new Blob([generatedText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'generated_text.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      flex={1}
                    >
                      Download
                    </Button>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </MotionCard>
          
          {/* Generated Output */}
          <MotionCard
            bg={cardBg}
            shadow="sm"
            borderRadius="xl"
            border="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <CardHeader>
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Icon as={ZapIcon} color="primary.500" boxSize={5} />
                  <Heading size="md">Generated Output</Heading>
                </HStack>
                {generatedText && (
                  <Badge colorScheme="green" variant="subtle">
                    {generatedText.split(' ').length} words
                  </Badge>
                )}
              </HStack>
            </CardHeader>
            <CardBody>
              {generatedText ? (
                <Box
                  bg={codeBg}
                  p={4}
                  borderRadius="md"
                  border="1px"
                  borderColor={useColorModeValue('gray.200', 'gray.600')}
                >
                  <Text whiteSpace="pre-wrap" fontSize="sm" lineHeight="tall">
                    {generatedText}
                  </Text>
                </Box>
              ) : (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Text>Generated text will appear here after you click "Generate Text"</Text>
                </Alert>
              )}
            </CardBody>
          </MotionCard>
          
          {/* Generation History */}
          {generationHistory.length > 0 && (
            <MotionCard
              bg={cardBg}
              shadow="sm"
              borderRadius="xl"
              border="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <CardHeader>
                <Heading size="md">Recent Generations</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {generationHistory.slice(0, 3).map((item, index) => (
                    <Box
                      key={index}
                      p={4}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="md"
                      border="1px"
                      borderColor={useColorModeValue('gray.200', 'gray.600')}
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color="gray.500">
                            {item.timestamp.toLocaleString()}
                          </Text>
                          <Badge size="sm" colorScheme="primary">
                            {item.params.model}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                          Prompt: {item.prompt}
                        </Text>
                        <Text fontSize="sm" color="gray.600" noOfLines={3}>
                          {item.response}
                        </Text>
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </MotionCard>
          )}
        </VStack>
      </SimpleGrid>
    </VStack>
  );
};

export default GeneratePage;