import { Box, Heading, Flex, Text } from '@chakra-ui/react';

const AppHeader = () => {
  return (
    <Box as="header" py={4} borderBottomWidth="1px">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="xl">Mask Generator Tool</Heading>
          <Text color="gray.600" fontSize="sm">Create precise masks for your images</Text>
        </Box>
        {/* Future global actions will go here */}
      </Flex>
    </Box>
  );
};

export default AppHeader;