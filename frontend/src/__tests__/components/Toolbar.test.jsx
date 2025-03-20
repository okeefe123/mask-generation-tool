import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Toolbar from '../../components/Toolbar';
import { useImageContext } from '../../contexts/ImageContext';
import { saveMask } from '../../services/api';
import { canvasToBinaryMask } from '../../utils/imageProcessing';

// Mock the ImageContext
vi.mock('../../contexts/ImageContext', () => ({
  useImageContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  saveMask: vi.fn(),
}));

// Mock the imageProcessing utility
vi.mock('../../utils/imageProcessing', () => ({
  canvasToBinaryMask: vi.fn(),
}));

describe('Toolbar Component', () => {
  // Mock canvas ref
  const mockCanvas = {
    getContext: vi.fn(() => ({
      clearRect: vi.fn(),
    })),
    width: 800,
    height: 600,
    clear: vi.fn(),
  };
  
  const mockCanvasRef = {
    current: mockCanvas,
  };

  // Default context values
  const defaultContextValues = {
    drawingMode: 'draw',
    setDrawingMode: vi.fn(),
    brushSize: 10,
    setBrushSize: vi.fn(),
    originalImage: 'http://example.com/images/test.jpg',
    originalDimensions: { width: 1920, height: 1080 },
    setIsLoading: vi.fn(),
    setError: vi.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context
    useImageContext.mockReturnValue(defaultContextValues);
    
    // Mock successful mask save
    saveMask.mockResolvedValue({ id: 1, file: 'http://example.com/masks/mask_test.png' });
    
    // Mock binary mask generation
    canvasToBinaryMask.mockReturnValue('data:image/png;base64,mockbase64data');
    
    // Mock fetch for blob conversion
    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['mock data'], { type: 'image/png' })),
    });
  });

  test('renders toolbar with all controls', () => {
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Check that all controls are rendered
    expect(screen.getByRole('button', { name: /Draw/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Erase/i })).toBeInTheDocument();
    expect(screen.getByText(/Brush Size/i)).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Mask/i })).toBeInTheDocument();
  });

  test('handles drawing mode change', () => {
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Click the Erase button
    fireEvent.click(screen.getByRole('button', { name: /Erase/i }));
    
    // Check that setDrawingMode was called with 'erase'
    expect(defaultContextValues.setDrawingMode).toHaveBeenCalledWith('erase');
    
    // Click the Draw button
    fireEvent.click(screen.getByRole('button', { name: /Draw/i }));
    
    // Check that setDrawingMode was called with 'draw'
    expect(defaultContextValues.setDrawingMode).toHaveBeenCalledWith('draw');
  });

  test('handles brush size change', () => {
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Change the slider value
    fireEvent.change(screen.getByRole('slider'), { target: { value: 20 } });
    
    // Check that setBrushSize was called with the new value
    expect(defaultContextValues.setBrushSize).toHaveBeenCalledWith(20);
  });

  test('handles canvas clear', () => {
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Click the Clear button
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    
    // Check that canvas.clear was called
    expect(mockCanvas.clear).toHaveBeenCalled();
  });

  test('handles mask save', async () => {
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Click the Save Mask button
    fireEvent.click(screen.getByRole('button', { name: /Save Mask/i }));
    
    // Check that loading state was set
    expect(defaultContextValues.setIsLoading).toHaveBeenCalledWith(true);
    
    // Check that canvasToBinaryMask was called
    expect(canvasToBinaryMask).toHaveBeenCalledWith(
      mockCanvas,
      defaultContextValues.originalDimensions.width,
      defaultContextValues.originalDimensions.height
    );
    
    // Check that saveMask was called
    await waitFor(() => {
      expect(saveMask).toHaveBeenCalled();
    });
    
    // Check that loading state was reset
    expect(defaultContextValues.setIsLoading).toHaveBeenCalledWith(false);
  });

  test('handles save error', async () => {
    // Mock API error
    saveMask.mockRejectedValue(new Error('Save failed'));
    
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Click the Save Mask button
    fireEvent.click(screen.getByRole('button', { name: /Save Mask/i }));
    
    // Check that error state was set
    await waitFor(() => {
      expect(defaultContextValues.setError).toHaveBeenCalled();
      expect(defaultContextValues.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  test('disables save button when no image is loaded', () => {
    // Set originalImage to null
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      originalImage: null,
    });
    
    render(<Toolbar canvasRef={mockCanvasRef} />);
    
    // Check that the Save Mask button is disabled
    expect(screen.getByRole('button', { name: /Save Mask/i })).toBeDisabled();
  });
});