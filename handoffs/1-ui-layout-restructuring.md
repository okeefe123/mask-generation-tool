# UI Layout Restructuring Handoff - 2025-03-20

## Summary
Phase 1 (State Management Refactoring) has been successfully completed with the implementation of a split context architecture, optimized save operations, and performance improvements. The next phase (Phase 2) will focus on UI Layout Restructuring to create a more professional and efficient interface based on the established foundation.

## Priority Development Requirements (PDR)
- **HIGH**: Create main layout components (AppHeader, Workspace, StatusFooter) to establish the new UI structure
- **HIGH**: Implement the ToolPanel component to organize drawing tools and controls
- **MEDIUM**: Enhance the canvas area with better interaction feedback and status indicators
- **MEDIUM**: Ensure responsive behavior across different screen sizes
- **LOW**: Add preliminary visual styling to prepare for Phase 3

## Discoveries
- The current App.jsx uses a simple VStack layout that will need to be replaced with a more sophisticated layout structure
- The ImageEditor component currently handles both the canvas and toolbar rendering, which should be separated in the new layout
- The DrawingCanvas component is well-optimized for performance but needs better integration with the new layout structure

## Problems & Solutions
- **Problem**: Current layout doesn't maximize canvas workspace area
  **Solution**: Create a dedicated Workspace component with flexible layout that prioritizes canvas space

- **Problem**: Tool controls are not organized by function
  **Solution**: Implement a ToolPanel component with logical grouping of related controls

- **Problem**: Status feedback for operations is limited
  **Solution**: Add a StatusFooter component to provide consistent feedback for all operations

## Work in Progress
- [Phase 1: State Management Refactoring]: 100%
- [Phase 2: UI Layout Restructuring]: 0%
- [Phase 3: Visual Design System]: 0%

## Deviations
- None at this stage - following the implementation plan as outlined

## References
- [phase1_implementation_summary.md]
- [ui_implementation_plan.md]
- [mask_generator_ui_plan.md]
- [frontend/src/App.jsx]
- [frontend/src/components/ImageEditor.jsx]
- [frontend/src/components/DrawingCanvas.jsx]
- [frontend/src/contexts/AppContexts.jsx]

## Implementation Steps

### 1. Create Main Layout Components

#### AppHeader Component
```jsx
// frontend/src/components/layout/AppHeader.jsx
import { Box, Heading, Flex, Text } from '@chakra-ui/react';

const AppHeader = () => {
  return (
    <Box as="header" py={4} borderBottomWidth="1px">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading as="h1" size="xl">Mask Generator Tool</Heading>
          <Text color="gray.600" fontSize="sm">Create precise masks for your images</Text>
        </Box>
        {/* Future global actions will go here */}
      </Flex>
    </Box>
  );
};

export default AppHeader;
```

#### Workspace Component
```jsx
// frontend/src/components/layout/Workspace.jsx
import { Flex, Box } from '@chakra-ui/react';
import { useAppContext } from '../../contexts/AppContexts';

const Workspace = ({ toolPanel, canvasArea }) => {
  const { displayImage } = useAppContext();
  
  return (
    <Flex 
      as="main" 
      flex="1" 
      h={{ base: 'calc(100vh - 180px)', md: 'calc(100vh - 200px)' }}
      direction={{ base: 'column', md: 'row' }}
    >
      {/* Tool Panel - collapsible on mobile */}
      <Box 
        w={{ base: '100%', md: '280px' }} 
        h={{ base: displayImage ? '200px' : 'auto', md: '100%' }}
        borderRightWidth={{ base: 0, md: '1px' }}
        borderBottomWidth={{ base: displayImage ? '1px' : 0, md: 0 }}
        overflowY="auto"
      >
        {toolPanel}
      </Box>
      
      {/* Canvas Area - expands to fill available space */}
      <Box flex="1" h="100%" overflowY="auto">
        {canvasArea}
      </Box>
    </Flex>
  );
};

export default Workspace;
```

#### StatusFooter Component
```jsx
// frontend/src/components/layout/StatusFooter.jsx
import { Box, Flex, Text } from '@chakra-ui/react';
import { useUIContext } from '../../contexts/AppContexts';

const StatusFooter = () => {
  const { isLoading, statusMessage } = useUIContext();
  
  return (
    <Box as="footer" py={3} borderTopWidth="1px">
      <Flex justify="space-between" align="center">
        <Text fontSize="sm" color={isLoading ? "blue.500" : "gray.600"}>
          {statusMessage || 'Ready'}
        </Text>
        <Text fontSize="xs" color="gray.500">© 2025 Mask Generator Tool</Text>
      </Flex>
    </Box>
  );
};

export default StatusFooter;
```

