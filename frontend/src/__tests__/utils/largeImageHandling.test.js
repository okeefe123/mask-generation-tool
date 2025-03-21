import { vi } from 'vitest';
import { calculateScaleFactor } from '../../utils/imageProcessing';

describe('Large Image Handling', () => {
  test('calculates correct scale factor for large images', () => {
    // Test with a large image size (e.g., 8K resolution)
    const largeWidth = 7680;
    const largeHeight = 4320;
    const containerWidth = 1280;
    const containerHeight = 720;
    
    const scaleFactor = calculateScaleFactor(largeWidth, largeHeight, containerWidth, containerHeight);
    
    // Check that the scale factor is calculated correctly
    expect(scaleFactor).toBeCloseTo(0.1667, 2); // 1280/7680 = 0.1667
  });
  
  // No performance or memory tests - those are better tested in a real browser environment
});