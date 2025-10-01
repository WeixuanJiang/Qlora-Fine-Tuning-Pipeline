import React, { useEffect } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  HStack,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Code,
} from '@chakra-ui/react';
import { Alert, AlertDescription, AlertIcon } from '@/components/common/Alert';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { useDatasetStore } from '@/stores/datasetStore';

interface DatasetPreviewProps {
  datasetName: string;
  numExamples?: number;
}

export const DatasetPreview: React.FC<DatasetPreviewProps> = ({
  datasetName,
  numExamples = 10,
}) => {
  const { preview, loading, error, previewDataset } = useDatasetStore();

  const cardBg = 'white';
  const borderColor = 'gray.200';
  const codeBg = 'gray.50';

  useEffect(() => {
    if (datasetName) {
      previewDataset(datasetName, numExamples);
    }
  }, [datasetName, numExamples]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="primary.500" />
        <Text mt={4} color="gray.500">
          Loading preview...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (!preview || !preview.success) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        No preview available
      </Alert>
    );
  }

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Statistics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Box
          p={6}
          bg={cardBg}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
        >
          <Stat>
            <StatLabel>Total Examples</StatLabel>
            <StatNumber>{preview.num_examples?.toLocaleString()}</StatNumber>
            <StatHelpText>
              Showing {preview.samples?.length} samples
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          p={6}
          bg={cardBg}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
        >
          <Stat>
            <StatLabel>Columns</StatLabel>
            <StatNumber>{preview.columns?.length}</StatNumber>
            <StatHelpText>
              {preview.columns?.slice(0, 3).join(', ')}
              {(preview.columns?.length ?? 0) > 3 && '...'}
            </StatHelpText>
          </Stat>
        </Box>

        <Box
          p={6}
          bg={cardBg}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
        >
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.500">
              Columns
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              {preview.columns?.map((col) => (
                <Badge key={col} colorScheme="primary" variant="subtle">
                  {col}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </Box>
      </SimpleGrid>

      {/* Sample Data Table */}
      <Box
        bg={cardBg}
        borderRadius="xl"
        border="1px"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <Text fontWeight="semibold" fontSize="lg">
            Sample Data
          </Text>
        </Box>

        {preview.samples && preview.samples.length > 0 ? (
          <Accordion allowMultiple>
            {preview.samples.map((sample, idx) => (
              <AccordionItem key={idx} border="none">
                <AccordionButton
                  py={4}
                  _hover={{ bg: 'gray.50' }}
                >
                  <HStack flex="1" spacing={3} align="center">
                    <Badge colorScheme="primary">Example {idx + 1}</Badge>
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                      {truncateText(
                        sample[preview.columns?.[0] || 'input'] || '',
                        60
                      )}
                    </Text>
                  </HStack>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} px={6}>
                  <VStack align="stretch" spacing={3}>
                    {Object.entries(sample).map(([key, value]) => (
                      <Box key={key}>
                        <Text fontSize="sm" fontWeight="semibold" mb={2}>
                          {key}:
                        </Text>
                        <Box
                          p={3}
                          bg={codeBg}
                          borderRadius="md"
                          border="1px"
                          borderColor={borderColor}
                        >
                          <Text fontSize="sm" whiteSpace="pre-wrap" fontFamily="mono">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Box p={8} textAlign="center">
            <Text color="gray.500">No samples available</Text>
          </Box>
        )}
      </Box>

      {/* Detailed Table View (Alternative) */}
      {preview.samples && preview.samples.length > 0 && (
        <Box
          bg={cardBg}
          borderRadius="xl"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <Box p={4} borderBottom="1px" borderColor={borderColor}>
            <Text fontWeight="semibold" fontSize="lg">
              Table View
            </Text>
          </Box>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>#</Th>
                  {preview.columns?.map((col) => (
                    <Th key={col}>{col}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {preview.samples.map((sample, idx) => (
                  <Tr key={idx}>
                    <Td fontWeight="medium">{idx + 1}</Td>
                    {preview.columns?.map((col) => (
                      <Td key={col}>
                        <Text fontSize="xs" noOfLines={2} maxW="300px">
                          {typeof sample[col] === 'object'
                            ? JSON.stringify(sample[col])
                            : truncateText(String(sample[col] || ''), 100)}
                        </Text>
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </VStack>
  );
};

export default DatasetPreview;
