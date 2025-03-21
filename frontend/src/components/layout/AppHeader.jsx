import { Box, Heading, Flex, Text } from '@chakra-ui/react';

/**
 * Application header component with centered title and subtitle.
 * 
 * @returns {JSX.Element} The rendered AppHeader component
 */
const AppHeader = () => {
  return (
    <Box as="header" py={5} borderBottomWidth="1px">
      <Flex justify="center" align="center" direction="column">
        <Heading as="h1" size="xl" textAlign="center">Mask Generator Tool</Heading>
        <Text color="gray.600" fontSize="sm" textAlign="center" mt={1}>
          Create precise masks for your images
        </Text>
      </Flex>
    </Box>
  );
};

export default AppHeader;