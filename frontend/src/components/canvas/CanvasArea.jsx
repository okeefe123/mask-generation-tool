import { Box, Center, Spinner, Text } from '@chakra-ui/react';
import { useAppContext } from '../../contexts/AppContext';
import { useUIContext } from '../../contexts/UIContext';
import DrawingCanvas from '../DrawingCanvas';

const CanvasArea = ({ onCanvasReady }) => {
  const { displayImage, originalDimensions } = useAppContext();
  const { isLoading, error } = useUIContext();
  
  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Center h="100%">
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }
  
  if (!displayImage) {
    return (
      <Center h="100%" bg="gray.50">
        <Text color="gray.500">Upload an image to start editing</Text>
      </Center>
    );
  }
  
  return (
    <Box 
      position="relative" 
      h="100%" 
      w="100%" 
      bg="gray.100"
      data-testid="canvas-area"
    >
      <Center h="100%" w="100%">
        <Box position="relative">
          <img
            src={displayImage}
            alt="Uploaded image"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
          <DrawingCanvas onCanvasReady={onCanvasReady} />
        </Box>
      </Center>
    </Box>
  );
};

export default CanvasArea;