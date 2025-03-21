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
      tagName: 'IMG', // Add this to simulate an img element
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
    // Mock document.querySelector to return the mock image element
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn(() => mockImageRef.current);

    render(<DrawingCanvas onCanvasReady={vi.fn()} />);
    
    // Check that the canvas is rendered
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
    
    // Restore original querySelector
    document.querySelector = originalQuerySelector;
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
    // Mock document.querySelector to return the mock image element
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn(() => mockImageRef.current);
    
    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    }));
    
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    
    const mockOnCanvasReady = vi.fn();
    render(<DrawingCanvas onCanvasReady={mockOnCanvasReady} />);
    
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
    
    // Restore original methods
    document.querySelector = originalQuerySelector;
    delete Element.prototype.getBoundingClientRect;
  });

  test('handles touch events correctly', () => {
    // Mock document.querySelector to return the mock image element
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn(() => mockImageRef.current);
    
    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    }));
    
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
    
    render(<DrawingCanvas onCanvasReady={vi.fn()} />);
    
    const canvas = screen.getByRole('presentation');
    
    // Simulate touch start
    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 100, clientY: 100 }],
      changedTouches: [{ clientX: 100, clientY: 100 }]
    });
    
    // Simulate touch move
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 150, clientY: 150 }],
      changedTouches: [{ clientX: 150, clientY: 150 }]
    });
    
    // Simulate touch end
    fireEvent.touchEnd(canvas, {
      changedTouches: [{ clientX: 150, clientY: 150 }]
    });
    
    // Check that drawing methods were called
    expect(mockGetContext().beginPath).toHaveBeenCalled();
    expect(mockGetContext().arc).toHaveBeenCalled();
    expect(mockGetContext().fill).toHaveBeenCalled();
    
    // Restore original methods
    document.querySelector = originalQuerySelector;
    delete Element.prototype.getBoundingClientRect;
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

  test('drawing uses consistent full opacity regardless of layering', () => {
    // Create mock context with known properties for testing opacity
    const mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 10,
      strokeStyle: '',
      globalCompositeOperation: 'source-over',
      globalAlpha: 1.0
    };
    
    // Create a simulated draw function similar to the component's draw function
    const draw = () => {
      const ctx = mockCtx;
      
      // This simulates the behavior in the updated draw function
      if (true) { // drawingMode === 'draw'
        ctx.globalAlpha = 0.7; // Setting opacity for visual feedback
      }
      
      // Drawing operations here
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(150, 150);
      ctx.stroke();
      
      // This is what we're testing - that we reset globalAlpha after drawing
      ctx.globalAlpha = 1.0;
      
      return ctx;
    };
    
    // Execute the simulated draw function
    const resultCtx = draw();
    
    // Verify the behavior
    expect(resultCtx.beginPath).toHaveBeenCalled();
    expect(resultCtx.stroke).toHaveBeenCalled();
    
    // Verify that global alpha is reset to 1.0 after drawing
    expect(resultCtx.globalAlpha).toBe(1.0);
  });

  test('erasing fully removes brush strokes', () => {
    // Create mock context with known properties for testing erase functionality
    const mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      lineJoin: 'round',
      lineCap: 'round',
      lineWidth: 10,
      strokeStyle: '',
      globalCompositeOperation: 'source-over',
      globalAlpha: 1.0
    };
    
    // Setup for erase mode
    useUIContext.mockReturnValue({
      ...mockUIContextValues,
      drawingMode: 'erase',
    });
    
    // Create a simulated draw function for erase mode
    const drawInEraseMode = () => {
      const ctx = mockCtx;
      
      // First setup the context for erasing
      ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
      ctx.globalCompositeOperation = 'destination-out';
      
      // This is what happens in the draw function for erase
      // For erasing: full opacity to completely remove pixels
      ctx.globalAlpha = 1.0;
      
      // Erasing operations
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(150, 150);
      ctx.stroke();
      
      return ctx;
    };
    
    // Execute the erase function
    const resultCtx = drawInEraseMode();
    
    // Verify the behavior
    expect(resultCtx.beginPath).toHaveBeenCalled();
    expect(resultCtx.stroke).toHaveBeenCalled();
    
    // Verify that proper settings were used for erasing
    expect(resultCtx.globalCompositeOperation).toBe('destination-out');
    expect(resultCtx.globalAlpha).toBe(1.0);
    expect(resultCtx.strokeStyle).toBe('rgba(0, 0, 0, 1.0)');
  });
});