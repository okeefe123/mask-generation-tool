import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ImageUploader from '../../components/ImageUploader';
import { useImageContext } from '../../contexts/ImageContext';
import { uploadImage } from '../../services/api';

// Mock the ImageContext
vi.mock('../../contexts/ImageContext', () => ({
  useImageContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  uploadImage: vi.fn(),
}));

describe('ImageUploader Component', () => {
  // Default context values
  const mockContextValues = {
    setOriginalImage: vi.fn(),
    setDisplayImage: vi.fn(),
    setOriginalDimensions: vi.fn(),
    setIsLoading: vi.fn(),
    setError: vi.fn(),
  };

  // Mock file
  const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    const file = new File(['dummy content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context
    useImageContext.mockReturnValue(mockContextValues);
    
    // Mock FileReader
    global.FileReader = function() {
      this.readAsDataURL = vi.fn(() => {
        this.onload({ target: { result: 'data:image/jpeg;base64,mockbase64data' } });
      });
    };
    
    // Mock Image
    global.Image = class {
      constructor() {
        setTimeout(() => {
          this.width = 1920;
          this.height = 1080;
          this.onload();
        }, 0);
      }
    };
    
    // Mock successful upload
    uploadImage.mockResolvedValue({ image_url: 'http://example.com/images/test.jpg' });
  });

  test('renders upload form correctly', () => {
    render(<ImageUploader />);
    
    // Check that the form elements are rendered
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload Image/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats: JPEG/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload/i })).toBeInTheDocument();
  });

  test('handles file selection', async () => {
    render(<ImageUploader />);
    
    const fileInput = screen.getByLabelText(/Upload Image/i);
    const mockFile = createMockFile();
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Check that the file info is displayed
    await waitFor(() => {
      expect(screen.getByText(/Selected: test.jpg/i)).toBeInTheDocument();
    });
  });

  test('validates file type', async () => {
    // Mock toast
    const mockToast = vi.fn();
    vi.mock('@chakra-ui/react', async () => {
      const actual = await vi.importActual('@chakra-ui/react');
      return {
        ...actual,
        useToast: () => mockToast,
      };
    });
    
    render(<ImageUploader />);
    
    const fileInput = screen.getByLabelText(/Upload Image/i);
    const invalidFile = createMockFile('test.png', 'image/png');
    
    // Simulate invalid file selection
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    // Check that error toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Invalid file type',
        })
      );
    });
  });

  test('handles file upload', async () => {
    render(<ImageUploader />);
    
    const fileInput = screen.getByLabelText(/Upload Image/i);
    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    const mockFile = createMockFile();
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Simulate upload button click
    fireEvent.click(uploadButton);
    
    // Check that loading state was set
    expect(mockContextValues.setIsLoading).toHaveBeenCalledWith(true);
    
    // Check that the API was called
    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith(mockFile);
    });
    
    // Check that the context was updated
    await waitFor(() => {
      expect(mockContextValues.setOriginalImage).toHaveBeenCalledWith('http://example.com/images/test.jpg');
      expect(mockContextValues.setDisplayImage).toHaveBeenCalled();
      expect(mockContextValues.setOriginalDimensions).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
      });
      expect(mockContextValues.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  test('handles upload error', async () => {
    // Mock API error
    uploadImage.mockRejectedValue(new Error('Upload failed'));
    
    render(<ImageUploader />);
    
    const fileInput = screen.getByLabelText(/Upload Image/i);
    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    const mockFile = createMockFile();
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
    
    // Simulate upload button click
    fireEvent.click(uploadButton);
    
    // Check that error state was set
    await waitFor(() => {
      expect(mockContextValues.setError).toHaveBeenCalled();
      expect(mockContextValues.setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  test('disables upload button when no file is selected', () => {
    render(<ImageUploader />);
    
    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    
    // Check that the button is disabled
    expect(uploadButton).toBeDisabled();
  });
});