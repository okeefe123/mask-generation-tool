import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAllImages, getAllMasks, checkImageHasMask } from '../services/api';

const ImageContext = createContext();

export const useImageContext = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
  // Single active image state
  const [originalImage, setOriginalImage] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [drawingMode, setDrawingMode] = useState('draw');
  const [brushSize, setBrushSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedStrokes, setSavedStrokes] = useState([]);
  const [initialized, setInitialized] = useState(false);
  
  // Multiple images state
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);
  const [imagesWithMasks, setImagesWithMasks] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Fetch all available images (those without masks)
  const fetchAvailableImages = useCallback(async () => {
    setIsLoadingImages(true);
    try {
      // Get all images from the server
      const imagesResponse = await getAllImages();
      
      // Get all masks from the server
      const masksResponse = await getAllMasks();
      
      // Extract filenames from masks (without extensions)
      const maskFilenames = masksResponse.map(mask => {
        // Extract base filename without extension
        const filename = mask.file.split('/').pop().split('.')[0];
        return filename;
      });
      
      setImagesWithMasks(maskFilenames);
      
      // Filter images that don't have masks
      const availableImgs = imagesResponse.filter(image => {
        // Get base filename without extension
        const imageFilename = image.original_filename.split('.')[0];
        return !maskFilenames.includes(imageFilename);
      });
      
      setAvailableImages(availableImgs);
      
      // Select the first available image if any exist and none is selected
      if (availableImgs.length > 0 && selectedImageIndex === -1) {
        setSelectedImageIndex(0);
        selectImage(availableImgs[0]);
      } else if (availableImgs.length === 0) {
        // Reset if no images are available
        setSelectedImageIndex(-1);
        setPreviewImage(null);
      } else if (selectedImageIndex >= availableImgs.length) {
        // If the selected index is out of bounds (e.g., after saving a mask that removes it from the list)
        // select the first available image
        setSelectedImageIndex(0);
        if (availableImgs.length > 0) {
          selectImage(availableImgs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching available images:', error);
      setError('Failed to load available images. Please try again.');
    } finally {
      setIsLoadingImages(false);
    }
  }, [selectedImageIndex]);

  // Select an image from available images
  const selectImage = useCallback((image) => {
    if (!image) return;
    
    setOriginalImage(image.file);
    setDisplayImage(image.file);
    setImageId(image.id);
    setOriginalFileName(image.original_filename);
    setOriginalDimensions({
      width: image.width,
      height: image.height
    });
    // Reset drawing state when selecting a new image
    setSavedStrokes([]);
    // Reset the initialized state for DrawingCanvas
    setInitialized(false);
  }, []);

  // Preview image for selection
  const [previewImage, setPreviewImage] = useState(null);
  
  // Select image by index (only updates preview, doesn't set the actual image)
  const selectImageByIndex = useCallback((index) => {
    if (index >= 0 && index < availableImages.length) {
      setSelectedImageIndex(index);
      // Just set the preview image for the dropdown selection
      setPreviewImage(availableImages[index]);
    }
  }, [availableImages]);

  // Reset all state
  const resetState = useCallback(() => {
    setOriginalImage(null);
    setDisplayImage(null);
    setImageId(null);
    setOriginalFileName(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setScaleFactor(1);
    setDrawingMode('draw');
    setBrushSize(10);
    setIsLoading(false);
    setError(null);
    setSavedStrokes([]);
    setSelectedImageIndex(-1);
  }, []);

  // Calculate scale factor based on viewport and image dimensions
  const calculateScaleFactor = useCallback((imageWidth, imageHeight, containerWidth, containerHeight) => {
    const widthRatio = containerWidth / imageWidth;
    const heightRatio = containerHeight / imageHeight;
    
    // Use the smaller ratio to ensure the image fits within the container
    const newScaleFactor = Math.min(widthRatio, heightRatio, 1);
    setScaleFactor(newScaleFactor);
    return newScaleFactor;
  }, []);

  // Refresh available images after uploading a new batch
  const refreshAvailableImages = useCallback(() => {
    fetchAvailableImages();
  }, [fetchAvailableImages]);

  // Check if an image has been successfully masked (removed from available)
  const checkImageMasked = useCallback(async (filename) => {
    try {
      const hasMask = await checkImageHasMask(filename);
      if (hasMask) {
        // Remove the masked image from available images
        setAvailableImages(prev =>
          prev.filter(img => img.original_filename !== filename)
        );
        
        // Update images with masks
        setImagesWithMasks(prev => [...prev, filename.split('.')[0]]);
        
        // If the current image was masked, select the next available one
        if (originalFileName === filename && availableImages.length > 1) {
          const nextIndex = selectedImageIndex < availableImages.length - 1
            ? selectedImageIndex
            : 0;
          selectImageByIndex(nextIndex);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error checking if image ${filename} has mask:`, error);
      return false;
    }
  }, [availableImages, originalFileName, selectedImageIndex, selectImageByIndex]);

  const value = {
    // Single image state
    originalImage,
    setOriginalImage,
    displayImage,
    setDisplayImage,
    imageId,
    setImageId,
    originalFileName,
    setOriginalFileName,
    originalDimensions,
    setOriginalDimensions,
    scaleFactor,
    setScaleFactor,
    drawingMode,
    setDrawingMode,
    brushSize,
    setBrushSize,
    isLoading,
    setIsLoading,
    error,
    setError,
    savedStrokes,
    setSavedStrokes,
    
    // Preview image (for dropdown selection)
    previewImage,
    setPreviewImage,
    
    // Canvas initialization state
    initialized,
    setInitialized,
    
    // Multiple images state and methods
    availableImages,
    selectedImageIndex,
    setSelectedImageIndex,
    selectImageByIndex,
    selectImage,
    isLoadingImages,
    imagesWithMasks,
    
    // Actions
    resetState,
    calculateScaleFactor,
    fetchAvailableImages,
    refreshAvailableImages,
    checkImageMasked,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};