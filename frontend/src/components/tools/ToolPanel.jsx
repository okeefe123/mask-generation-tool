import { VStack, Box, Heading, Divider, Badge, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import ActionButtons from './ActionButtons';
import { useImageContext } from '../../contexts/AppContexts';
import { useUIContext } from '../../contexts/AppContexts';
import { saveMask } from '../../services/api';

const ToolPanel = ({ canvasElement }) => {
  const { displayImage, imageId, originalImage, originalFileName, originalDimensions } = useImageContext();
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
      
      // Log dimensions for debugging large image issue
      console.log('DEBUG - CRITICAL - Mask Save Dimensions:', {
        originalImageWidth: originalDimensions.width,
        originalImageHeight: originalDimensions.height,
        canvasWidth: canvasElement.width,
        canvasHeight: canvasElement.height,
        canvasStyleWidth: canvasElement.style.width,
        canvasStyleHeight: canvasElement.style.height,
        clientWidth: canvasElement.clientWidth,
        clientHeight: canvasElement.clientHeight,
        originalImageAspectRatio: originalDimensions.width / originalDimensions.height,
        canvasAspectRatio: canvasElement.width / canvasElement.height
      });
      
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
      
      // Calculate aspect ratios to check for distortion
      const sourceAspectRatio = canvasElement.width / canvasElement.height;
      const targetAspectRatio = tempCanvas.width / tempCanvas.height;
      
      console.log('DEBUG - Aspect Ratios:', {
        sourceAspectRatio,
        targetAspectRatio,
        difference: Math.abs(sourceAspectRatio - targetAspectRatio),
        canvasElement,
        tempCanvas
      });
      
      console.log('IMPORTANT: This is likely causing the squishing issue!');
      
      console.log('DEBUG - Final Aspect Ratios when saving mask:', {
        sourceAspectRatio,
        targetAspectRatio,
        difference: Math.abs(sourceAspectRatio - targetAspectRatio)
      });
      
      // Scale canvas content to fit the output dimensions while preserving aspect ratio
      let sx = 0, sy = 0, sWidth = canvasElement.width, sHeight = canvasElement.height;
      let dx = 0, dy = 0, dWidth = tempCanvas.width, dHeight = tempCanvas.height;
      
      // If aspect ratios are significantly different (which they shouldn't be after our fix)
      // then adjust the source or destination rectangle to preserve aspect ratio
      if (Math.abs(sourceAspectRatio - targetAspectRatio) > 0.01) {
        console.log('Adjusting mask dimensions to correct aspect ratio');
        
        // Since we're fixing the canvas initialization, this is just a safety measure
        // Use the entire tempCanvas (destination) as is, and adjust the source rectangle
        if (sourceAspectRatio > targetAspectRatio) {
          // Source is wider, adjust height
          const adjustedHeight = canvasElement.width / targetAspectRatio;
          sy = (canvasElement.height - adjustedHeight) / 2;
          sHeight = adjustedHeight;
        } else {
          // Source is taller, adjust width
          const adjustedWidth = canvasElement.height * targetAspectRatio;
          sx = (canvasElement.width - adjustedWidth) / 2;
          sWidth = adjustedWidth;
        }
      }
      
      // Add additional log to debug final dimensions when drawing to tempCanvas
      console.log('DEBUG - Using dimensions for saving mask:', {
        sourceRect: { x: sx, y: sy, width: sWidth, height: sHeight },
        destRect: { x: dx, y: dy, width: dWidth, height: dHeight },
        sourceAspectRatio: sWidth / sHeight,
        destAspectRatio: dWidth / dHeight
      });
      
      // Draw the canvas content to our temporary canvas with correct proportions
      tempCtx.drawImage(
        canvasElement,
        sx, sy, sWidth, sHeight,
        dx, dy, dWidth, dHeight
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
      
      // Determine file type and name based on original file
      let fileType, maskFileName;
      
      if (originalFileName) {
        const lastDotIndex = originalFileName.lastIndexOf('.');
        const baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
        const originalExtension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
        
        // Detect file type from original file extension
        const isPNG = originalExtension.toLowerCase() === '.png';
        const isJPG = originalExtension.toLowerCase() === '.jpg' || originalExtension.toLowerCase() === '.jpeg';
        
        if (isPNG) {
          // Keep PNG format with exact same extension
          fileType = 'image/png';
          maskFileName = `${baseName}${originalExtension}`;
        } else if (isJPG) {
          // Use JPEG format with matching case sensitivity
          fileType = 'image/jpeg';
          // Preserve .jpg or .jpeg distinction
          if (originalExtension.toLowerCase() === '.jpg') {
            // Match case sensitivity
            maskFileName = `${baseName}${originalExtension.toLowerCase() === originalExtension ? '.jpg' : '.JPG'}`;
          } else {
            // For .jpeg
            maskFileName = `${baseName}${originalExtension.toLowerCase() === originalExtension ? '.jpeg' : '.JPEG'}`;
          }
        } else {
          // Default to PNG for any other format
          fileType = 'image/png';
          maskFileName = `${baseName}.png`;
        }
      } else {
        // Default when no original filename
        fileType = 'image/png';
        maskFileName = `mask_${imageId}.png`;
      }
      
      // Convert to blob asynchronously
      const blob = await new Promise(resolve => {
        // Use the matched file type for the blob
        tempCanvas.toBlob(resolve, fileType, fileType === 'image/jpeg' ? 0.95 : undefined);
      });
      
      // Log format information for debugging
      console.log(`Creating mask in ${fileType === 'image/jpeg' ? 'JPEG' : 'PNG'} format to match original: ${maskFileName}`);
      
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
    
    // Extra debug - log original dimensions vs canvas dimensions
    console.log('SAVING MASK - Debug Information', {
      originalImageWidth: originalDimensions.width,
      originalImageHeight: originalDimensions.height,
      originalAspectRatio: originalDimensions.width / originalDimensions.height,
      canvasElement: canvasElement ? {
        width: canvasElement.width,
        height: canvasElement.height,
        aspectRatio: canvasElement.width / canvasElement.height
      } : 'No canvas'
    });
    
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
      width="100%"
      minWidth="250px"
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