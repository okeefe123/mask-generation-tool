/**
 * Loads an image from a URL and returns a Promise that resolves with the Image object
 * @param {string} src - The image URL
 * @returns {Promise<HTMLImageElement>} - Promise resolving with the loaded image
 */
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Converts a File object to a data URL
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Promise resolving with the data URL
 */
export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Calculates the scale factor to fit an image within a container
 * @param {number} imageWidth - Original image width
 * @param {number} imageHeight - Original image height
 * @param {number} containerWidth - Container width
 * @param {number} containerHeight - Container height
 * @returns {number} - The calculated scale factor
 */
export const calculateScaleFactor = (imageWidth, imageHeight, containerWidth, containerHeight) => {
  const widthRatio = containerWidth / imageWidth;
  const heightRatio = containerHeight / imageHeight;
  
  // Use the smaller ratio to ensure the image fits within the container
  return Math.min(widthRatio, heightRatio, 1);
};

/**
 * Converts a canvas drawing to a binary mask
 * @param {HTMLCanvasElement} canvas - The canvas with the drawing
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @returns {string} - Data URL of the binary mask
 */
export const canvasToBinaryMask = (canvas, originalWidth, originalHeight) => {
  // Create a new canvas with the original image dimensions
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = originalWidth;
  outputCanvas.height = originalHeight;
  const outputCtx = outputCanvas.getContext('2d');
  
  // Draw the scaled canvas content to the output canvas
  outputCtx.fillStyle = 'black';
  outputCtx.fillRect(0, 0, originalWidth, originalHeight);
  
  // Get the drawing from the input canvas
  const inputCtx = canvas.getContext('2d');
  const inputData = inputCtx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Create a new ImageData for the output
  const outputData = outputCtx.createImageData(originalWidth, originalHeight);
  
  // Scale the input data to the output dimensions
  const scaleX = canvas.width / originalWidth;
  const scaleY = canvas.height / originalHeight;
  
  // For each pixel in the output
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      // Find the corresponding pixel in the input
      const sourceX = Math.floor(x * scaleX);
      const sourceY = Math.floor(y * scaleY);
      const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
      
      // Get the alpha value from the source
      const alpha = inputData.data[sourceIndex + 3];
      
      // Set the output pixel
      const destIndex = (y * originalWidth + x) * 4;
      
      // If the alpha is significant, make it white, otherwise black
      if (alpha > 50) {
        outputData.data[destIndex] = 255; // R
        outputData.data[destIndex + 1] = 255; // G
        outputData.data[destIndex + 2] = 255; // B
        outputData.data[destIndex + 3] = 255; // A
      } else {
        outputData.data[destIndex] = 0; // R
        outputData.data[destIndex + 1] = 0; // G
        outputData.data[destIndex + 2] = 0; // B
        outputData.data[destIndex + 3] = 255; // A
      }
    }
  }
  
  // Put the image data back to the canvas
  outputCtx.putImageData(outputData, 0, 0);
  
  // Return as data URL
  return outputCanvas.toDataURL('image/png');
};