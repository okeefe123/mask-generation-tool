import { Box, Flex, Text } from '@chakra-ui/react';
import { useUIContext } from '../../contexts/UIContext';

const StatusFooter = () => {
  const { isLoading, statusMessage } = useUIContext();
  
  return (
    <Box as="footer" py={3} borderTopWidth="1px">
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color={isLoading ? "blue.500" : "gray.600"}>
          {statusMessage || 'Ready'}
        </Text>
        <Text fontSize="xs" color="gray.500">© 2025 Mask Generator Tool</Text>
      </Flex>
    </Box>
  );
};

export default StatusFooter;