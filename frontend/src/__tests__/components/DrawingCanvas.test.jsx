import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DrawingCanvas from '../../components/DrawingCanvas';
import { useImageContext } from '../../contexts/ImageContext';

// Mock the ImageContext
vi.mock('../../contexts/ImageContext', () => ({
  useImageContext: vi.fn(),
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

  // Default context values
  const defaultContextValues = {
    displayImage: 'test-image.jpg',
    drawingMode: 'draw',
    brushSize: 10,
    originalDimensions: { width: 1920, height: 1080 },
    scaleFactor: 0.5,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context
    useImageContext.mockReturnValue(defaultContextValues);
    
    // Mock canvas element creation
    HTMLCanvasElement.prototype.getContext = mockGetContext;
  });

  test('renders canvas when display image is available', () => {
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    // Check that the canvas is rendered
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
  });

  test('does not allow drawing when no image is displayed', () => {
    // Set displayImage to null
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      displayImage: null,
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    // Check that the canvas has pointer-events: none
    const canvas = screen.getByRole('presentation');
    expect(canvas).toHaveStyle('pointer-events: none');
  });

  test('sets correct drawing style based on mode', () => {
    // Test draw mode
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      drawingMode: 'draw',
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    // Test erase mode
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      drawingMode: 'erase',
    });
    
    render(<DrawingCanvas imageRef={mockImageRef} />);
  });

  test('handles mouse events correctly', () => {
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    const canvas = screen.getByRole('presentation');
    
    // Simulate mouse down
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    
    // Simulate mouse move
    fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
    
    // Simulate mouse up
    fireEvent.mouseUp(canvas);
    
    // Check that drawing methods were called
    expect(mockGetContext().beginPath).toHaveBeenCalled();
    expect(mockGetContext().moveTo).toHaveBeenCalled();
    expect(mockGetContext().lineTo).toHaveBeenCalled();
    expect(mockGetContext().stroke).toHaveBeenCalled();
  });

  test('handles touch events correctly', () => {
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
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
    expect(mockGetContext().moveTo).toHaveBeenCalled();
    expect(mockGetContext().lineTo).toHaveBeenCalled();
    expect(mockGetContext().stroke).toHaveBeenCalled();
  });

  test('clears canvas when clear method is called', () => {
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    // Get the canvas element
    const canvas = screen.getByRole('presentation');
    
    // Call the clear method
    canvas.clear();
    
    // Check that clearRect was called
    expect(mockGetContext().clearRect).toHaveBeenCalled();
  });

  test('resizes canvas when window is resized', () => {
    render(<DrawingCanvas imageRef={mockImageRef} />);
    
    // Simulate window resize
    global.dispatchEvent(new Event('resize'));
    
    // Check that canvas was resized
    expect(mockGetContext().clearRect).toHaveBeenCalled();
  });
});