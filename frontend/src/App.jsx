import { Box, Container, Heading, VStack, Text } from '@chakra-ui/react';
import { AllProvidersWrapper } from './contexts/AppContexts';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';
import './App.css';

function App() {
  return (
    <AllProvidersWrapper>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={2}>Mask Generator Tool</Heading>
            <Text color="gray.600">Upload an image and draw a mask by marking areas on the image</Text>
          </Box>
          
          <ImageUploader />
          <ImageEditor />
          
          <Box as="footer" textAlign="center" fontSize="sm" color="gray.500" mt={8}>
            <Text>© 2025 Mask Generator Tool</Text>
          </Box>
        </VStack>
      </Container>
    </AllProvidersWrapper>
  );
}

export default App;
