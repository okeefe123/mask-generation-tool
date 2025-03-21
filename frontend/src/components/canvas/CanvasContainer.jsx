import { Box, Button, Flex, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import CanvasArea from './CanvasArea';
import { useUIContext, useImageContext } from '../../contexts/AppContexts';
import { handleSaveMask } from '../tools/ToolPanel';

/**
 * Container component for the canvas area that includes the Save Mask button.
 * 
 * @param {Object} props - Component properties
 * @param {Function} props.onCanvasReady - Callback when canvas is ready
 * @param {HTMLCanvasElement} props.canvasElement - Reference to the canvas element
 * @returns {JSX.Element} The rendered CanvasContainer component
 */
const CanvasContainer = ({ onCanvasReady, canvasElement }) => {
  const { setIsLoading, setError } = useUIContext();
  const { imageId, originalImage } = useImageContext();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  /**
   * Handles the save mask action
   * @returns {Promise<void>}
   */
  const onSaveMask = async () => {
    if (!canvasElement || !imageId) {
      toast({
        title: 'Cannot save',
        description: 'No canvas or image available for saving',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setIsSaving(true);
      await handleSaveMask(canvasElement, imageId, originalImage, toast, setIsLoading, setError);
    } catch (error) {
      console.error('Error in save handler:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Flex direction="column" height="100%" width="100%">
      <Box flex="1" position="relative">
        <CanvasArea onCanvasReady={onCanvasReady} />
      </Box>
      
      <Flex justifyContent="center" mt={4} mb={2}>
        {canvasElement && imageId ? (
          <Button
            colorScheme="brand"
            size="md"
            onClick={onSaveMask}
            isLoading={isSaving}
            loadingText="Saving..."
            width="200px"
            boxShadow="sm"
          >
            Save Mask
          </Button>
        ) : (
          <Button
            colorScheme="brand"
            size="md"
            isDisabled
            width="200px"
            opacity={0.6}
          >
            Save Mask
          </Button>
        )}
      </Flex>
    </Flex>
  );
};

export default CanvasContainer; 