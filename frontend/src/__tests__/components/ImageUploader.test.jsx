import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import ImageUploader from '../../components/ImageUploader';
import { useAppContext, useUIContext } from '../../contexts/AppContexts';
import { uploadImage } from '../../services/api';
import { fileToDataURL } from '../../utils/imageProcessing';

// Mock the contexts
vi.mock('../../contexts/AppContexts', () => ({
  useAppContext: vi.fn(),
  useUIContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  uploadImage: vi.fn(),
}));

// Mock the image processing utility
vi.mock('../../utils/imageProcessing', () => ({
  fileToDataURL: vi.fn(),
}));

describe('ImageUploader Component', () => {
  // Mock context values
  const mockAppContextValues = {
    setOriginalImage: vi.fn(),
    setDisplayImage: vi.fn(),
    setImageId: vi.fn(),
    setOriginalFileName: vi.fn(),
    setOriginalDimensions: vi.fn(),
  };

  const mockUIContextValues = {
    setIsLoading: vi.fn(),
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

  // Mock file
  const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context values
    useAppContext.mockReturnValue(mockAppContextValues);
    useUIContext.mockReturnValue(mockUIContextValues);
    
    // Mock successful dataURL conversion
    fileToDataURL.mockResolvedValue('data:image/jpeg;base64,abc123');
    
    // Mock successful API response
    uploadImage.mockResolvedValue({
      id: '123',
      image_url: 'http://example.com/test.jpg',
    });
    
    // Mock Image constructor
    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onload();
        }, 0);
      }
      width = 1920;
      height = 1080;
    };
  });

  test('renders upload form', () => {
    render(<ImageUploader />);
    
    // Check that form elements are rendered
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeInTheDocument();
    expect(screen.getByText('Supported formats: JPEG')).toBeInTheDocument();
  });

  test('handles file selection', () => {
    render(<ImageUploader />);
    
    // Get file input
    const fileInput = screen.getByLabelText('Upload Image');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Check that file name is displayed
    expect(screen.getByText(/Selected: test.jpg/)).toBeInTheDocument();
    
    // Check that setOriginalFileName was called
    expect(mockAppContextValues.setOriginalFileName).toHaveBeenCalledWith('test.jpg');
  });

  test('validates file type', () => {
    render(<ImageUploader />);
    
    // Create invalid file (PNG instead of JPEG)
    const invalidFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    
    // Get file input
    const fileInput = screen.getByLabelText('Upload Image');
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Invalid file type',
      status: 'error',
    }));
  });

  test('uploads file successfully', async () => {
    render(<ImageUploader />);
    
    // Get file input and upload button
    const fileInput = screen.getByLabelText('Upload Image');
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Click upload button
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    // Check that loading state was set
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(true);
    
    // Check that image was processed
    expect(fileToDataURL).toHaveBeenCalledWith(mockFile);
    
    // Check that dimensions were set
    expect(mockAppContextValues.setOriginalDimensions).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
    });
    
    // Check that display image was set
    expect(mockAppContextValues.setDisplayImage).toHaveBeenCalledWith('data:image/jpeg;base64,abc123');
    
    // Check that API was called
    expect(uploadImage).toHaveBeenCalledWith(mockFile);
    
    // Check that context was updated with API response
    expect(mockAppContextValues.setOriginalImage).toHaveBeenCalledWith('http://example.com/test.jpg');
    expect(mockAppContextValues.setImageId).toHaveBeenCalledWith('123');
    
    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Upload successful',
      status: 'success',
    }));
    
    // Check that loading state was reset
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(false);
  });

  test('handles upload error', async () => {
    // Mock API error
    uploadImage.mockRejectedValue(new Error('Server error'));
    
    render(<ImageUploader />);
    
    // Get file input and upload button
    const fileInput = screen.getByLabelText('Upload Image');
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Click upload button
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    // Check that error was set
    expect(mockUIContextValues.setError).toHaveBeenCalledWith('Server error');
    
    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Upload failed',
      status: 'error',
    }));
  });

  test('handles image loading error', async () => {
    // Mock Image loading error
    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.onerror();
        }, 0);
      }
    };
    
    render(<ImageUploader />);
    
    // Get file input and upload button
    const fileInput = screen.getByLabelText('Upload Image');
    const uploadButton = screen.getByRole('button', { name: 'Upload' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Click upload button
    await act(async () => {
      fireEvent.click(uploadButton);
    });
    
    // Check that error was set
    expect(mockUIContextValues.setError).toHaveBeenCalledWith('Failed to load image preview.');
    
    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Preview failed',
      status: 'error',
    }));
  });
});