import { Button, VStack, HStack, Tooltip } from '@chakra-ui/react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAppContext } from '../../contexts/AppContext';
import { useUIContext } from '../../contexts/UIContext';

const ActionButtons = () => {
  const { clearCanvas, handleUndo } = useCanvasContext();
  const { setIsLoading, setStatusMessage, setError } = useUIContext();
  const { displayImage } = useAppContext();

  const handleSaveMask = async () => {
    if (!displayImage) return;
    
    try {
      setIsLoading(true);
      setStatusMessage('Saving mask...');
      // This is a placeholder for the actual save functionality
      // In a real implementation, this would call an API to save the mask
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setStatusMessage('Mask saved successfully');
    } catch (error) {
      setError('Failed to save mask: ' + (error.message || 'Unknown error'));
      setStatusMessage(`Error saving mask`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={2}>
        <Tooltip label="Undo last stroke" placement="top">
          <Button
            colorScheme="gray"
            size="sm"
            onClick={handleUndo}
            flex="1"
          >
            Undo
          </Button>
        </Tooltip>
        <Tooltip label="Clear all strokes" placement="top">
          <Button
            colorScheme="gray"
            size="sm"
            onClick={clearCanvas}
            flex="1"
          >
            Clear
          </Button>
        </Tooltip>
      </HStack>
      <Tooltip label="Save mask to server" placement="top">
        <Button
          colorScheme="brand"
          onClick={handleSaveMask}
          size="md"
          width="100%"
        >
          Save Mask
        </Button>
      </Tooltip>
    </VStack>
  );
};

export default ActionButtons;