import { vi } from 'vitest';
import {
  loadImage,
  fileToDataURL,
  calculateScaleFactor,
  canvasToBinaryMask
} from '../../utils/imageProcessing';

describe('imageProcessing utilities', () => {
  describe('loadImage', () => {
    beforeEach(() => {
      // Mock Image constructor
      global.Image = class {
        constructor() {
          setTimeout(() => {
            this.onload();
          }, 0);
        }
      };
    });

    test('loads an image from a URL', async () => {
      const src = 'test-image.jpg';
      const image = await loadImage(src);
      
      expect(image).toBeDefined();
      expect(image.src).toContain(src);
    });

    test('handles image load error', async () => {
      // Mock Image with error
      global.Image = class {
        constructor() {
          setTimeout(() => {
            this.onerror(new Error('Failed to load image'));
          }, 0);
        }
      };
      
      await expect(loadImage('test-image.jpg')).rejects.toThrow();
    });
  });

  describe('fileToDataURL', () => {
    beforeEach(() => {
      // Mock FileReader
      global.FileReader = class MockFileReader {
        constructor() {
          this.result = null;
          this.onload = null;
          this.onerror = null;
        }
        
        readAsDataURL(file) {
          // Simulate async behavior but in a more controlled way
          Promise.resolve().then(() => {
            this.result = 'data:image/jpeg;base64,mockbase64data';
            if (this.onload) {
              this.onload({ target: this });
            }
          });
        }
      };
    });

    test('converts a File to a data URL', async () => {
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const dataURL = await fileToDataURL(file);
      
      expect(dataURL).toBe('data:image/jpeg;base64,mockbase64data');
    });

    test('handles FileReader error', async () => {
      // Mock FileReader with error
      global.FileReader = function() {
        this.readAsDataURL = vi.fn(() => {
          setTimeout(() => {
            this.onerror(new Error('Failed to read file'));
          }, 0);
        });
      };
      
      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      await expect(fileToDataURL(file)).rejects.toThrow();
    });
  });

  describe('calculateScaleFactor', () => {
    test('calculates correct scale factor when width is limiting', () => {
      const imageWidth = 1920;
      const imageHeight = 1080;
      const containerWidth = 800;
      const containerHeight = 600;
      
      const scaleFactor = calculateScaleFactor(imageWidth, imageHeight, containerWidth, containerHeight);
      
      // Width ratio is 800/1920 = 0.4166...
      // Height ratio is 600/1080 = 0.5555...
      // Should use the smaller ratio (width)
      expect(scaleFactor).toBeCloseTo(0.4166, 2);
    });

    test('calculates correct scale factor when height is limiting', () => {
      const imageWidth = 800;
      const imageHeight = 1200;
      const containerWidth = 600;
      const containerHeight = 400;
      
      const scaleFactor = calculateScaleFactor(imageWidth, imageHeight, containerWidth, containerHeight);
      
      // Width ratio is 600/800 = 0.75
      // Height ratio is 400/1200 = 0.3333...
      // Should use the smaller ratio (height)
      expect(scaleFactor).toBeCloseTo(0.3333, 2);
    });

    test('returns 1 when image is smaller than container', () => {
      const imageWidth = 400;
      const imageHeight = 300;
      const containerWidth = 800;
      const containerHeight = 600;
      
      const scaleFactor = calculateScaleFactor(imageWidth, imageHeight, containerWidth, containerHeight);
      
      // Both ratios are > 1, so should return 1
      expect(scaleFactor).toBe(1);
    });
  });

  describe('canvasToBinaryMask', () => {
    let originalCreateElement;
    
    beforeEach(() => {
      // Save original createElement
      originalCreateElement = document.createElement;
      
      // Create a mock canvas element that will be returned by document.createElement
      const mockOutputContext = {
        fillStyle: '',
        fillRect: vi.fn(),
        createImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(16), // 4 pixels * 4 channels
          width: 4,
          height: 4
        })),
        putImageData: vi.fn()
      };
      
      const mockOutputCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockOutputContext),
        toDataURL: vi.fn(() => 'data:image/png;base64,mockbase64data')
      };
      
      // Mock document.createElement
      document.createElement = vi.fn(tag => {
        if (tag === 'canvas') {
          return mockOutputCanvas;
        }
        return originalCreateElement.call(document, tag);
      });
    });
    
    afterEach(() => {
      // Restore original createElement
      document.createElement = originalCreateElement;
    });
    
    test('converts canvas drawing to binary mask', () => {
      // Mock input canvas and context
      const mockInputContext = {
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray([
            0, 0, 0, 0,    // Transparent pixel
            0, 0, 0, 100,  // Semi-transparent pixel
            0, 0, 0, 200,  // Nearly opaque pixel
            0, 0, 0, 255   // Fully opaque pixel
          ]),
          width: 2,
          height: 2
        }))
      };
      
      const mockInputCanvas = {
        getContext: vi.fn(() => mockInputContext),
        width: 2,
        height: 2
      };
      
      const originalWidth = 4;
      const originalHeight = 4;
      
      const result = canvasToBinaryMask(mockInputCanvas, originalWidth, originalHeight);
      
      // Check that the result is what we expect
      expect(result).toBe('data:image/png;base64,mockbase64data');
    });
  });
});