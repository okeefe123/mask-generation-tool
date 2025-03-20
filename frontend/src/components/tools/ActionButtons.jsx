import { VStack, Button } from '@chakra-ui/react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAppContext } from '../../contexts/AppContext';
import { useUIContext } from '../../contexts/UIContext';

const ActionButtons = () => {
  const { clearCanvas, handleUndo } = useCanvasContext();
  const { setIsLoading, setStatusMessage } = useUIContext();
  const { displayImage } = useAppContext();

  const handleSaveMask = async () => {
    if (!displayImage) return;
    
    setIsLoading(true);
    setStatusMessage('Saving mask...');
    
    try {
      // This is a placeholder for the actual save functionality
      // In a real implementation, this would call an API to save the mask
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setStatusMessage('Mask saved successfully');
    } catch (error) {
      setStatusMessage(`Error saving mask: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={3} align="stretch">
      <Button colorScheme="blue" onClick={handleSaveMask}>
        Save Mask
      </Button>
      <Button onClick={handleUndo}>
        Undo Last Stroke
      </Button>
      <Button colorScheme="red" variant="outline" onClick={clearCanvas}>
        Clear Canvas
      </Button>
    </VStack>
  );
};

export default ActionButtons;