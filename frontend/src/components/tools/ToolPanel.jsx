import { VStack, Box, Heading, Divider, Badge, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import { useImageContext } from '../../contexts/AppContexts';
import { useUIContext } from '../../contexts/AppContexts';
import { saveMask } from '../../services/api';

// Create a shared variable to store the fetchAvailableImages function
let globalFetchAvailableImages = null;

const ToolPanel = ({ canvasElement }) => {
  const { displayImage, imageId, originalImage, originalFileName, originalDimensions, fetchAvailableImages } = useImageContext();
  const { setIsLoading, setError } = useUIContext();
  const [isSaving, setIsSaving] = useState(false);
  const [canvasError, setCanvasError] = useState(null);
  const toast = useToast();
  
  // Store the fetchAvailableImages function in the global variable so it can be accessed by handleSaveMask
  useEffect(() => {
    if (fetchAvailableImages && typeof fetchAvailableImages === 'function') {
      console.log('Storing fetchAvailableImages function in global variable');
      globalFetchAvailableImages = fetchAvailableImages;
      
      // For debugging - add a global function to check if it's available
      window.checkFetchAvailableImages = () => {
        return !!globalFetchAvailableImages;
      };
    }
    
    // Cleanup function to ensure proper cleanup
    return () => {
      // Don't clear the global function when unmounting, as it might be needed by other components
      if (window.checkFetchAvailableImages) {
        delete window.checkFetchAvailableImages;
      }
    };
  }, [fetchAvailableImages]);

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
        // Check if the pixel is from a brush stroke with significant opacity
        // The original drawing canvas should have non-zero alpha for brush strokes
        // and some color value that's not pure black
        const alpha = data[i+3];
        const hasColor = data[i] > 10 || data[i+1] > 10 || data[i+2] > 10;
        
        // A pixel is a stroke if it has enough opacity AND either has color
        // OR is not pure black (to catch white/gray brush strokes)
        const isStrokePixel = alpha > 50 && hasColor;
        
        if (isStrokePixel) {
          // This is a brush stroke area - set to pure white
          data[i] = 255;    // R
          data[i+1] = 255;  // G
          data[i+2] = 255;  // B
          data[i+3] = 255;  // A (fully opaque)
        } else {
          // This is background - set to pure black
          data[i] = 0;      // R
          data[i+1] = 0;    // G
          data[i+2] = 0;    // B
          data[i+3] = 255;  // A (fully opaque)
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
        </>
      )}
    </VStack>
  );
};

