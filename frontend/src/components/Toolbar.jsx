import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Tooltip,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useImageContext } from '../contexts/ImageContext';
import { saveMask } from '../services/api';

const Toolbar = ({ canvasElement }) => {
  const [showBrushSize, setShowBrushSize] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasError, setCanvasError] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const {
    drawingMode,
    setDrawingMode,
    brushSize,
    setBrushSize,
    originalImage,
    displayImage,
    imageId,
    originalDimensions,
    setIsLoading,
    setError,
  } = useImageContext();
  
  // Debug - check dependencies on mount and when they change
  useEffect(() => {
    console.log("Toolbar dependencies:", {
      canvasElement,
      originalImage,
      originalDimensions,
      brushSize // Add brushSize to logging
    });
    
    // Check if canvas is available and valid
    if (!canvasElement) {
      setCanvasError("Canvas element is not available");
    } else if (canvasElement.tagName !== 'CANVAS') {
      setCanvasError("Element is not a canvas");
    } else if (typeof canvasElement.getContext !== 'function') {
      setCanvasError("Canvas missing required methods");
    } else if (!originalImage) {
      setCanvasError("No image has been uploaded to the server yet");
    } else if (!imageId) {
      setCanvasError("Image ID is missing. Please re-upload the image.");
    } else {
      setCanvasError(null);
    }
    
    // Log detailed canvas information
    if (canvasElement) {
      console.log('Canvas details:', {
        tagName: canvasElement.tagName,
        hasGetContext: typeof canvasElement.getContext === 'function',
        width: canvasElement.width,
        height: canvasElement.height,
        dataAttrs: canvasElement.dataset
      });
    }
  }, [canvasElement, originalImage, imageId, originalDimensions]);

  const handleDrawModeChange = (mode) => {
    setDrawingMode(mode);
  };

  const handleBrushSizeChange = (value) => {
    console.log('Changing brush size from', brushSize, 'to', value);
    setBrushSize(value);
  };

  const handleClear = () => {
    if (canvasElement) {
      const ctx = canvasElement.getContext('2d');
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      toast({
        title: 'Canvas cleared',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Create a new direct canvas function for saving
  const saveCanvasAsMask = async () => {
    try {
      // Thorough canvas validation - we now use canvasElement directly
      if (!canvasElement) {
        throw new Error("Canvas element is not available");
      }
      
      // Simple tag validation
      console.log('Canvas element for saving:', canvasElement);
      
      // Basic check - is it a canvas tag?
      if (canvasElement.tagName !== 'CANVAS') {
        console.error('Element is not a canvas:', canvasElement);
        throw new Error("Element is not a canvas");
      }
      
      // Check for required method
      if (typeof canvasElement.getContext !== 'function') {
        console.error('Missing getContext method:', canvasElement);
        throw new Error("Canvas missing required methods");
      }
      
      // At this point, we know the canvas is valid
      
      // Check if we have the image URL from the server
      if (!originalImage) {
        // If not, check if we at least have the display image
        if (!displayImage) {
          throw new Error("No image has been uploaded");
        }
        
        // We can't save without the server-side image ID
        throw new Error("Image was not properly uploaded to the server. Please try uploading again.");
      }
      
      // Get canvas and create a temp canvas for processing
      const canvas = document.createElement('canvas');
      canvas.width = originalDimensions.width;
      canvas.height = originalDimensions.height;
      const ctx = canvas.getContext('2d');
      
      // Fill with black (background)
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw white where there was drawing on the original canvas
      ctx.fillStyle = 'white';
      
      // Get canvas context and image data
      try {
        // Get the canvas context
        const sourceCtx = canvasElement.getContext('2d');
        if (!sourceCtx) {
          throw new Error('Failed to get canvas context');
        }
        
        // Get the pixel data
        const sourceData = sourceCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      
        // Check if there's any drawing (non-transparent pixels)
        let hasDrawing = false;
        for (let i = 3; i < sourceData.data.length; i += 4) {
          if (sourceData.data[i] > 0) {
            hasDrawing = true;
            break;
          }
        }
        
        if (!hasDrawing) {
          throw new Error("Please draw something before saving");
        }
        
        // Scale and draw the canvas
        ctx.drawImage(canvasElement, 0, 0, canvasElement.width, canvasElement.height, 
                      0, 0, canvas.width, canvas.height);
      } catch (err) {
        console.error('Canvas operation error:', err);
        throw new Error(`Canvas error: ${err.message}`);
      }
      
      // Get the image as data URL and convert to blob
      const dataUrl = canvas.toDataURL('image/png');
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      if (!imageId) {
        throw new Error("Image ID is missing. Please re-upload the image.");
      }
      
      console.log('Using image ID for mask:', imageId);
      
      // Create file
      const file = new File([blob], `mask_${imageId}.png`, { type: 'image/png' });
      
      // Send to server using the numeric ID
      return await saveMask(imageId, file);
    } catch (error) {
      console.error('Failed to save mask:', error);
      throw error;
    }
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setIsLoading(true);
      setError(null);
      
      // Check canvas availability
      if (canvasError) {
        toast({
          title: 'Cannot save',
          description: canvasError,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Use our direct canvas function
      const result = await saveCanvasAsMask();
      console.log('Save result:', result);
      
      toast({
        title: 'Mask saved',
        description: 'Your mask has been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save mask');
      
      toast({
        title: 'Save failed',
        description: error.message || 'There was an error saving your mask.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      shadow="md"
      width="100%"
    >
      {canvasError && (
        <Box mb={4} p={2} bg="red.50" color="red.600" borderRadius="md">
          <Text fontWeight="bold">Canvas Error:</Text>
          <Text>{canvasError}</Text>
          <Text fontSize="sm" mt={1}>
            Try refreshing the page or reuploading your image.
          </Text>
        </Box>
      )}
      
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center" gap={4}>
        <Flex gap={4}>
          <Button
            colorScheme="blue"
            onClick={() => handleDrawModeChange('draw')}
            isDisabled={!!canvasError}
          >
            Draw
          </Button>
          <Button
            colorScheme="red"
            onClick={() => canvasElement.undo()}
            isDisabled={!!canvasError}
          >
            Undo
          </Button>
        </Flex>

        <Flex align="center" width={{ base: '100%', md: '200px' }}>
          <Text fontSize="sm" mr={2} whiteSpace="nowrap">
            Brush Size:
          </Text>
          <Slider
            aria-label="brush-size"
            defaultValue={brushSize}
            min={1}
            max={50}
            onChange={handleBrushSizeChange}
            onMouseEnter={() => setShowBrushSize(true)}
            onMouseLeave={() => setShowBrushSize(false)}
            isDisabled={!!canvasError}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <Tooltip
              hasArrow
              bg="blue.500"
              color="white"
              placement="top"
              isOpen={showBrushSize}
              label={`${brushSize}px`}
            >
              <SliderThumb />
            </Tooltip>
          </Slider>
        </Flex>

        <ButtonGroup>
          <Button
            colorScheme="gray"
            onClick={handleClear}
            size="md"
            isDisabled={!!canvasError}
          >
            Clear
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            size="md"
            isDisabled={!!canvasError}
          >
            Save Mask
          </Button>
        </ButtonGroup>
      </Flex>
      
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Drawing Canvas Error</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              There was an issue with the drawing canvas. Please try refreshing the page
              or uploading your image again.
            </Text>
            <Text fontWeight="bold" mt={4}>
              Error details:
            </Text>
            <Text color="red.500">{canvasError}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Toolbar;