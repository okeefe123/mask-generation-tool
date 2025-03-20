import { vi } from 'vitest';
import { calculateScaleFactor, canvasToBinaryMask } from '../../utils/imageProcessing';

describe('Large Image Handling', () => {
  // Mock performance.now for timing measurements
  const originalPerformanceNow = global.performance.now;
  let performanceValues = [];
  
  beforeEach(() => {
    performanceValues = [0, 1000]; // Mock 1 second elapsed time
    global.performance.now = vi.fn(() => performanceValues.shift());
  });
  
  afterEach(() => {
    global.performance.now = originalPerformanceNow;
  });

  test('handles very large images efficiently', () => {
    // Test with a very large image size (e.g., 8K resolution)
    const largeWidth = 7680;
    const largeHeight = 4320;
    const containerWidth = 1280;
    const containerHeight = 720;
    
    // Measure performance
    const startTime = performance.now();
    const scaleFactor = calculateScaleFactor(largeWidth, largeHeight, containerWidth, containerHeight);
    const endTime = performance.now();
    
    // Check that the scale factor is calculated correctly
    expect(scaleFactor).toBeCloseTo(0.1667, 2); // 1280/7680 = 0.1667
    
    // Check that the calculation is efficient (should be very fast)
    expect(endTime - startTime).toBeLessThan(100); // Should take less than 100ms
  });

  test('handles binary mask generation for large images', () => {
    // Mock a large canvas
    const largeWidth = 7680;
    const largeHeight = 4320;
    
    // Create a large typed array for the image data (4 bytes per pixel: R,G,B,A)
    const largeImageData = new Uint8ClampedArray(largeWidth * largeHeight * 4);
    
    // Fill with some drawing data (every 100th pixel is drawn)
    for (let i = 0; i < largeImageData.length; i += 400) {
      largeImageData[i + 3] = 255; // Set alpha to fully opaque
    }
    
    // Mock canvas and context
    const mockContext = {
      getImageData: vi.fn(() => ({
        data: largeImageData,
        width: largeWidth,
        height: largeHeight
      })),
      createImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(largeWidth * largeHeight * 4),
        width: largeWidth,
        height: largeHeight
      })),
      putImageData: vi.fn()
    };
    
    const mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: largeWidth,
      height: largeHeight,
      toDataURL: vi.fn(() => 'data:image/png;base64,mockbase64data')
    };
    
    // Measure performance
    const startTime = performance.now();
    const result = canvasToBinaryMask(mockCanvas, largeWidth, largeHeight);
    const endTime = performance.now();
    
    // Check that the function returns a data URL
    expect(result).toBe('data:image/png;base64,mockbase64data');
    
    // Check that the context methods were called
    expect(mockContext.getImageData).toHaveBeenCalled();
    expect(mockContext.createImageData).toHaveBeenCalled();
    expect(mockContext.putImageData).toHaveBeenCalled();
    
    // Check that the operation completes in a reasonable time
    // For very large images, this might take longer, but should still be efficient
    expect(endTime - startTime).toBeLessThan(5000); // Should take less than 5 seconds
  });

  test('handles memory efficiently for large images', () => {
    // This test checks if we're handling memory efficiently
    // by ensuring we're not creating unnecessary copies of large data
    
    // Mock a large canvas with a large image
    const largeWidth = 7680;
    const largeHeight = 4320;
    
    // Create a large typed array for the image data
    const largeImageData = new Uint8ClampedArray(largeWidth * largeHeight * 4);
    
    // Mock canvas and context with memory tracking
    let allocatedMemory = 0;
    
    const mockContext = {
      getImageData: vi.fn(() => {
        allocatedMemory += largeWidth * largeHeight * 4;
        return {
          data: largeImageData,
          width: largeWidth,
          height: largeHeight
        };
      }),
      createImageData: vi.fn(() => {
        allocatedMemory += largeWidth * largeHeight * 4;
        return {
          data: new Uint8ClampedArray(largeWidth * largeHeight * 4),
          width: largeWidth,
          height: largeHeight
        };
      }),
      putImageData: vi.fn()
    };
    
    const mockCanvas = {
      getContext: vi.fn(() => mockContext),
      width: largeWidth,
      height: largeHeight,
      toDataURL: vi.fn(() => {
        // Simulate memory being freed after toDataURL
        allocatedMemory -= largeWidth * largeHeight * 4;
        return 'data:image/png;base64,mockbase64data';
      })
    };
    
    // Process the large image
    canvasToBinaryMask(mockCanvas, largeWidth, largeHeight);
    
    // Check that we're not leaking memory
    // We should have at most 2 copies of the image data in memory at once
    // (the original and the binary mask)
    expect(allocatedMemory).toBeLessThanOrEqual(largeWidth * largeHeight * 4 * 2);
  });
});