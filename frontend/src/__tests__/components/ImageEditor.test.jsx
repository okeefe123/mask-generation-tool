import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ImageEditor from '../../components/ImageEditor';
import { useImageContext } from '../../contexts/ImageContext';

// Mock the ImageContext
vi.mock('../../contexts/ImageContext', () => ({
  useImageContext: vi.fn(),
}));

// Mock the DrawingCanvas component
vi.mock('../../components/DrawingCanvas', () => ({
  default: vi.fn(() => <div data-testid="drawing-canvas" />),
}));

// Mock the Toolbar component
vi.mock('../../components/Toolbar', () => ({
  default: vi.fn(() => <div data-testid="toolbar" />),
}));

describe('ImageEditor Component', () => {
  // Default context values
  const defaultContextValues = {
    displayImage: 'test-image.jpg',
    originalDimensions: { width: 1920, height: 1080 },
    calculateScaleFactor: vi.fn(),
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context
    useImageContext.mockReturnValue(defaultContextValues);
  });

  test('renders loading spinner when isLoading is true', () => {
    // Set loading state to true
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      isLoading: true,
    });
    
    render(<ImageEditor />);
    
    // Check that the spinner is rendered
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders error message when error is present', () => {
    // Set error state
    const errorMessage = 'Failed to load image';
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      error: errorMessage,
    });
    
    render(<ImageEditor />);
    
    // Check that the error message is rendered
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('renders placeholder when no image is displayed', () => {
    // Set displayImage to null
    useImageContext.mockReturnValue({
      ...defaultContextValues,
      displayImage: null,
    });
    
    render(<ImageEditor />);
    
    // Check that the placeholder is rendered
    expect(screen.getByText(/Upload an image to start editing/i)).toBeInTheDocument();
  });

  test('renders image, canvas, and toolbar when image is displayed', () => {
    render(<ImageEditor />);
    
    // Check that the image is rendered
    const image = screen.getByAltText('Uploaded image');
    expect(image).toBeInTheDocument();
    expect(image.src).toContain('test-image.jpg');
    
    // Check that the canvas and toolbar are rendered
    expect(screen.getByTestId('drawing-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
  });

  test('calculates scale factor when image or container size changes', () => {
    render(<ImageEditor />);
    
    // Check that calculateScaleFactor was called
    expect(defaultContextValues.calculateScaleFactor).toHaveBeenCalled();
    
    // Simulate window resize
    global.dispatchEvent(new Event('resize'));
    
    // Check that calculateScaleFactor was called again
    expect(defaultContextValues.calculateScaleFactor).toHaveBeenCalledTimes(2);
  });

  test('applies proper styling to the image container', () => {
    render(<ImageEditor />);
    
    // Check that the container has the correct styling
    const container = screen.getByRole('img', { name: 'Uploaded image' }).parentElement.parentElement;
    expect(container).toHaveStyle({
      position: 'relative',
      width: '100%',
      height: '70vh',
    });
  });
});