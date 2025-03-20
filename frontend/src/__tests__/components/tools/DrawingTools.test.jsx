import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DrawingTools from '../../../components/tools/DrawingTools';

// Mock the useCanvasContext hook
jest.mock('../../../contexts/AppContexts', () => ({
  useCanvasContext: jest.fn()
}));

describe('DrawingTools Component', () => {
  // Set up default mock values
  const mockSetCurrentTool = jest.fn();
  const mockSetBrushSize = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    mockSetCurrentTool.mockReset();
    mockSetBrushSize.mockReset();
    
    // Set up the mock to return default values
    const mockUseCanvasContext = require('../../../contexts/AppContexts').useCanvasContext;
    mockUseCanvasContext.mockReturnValue({
      currentTool: 'brush',
      setCurrentTool: mockSetCurrentTool,
      brushSize: 15,
      setBrushSize: mockSetBrushSize
    });
  });
  
  test('renders all drawing tools', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Check that all tool buttons are rendered
    expect(screen.getByRole('button', { name: /brush/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eraser/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument();
  });
  
  test('renders all brush size options', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Check that all brush size buttons are rendered
    expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
  });
  
  test('highlights the currently selected tool', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // The brush tool should be highlighted (have a different color scheme)
    const brushButton = screen.getByRole('button', { name: /brush/i });
    expect(brushButton).toHaveAttribute('data-active'); // This is how we can check for the active state in Chakra UI
  });
  
  test('calls setCurrentTool when a tool is clicked', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Click the eraser tool
    fireEvent.click(screen.getByRole('button', { name: /eraser/i }));
    
    // Check that setCurrentTool was called with 'eraser'
    expect(mockSetCurrentTool).toHaveBeenCalledWith('eraser');
  });
  
  test('calls setBrushSize when a size option is clicked', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Click the small brush size
    fireEvent.click(screen.getByRole('button', { name: /small/i }));
    
    // Check that setBrushSize was called with 5
    expect(mockSetBrushSize).toHaveBeenCalledWith(5);
  });
});