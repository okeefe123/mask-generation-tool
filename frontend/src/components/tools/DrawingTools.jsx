import {
  VStack,
  HStack,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Tooltip,
  Box
} from '@chakra-ui/react';
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
      <Box borderRadius="md" p={2} bg="gray.50">
        <Text fontWeight="medium" fontSize="sm" mb={2}>Drawing Mode</Text>
        <HStack spacing={2}>
          <Tooltip label="Draw mask" placement="top">
            <Button
              colorScheme={drawingMode === 'draw' ? 'brand' : 'gray'}
              onClick={() => setDrawingMode('draw')}
              flex="1"
              size="sm"
              variant={drawingMode === 'draw' ? 'solid' : 'outline'}
            >
              Draw
            </Button>
          </Tooltip>
          <Tooltip label="Erase mask" placement="top">
            <Button
              colorScheme={drawingMode === 'erase' ? 'brand' : 'gray'}
              onClick={() => setDrawingMode('erase')}
              flex="1"
              size="sm"
              variant={drawingMode === 'erase' ? 'solid' : 'outline'}
            >
              Erase
            </Button>
          </Tooltip>
        </HStack>
      </Box>
      
      <Box borderRadius="md" p={2} bg="gray.50">
        <HStack spacing={1} align="center" mb={1}>
          <Text fontWeight="medium" fontSize="sm">
            Brush Size: {brushSize}px
          </Text>
          <Box
            borderRadius="full"
            bg={drawingMode === 'draw' ? 'black' : 'white'}
            border="1px solid"
            borderColor="gray.300"
            width={`${Math.min(brushSize, 20)}px`}
            height={`${Math.min(brushSize, 20)}px`}
            display="inline-block"
            mx={1}
            data-testid="brush-preview"
          />
        </HStack>
        <Slider
          min={1}
          max={50}
          step={1}
          value={brushSize}
          onChange={setBrushSize}
          colorScheme="brand"
        >
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb boxSize={5} />
        </Slider>
        <HStack justifyContent="space-between" mt={2}>
          <Button
            size="xs"
            onClick={() => setBrushSize(5)}
            variant="ghost"
            colorScheme={brushSize === 5 ? "brand" : "gray"}
          >
            Small
          </Button>
          <Button
            size="xs"
            onClick={() => setBrushSize(15)}
            variant="ghost"
            colorScheme={brushSize === 15 ? "brand" : "gray"}
          >
            Medium
          </Button>
          <Button
            size="xs"
            onClick={() => setBrushSize(30)}
            variant="ghost"
            colorScheme={brushSize === 30 ? "brand" : "gray"}
          >
            Large
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
};

export default DrawingTools;