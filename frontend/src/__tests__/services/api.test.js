import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { 
  uploadImage, 
  uploadMultipleImages,
  getAllImages,
  getAllMasks,
  checkImageHasMask
} from '../../services/api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
    })),
  },
}));

describe('API Service', () => {
  let mockAxiosInstance;
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get the axios instance created in the api.js module
    mockAxiosInstance = axios.create();
  });
  
  test('uploadImage sends correct data and returns response', async () => {
    // Setup mock response
    const mockResponse = { data: { id: '123', image_url: 'http://example.com/test.jpg' } };
    mockAxiosInstance.post.mockResolvedValue(mockResponse);
    
    // Mock file
    const mockFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    
    // Call the function
    const result = await uploadImage(mockFile);
    
    // Assertions
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/images/upload/',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'multipart/form-data',
        }),
      })
    );
    expect(result).toEqual(mockResponse.data);
  });
  
  test('uploadMultipleImages processes multiple files', async () => {
    // Setup mock responses
    const mockResponses = [
      { data: { id: '1', image_url: 'http://example.com/image1.jpg' } },
      { data: { id: '2', image_url: 'http://example.com/image2.jpg' } },
    ];
    
    // Mock the post method to return responses for each call
    mockAxiosInstance.post
      .mockResolvedValueOnce(mockResponses[0])
      .mockResolvedValueOnce(mockResponses[1]);
    
    // Mock files
    const mockFiles = [
      new File(['dummy content 1'], 'image1.jpg', { type: 'image/jpeg' }),
      new File(['dummy content 2'], 'image2.jpg', { type: 'image/jpeg' }),
    ];
    
    // Call the function
    const result = await uploadMultipleImages(mockFiles);
    
    // Assertions
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    expect(result.successful).toEqual([
      mockResponses[0].data,
      mockResponses[1].data,
    ]);
    expect(result.totalSuccessful).toBe(2);
    expect(result.totalFailed).toBe(0);
  });
  
  test('uploadMultipleImages handles failed uploads', async () => {
    // Setup mock response and rejection
    const mockResponse = { data: { id: '1', image_url: 'http://example.com/image1.jpg' } };
    mockAxiosInstance.post
      .mockResolvedValueOnce(mockResponse)
      .mockRejectedValueOnce(new Error('Upload failed'));
    
    // Mock files
    const mockFiles = [
      new File(['dummy content 1'], 'image1.jpg', { type: 'image/jpeg' }),
      new File(['dummy content 2'], 'image2.jpg', { type: 'image/jpeg' }),
    ];
    
    // Call the function
    const result = await uploadMultipleImages(mockFiles);
    
    // Assertions
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    expect(result.successful).toEqual([mockResponse.data]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].fileName).toBe('image2.jpg');
    expect(result.totalSuccessful).toBe(1);
    expect(result.totalFailed).toBe(1);
  });
  
  test('getAllImages fetches all images', async () => {
    // Setup mock response
    const mockResponse = {
      data: [
        { id: '1', original_filename: 'image1.jpg', width: 1920, height: 1080 },
        { id: '2', original_filename: 'image2.jpg', width: 1024, height: 768 },
      ]
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Call the function
    const result = await getAllImages();
    
    // Assertions
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/images/');
    expect(result).toEqual(mockResponse.data);
  });
  
  test('getAllMasks fetches all masks', async () => {
    // Setup mock response
    const mockResponse = {
      data: [
        { id: '1', image: '1', file: '/media/masks/mask1.png' },
        { id: '2', image: '2', file: '/media/masks/mask2.png' },
      ]
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Call the function
    const result = await getAllMasks();
    
    // Assertions
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/masks/');
    expect(result).toEqual(mockResponse.data);
  });
  
  test('checkImageHasMask checks if image has mask', async () => {
    // Setup mock response
    const mockResponse = {
      data: { hasMask: true }
    };
    mockAxiosInstance.get.mockResolvedValue(mockResponse);
    
    // Call the function
    const result = await checkImageHasMask('image1.jpg');
    
    // Assertions
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/masks/check/image1.jpg/');
    expect(result).toBe(true);
  });
  
  test('checkImageHasMask handles errors gracefully', async () => {
    // Setup mock rejection
    mockAxiosInstance.get.mockRejectedValue(new Error('Server error'));
    
    // Call the function
    const result = await checkImageHasMask('image1.jpg');
    
    // Should return false on error
    expect(result).toBe(false);
  });
});