### 2. Implement Tool Panel

```jsx
// frontend/src/components/tools/ToolPanel.jsx
import { VStack, Box, Heading, Divider } from '@chakra-ui/react';
import ImageUploader from '../ImageUploader';
import DrawingTools from './DrawingTools';
import ActionButtons from './ActionButtons';
import { useAppContext } from '../../contexts/AppContexts';

const ToolPanel = () => {
  const { displayImage } = useAppContext();
  
  return (
    <VStack spacing={4} align="stretch" p={4}>
      <Box>
        <Heading size="md" mb={2}>Image</Heading>
        <ImageUploader />
      </Box>
      
      {displayImage && (
        <>
          <Divider />
          <Box>
            <Heading size="md" mb={2}>Drawing Tools</Heading>
            <DrawingTools />
          </Box>
          
          <Divider />
          <Box>
            <Heading size="md" mb={2}>Actions</Heading>
            <ActionButtons />
          </Box>
        </>
      )}
    </VStack>
  );
};

export default ToolPanel;
```

### 3. Enhance Canvas Area

```jsx
// frontend/src/components/canvas/CanvasArea.jsx
import { Box, Center, Spinner, Text } from '@chakra-ui/react';
import { useAppContext, useUIContext } from '../../contexts/AppContexts';
import DrawingCanvas from '../DrawingCanvas';

const CanvasArea = ({ onCanvasReady }) => {
  const { displayImage, originalDimensions } = useAppContext();
  const { isLoading, error } = useUIContext();
  
  if (isLoading) {
    return (
      <Center h="100%">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Center h="100%">
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }
  
  if (!displayImage) {
    return (
      <Center h="100%" bg="gray.50">
        <Text color="gray.500">Upload an image to start editing</Text>
      </Center>
    );
  }
  
  return (
    <Box 
      position="relative" 
      h="100%" 
      w="100%" 
      bg="gray.100"
      data-testid="canvas-area"
    >
      <Center h="100%" w="100%">
        <Box position="relative">
          <img
            src={displayImage}
            alt="Uploaded image"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
          <DrawingCanvas onCanvasReady={onCanvasReady} />
        </Box>
      </Center>
    </Box>
  );
};

export default CanvasArea;
```

### 4. Update App.jsx

```jsx
// Updated App.jsx
import { Box } from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { AllProvidersWrapper } from './contexts/AppContexts';
import AppHeader from './components/layout/AppHeader';
import Workspace from './components/layout/Workspace';
import StatusFooter from './components/layout/StatusFooter';
import ToolPanel from './components/tools/ToolPanel';
import CanvasArea from './components/canvas/CanvasArea';
import Toolbar from './components/Toolbar';
import './App.css';

function App() {
  const [canvasElement, setCanvasElement] = useState(null);
  
  const handleCanvasReady = useCallback((canvas) => {
    setCanvasElement(canvas);
  }, []);
  
  return (
    <AllProvidersWrapper>
      <Box minH="100vh" display="flex" flexDirection="column">
        <AppHeader />
        <Workspace 
          toolPanel={<ToolPanel />}
          canvasArea={<CanvasArea onCanvasReady={handleCanvasReady} />}
        />
        <StatusFooter />
        {canvasElement && <Toolbar canvasElement={canvasElement} />}
      </Box>
    </AllProvidersWrapper>
  );
}

export default App;
```

### 5. Testing Requirements

The following tests should be created or updated:

1. **Layout Component Tests**
   - Test that AppHeader renders correctly
   - Test that Workspace properly handles responsive layout
   - Test that StatusFooter displays the correct status message

2. **ToolPanel Tests**
   - Test that ToolPanel shows appropriate sections based on state
   - Test that drawing tools are properly displayed
   - Test that action buttons work correctly

3. **CanvasArea Tests**
   - Test that CanvasArea properly displays loading, error, and empty states
   - Test that the canvas is properly positioned
   - Test that the DrawingCanvas is properly integrated

4. **Integration Tests**
   - Test that the complete layout works together
   - Test responsive behavior at different screen sizes
   - Test that tool selection updates the UI appropriately