import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CanvasArea from '../../../components/canvas/CanvasArea';
import * as AppContextModule from '../../../contexts/AppContext';
import * as UIContextModule from '../../../contexts/UIContext';

// Mock the DrawingCanvas component
vi.mock('../../../components/DrawingCanvas', () => ({
  default: ({ onCanvasReady }) => {
    // Call onCanvasReady with a mock canvas element
    if (onCanvasReady) {
      onCanvasReady({ id: 'mock-canvas' });
    }
    return <canvas data-testid="drawing-canvas">Mock Canvas</canvas>;
  }
}));

describe('CanvasArea', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  test('displays loading spinner when isLoading is true', () => {
    // Mock the context hooks
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg'
    });
    
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: true,
      error: null
    });
    
    render(<CanvasArea onCanvasReady={() => {}} />);
    
    // Check that the spinner is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that the canvas is not displayed
    expect(screen.queryByTestId('drawing-canvas')).not.toBeInTheDocument();
  });
  
  test('displays error message when there is an error', () => {
    // Mock the context hooks
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg'
    });
    
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: false,
      error: 'Test error message'
    });
    
    render(<CanvasArea onCanvasReady={() => {}} />);
    
    // Check that the error message is displayed
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    
    // Check that the canvas is not displayed
    expect(screen.queryByTestId('drawing-canvas')).not.toBeInTheDocument();
  });
  
  test('displays upload message when no image is displayed', () => {
    // Mock the context hooks
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: null
    });
    
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: false,
      error: null
    });
    
    render(<CanvasArea onCanvasReady={() => {}} />);
    
    // Check that the upload message is displayed
    expect(screen.getByText('Upload an image to start editing')).toBeInTheDocument();
    
    // Check that the canvas is not displayed
    expect(screen.queryByTestId('drawing-canvas')).not.toBeInTheDocument();
  });
  
  test('displays image and canvas when an image is loaded', () => {
    // Mock the context hooks
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg',
      originalDimensions: { width: 800, height: 600 }
    });
    
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: false,
      error: null
    });
    
    const mockCanvasReady = vi.fn();
    render(<CanvasArea onCanvasReady={mockCanvasReady} />);
    
    // Check that the image is displayed
    expect(screen.getByAltText('Uploaded image')).toBeInTheDocument();
    
    // Check that the canvas is displayed
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
    
    // Check that onCanvasReady was called with the mock canvas
    expect(mockCanvasReady).toHaveBeenCalledWith({ id: 'mock-canvas' });
  });
});