// Export the save function to be used in StatusFooter
export const handleSaveMask = async (canvasElement, imageId, originalImage, toast, setIsLoading, setError) => {
  if (!canvasElement || !imageId) {
    return;
  }
  
  try {
    setIsLoading(true);
    
    // Get the original image dimensions from the backend if needed
    let originalWidth, originalHeight;
    
    // Try to get dimensions from the canvasElement's attributes
    if (canvasElement.getAttribute('data-original-width') && canvasElement.getAttribute('data-original-height')) {
      originalWidth = parseInt(canvasElement.getAttribute('data-original-width'));
      originalHeight = parseInt(canvasElement.getAttribute('data-original-height'));
      console.log('Using data attributes for original dimensions:', originalWidth, originalHeight);
    } else {
      // If we have originalImage URL, we can try to load it to get dimensions
      console.log('Attempting to determine original image dimensions');
      
      try {
        // Get image info from the backend based on imageId
        const response = await fetch(`/api/images/${imageId}/`);
        if (response.ok) {
          const imageData = await response.json();
          originalWidth = imageData.width;
          originalHeight = imageData.height;
          console.log('Got dimensions from API:', originalWidth, originalHeight);
        } else {
          throw new Error('Failed to get image dimensions from API');
        }
      } catch (error) {
        console.error('Error getting original dimensions:', error);
        // Fallback to canvas dimensions if we can't get original dimensions
        originalWidth = canvasElement.width;
        originalHeight = canvasElement.height;
        console.warn('Using canvas dimensions as fallback:', originalWidth, originalHeight);
      }
    }
    
    // Get canvas data and convert to binary mask
    const maskData = await new Promise((resolve, reject) => {
      // Create a temporary canvas for the binary mask at ORIGINAL dimensions
      const tempCanvas = document.createElement('canvas');
      const ctx = canvasElement.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Set the temp canvas to the ORIGINAL image dimensions (not canvas dimensions)
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      console.log('Creating mask at original dimensions:', originalWidth, 'x', originalHeight);
      console.log('Current canvas dimensions:', canvasElement.width, 'x', canvasElement.height);
      
      // First fill with black (background)
      tempCtx.fillStyle = 'black';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Calculate scaling needed to map canvas drawing to original dimensions
      const scaleX = originalWidth / canvasElement.width;
      const scaleY = originalHeight / canvasElement.height;
      
      // Get the drawing data from canvas
      const sourceData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const targetData = tempCtx.createImageData(originalWidth, originalHeight);
      
      // Process each pixel in the target (original size) dimensions
      for (let y = 0; y < originalHeight; y++) {
        for (let x = 0; x < originalWidth; x++) {
          // Map to the corresponding source pixel
          const sourceX = Math.floor(x / scaleX);
          const sourceY = Math.floor(y / scaleY);
          
          // Ensure we're within bounds
          if (sourceX >= 0 && sourceX < canvasElement.width && 
              sourceY >= 0 && sourceY < canvasElement.height) {
            
            // Get source pixel data
            const sourceIndex = (sourceY * canvasElement.width + sourceX) * 4;
            const alpha = sourceData.data[sourceIndex + 3];
            const hasColor = sourceData.data[sourceIndex] > 10 || 
                            sourceData.data[sourceIndex + 1] > 10 || 
                            sourceData.data[sourceIndex + 2] > 10;
            
            // A pixel is a stroke if it has enough opacity AND has color
            const isStrokePixel = alpha > 50 && hasColor;
            
            // Set target pixel
            const targetIndex = (y * originalWidth + x) * 4;
            
            if (isStrokePixel) {
              // Set to pure white
              targetData.data[targetIndex] = 255;      // R
              targetData.data[targetIndex + 1] = 255;  // G
              targetData.data[targetIndex + 2] = 255;  // B
              targetData.data[targetIndex + 3] = 255;  // A
            } else {
              // Set to pure black
              targetData.data[targetIndex] = 0;        // R
              targetData.data[targetIndex + 1] = 0;    // G
              targetData.data[targetIndex + 2] = 0;    // B
              targetData.data[targetIndex + 3] = 255;  // A
            }
          }
        }
      }
      
      // Put the binary mask back to the temp canvas
      tempCtx.putImageData(targetData, 0, 0);
      
      // Get the base file name from the original image path
      let maskFileName = 'mask.png';
      
      // If originalImage is a URL, extract the filename
      if (originalImage && typeof originalImage === 'string') {
        const urlParts = originalImage.split('/');
        const fileName = urlParts[urlParts.length - 1];
        // Keep the same extension if possible
        const baseFileName = fileName.split('.')[0];
        const extension = fileName.split('.').pop();
        maskFileName = `${baseFileName}.${extension}`;
        console.log('Using filename from original image:', maskFileName);
      }
      
      // Convert to blob and create a File object
      tempCanvas.toBlob((blob) => {
        if (blob) {
          // Create a File object with the proper name
          const maskFile = new File([blob], maskFileName, { type: 'image/png' });
          resolve(maskFile);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
    
    // Call the API with the correct parameters (imageId, maskFile)
    const response = await saveMask(imageId, maskData);
    
    toast({
      title: 'Mask saved',
      description: 'Your mask has been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Store the current originalFileName before refreshing the images
    // This will help us identify which image was just masked
    const maskedFileName = originalImage && typeof originalImage === 'string' 
      ? originalImage.split('/').pop() 
      : null;
    
    console.log('Image that was just masked:', maskedFileName);
    
    // Since we're using a filesystem-based approach, refresh available images
    // This will remove the image from the list if a mask was created for it
    if (globalFetchAvailableImages) {
      console.log('Refreshing available images after mask save');
      
      // We need to give the server time to process the saved mask
      setTimeout(async () => {
        // First, manually force the image to be removed from the list
        // This is specifically to handle the last image case and ensure immediate UI updates
        if (window && window.forceMaskUpdate) {
          window.forceMaskUpdate(maskedFileName);
        }
        
        // Then refresh the available images
        await globalFetchAvailableImages();
        
        // Add a reminder toast after images are refreshed
        setTimeout(() => {
          toast({
            title: 'Next image preview loaded',
            description: 'Click "Open Selected Image" button to load it into the canvas.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }, 500);
      }, 1000); // Delay to allow for server processing
    } else {
      console.error('fetchAvailableImages function is not available');
    }
    
    return response;
  } catch (error) {
    console.error('Error saving mask:', error);
    
    toast({
      title: 'Save failed',
      description: error.message || 'There was an error saving your mask.',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    
    throw error;
  } finally {
    setIsLoading(false);
  }
};

export default ToolPanel;