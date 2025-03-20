import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import Toolbar from '../../components/Toolbar';
import { useAppContext, useUIContext } from '../../contexts/AppContexts';
import { saveMask } from '../../services/api';

// Mock the contexts
vi.mock('../../contexts/AppContexts', () => ({
  useAppContext: vi.fn(),
  useUIContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  saveMask: vi.fn(),
}));

describe('Toolbar Component', () => {
  // Mock canvas element
  const mockCanvasElement = {
    tagName: 'CANVAS',
    getContext: vi.fn(() => ({
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]), // Non-transparent pixel
      })),
    })),
    width: 800,
    height: 600,
    toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
    undo: vi.fn(),
    clear: vi.fn(),
  };

  // Mock context values
  const mockAppContextValues = {
    originalImage: 'test-image.jpg',
    displayImage: 'test-display.jpg',
    imageId: '123',
    originalFileName: 'test.jpg',
    originalDimensions: { width: 1920, height: 1080 },
  };

  const mockUIContextValues = {
    drawingMode: 'draw',
    setDrawingMode: vi.fn(),
    brushSize: 10,
    setBrushSize: vi.fn(),
    isLoading: false,
    setIsLoading: vi.fn(),
    error: null,
    setError: vi.fn(),
  };

  // Mock toast
  const mockToast = vi.fn();
  vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
      ...actual,
      useToast: () => mockToast,
    };
  });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context values
    useAppContext.mockReturnValue(mockAppContextValues);
    useUIContext.mockReturnValue(mockUIContextValues);
    
    // Mock document.createElement for canvas
    global.document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: vi.fn(() => ({
            fillRect: vi.fn(),
            fillStyle: '',
            drawImage: vi.fn(),
          })),
          toBlob: vi.fn((callback) => callback(new Blob())),
          toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
          width: 0,
          height: 0,
        };
      }
      return { tagName };
    });
    
    // Mock fetch for blob
    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob()),
    });
    
    // Mock File constructor
    global.File = vi.fn().mockImplementation(() => ({}));
    
    // Mock successful API response
    saveMask.mockResolvedValue({ success: true });
  });

  test('renders toolbar with all controls', () => {
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Check that all controls are rendered
    expect(screen.getByText('Draw')).toBeInTheDocument();
    expect(screen.getByText('Brush Size:')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Save Mask')).toBeInTheDocument();
  });

  test('changes drawing mode when buttons are clicked', () => {
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Click the draw mode button
    fireEvent.click(screen.getByText('Draw'));
    expect(mockUIContextValues.setDrawingMode).toHaveBeenCalledWith('draw');
    
    // Click the erase mode button
    fireEvent.click(screen.getByText('Erase'));
    expect(mockUIContextValues.setDrawingMode).toHaveBeenCalledWith('erase');
  });

  test('changes brush size when slider is moved', () => {
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Find the slider
    const slider = screen.getByRole('slider');
    
    // Change the slider value
    fireEvent.change(slider, { target: { value: '20' } });
    
    // Check that setBrushSize was called with the new value
    expect(mockUIContextValues.setBrushSize).toHaveBeenCalledWith(20);
  });

  test('clears canvas when clear button is clicked', () => {
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Click the clear button
    fireEvent.click(screen.getByText('Clear'));
    
    // Check that canvas.clear was called
    expect(mockCanvasElement.clear).toHaveBeenCalled();
    
    // Check that toast was called
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Canvas cleared',
      status: 'info',
    }));
  });

  test('saves mask when save button is clicked', async () => {
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Click the save button
    await act(async () => {
      fireEvent.click(screen.getByText('Save Mask'));
    });
    
    // Check that setIsLoading was called with true then false
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(true);
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(false);
    
    // Check that saveMask was called with the correct parameters
    expect(saveMask).toHaveBeenCalledWith('123', expect.any(Object), undefined);
    
    // Check that toast was called with success message
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Mask saved',
      status: 'success',
    }));
  });

  test('shows error when canvas validation fails', () => {
    // Set imageId to null to trigger validation error
    useAppContext.mockReturnValue({
      ...mockAppContextValues,
      imageId: null,
    });
    
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Check that error message is displayed
    expect(screen.getByText('Canvas Error:')).toBeInTheDocument();
    expect(screen.getByText('Image ID is missing. Please re-upload the image.')).toBeInTheDocument();
  });

  test('handles save error gracefully', async () => {
    // Mock API error
    saveMask.mockRejectedValue(new Error('Server error'));
    
    render(<Toolbar canvasElement={mockCanvasElement} />);
    
    // Click the save button
    await act(async () => {
      fireEvent.click(screen.getByText('Save Mask'));
    });
    
    // Check that setError was called with the error message
    expect(mockUIContextValues.setError).toHaveBeenCalledWith('Server error');
    
    // Check that toast was called with error message
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Save failed',
      status: 'error',
    }));
  });
});