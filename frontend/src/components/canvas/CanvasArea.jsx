import { Box, Center, Spinner, Text, VStack, Code } from '@chakra-ui/react';
import { useImageContext } from '../../contexts/ImageContext';
import { useUIContext } from '../../contexts/UIContext';
import { useState, useEffect } from 'react';
import DrawingCanvas from '../DrawingCanvas';

/**
 * Component that renders the canvas area where images are displayed and edited.
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onCanvasReady - Callback when canvas is ready
 * @returns {JSX.Element} The rendered CanvasArea component
 */
const CanvasArea = ({ onCanvasReady }) => {
  const { displayImage, originalDimensions } = useImageContext();
  const { isLoading, error } = useUIContext();
  const [imageState, setImageState] = useState("initializing");
  
  // Debug effect to monitor image loading and changes
  useEffect(() => {
    console.log("CanvasArea: displayImage changed:", displayImage);
    
    if (!displayImage) {
      setImageState("no-image");
      return;
    }
    
    // Set to loading
    setImageState("loading");
    
    // Create an image element to test if the URL is valid
    const img = new Image();
    img.onload = () => {
      console.log("CanvasArea: Image loaded successfully:", displayImage);
      setImageState("loaded");
    };
    img.onerror = (err) => {
      console.error("CanvasArea: Error loading image:", err);
      setImageState("error");
    };
    img.src = displayImage;
  }, [displayImage]);
  
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
  
  if (imageState === "error") {
    return (
      <Center h="100%" bg="red.50">
        <VStack spacing={2}>
          <Text color="red.500">Error loading image</Text>
          <Code fontSize="xs" p={2} maxW="90%" whiteSpace="pre-wrap">
            URL: {displayImage}
          </Code>
          <Text fontSize="sm">The image URL may be incorrect or the file is not accessible.</Text>
        </VStack>
      </Center>
    );
  }
  
  if (imageState === "loading") {
    return (
      <Center h="100%">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading image...</Text>
        </VStack>
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
        <Box
          position="relative"
          id="image-canvas-container"
          maxW="100%"
          maxH="100%"
          w="auto"
          h="auto"
          sx={{
            // Force maintain aspect ratio on container
            '&': {
              aspectRatio: originalDimensions.width && originalDimensions.height
                ? `${originalDimensions.width} / ${originalDimensions.height}`
                : 'auto',
              width: originalDimensions.width ? 'min(100%, 2000px)' : 'auto',
              height: 'auto',
            }
          }}
        >
          {/* Debug info overlay - Commented out to remove image description from top-left corner
          <Box
            position="absolute"
            top="0"
            left="0"
            bg="rgba(0,0,0,0.7)"
            color="white"
            p={2}
            fontSize="xs"
            zIndex="10"
            maxW="250px"
            display={process.env.NODE_ENV === 'development' ? 'block' : 'none'}
          >
            <Text>Image State: {imageState}</Text>
            <Text noOfLines={1}>URL: {displayImage ? displayImage.substring(0, 25) + '...' : 'None'}</Text>
            <Text>Dimensions: {originalDimensions.width}x{originalDimensions.height}</Text>
          </Box>
          */}
          
          {/* The image */}
          <img
            src={displayImage}
            alt="Uploaded image"
            id="source-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 1,
              aspectRatio: originalDimensions.width && originalDimensions.height
                ? `${originalDimensions.width} / ${originalDimensions.height}`
                : 'auto',
              maxHeight: '100%',
              maxWidth: '100%',
            }}
          />
          
          {/* Canvas overlay - positioned absolutely on top of the image */}
          <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            zIndex={2}
          >
            <DrawingCanvas onCanvasReady={onCanvasReady} />
          </Box>
        </Box>
      </Center>
    </Box>
  );
};

export default CanvasArea;