import { useRef, useEffect, useCallback, useState } from 'react';
import { Box, Center, Flex, Spinner, Text } from '@chakra-ui/react';
import { useAppContext, useUIContext } from '../contexts/AppContexts';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';

const ImageEditor = () => {
  const imageRef = useRef(null);
  const [canvasElement, setCanvasElement] = useState(null);
  
  // Function to receive canvas element from DrawingCanvas
  const handleCanvasReady = useCallback((canvas) => {
    console.log('Received canvas element from DrawingCanvas:', canvas);
    setCanvasElement(canvas);
  }, []);
  
  // Add a debug effect to check refs
  useEffect(() => {
    console.log('ImageEditor mounted, refs initialized:', {
      imageRef: imageRef.current,
      canvasElement
    });
    
    return () => {
      console.log('ImageEditor unmounting');
    };
  }, [canvasElement]);
  
  // Get state from contexts
  const { 
    displayImage, 
    originalDimensions, 
    calculateScaleFactor
  } = useAppContext();
  
  const {
    isLoading,
    error
  } = useUIContext();

  // Calculate scale factor when image or container size changes
  useEffect(() => {
    if (!displayImage || !imageRef.current) return;

    const updateScaleFactor = () => {
      const container = imageRef.current.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      calculateScaleFactor(
        originalDimensions.width,
        originalDimensions.height,
        containerWidth,
        containerHeight
      );
    };

    // Initial calculation
    updateScaleFactor();

    // Recalculate on window resize
    window.addEventListener('resize', updateScaleFactor);
    return () => window.removeEventListener('resize', updateScaleFactor);
  }, [displayImage, originalDimensions, calculateScaleFactor]);

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="400px">
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  return (
    <Flex direction="column" gap={4} w="100%">
      {displayImage ? (
        <>
          <Box 
            position="relative" 
            width="100%" 
            height="70vh" 
            borderWidth="1px" 
            borderRadius="lg" 
            overflow="hidden"
            bg="gray.100"
          >
            <Box position="relative" h="100%" w="100%">
              <Center h="100%" w="100%">
                <img
                  ref={imageRef}
                  src={displayImage}
                  alt="Uploaded image"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Center>
              <DrawingCanvas imageRef={imageRef} onCanvasReady={handleCanvasReady} />
            </Box>
          </Box>
          {canvasElement && <Toolbar canvasElement={canvasElement} />}
        </>
      ) : (
        <Center h="400px" borderWidth="1px" borderRadius="lg" bg="gray.50">
          <Text color="gray.500">Upload an image to start editing</Text>
        </Center>
      )}
    </Flex>
  );
};

export default ImageEditor;