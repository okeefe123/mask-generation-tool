import { Button, VStack, HStack, Tooltip } from '@chakra-ui/react';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAppContext } from '../../contexts/AppContext';
import { useUIContext } from '../../contexts/UIContext';

const ActionButtons = ({ onSave, isSaving, canvasElement, canvasError }) => {
  const { clearCanvas, handleUndo: contextHandleUndo } = useCanvasContext();
  const { setStatusMessage } = useUIContext();
  const { displayImage } = useAppContext();

  const handleClear = () => {
    if (canvasElement && canvasElement.clear) {
      canvasElement.clear();
      setStatusMessage('Canvas cleared');
    } else if (clearCanvas) {
      clearCanvas();
      setStatusMessage('Canvas cleared');
    }
  };

  const handleUndo = () => {
    if (canvasElement && canvasElement.undo) {
      canvasElement.undo();
      setStatusMessage('Undid last stroke');
    } else if (contextHandleUndo) {
      contextHandleUndo();
      setStatusMessage('Undid last stroke');
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
            isDisabled={!!canvasError}
          >
            Undo
          </Button>
        </Tooltip>
        <Tooltip label="Clear all strokes" placement="top">
          <Button
            colorScheme="gray"
            size="sm"
            onClick={handleClear}
            flex="1"
            isDisabled={!!canvasError}
          >
            Clear
          </Button>
        </Tooltip>
      </HStack>
      <Tooltip label="Save mask to server" placement="top">
        <Button
          colorScheme="brand"
          onClick={onSave}
          isLoading={isSaving}
          loadingText="Saving..."
          size="md"
          width="100%"
          isDisabled={!!canvasError}
        >
          Save Mask
        </Button>
      </Tooltip>
    </VStack>
  );
};

export default ActionButtons;