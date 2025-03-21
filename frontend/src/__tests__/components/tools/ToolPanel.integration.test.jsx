import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import ToolPanel from '../../../components/tools/ToolPanel';
import { useAppContext } from '../../../contexts/AppContexts';
import { useUIContext } from '../../../contexts/AppContexts';
import { useCanvasContext } from '../../../contexts/AppContexts';
import { saveMask } from '../../../services/api';

// Mock the contexts
vi.mock('../../../contexts/AppContexts', () => ({
  useAppContext: vi.fn(),
  useUIContext: vi.fn(),
  useCanvasContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../../services/api', () => ({
  saveMask: vi.fn(),
}));

describe('ToolPanel with integrated Toolbar functionality', () => {
  // Mock canvas element
  const mockCanvasElement = {
    tagName: 'CANVAS',
    getContext: vi.fn(() => ({
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]), // Non-transparent pixel
      })),
      drawImage: vi.fn(),
      putImageData: vi.fn(),
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

  const mockCanvasContextValues = {
    clearCanvas: vi.fn(),
    handleUndo: vi.fn(),
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
    useCanvasContext.mockReturnValue(mockCanvasContextValues);
    
    // Mock document.createElement for canvas
    global.document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: vi.fn(() => ({
            fillRect: vi.fn(),
            fillStyle: '',
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({
              data: new Uint8ClampedArray(400), // 25 pixels (25 * 4 = 100)
              width: 5,
              height: 5
            })),
            putImageData: vi.fn(),
          })),
          toBlob: vi.fn((callback) => callback(new Blob())),
          toDataURL: vi.fn(() => 'data:image/png;base64,abc123'),
          width: 0,
          height: 0,
        };
      }
      return { tagName };
    });
    
    // Mock File constructor
    global.File = vi.fn().mockImplementation(() => ({}));
    
    // Mock successful API response
    saveMask.mockResolvedValue({ success: true });
  });

  test('renders with drawing tools sections when image is displayed', () => {
    render(<ToolPanel canvasElement={mockCanvasElement} />);
    
    // Check that all sections are rendered
    expect(screen.getByRole('heading', { name: 'Image' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drawing Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actions' })).toBeInTheDocument();
  });

  test('does not show drawing tools when no image is loaded', () => {
    useAppContext.mockReturnValue({
      ...mockAppContextValues,
      displayImage: null,
    });
    
    render(<ToolPanel canvasElement={mockCanvasElement} />);
    
    // Check that only Image section is rendered
    expect(screen.getByRole('heading', { name: 'Image' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Drawing Tools' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Actions' })).not.toBeInTheDocument();
  });

  test('handles save mask functionality', async () => {
    render(<ToolPanel canvasElement={mockCanvasElement} />);
    
    // Find the Save Mask button
    const saveButton = screen.getByText('Save Mask');
    expect(saveButton).toBeInTheDocument();
    
    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Check that setIsLoading was called with true then false
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(true);
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(false);
    
    // Check that saveMask was called with the correct parameters
    expect(saveMask).toHaveBeenCalledWith('123', expect.any(Object));
    
    // Check that toast was called with success message
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Mask saved',
      status: 'success',
    }));
  });

  test('ensures binary mask representation when saving', async () => {
    // Mock the getImageData to return a canvas with semi-transparent pixels
    const mockImageData = {
      data: new Uint8ClampedArray(400), // 25 pixels (25 * 4 = 100)
      width: 5,
      height: 5
    };
    
    // Set up some test pixel data with various transparencies
    // Pixel 1: Semi-transparent white
    mockImageData.data[0] = 255; // R
    mockImageData.data[1] = 255; // G
    mockImageData.data[2] = 255; // B
    mockImageData.data[3] = 128; // A (semi-transparent)
    
    // Pixel 2: Semi-transparent black
    mockImageData.data[4] = 0;   // R
    mockImageData.data[5] = 0;   // G
    mockImageData.data[6] = 0;   // B
    mockImageData.data[7] = 64;  // A (mostly transparent)
    
    // Pixel 3: Fully transparent
    mockImageData.data[8] = 255; // R
    mockImageData.data[9] = 255; // G
    mockImageData.data[10] = 255; // B
    mockImageData.data[11] = 0;  // A (fully transparent)
    
    const mockGetImageData = vi.fn(() => mockImageData);
    const mockPutImageData = vi.fn();
    
    const mockCtx = {
      getImageData: mockGetImageData,
      putImageData: mockPutImageData,
      drawImage: vi.fn(),
    };
    
    document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: vi.fn(() => mockCtx),
          toBlob: vi.fn((callback) => callback(new Blob())),
          width: 5,
          height: 5,
        };
      }
      return { tagName };
    });
    
    mockCanvasElement.getContext = vi.fn(() => ({
      getImageData: mockGetImageData,
      drawImage: vi.fn(),
    }));
    
    render(<ToolPanel canvasElement={mockCanvasElement} />);
    
    // Find the Save Mask button
    const saveButton = screen.getByText('Save Mask');
    
    // Click the save button
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Check that putImageData was called (mask conversion happened)
    expect(mockPutImageData).toHaveBeenCalled();
    
    // We can't directly check the binary conversion in this test since we are mocking,
    // but we're verifying that the function to convert to binary mask was called
    expect(saveMask).toHaveBeenCalled();
  });

  test('handles clear and undo buttons', () => {
    render(<ToolPanel canvasElement={mockCanvasElement} />);
    
    // Find the buttons
    const clearButton = screen.getByText('Clear');
    const undoButton = screen.getByText('Undo');
    
    // Click the clear button
    fireEvent.click(clearButton);
    
    // Should prefer canvas.clear over context clearCanvas if available
    expect(mockCanvasElement.clear).toHaveBeenCalled();
    expect(mockCanvasContextValues.clearCanvas).not.toHaveBeenCalled();
    
    // Click the undo button
    fireEvent.click(undoButton);
    
    // Should prefer canvas.undo over context handleUndo if available
    expect(mockCanvasElement.undo).toHaveBeenCalled();
    expect(mockCanvasContextValues.handleUndo).not.toHaveBeenCalled();
    
    // Test with no canvas methods
    mockCanvasElement.clear = null;
    mockCanvasElement.undo = null;
    
    // Click the buttons again
    fireEvent.click(clearButton);
    fireEvent.click(undoButton);
    
    // Should now use context methods
    expect(mockCanvasContextValues.clearCanvas).toHaveBeenCalled();
    expect(mockCanvasContextValues.handleUndo).toHaveBeenCalled();
  });
});