import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Box as Card,
  
  
  Badge,
  Icon,
  
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { motion } from 'framer-motion';
import {
  UploadIcon,
  DatabaseIcon,
  EyeIcon,
  RefreshIcon,
  MoreVerticalIcon,
  DownloadIcon,
  TrashIcon,
  InfoIcon,
} from '@/components/icons/GeometricIcons';
import { useDatasetStore } from '@/stores/datasetStore';
import DatasetUploader from '@/components/dataset/DatasetUploader';
import DatasetPreview from '@/components/dataset/DatasetPreview';
import { formatDistanceToNow } from 'date-fns';

const MotionCard = motion(Card);

const DatasetPage: React.FC = () => {
  const {
    datasets,
    selectedDataset,
    datasetInfo,
    loading,
    fetchDatasets,
    getDatasetInfo,
    selectDataset,
    clearPreview,
  } = useDatasetStore();

  const [selectedTab, setSelectedTab] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();

  const toast = useToast();
  const cardBg = 'white';
  const borderColor = 'gray.200';

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDatasetClick = async (dataset: any) => {
    selectDataset(dataset);
    await getDatasetInfo(dataset.name);
    onPreviewOpen();
  };

  const handleUploadComplete = () => {
    fetchDatasets();
    onClose();
    toast({
      title: 'Dataset uploaded',
      description: 'Your dataset has been uploaded successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const formatFileSize = (sizeInMB: number): string => {
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <Flex align="center" justify="space-between">
        <Box>
          <Heading size="lg" mb={2}>
            Datasets
          </Heading>
          <Text color="gray.500">
            Manage and preview your training datasets
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RefreshIcon />}
            onClick={fetchDatasets}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<UploadIcon />}
            colorScheme="primary"
            onClick={onOpen}
          >
            Upload Dataset
          </Button>
        </HStack>
      </Flex>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <MotionCard
          bg={cardBg}
          border="1px"
          borderColor={borderColor}
          borderRadius="xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box p={6}>
            <Stat>
              <StatLabel>Total Datasets</StatLabel>
              <StatNumber>{datasets.length}</StatNumber>
              <StatHelpText>
                <Icon as={DatabaseIcon} mr={1} />
                Available for training
              </StatHelpText>
            </Stat>
          </Box>
        </MotionCard>

        <MotionCard
          bg={cardBg}
          border="1px"
          borderColor={borderColor}
          borderRadius="xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Box p={6}>
            <Stat>
              <StatLabel>Total Size</StatLabel>
              <StatNumber>
                {formatFileSize(
                  datasets.reduce((sum, d) => sum + d.size_mb, 0)
                )}
              </StatNumber>
              <StatHelpText>Across all datasets</StatHelpText>
            </Stat>
          </Box>
        </MotionCard>

        <MotionCard
          bg={cardBg}
          border="1px"
          borderColor={borderColor}
          borderRadius="xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Box p={6}>
            <Stat>
              <StatLabel>Formats</StatLabel>
              <HStack mt={2} spacing={2}>
                {Array.from(new Set(datasets.map((d) => d.format))).map(
                  (format) => (
                    <Badge key={format} colorScheme="primary" variant="subtle">
                      {format.toUpperCase()}
                    </Badge>
                  )
                )}
              </HStack>
              <StatHelpText>JSON, JSONL, CSV</StatHelpText>
            </Stat>
          </Box>
        </MotionCard>
      </SimpleGrid>

      {/* Dataset Grid */}
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Available Datasets
        </Text>

        {datasets.length === 0 ? (
          <Card
            bg={cardBg}
            border="1px"
            borderColor={borderColor}
            borderRadius="xl"
          >
            <Box p={12} textAlign="center">
              <Icon as={DatabaseIcon} boxSize={16} color="gray.400" mb={4} />
              <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
                No datasets found
              </Text>
              <Text color="gray.400" mb={6}>
                Upload your first dataset to get started
              </Text>
              <Button
                leftIcon={<UploadIcon />}
                colorScheme="primary"
                onClick={onOpen}
              >
                Upload Dataset
              </Button>
            </Box>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {datasets.map((dataset, index) => (
              <MotionCard
                key={dataset.path}
                bg={cardBg}
                border="1px"
                borderColor={borderColor}
                borderRadius="xl"
                cursor="pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileHover={{
                  y: -4,
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                }}
                onClick={() => handleDatasetClick(dataset)}
              >
                <Box pb={3}>
                  <HStack justify="space-between">
                    <HStack spacing={3}>
                      <Icon as={DatabaseIcon} color="primary.500" boxSize={5} />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                          {dataset.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDistanceToNow(dataset.modified * 1000, {
                            addSuffix: true,
                          })}
                        </Text>
                      </VStack>
                    </HStack>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<MoreVerticalIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList>
                        <MenuItem icon={<EyeIcon />}>Preview</MenuItem>
                        <MenuItem icon={<InfoIcon />}>Details</MenuItem>
                        <MenuItem icon={<DownloadIcon />}>Download</MenuItem>
                        <MenuItem icon={<TrashIcon />} color="red.500">
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                </Box>
                <Box pt={0}>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        Size
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatFileSize(dataset.size_mb)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        Format
                      </Text>
                      <Badge colorScheme="primary" variant="subtle">
                        {dataset.format.toUpperCase()}
                      </Badge>
                    </HStack>
                  </VStack>
                </Box>
              </MotionCard>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Dataset</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <DatasetUploader onUploadComplete={handleUploadComplete} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => {
          onPreviewClose();
          clearPreview();
        }}
        size="6xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={DatabaseIcon} color="primary.500" />
              <Text>{selectedDataset?.name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <Tabs>
              <TabList>
                <Tab>Preview</Tab>
                <Tab>Information</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  {selectedDataset && (
                    <DatasetPreview datasetName={selectedDataset.name} />
                  )}
                </TabPanel>
                <TabPanel>
                  {datasetInfo && (
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Text fontWeight="semibold" mb={2}>
                          Validation Status
                        </Text>
                        <Badge
                          colorScheme={datasetInfo.is_valid ? 'green' : 'red'}
                          variant="subtle"
                          px={3}
                          py={1}
                        >
                          {datasetInfo.is_valid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </Box>

                      {datasetInfo.errors.length > 0 && (
                        <Box>
                          <Text fontWeight="semibold" mb={2} color="red.500">
                            Errors
                          </Text>
                          <VStack align="stretch" spacing={1}>
                            {datasetInfo.errors.map((error, idx) => (
                              <Text key={idx} fontSize="sm">
                                • {error}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {datasetInfo.warnings.length > 0 && (
                        <Box>
                          <Text fontWeight="semibold" mb={2} color="orange.500">
                            Warnings
                          </Text>
                          <VStack align="stretch" spacing={1}>
                            {datasetInfo.warnings.map((warning, idx) => (
                              <Text key={idx} fontSize="sm">
                                • {warning}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {datasetInfo.stats && (
                        <Box>
                          <Text fontWeight="semibold" mb={2}>
                            Statistics
                          </Text>
                          <SimpleGrid columns={2} spacing={4}>
                            <Stat>
                              <StatLabel fontSize="sm">Examples</StatLabel>
                              <StatNumber fontSize="2xl">
                                {datasetInfo.stats.num_examples}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel fontSize="sm">Columns</StatLabel>
                              <StatNumber fontSize="2xl">
                                {datasetInfo.stats.columns.length}
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>
                        </Box>
                      )}
                    </VStack>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default DatasetPage;