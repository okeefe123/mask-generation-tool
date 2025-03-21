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
import { useState, useEffect, useRef } from 'react';
import { useImageContext, useUIContext } from '../contexts/AppContexts';
import { saveMask } from '../services/api';

const Toolbar = ({ canvasElement }) => {
  const [showBrushSize, setShowBrushSize] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasError, setCanvasError] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const saveOperationRef = useRef(null);
  
  // Get state from contexts
  const {
    originalImage,
    displayImage,
    imageId,
    originalFileName,
    originalDimensions,
  } = useImageContext();
  
  const {
    drawingMode,
    setDrawingMode,
    brushSize,
    setBrushSize,
    setIsLoading,
    setError,
  } = useUIContext();
  
  // Debug - check dependencies on mount and when they change
  useEffect(() => {
    console.log("Toolbar dependencies:", {
      canvasElement,
      originalImage,
      originalDimensions,
      brushSize
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
    if (canvasElement && canvasElement.clear) {
      canvasElement.clear();
      toast({
        title: 'Canvas cleared',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Optimized save operation that doesn't affect the original canvas
  const saveCanvasAsMask = async () => {
    try {
      // If already saving, don't start a new save
      if (isSaving) return;
      
      // Thorough canvas validation
      if (!canvasElement) {
        throw new Error("Canvas element is not available");
      }
      
      // Basic check - is it a canvas tag?
      if (canvasElement.tagName !== 'CANVAS') {
        throw new Error("Element is not a canvas");
      }
      
      // Check for required method
      if (typeof canvasElement.getContext !== 'function') {
        throw new Error("Canvas missing required methods");
      }
      
      // Check if we have the image URL from the server
      if (!originalImage) {
        if (!displayImage) {
          throw new Error("No image has been uploaded");
        }
        throw new Error("Image was not properly uploaded to the server. Please try uploading again.");
      }
      
      // Cancel any previous save operation
      if (saveOperationRef.current) {
        saveOperationRef.current.abort();
      }
      
      // Create an abort controller for this operation
      const abortController = new AbortController();
      saveOperationRef.current = abortController;
      
      // Create a temporary canvas for processing to avoid modifying the original
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalDimensions.width;
      tempCanvas.height = originalDimensions.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Fill with black (background)
      tempCtx.fillStyle = 'black';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
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
      
      // Scale and draw the canvas to our temporary canvas (not affecting the original)
      tempCtx.drawImage(
        canvasElement, 
        0, 0, canvasElement.width, canvasElement.height,
        0, 0, tempCanvas.width, tempCanvas.height
      );
      
      // Determine file type based on original filename
      let fileType = 'image/png';
      let maskFileName;
      
      if (originalFileName) {
        // Extract base name and extension
        const lastDotIndex = originalFileName.lastIndexOf('.');
        const baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
        
        // Always use PNG for masks
        maskFileName = `${baseName}.png`;
      } else {
        // Fallback to using ID if original filename is not available
        maskFileName = `mask_${imageId}.png`;
      }
      
      // Convert to blob asynchronously
      const blob = await new Promise(resolve => {
        tempCanvas.toBlob(resolve, fileType);
      });
      
      // Create file with the generated name and matching type
      const file = new File([blob], maskFileName, { type: fileType });
      
      // Send to server using the numeric ID
      return await saveMask(imageId, file, abortController.signal);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to save mask:', error);
        throw error;
      }
    } finally {
      saveOperationRef.current = null;
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
      
      // Use our optimized save function
      const result = await saveCanvasAsMask();
      
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
            colorScheme={drawingMode === 'draw' ? 'blue' : 'gray'}
            variant={drawingMode === 'draw' ? 'solid' : 'outline'}
            onClick={() => handleDrawModeChange('draw')}
            isDisabled={!!canvasError}
          >
            Draw
          </Button>
          <Button
            colorScheme={drawingMode === 'erase' ? 'red' : 'gray'}
            variant={drawingMode === 'erase' ? 'solid' : 'outline'}
            onClick={() => handleDrawModeChange('erase')}
            isDisabled={!!canvasError}
          >
            Erase
          </Button>
        </Flex>

        <Flex align="center" width={{ base: '100%', md: '200px' }}>
          <Text fontSize="sm" mr={2} whiteSpace="nowrap">
            Brush Size:
          </Text>
          <Slider
            aria-label="brush-size"
            value={brushSize}
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