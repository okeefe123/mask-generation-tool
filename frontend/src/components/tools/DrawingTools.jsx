import { VStack, HStack, Button, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text } from '@chakra-ui/react';
import { useUIContext } from '../../contexts/UIContext';

const DrawingTools = () => {
  const { 
    drawingMode, 
    setDrawingMode, 
    brushSize, 
    setBrushSize 
  } = useUIContext();

  return (
    <VStack spacing={4} align="stretch">
      <HStack spacing={2}>
        <Button 
          colorScheme={drawingMode === 'draw' ? 'blue' : 'gray'} 
          onClick={() => setDrawingMode('draw')}
          flex="1"
        >
          Draw
        </Button>
        <Button 
          colorScheme={drawingMode === 'erase' ? 'blue' : 'gray'} 
          onClick={() => setDrawingMode('erase')}
          flex="1"
        >
          Erase
        </Button>
      </HStack>
      
      <VStack spacing={1} align="stretch">
        <Text fontSize="sm">Brush Size: {brushSize}px</Text>
        <Slider 
          min={1} 
          max={50} 
          step={1} 
          value={brushSize} 
          onChange={setBrushSize}
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </VStack>
    </VStack>
  );
};

export default DrawingTools;