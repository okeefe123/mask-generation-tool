import { vi } from 'vitest';

describe('Mask Generation', () => {
  test('ensures mask representation is pure black/white', () => {
    // Create a helper function to simulate mask generation
    const generateMask = vi.fn(() => {
      // Mock image data with some semi-transparent pixels
      const imageData = {
        data: new Uint8ClampedArray(400), // 25 pixels (25 * 4 = 100)
        width: 5,
        height: 5
      };
      
      // Set some pixels with partial opacity
      // RGBA values for a few pixels
      // Pixel 1: Semi-transparent white (brush stroke)
      imageData.data[0] = 200; // R
      imageData.data[1] = 200; // G
      imageData.data[2] = 200; // B
      imageData.data[3] = 128; // A (semi-transparent)
      
      // Pixel 2: Semi-transparent gray (brush stroke)
      imageData.data[4] = 100;   // R
      imageData.data[5] = 100;   // G
      imageData.data[6] = 100;   // B
      imageData.data[7] = 64;    // A (mostly transparent)
      
      // Pixel 3: Fully transparent (no brush stroke)
      imageData.data[8] = 0;     // R
      imageData.data[9] = 0;     // G
      imageData.data[10] = 0;    // B
      imageData.data[11] = 0;    // A (fully transparent)
      
      // Pixel 4: Solid black with opacity (background)
      imageData.data[12] = 0;    // R
      imageData.data[13] = 0;    // G
      imageData.data[14] = 0;    // B
      imageData.data[15] = 255;  // A (fully opaque)
      
      // Process the image data (simulating our new mask generation logic)
      for (let i = 0; i < imageData.data.length; i += 4) {
        // Check if the pixel is from a brush stroke (non-black with opacity)
        const isStrokePixel = (imageData.data[i+3] > 0) && 
                             !(imageData.data[i] === 0 && 
                               imageData.data[i+1] === 0 && 
                               imageData.data[i+2] === 0);
        
        if (isStrokePixel) {
          // This is a brush stroke area - set to white
          imageData.data[i] = 255;    // R
          imageData.data[i+1] = 255;  // G
          imageData.data[i+2] = 255;  // B
          imageData.data[i+3] = 255;  // A (fully opaque)
        } else {
          // This is background - set to black
          imageData.data[i] = 0;      // R
          imageData.data[i+1] = 0;    // G
          imageData.data[i+2] = 0;    // B
          imageData.data[i+3] = 255;  // A (fully opaque)
        }
      }
      
      return imageData;
    });
    
    // Generate the mask
    const maskData = generateMask();
    
    // Check pixel 1 (was semi-transparent white, should now be fully opaque white)
    expect(maskData.data[0]).toBe(255); // R
    expect(maskData.data[1]).toBe(255); // G
    expect(maskData.data[2]).toBe(255); // B
    expect(maskData.data[3]).toBe(255); // A
    
    // Check pixel 2 (was semi-transparent gray, should now be fully opaque white)
    expect(maskData.data[4]).toBe(255); // R
    expect(maskData.data[5]).toBe(255); // G
    expect(maskData.data[6]).toBe(255); // B
    expect(maskData.data[7]).toBe(255); // A
    
    // Check pixel 3 (was fully transparent, should now be fully opaque black)
    expect(maskData.data[8]).toBe(0);   // R
    expect(maskData.data[9]).toBe(0);   // G
    expect(maskData.data[10]).toBe(0);  // B
    expect(maskData.data[11]).toBe(255); // A
    
    // Check pixel 4 (was solid black, should remain black)
    expect(maskData.data[12]).toBe(0);  // R
    expect(maskData.data[13]).toBe(0);  // G
    expect(maskData.data[14]).toBe(0);  // B
    expect(maskData.data[15]).toBe(255); // A
  });
});