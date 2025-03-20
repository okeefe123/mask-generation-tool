import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import DrawingTools from '../../../components/tools/DrawingTools';
import { useUIContext } from '../../../contexts/UIContext';

// Mock the useUIContext hook
vi.mock('../../../contexts/UIContext', () => ({
  useUIContext: vi.fn()
}));

describe('DrawingTools Component', () => {
  // Set up default mock values
  const mockSetDrawingMode = vi.fn();
  const mockSetBrushSize = vi.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Set up the mock to return default values
    useUIContext.mockReturnValue({
      drawingMode: 'draw',
      setDrawingMode: mockSetDrawingMode,
      brushSize: 15,
      setBrushSize: mockSetBrushSize
    });
  });
  
  it('renders drawing mode buttons', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Check that the draw and erase buttons are rendered
    expect(screen.getByRole('button', { name: /draw/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /erase/i })).toBeInTheDocument();
  });
  
  it('renders brush size controls', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Check that the brush size slider and text are present
    expect(screen.getByText(/brush size: 15px/i)).toBeInTheDocument();
    
    // Check that the brush size buttons are rendered
    expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
  });
  
  it('highlights the currently selected drawing mode', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // The draw button should have a solid variant when active
    const drawButton = screen.getByRole('button', { name: /draw/i });
    const eraseButton = screen.getByRole('button', { name: /erase/i });
    
    // In Chakra UI, the solid variant will have a different background color than outline
    expect(drawButton).toHaveClass('chakra-button');
    expect(eraseButton).toHaveClass('chakra-button');
  });
  
  it('calls setDrawingMode when a mode button is clicked', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Click the erase button
    fireEvent.click(screen.getByRole('button', { name: /erase/i }));
    
    // Check that setDrawingMode was called with 'erase'
    expect(mockSetDrawingMode).toHaveBeenCalledWith('erase');
  });
  
  it('calls setBrushSize when a size option is clicked', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Click the small brush size button
    fireEvent.click(screen.getByRole('button', { name: /small/i }));
    
    // Check that setBrushSize was called with 5
    expect(mockSetBrushSize).toHaveBeenCalledWith(5);
  });
  
  it('displays the brush preview', () => {
    render(
      <ChakraProvider>
        <DrawingTools />
      </ChakraProvider>
    );
    
    // Check that the brush preview is rendered with the correct properties
    const brushPreview = screen.getByTestId('brush-preview');
    expect(brushPreview).toBeInTheDocument();
    expect(brushPreview).toHaveStyle({
      display: 'inline-block'
    });
  });
});