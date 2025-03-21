import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ImageUploader from '../../components/ImageUploader';
import { useUIContext } from '../../contexts/AppContexts';
import { useImageContext } from '../../contexts/ImageContext';
import { uploadImage, uploadMultipleImages, getAllImages, getAllMasks, checkImageHasMask } from '../../services/api';
import { fileToDataURL } from '../../utils/imageProcessing';

// Define mocks before using them
const mockToast = vi.fn();
const mockOnOpen = vi.fn();
const mockOnClose = vi.fn();

// Mock the contexts
vi.mock('../../contexts/AppContexts', () => ({
  useUIContext: vi.fn(),
}));

vi.mock('../../contexts/ImageContext', () => ({
  useImageContext: vi.fn(),
}));

// Mock the API service
vi.mock('../../services/api', () => ({
  uploadImage: vi.fn(),
  uploadMultipleImages: vi.fn(),
  getAllImages: vi.fn(),
  getAllMasks: vi.fn(),
  checkImageHasMask: vi.fn(),
}));

// Mock the image processing utility
vi.mock('../../utils/imageProcessing', () => ({
  fileToDataURL: vi.fn(),
}));

// Mock Chakra UI components
vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mockToast,
    useDisclosure: () => ({
      isOpen: false,
      onOpen: mockOnOpen,
      onClose: mockOnClose,
    }),
  };
});

