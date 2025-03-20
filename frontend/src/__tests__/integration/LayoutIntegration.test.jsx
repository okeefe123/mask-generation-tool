import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from '../../App';
import { AllProvidersWrapper } from '../../contexts/AppContexts';

// Mock the components that interact with external resources
jest.mock('../../components/ImageUploader', () => () => (
  <div data-testid="image-uploader">
    <button data-testid="upload-button">Upload Image</button>
  </div>
));

jest.mock('../../components/DrawingCanvas', () => ({ onCanvasReady }) => {
  // Create a mock canvas element with the required methods
  const mockCanvas = document.createElement('canvas');
  mockCanvas.undo = jest.fn();
  mockCanvas.clear = jest.fn();
  
  // Call onCanvasReady with the mock canvas
  setTimeout(() => onCanvasReady(mockCanvas), 0);
  
  return <div data-testid="drawing-canvas">Drawing Canvas</div>;
});

jest.mock('../../components/Toolbar', () => ({ canvasElement }) => (
  <div data-testid="toolbar">
    <button data-testid="undo-button" onClick={() => canvasElement.undo()}>Undo</button>
    <button data-testid="clear-button" onClick={() => canvasElement.clear()}>Clear</button>
  </div>
));

// Mock the context hooks to control the state
jest.mock('../../contexts/AppContexts', () => {
  const originalModule = jest.requireActual('../../contexts/AppContexts');
  
  // Create a mock wrapper that provides all contexts
  const AllProvidersWrapper = ({ children }) => children;
  
  return {
    ...originalModule,
    AllProvidersWrapper,
    useAppContext: jest.fn(),
    useUIContext: jest.fn(),
    useCanvasContext: jest.fn()
  };
});

describe('Layout Integration', () => {
  beforeEach(() => {
    // Set up default mock values
    const mockUseAppContext = require('../../contexts/AppContexts').useAppContext;
    mockUseAppContext.mockReturnValue({
      displayImage: null,
      originalDimensions: { width: 800, height: 600 }
    });
    
    const mockUseUIContext = require('../../contexts/AppContexts').useUIContext;
    mockUseUIContext.mockReturnValue({
      isLoading: false,
      error: null,
      statusMessage: '',
      setStatusMessage: jest.fn()
    });
    
    const mockUseCanvasContext = require('../../contexts/AppContexts').useCanvasContext;
    mockUseCanvasContext.mockReturnValue({
      currentTool: 'brush',
      setCurrentTool: jest.fn(),
      brushSize: 15,
      setBrushSize: jest.fn()
    });
  });
  
  test('renders the complete layout structure', () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check that all main layout components are rendered
    expect(screen.getByRole('heading', { name: /mask generator tool/i })).toBeInTheDocument(); // AppHeader
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument(); // ToolPanel > ImageUploader
    expect(screen.getByText(/ready/i)).toBeInTheDocument(); // StatusFooter
  });
  
  test('displays toolbar when canvas is ready', async () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Wait for the toolbar to appear (after canvas is ready)
    const toolbar = await screen.findByTestId('toolbar');
    expect(toolbar).toBeInTheDocument();
    
    // Check that the toolbar buttons are rendered
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });
  
  test('updates layout when an image is loaded', async () => {
    // First render with no image
    const { rerender } = render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check initial state
    expect(screen.getByText(/upload an image to start editing/i)).toBeInTheDocument();
    expect(screen.queryByTestId('drawing-canvas')).not.toBeInTheDocument();
    
    // Update the mock to simulate an image being loaded
    const mockUseAppContext = require('../../contexts/AppContexts').useAppContext;
    mockUseAppContext.mockReturnValue({
      displayImage: 'test-image.jpg',
      originalDimensions: { width: 800, height: 600 }
    });
    
    // Re-render the component
    rerender(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check that the canvas is now displayed
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
    
    // Check that the upload prompt is no longer displayed
    expect(screen.queryByText(/upload an image to start editing/i)).not.toBeInTheDocument();
  });
  
  test('displays loading state correctly', () => {
    // Set up the UI context mock to return loading state
    const mockUseUIContext = require('../../contexts/AppContexts').useUIContext;
    mockUseUIContext.mockReturnValue({
      isLoading: true,
      error: null,
      statusMessage: 'Loading...',
      setStatusMessage: jest.fn()
    });
    
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check that the loading message is displayed in the status footer
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('handles responsive layout', () => {
    // This test is more conceptual since we can't easily test responsive behavior in JSDOM
    // In a real environment, we might use a tool like Cypress for this
    
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check that the main layout components have the expected structure
    const header = screen.getByRole('heading', { name: /mask generator tool/i }).closest('header');
    expect(header).toBeInTheDocument();
    
    const main = document.querySelector('main'); // Workspace component
    expect(main).toBeInTheDocument();
    
    const footer = document.querySelector('footer'); // StatusFooter component
    expect(footer).toBeInTheDocument();
  });
});