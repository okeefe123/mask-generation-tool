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
    setBrushSize,
    brushShape,
    setBrushShape
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
        <Text fontWeight="medium" fontSize="sm" mb={2}>Brush Shape</Text>
        <HStack spacing={2}>
          <Tooltip label="Circle shape" placement="top">
            <Button
              colorScheme={brushShape === 'circle' ? 'brand' : 'gray'}
              onClick={() => setBrushShape('circle')}
              flex="1"
              size="sm"
              variant={brushShape === 'circle' ? 'solid' : 'outline'}
            >
              Circle
            </Button>
          </Tooltip>
          <Tooltip label="Square shape" placement="top">
            <Button
              colorScheme={brushShape === 'square' ? 'brand' : 'gray'}
              onClick={() => setBrushShape('square')}
              flex="1"
              size="sm"
              variant={brushShape === 'square' ? 'solid' : 'outline'}
            >
              Square
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
            borderRadius={brushShape === 'circle' ? "full" : "0"}
            bg={drawingMode === 'draw' ? 'white' : 'white'}
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
          max={100}
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