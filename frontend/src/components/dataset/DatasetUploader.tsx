import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Icon,
  Badge,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@/components/common/Alert';
import { UploadIcon, CheckIcon, XIcon, AlertIcon as WarningTriangleIcon } from '@/components/icons/GeometricIcons';
import { useDatasetStore } from '@/stores/datasetStore';

interface DatasetUploaderProps {
  onUploadComplete?: () => void;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({ onUploadComplete }) => {
  const { uploadDataset, validateDataset, loading, uploadProgress, error } = useDatasetStore();
  const [validationResult, setValidationResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const borderColor = 'gray.300';
  const bgColor = 'gray.50';
  const hoverBgColor = 'gray.100';

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setSelectedFile(file);
    setValidationResult(null);

    // Validate the file
    setIsValidating(true);
    try {
      const result = await validateDataset(file);
      setValidationResult(result);
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, [validateDataset]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json', '.jsonl'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadDataset(selectedFile);
      setSelectedFile(null);
      setValidationResult(null);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Drop Zone */}
      <Box
        {...getRootProps()}
        border="2px dashed"
        borderColor={isDragActive ? 'primary.500' : borderColor}
        borderRadius="xl"
        bg={isDragActive ? hoverBgColor : bgColor}
        p={10}
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{
          bg: hoverBgColor,
          borderColor: 'primary.500',
        }}
      >
        <input {...getInputProps()} />
        <VStack spacing={4}>
          <Icon
            as={UploadIcon}
            boxSize={12}
            color={isDragActive ? 'primary.500' : 'gray.400'}
          />
          <VStack spacing={2}>
            <Text fontSize="lg" fontWeight="semibold">
              {isDragActive ? 'Drop the file here' : 'Drag & drop dataset file'}
            </Text>
            <Text fontSize="sm" color="gray.500">
              or click to browse
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Badge>JSON</Badge>
            <Badge>JSONL</Badge>
            <Badge>CSV</Badge>
          </HStack>
        </VStack>
      </Box>

      {/* File Info */}
      {selectedFile && (
        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
        >
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon as={CheckIcon} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold">{selectedFile.name}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatFileSize(selectedFile.size)}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  setValidationResult(null);
                }}
              >
                Remove
              </Button>
            </HStack>

            {/* Validation Status */}
            {isValidating && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">Validating dataset...</Text>
              </Alert>
            )}

            {validationResult && (
              <VStack align="stretch" spacing={3}>
                {/* Validation Summary */}
                <Alert
                  status={validationResult.is_valid ? 'success' : 'error'}
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle fontSize="sm">
                      {validationResult.is_valid
                        ? 'Dataset is valid'
                        : 'Validation failed'}
                    </AlertTitle>
                    {validationResult.stats && (
                      <AlertDescription fontSize="xs">
                        {validationResult.stats.num_examples} examples, {' '}
                        {validationResult.stats.columns.length} columns
                      </AlertDescription>
                    )}
                  </Box>
                </Alert>

                {/* Errors */}
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="red.500" mb={2}>
                      Errors:
                    </Text>
                    <List spacing={1}>
                      {validationResult.errors.map((error: string, idx: number) => (
                        <ListItem key={idx} fontSize="sm">
                          <HStack align="start">
                            <Icon as={XIcon} color="red.500" boxSize={3} mt={1} />
                            <Text>{error}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Warnings */}
                {validationResult.warnings && validationResult.warnings.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="orange.500" mb={2}>
                      Warnings:
                    </Text>
                    <List spacing={1}>
                      {validationResult.warnings.map((warning: string, idx: number) => (
                        <ListItem key={idx} fontSize="sm">
                          <HStack align="start">
                            <Icon as={WarningTriangleIcon} color="orange.500" boxSize={3} mt={1} />
                            <Text>{warning}</Text>
                          </HStack>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Stats */}
                {validationResult.stats && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>
                      Dataset Statistics:
                    </Text>
                    <VStack align="stretch" spacing={1} fontSize="sm">
                      <HStack justify="space-between">
                        <Text color="gray.500">Examples:</Text>
                        <Text fontWeight="medium">
                          {validationResult.stats.num_examples}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.500">Columns:</Text>
                        <Text fontWeight="medium">
                          {validationResult.stats.columns.join(', ')}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.500">Format:</Text>
                        <Badge>{validationResult.stats.format.toUpperCase()}</Badge>
                      </HStack>
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </Box>
      )}

      {/* Upload Progress */}
      {loading && uploadProgress > 0 && (
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">
              Uploading...
            </Text>
            <Text fontSize="sm" color="gray.500">
              {uploadProgress}%
            </Text>
          </HStack>
          <Progress value={uploadProgress} colorScheme="primary" borderRadius="full" />
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription fontSize="sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      {selectedFile && validationResult?.is_valid && (
        <Button
          colorScheme="primary"
          size="lg"
          leftIcon={<UploadIcon />}
          onClick={handleUpload}
          isLoading={loading}
          loadingText="Uploading..."
        >
          Upload Dataset
        </Button>
      )}
    </VStack>
  );
};

export default DatasetUploader;