describe('ImageUploader Component', () => {
  // Mock image context values
  const mockImageContextValues = {
    setOriginalImage: vi.fn(),
    setDisplayImage: vi.fn(),
    setImageId: vi.fn(),
    setOriginalFileName: vi.fn(),
    setOriginalDimensions: vi.fn(),
    availableImages: [
      { id: '1', original_filename: 'image1.jpg', width: 1920, height: 1080, file: 'http://example.com/image1.jpg' },
      { id: '2', original_filename: 'image2.jpg', width: 1024, height: 768, file: 'http://example.com/image2.jpg' }
    ],
    selectedImageIndex: 0,
    selectImageByIndex: vi.fn(),
    fetchAvailableImages: vi.fn(),
    isLoadingImages: false,
    imagesWithMasks: ['mask1'],
    selectImage: vi.fn(),
  };

  const mockUIContextValues = {
    isLoading: false,
    setIsLoading: vi.fn(),
    setError: vi.fn(),
  };

  // Mock files
  const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
  const mockMpoFile = new File(['dummy mpo content'], 'test.mpo', { type: 'image/mpo' });
  const mockMultipleFiles = [
    new File(['dummy content 1'], 'image1.jpg', { type: 'image/jpeg' }),
    new File(['dummy content 2'], 'image2.jpg', { type: 'image/jpeg' }),
    new File(['dummy mpo content'], 'image3.mpo', { type: 'image/mpo' }),
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default context values
    useImageContext.mockReturnValue(mockImageContextValues);
    useUIContext.mockReturnValue(mockUIContextValues);
    
    // Mock successful dataURL conversion
    fileToDataURL.mockResolvedValue('data:image/jpeg;base64,abc123');
    
    // Mock successful API responses
    uploadImage.mockResolvedValue({
      id: '123',
      image_url: 'http://example.com/test.jpg',
    });
    
    uploadMultipleImages.mockResolvedValue({
      successful: [
        { id: '1', image_url: 'http://example.com/image1.jpg' },
        { id: '2', image_url: 'http://example.com/image2.jpg' },
      ],
      failed: [],
      totalSuccessful: 2,
      totalFailed: 0
    });
    
    getAllImages.mockResolvedValue([
      { id: '1', original_filename: 'image1.jpg', width: 1920, height: 1080, file: 'http://example.com/image1.jpg' },
      { id: '2', original_filename: 'image2.jpg', width: 1024, height: 768, file: 'http://example.com/image2.jpg' }
    ]);
    
    getAllMasks.mockResolvedValue([
      { id: '1', file: '/media/masks/mask1.png', image: '3' }
    ]);
    
    checkImageHasMask.mockResolvedValue(false);
    
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

  test('renders upload form with file and folder inputs', () => {
    render(<ImageUploader />);
    
    // Check that form elements are rendered
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Upload Folder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload File' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload Folder' })).toBeInTheDocument();
    expect(screen.getByText('Supported formats: JPEG, MPO (first layer will be extracted)')).toBeInTheDocument();
    expect(screen.getByText('Select Image to Annotate')).toBeInTheDocument();
  });

  test('fetches available images on mount', () => {
    render(<ImageUploader />);
    
    // Check that fetchAvailableImages was called
    expect(mockImageContextValues.fetchAvailableImages).toHaveBeenCalled();
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
    expect(mockImageContextValues.setOriginalFileName).toHaveBeenCalledWith('test.jpg');
  });

  test('handles MPO file selection', () => {
    render(<ImageUploader />);
    
    // Get file input
    const fileInput = screen.getByLabelText('Upload Image');
    
    // Simulate MPO file selection
    fireEvent.change(fileInput, { target: { files: [mockMpoFile] } });
    
    // Check that file name is displayed (MPO is a valid extension)
    expect(screen.getByText(/Selected: test.mpo/)).toBeInTheDocument();
    
    // Check that setOriginalFileName was called
    expect(mockImageContextValues.setOriginalFileName).toHaveBeenCalledWith('test.mpo');
  });

  test('validates file type', () => {
    render(<ImageUploader />);
    
    // Create invalid file (PNG instead of JPEG/MPO)
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

  test('handles directory selection', () => {
    render(<ImageUploader />);
    
    // Get directory input
    const directoryInput = screen.getByLabelText('Upload Folder');
    
    // Simulate directory selection
    fireEvent.change(directoryInput, { target: { files: mockMultipleFiles } });
    
    // Check that directory selection message is displayed
    expect(screen.getByText(/Selected Folder: 3 images found/)).toBeInTheDocument();
    
    // Check that info toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Folder selected',
      status: 'info',
    }));
  });

  test('uploads single file successfully', async () => {
    render(<ImageUploader />);
    
    // Get file input and upload button
    const fileInput = screen.getByLabelText('Upload Image');
    const uploadButton = screen.getByRole('button', { name: 'Upload File' });
    
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
    expect(mockImageContextValues.setOriginalDimensions).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
    });
    
    // Check that display image was set
    expect(mockImageContextValues.setDisplayImage).toHaveBeenCalledWith('data:image/jpeg;base64,abc123');
    
    // Check that API was called
    expect(uploadImage).toHaveBeenCalledWith(mockFile);
    
    // Check that context was updated with API response
    expect(mockImageContextValues.setOriginalImage).toHaveBeenCalledWith('http://example.com/test.jpg');
    expect(mockImageContextValues.setImageId).toHaveBeenCalledWith('123');
    
    // Check that fetchAvailableImages was called to refresh the list
    expect(mockImageContextValues.fetchAvailableImages).toHaveBeenCalled();
    
    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Upload successful',
      status: 'success',
    }));
    
    // Check that loading state was reset
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(false);
  });

  test('uploads multiple files successfully', async () => {
    render(<ImageUploader />);
    
    // Get directory input and upload button
    const directoryInput = screen.getByLabelText('Upload Folder');
    const uploadFolderButton = screen.getByRole('button', { name: 'Upload Folder' });
    
    // Simulate directory selection
    fireEvent.change(directoryInput, { target: { files: mockMultipleFiles } });
    
    // Click upload button
    await act(async () => {
      fireEvent.click(uploadFolderButton);
    });
    
    // Check that loading state was set
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(true);
    
    // Check that API was called with the files
    expect(uploadMultipleImages).toHaveBeenCalledWith(mockMultipleFiles);
    
    // Check that modal was opened
    expect(mockOnOpen).toHaveBeenCalled();
    
    // Check that fetchAvailableImages was called to refresh the list
    expect(mockImageContextValues.fetchAvailableImages).toHaveBeenCalled();
    
    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Batch upload completed',
      status: 'success',
    }));
    
    // Check that loading state was reset
    expect(mockUIContextValues.setIsLoading).toHaveBeenCalledWith(false);
  });

  test('handles image selection from dropdown', () => {
    render(<ImageUploader />);
    
    // Get image select dropdown
    const selectDropdown = screen.getByRole('combobox');
    
    // Select the second image
    fireEvent.change(selectDropdown, { target: { value: '1' } });
    
    // Check that selectImageByIndex was called with the correct index
    expect(mockImageContextValues.selectImageByIndex).toHaveBeenCalledWith(1);
  });

  test('displays available images in dropdown', async () => {
    render(<ImageUploader />);
    
    // Check that images are in the dropdown
    const options = screen.getAllByRole('option');
    
    // Two available images
    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('image1.jpg');
    expect(options[1].textContent).toContain('image2.jpg');
  });

  test('handles upload error', async () => {
    // Mock API error
    uploadImage.mockRejectedValue(new Error('Server error'));
    
    render(<ImageUploader />);
    
    // Get file input and upload button
    const fileInput = screen.getByLabelText('Upload Image');
    const uploadButton = screen.getByRole('button', { name: 'Upload File' });
    
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

  test('handles multiple uploads error', async () => {
    // Mock API error
    uploadMultipleImages.mockRejectedValue(new Error('Batch error'));
    
    render(<ImageUploader />);
    
    // Get directory input and upload button
    const directoryInput = screen.getByLabelText('Upload Folder');
    const uploadFolderButton = screen.getByRole('button', { name: 'Upload Folder' });
    
    // Simulate directory selection
    fireEvent.change(directoryInput, { target: { files: mockMultipleFiles } });
    
    // Click upload button
    await act(async () => {
      fireEvent.click(uploadFolderButton);
    });
    
    // Check that error was set
    expect(mockUIContextValues.setError).toHaveBeenCalledWith('Failed to upload batch of images.');
    
    // Check that error toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Batch upload failed',
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
    const uploadButton = screen.getByRole('button', { name: 'Upload File' });
    
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

  test('displays message when no images are available', () => {
    // Mock empty available images
    useImageContext.mockReturnValue({
      ...mockImageContextValues,
      availableImages: [],
      isLoadingImages: false
    });
    
    render(<ImageUploader />);
    
    // Check for no images message
    expect(screen.getByText(/No images available for annotation/)).toBeInTheDocument();
  });

  test('shows loading badge when fetching images', () => {
    // Mock loading state
    useImageContext.mockReturnValue({
      ...mockImageContextValues,
      isLoadingImages: true
    });
    
    render(<ImageUploader />);
    
    // Check for loading badge
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});