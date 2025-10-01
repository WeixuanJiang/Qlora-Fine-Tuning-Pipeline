import React from 'react';
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Link,
  Icon,
  Divider,
  
  Container,
} from '@chakra-ui/react';
import { useColorModeValue } from '@/hooks/useColorModeValue';
import { GithubIcon, HeartIcon, ExternalLinkIcon } from '@/components/icons/GeometricIcons';
import { useAppStore } from '@/stores/appStore';

const Footer: React.FC = () => {
  const { apiStatus } = useAppStore();
  const bgColor = 'white';
  const borderColor = 'gray.200';
  const textColor = 'gray.600';
  const linkColor = 'primary.600';
  const mutedColor = 'gray.500';

  const currentYear = new Date().getFullYear();

  return (
    <Box
      bg={bgColor}
      borderTopWidth="1px"
      borderColor={borderColor}
      py={6}
      mt="auto"
    >
      <Container maxW="7xl">
        <VStack spacing={4}>
          {/* Main Footer Content */}
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'center', md: 'flex-start' }}
            w="full"
            gap={6}
          >
            {/* Brand and Description */}
            <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
              <HStack spacing={2}>
                <Box
                  w={8}
                  h={8}
                  bgGradient="linear(135deg, primary.500, primary.600)"
                  borderRadius="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="sm"
                  fontWeight="bold"
                  boxShadow="sm"
                >
                  Q
                </Box>
                <Text fontWeight="bold" color={textColor} fontSize="md">
                  QLoRA Copilot
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                color={mutedColor}
                textAlign={{ base: 'center', md: 'left' }}
                maxW="300px"
              >
                Efficient fine-tuning of large language models using QLoRA methodology
              </Text>
            </VStack>

            {/* Links and Status */}
            <VStack align={{ base: 'center', md: 'flex-end' }} spacing={3}>
              {/* Quick Links */}
              <HStack spacing={6}>
                <Link
                  href="https://github.com/artidoro/qlora"
                  isExternal
                  color={linkColor}
                  fontSize="sm"
                  _hover={{ textDecoration: 'underline' }}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Icon as={GithubIcon} boxSize={4} />
                  QLoRA Paper
                  <Icon as={ExternalLinkIcon} boxSize={3} />
                </Link>
                <Link
                  href="https://huggingface.co/docs/transformers/main/en/peft"
                  isExternal
                  color={linkColor}
                  fontSize="sm"
                  _hover={{ textDecoration: 'underline' }}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  Documentation
                  <Icon as={ExternalLinkIcon} boxSize={3} />
                </Link>
              </HStack>

              {/* System Status */}
              <HStack spacing={4} fontSize="xs" color={mutedColor}>
                <HStack spacing={1}>
                  <Box
                    w={2}
                    h={2}
                    borderRadius="full"
                    bg={
                      apiStatus === 'connected'
                        ? 'green.400'
                        : apiStatus === 'error'
                        ? 'red.400'
                        : 'yellow.400'
                    }
                  />
                  <Text>
                    API {apiStatus === 'connected' ? 'Online' : apiStatus === 'error' ? 'Offline' : 'Connecting'}
                  </Text>
                </HStack>
                <Text>•</Text>
                <Text>Version 1.0.0</Text>
                <Text>•</Text>
                <Text>Build {import.meta.env.VITE_BUILD_NUMBER || 'dev'}</Text>
              </HStack>
            </VStack>
          </Flex>

          <Divider />

          {/* Copyright and Attribution */}
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align="center"
            w="full"
            gap={2}
          >
            <Text fontSize="xs" color={mutedColor}>
              © {currentYear} QLoRA Fine-Tuning Pipeline. Built with modern web technologies.
            </Text>
            <HStack spacing={1} fontSize="xs" color={mutedColor}>
              <Text>Made with</Text>
              <Icon as={HeartIcon} color="red.400" boxSize={3} />
              <Text>for the AI community</Text>
            </HStack>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default Footer;