import { Box, ChakraProvider } from '@chakra-ui/react';
import { useState, useCallback } from 'react';
import { AllProvidersWrapper } from './contexts/AppContexts';
import AppHeader from './components/layout/AppHeader';
import Workspace from './components/layout/Workspace';
import StatusFooter from './components/layout/StatusFooter';
import ImageSettings from './components/tools/ImageSettings';
import DrawingTools from './components/tools/DrawingTools';
import CanvasContainer from './components/canvas/CanvasContainer';
import theme from './theme/theme';
import './App.css';

function App() {
  const [canvasElement, setCanvasElement] = useState(null);
  
  const handleCanvasReady = useCallback((canvas) => {
    setCanvasElement(canvas);
  }, []);
  
  return (
    <ChakraProvider theme={theme}>
      <AllProvidersWrapper>
        <Box minH="100vh" display="flex" flexDirection="column">
          <AppHeader />
          <Workspace
            imageSettings={<ImageSettings />}
            canvasArea={<CanvasContainer onCanvasReady={handleCanvasReady} canvasElement={canvasElement} />}
            drawingTools={<DrawingTools />}
          />
          <StatusFooter />
        </Box>
      </AllProvidersWrapper>
    </ChakraProvider>
  );
}

export default App;
