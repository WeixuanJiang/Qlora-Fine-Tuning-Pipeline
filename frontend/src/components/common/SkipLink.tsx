import React from 'react';
import { Box, Link } from '@chakra-ui/react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

const SkipLink: React.FC<SkipLinkProps> = ({ 
  href = '#main-content', 
  children = 'Skip to main content' 
}) => {
  return (
    <Link
      href={href}
      position="absolute"
      left="-9999px"
      zIndex={9999}
      p={3}
      bg="primary.600"
      color="white"
      borderRadius="md"
      fontWeight="medium"
      textDecoration="none"
      _focus={{
        left: 4,
        top: 4,
        textDecoration: 'none',
        outline: '2px solid',
        outlineColor: 'primary.300',
        outlineOffset: '2px',
      }}
      _hover={{
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
};

export default SkipLink;