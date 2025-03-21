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
  
  // Preview image for selection - moved up to fix reference error
  const [previewImage, setPreviewImage] = useState(null);

  // Clear all image-related state when there are no images
  const clearImageState = useCallback(() => {
    console.log('Clearing image state as no images are available');
    setOriginalImage(null);
    setDisplayImage(null);
    setImageId(null);
    setOriginalFileName(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setSelectedImageIndex(-1);
    setPreviewImage(null);
    setSavedStrokes([]);
    setInitialized(false);
  }, []);

  // Manually handle an image being masked (for immediate UI updates)
  const forceMaskUpdate = useCallback((filename) => {
    if (!filename) return;
    
    console.log('Force updating UI for masked image:', filename);
    
    // Extract just the filename without path
    const shortFilename = filename.split('/').pop();
    
    // Check if this is the currently selected image
    const isCurrentImage = originalFileName === shortFilename;
    
    // Get the current state before updates
    const currentImages = [...availableImages];
    const maskedImageIndex = currentImages.findIndex(img => 
      img.original_filename === shortFilename
    );
    
    if (maskedImageIndex === -1) {
      console.log('Image not found in available images list:', shortFilename);
      return;
    }
    
    // Update the masks list
    const baseFilename = shortFilename.split('.')[0];
    setImagesWithMasks(prev => {
      if (!prev.includes(baseFilename)) {
        return [...prev, baseFilename];
      }
      return prev;
    });
    
    // Remove the image from the available images list
    setAvailableImages(prev => 
      prev.filter(img => img.original_filename !== shortFilename)
    );
    
    // If this was the current image, we need to select a new one
    if (isCurrentImage) {
      console.log('Current image was masked, clearing canvas state');
      
      // Clear the canvas immediately
      setOriginalImage(null);
      setDisplayImage(null);
      setImageId(null);
      setOriginalFileName(null);
      setOriginalDimensions({ width: 0, height: 0 });
      setSavedStrokes([]);
      setInitialized(false);
      
      // Select the next image in the list (if any)
      const remainingImages = currentImages.filter(img => 
        img.original_filename !== shortFilename
      );
      
      if (remainingImages.length > 0) {
        // We have remaining images
        let nextIndex = maskedImageIndex < remainingImages.length ? maskedImageIndex : 0;
        console.log('Setting next preview image after masking, index:', nextIndex);
        
        // Only set preview and index, not the actual image
        if (nextIndex < remainingImages.length) {
          setSelectedImageIndex(nextIndex);
          setPreviewImage(remainingImages[nextIndex]);
        }
      } else {
        // No remaining images, clear the selection
        console.log('No remaining images after masking, clearing state');
        setSelectedImageIndex(-1);
        setPreviewImage(null);
      }
    }
  }, [availableImages, originalFileName, setImagesWithMasks, setAvailableImages, 
      setOriginalImage, setDisplayImage, setImageId, setOriginalFileName, 
      setOriginalDimensions, setSavedStrokes, setInitialized, setSelectedImageIndex, setPreviewImage]);
  
  // Expose the forceMaskUpdate function globally for the save mask handler to use
  useEffect(() => {
    if (window) {
      window.forceMaskUpdate = forceMaskUpdate;
    }
    
    // Cleanup
    return () => {
      if (window && window.forceMaskUpdate) {
        delete window.forceMaskUpdate;
      }
    };
  }, [forceMaskUpdate]);

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
      
      console.log(`After filtering: ${availableImgs.length} images available`);
      setAvailableImages(availableImgs);
      
      // Handle the case where there are no available images
      if (availableImgs.length === 0) {
        clearImageState();
        return;
      }
      
      // Determine if the current preview image is still valid
      const currentPreviewStillValid = previewImage && availableImgs.some(img => 
        img.id === previewImage.id
      );
      
      // If the current preview is no longer valid, select a new one
      if (!currentPreviewStillValid) {
        // Select the first available image for preview
        setSelectedImageIndex(0);
        setPreviewImage(availableImgs[0]);
        console.log('Current preview image no longer valid, selecting first available image');
      } else if (selectedImageIndex >= availableImgs.length) {
        // If the selected index is out of bounds, select the first available image
        setSelectedImageIndex(0);
        setPreviewImage(availableImgs[0]);
        console.log('Selected index out of bounds, selecting first available image');
      } else {
        // Ensure the preview matches the selected index
        const currentIndexImage = availableImgs[selectedImageIndex];
        if (currentIndexImage && (!previewImage || currentIndexImage.id !== previewImage.id)) {
          setPreviewImage(currentIndexImage);
          console.log('Updating preview to match selected index');
        }
      }
    } catch (error) {
      console.error('Error fetching available images:', error);
      setError('Failed to load available images. Please try again.');
    } finally {
      setIsLoadingImages(false);
    }
  }, [selectedImageIndex, clearImageState, previewImage]);

  // Select an image from available images
  const selectImage = useCallback((image) => {
    if (!image) {
      console.log('No image provided to selectImage');
      return;
    }
    
    console.log('Setting active image:', image.original_filename);
    
    // IMPORTANT: Order matters here for proper canvas clearing
    
    // Step 1: Set initialized to false FIRST to prevent any redrawing
    setInitialized(false);
    
    // Step 2: Clear saved strokes array
    setSavedStrokes([]);
    
    // Step 3: Temporarily clear display image to force useEffect in DrawingCanvas to trigger
    setDisplayImage(null);
    
    // Step 4: Add a small delay before setting the new image to ensure clearing happens first
    setTimeout(() => {
      // Step 5: Set all the new image data
      setOriginalImage(image.file);
      setDisplayImage(image.file);
      setImageId(image.id);
      setOriginalFileName(image.original_filename);
      setOriginalDimensions({
        width: image.width,
        height: image.height
      });
      
      // Also set preview image for consistency
      setPreviewImage(image);
      
      console.log('Canvas reset complete for new image:', image.original_filename);
    }, 10); // Small delay to ensure clearing happens before new image is set
  }, []);

  // Select image by index - now actually selects the image too, not just preview
  const selectImageByIndex = useCallback((index) => {
    if (index >= 0 && index < availableImages.length) {
      console.log(`Selecting image at index ${index}:`, availableImages[index].original_filename);
      setSelectedImageIndex(index);
      // Set both preview and actual image
      const selectedImage = availableImages[index];
      setPreviewImage(selectedImage);
      selectImage(selectedImage);
    } else if (index === -1 || availableImages.length === 0) {
      // Clear selection if index is -1 or there are no available images
      console.log('Clearing image selection');
      clearImageState();
    }
  }, [availableImages, selectImage, clearImageState]);

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
    setPreviewImage(null);
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
        // Immediately apply the UI update using our force update function
        forceMaskUpdate(filename);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error checking if image ${filename} has mask:`, error);
      return false;
    }
  }, [forceMaskUpdate]);

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
    clearImageState,
    forceMaskUpdate,
    
    // Actions
    resetState,
    calculateScaleFactor,
    fetchAvailableImages,
    refreshAvailableImages,
    checkImageMasked,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};