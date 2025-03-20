import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ImageEditor from '../../components/ImageEditor';
import { useAppContext, useUIContext } from '../../contexts/AppContexts';

// Mock the contexts
vi.mock('../../contexts/AppContexts', () => ({
  useAppContext: vi.fn(),
  useUIContext: vi.fn(),
}));

// Mock the DrawingCanvas component
vi.mock('../../components/DrawingCanvas', () => ({
  default: vi.fn(({ onCanvasReady }) => {
    // Call onCanvasReady with a mock canvas element
    if (onCanvasReady) {
      onCanvasReady({
        tagName: 'CANVAS',
        getContext: vi.fn(),
      });
    }
    return <div data-testid="mock-drawing-canvas" />;
  }),
}));

// Mock the Toolbar component
vi.mock('../../components/Toolbar', () => ({
  default: vi.fn(() => <div data-testid="mock-toolbar" />),
}));

describe('ImageEditor Component', () => {
  // Mock context values
  const mockAppContextValues = {
    displayImage: 'test-image.jpg',
    originalDimensions: { width: 1920, height: 1080 },
    calculateScaleFactor: vi.fn(),
  };

  const mockUIContextValues = {
    isLoading: false,
    error: null,
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context values
    useAppContext.mockReturnValue(mockAppContextValues);
    useUIContext.mockReturnValue(mockUIContextValues);
  });

  test('renders loading spinner when isLoading is true', () => {
    // Set isLoading to true
    useUIContext.mockReturnValue({
      ...mockUIContextValues,
      isLoading: true,
    });
    
    render(<ImageEditor />);
    
    // Check that spinner is rendered
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders error message when error is present', () => {
    // Set error
    useUIContext.mockReturnValue({
      ...mockUIContextValues,
      error: 'Test error message',
    });
    
    render(<ImageEditor />);
    
    // Check that error message is rendered
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('renders image and canvas when displayImage is available', () => {
    render(<ImageEditor />);
    
    // Check that image is rendered
    expect(screen.getByAltText('Uploaded image')).toBeInTheDocument();
    
    // Check that DrawingCanvas is rendered
    expect(screen.getByTestId('mock-drawing-canvas')).toBeInTheDocument();
    
    // Check that Toolbar is rendered
    expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument();
  });

  test('renders placeholder when no image is available', () => {
    // Set displayImage to null
    useAppContext.mockReturnValue({
      ...mockAppContextValues,
      displayImage: null,
    });
    
    render(<ImageEditor />);
    
    // Check that placeholder is rendered
    expect(screen.getByText('Upload an image to start editing')).toBeInTheDocument();
  });

  test('calculates scale factor when image and container dimensions change', () => {
    const calculateScaleFactorMock = vi.fn();
    
    // Set calculateScaleFactor mock
    useAppContext.mockReturnValue({
      ...mockAppContextValues,
      calculateScaleFactor: calculateScaleFactorMock,
    });
    
    render(<ImageEditor />);
    
    // Trigger window resize
    global.dispatchEvent(new Event('resize'));
    
    // Check that calculateScaleFactor was called
    expect(calculateScaleFactorMock).toHaveBeenCalled();
  });
});