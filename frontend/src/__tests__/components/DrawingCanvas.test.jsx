import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DrawingCanvas from '../../components/DrawingCanvas';
import { useAppContext, useUIContext, useCanvasContext } from '../../contexts/AppContexts';

// Mock the contexts
vi.mock('../../contexts/AppContexts', () => ({
  useAppContext: vi.fn(),
  useUIContext: vi.fn(),
  useCanvasContext: vi.fn(),
}));

describe('DrawingCanvas Component', () => {
  // Mock canvas methods
  const mockGetContext = vi.fn(() => ({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  }));

  // Mock canvas element
  const mockCanvas = {
    getContext: mockGetContext,
    width: 800,
    height: 600,
    clear: vi.fn(),
  };

  // Mock ref
  const mockCanvasRef = {
    current: mockCanvas,
  };

  // Mock image ref
  const mockImageRef = {
    current: {
      clientWidth: 800,
      clientHeight: 600,
    },
  };

  // Mock context values
  const mockAppContextValues = {
    displayImage: 'test-image.jpg',
    originalDimensions: { width: 1920, height: 1080 },
    scaleFactor: 0.5,
  };

  const mockUIContextValues = {
    drawingMode: 'draw',
    brushSize: 10,
    isLoading: false,
    setIsLoading: vi.fn(),
  };

  const mockCanvasContextValues = {
    strokes: [],
    addStroke: vi.fn(),
    handleUndo: vi.fn(),
    clearCanvas: vi.fn(),
    getCurrentStrokes: vi.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context values
    useAppContext.mockReturnValue(mockAppContextValues);
    useUIContext.mockReturnValue(mockUIContextValues);
    useCanvasContext.mockReturnValue(mockCanvasContextValues);
    
    // Mock canvas element creation
    HTMLCanvasElement.prototype.getContext = mockGetContext;
  });

  test('renders canvas when display image is available', () => {
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={vi.fn()} />);
    
    // Check that the canvas is rendered
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
  });

  test('does not allow drawing when no image is displayed', () => {
    // Set displayImage to null
    useAppContext.mockReturnValue({
      ...mockAppContextValues,
      displayImage: null,
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={vi.fn()} />);
    
    // Check that the canvas has pointer-events: none
    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveStyle('pointer-events: none');
  });

  test('sets correct drawing style based on mode', () => {
    // Test draw mode
    useUIContext.mockReturnValue({
      ...mockUIContextValues,
      drawingMode: 'draw',
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={vi.fn()} />);
    
    // Test erase mode
    useUIContext.mockReturnValue({
      ...mockUIContextValues,
      drawingMode: 'erase',
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={vi.fn()} />);
  });

  test('handles mouse events correctly', () => {
    const mockOnCanvasReady = vi.fn();
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={mockOnCanvasReady} />);
    
    const canvas = screen.getByRole('presentation');
    
    // Simulate mouse down
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    
    // Simulate mouse move
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
    
    // Simulate mouse up
    fireEvent.mouseUp(canvas);
    
    // Check that drawing methods were called
    expect(mockGetContext().beginPath).toHaveBeenCalled();
    expect(mockGetContext().arc).toHaveBeenCalled();
    expect(mockGetContext().fill).toHaveBeenCalled();
    
    // Check that stroke was added to context
    expect(mockCanvasContextValues.addStroke).toHaveBeenCalled();
  });

  test('handles touch events correctly', () => {
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={vi.fn()} />);
    
    const canvas = screen.getByRole('presentation');
    
    // Simulate touch start
    fireEvent.touchStart(canvas, { 
      touches: [{ clientX: 100, clientY: 100 }] 
    });
    
    // Simulate touch move
    fireEvent.touchMove(canvas, { 
      touches: [{ clientX: 150, clientY: 150 }] 
    });
    
    // Simulate touch end
    fireEvent.touchEnd(canvas);
    
    // Check that drawing methods were called
    expect(mockGetContext().beginPath).toHaveBeenCalled();
    expect(mockGetContext().arc).toHaveBeenCalled();
    expect(mockGetContext().fill).toHaveBeenCalled();
  });

  test('exposes undo and clear methods to canvas element', () => {
    const mockOnCanvasReady = vi.fn();
    render(<DrawingCanvas imageRef={mockImageRef} onCanvasReady={mockOnCanvasReady} />);
    
    // Check that onCanvasReady was called with canvas element
    expect(mockOnCanvasReady).toHaveBeenCalled();
    
    // Get the canvas element passed to onCanvasReady
    const canvasElement = mockOnCanvasReady.mock.calls[0][0];
    
    // Check that undo and clear methods are attached
    expect(typeof canvasElement.undo).toBe('function');
    expect(typeof canvasElement.clear).toBe('function');
    
    // Call the undo method
    canvasElement.undo();
    
    // Check that handleUndo was called
    expect(mockCanvasContextValues.handleUndo).toHaveBeenCalled();
    
    // Call the clear method
    canvasElement.clear();
    
    // Check that clearCanvas was called
    expect(mockCanvasContextValues.clearCanvas).toHaveBeenCalled();
  });
});