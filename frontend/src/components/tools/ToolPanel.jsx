import { VStack, Box, Heading, Divider, Badge, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import ActionButtons from './ActionButtons';
import { useAppContext } from '../../contexts/AppContext';
import { useUIContext } from '../../contexts/UIContext';
import { saveMask } from '../../services/api';

const ToolPanel = ({ canvasElement }) => {
  const { displayImage, imageId, originalImage, originalFileName, originalDimensions } = useAppContext();
  const { setIsLoading, setError } = useUIContext();
  const [isSaving, setIsSaving] = useState(false);
  const [canvasError, setCanvasError] = useState(null);
  const toast = useToast();
  
  // Check canvas validity when it changes
  useEffect(() => {
    if (!canvasElement) {
      setCanvasError(null);
      return;
    }
    
    // Basic validation
    if (canvasElement.tagName !== 'CANVAS') {
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
  }, [canvasElement, originalImage, imageId]);
  
  // Save canvas as mask
  const saveCanvasAsMask = async () => {
    try {
      if (isSaving) return;
      
      // Thorough canvas validation
      if (!canvasElement) {
        throw new Error("Canvas element is not available");
      }
      
      if (canvasElement.tagName !== 'CANVAS') {
        throw new Error("Element is not a canvas");
      }
      
      if (typeof canvasElement.getContext !== 'function') {
        throw new Error("Canvas missing required methods");
      }
      
      if (!originalImage) {
        if (!displayImage) {
          throw new Error("No image has been uploaded");
        }
        throw new Error("Image was not properly uploaded to the server. Please try uploading again.");
      }
      
      // Create a temporary canvas for processing
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
      
      // Scale and draw the canvas to our temporary canvas
      tempCtx.drawImage(
        canvasElement,
        0, 0, canvasElement.width, canvasElement.height,
        0, 0, tempCanvas.width, tempCanvas.height
      );
      
      // Convert to binary mask
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      
      // Convert to binary mask (0 or 255)
      for (let i = 0; i < data.length; i += 4) {
        // Check if the pixel is from a brush stroke (non-black with opacity)
        // If it's completely black (0,0,0,255), it's likely background
        // If it has some color value and opacity, it's a brush stroke
        const isStrokePixel = (data[i+3] > 0) &&
                             !(data[i] === 0 && data[i+1] === 0 && data[i+2] === 0);
        
        if (isStrokePixel) {
          // This is a brush stroke area - set to white
          data[i] = 255;    // R
          data[i+1] = 255;  // G
          data[i+2] = 255;  // B
          data[i+3] = 255;  // A
        } else {
          // This is background - set to black
          data[i] = 0;      // R
          data[i+1] = 0;    // G
          data[i+2] = 0;    // B
          data[i+3] = 255;  // A
        }
      }
      
      // Put the modified image data back
      tempCtx.putImageData(imageData, 0, 0);
      
      // Determine file type and name
      let fileType = 'image/png';
      let maskFileName;
      
      if (originalFileName) {
        const lastDotIndex = originalFileName.lastIndexOf('.');
        const baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
        maskFileName = `${baseName}.png`;
      } else {
        maskFileName = `mask_${imageId}.png`;
      }
      
      // Convert to blob asynchronously
      const blob = await new Promise(resolve => {
        tempCanvas.toBlob(resolve, fileType);
      });
      
      // Create file with the generated name and matching type
      const file = new File([blob], maskFileName, { type: fileType });
      
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
      
      // Use our optimized save function
      await saveCanvasAsMask();
      
      toast({
        title: 'Mask saved',
        description: 'Your mask has been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save mask');
      
      toast({
        title: 'Save failed',
        description: error.message || 'There was an error saving your mask.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };
  
  return (
    <VStack
      spacing={6}
      align="stretch"
      p={5}
      bg="white"
      boxShadow="sm"
      borderRadius="md"
      height="100%"
    >
      <Box>
        <Heading
          size="md"
          mb={3}
          color="gray.700"
          fontWeight="semibold"
          display="flex"
          alignItems="center"
        >
          Image
          {!displayImage && (
            <Badge ml={2} colorScheme="orange" variant="subtle">
              Required
            </Badge>
          )}
        </Heading>
        <ImageUploader />
      </Box>
      
      {displayImage && (
        <>
          <Divider borderColor="gray.200" />
          <Box>
            <Heading
              size="md"
              mb={3}
              color="gray.700"
              fontWeight="semibold"
            >
              Drawing Tools
            </Heading>
            <DrawingTools />
          </Box>
          
          <Divider borderColor="gray.200" />
          <Box>
            <Heading
              size="md"
              mb={3}
              color="gray.700"
              fontWeight="semibold"
            >
              Actions
            </Heading>
            <ActionButtons
              onSave={handleSave}
              isSaving={isSaving}
              canvasElement={canvasElement}
              canvasError={canvasError}
            />
          </Box>
        </>
      )}
    </VStack>
  );
};

export default ToolPanel;