import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { saveMask } from '../services/api';

// Create context
const AppContext = createContext();

// Custom hook for using this context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
export const AppProvider = ({ children }) => {
  // App state
  const [originalImage, setOriginalImage] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);

  // Reset app state
  const resetState = useCallback(() => {
    setOriginalImage(null);
    setDisplayImage(null);
    setImageId(null);
    setOriginalFileName(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setScaleFactor(1);
  }, []);

  // Calculate scale factor based on viewport and image dimensions
  const calculateScaleFactor = useCallback((imageWidth, imageHeight, containerWidth, containerHeight) => {
    if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) {
      return 1;
    }
    
    const widthRatio = containerWidth / imageWidth;
    const heightRatio = containerHeight / imageHeight;
    
    // Use the smaller ratio to ensure the image fits within the container
    const newScaleFactor = Math.min(widthRatio, heightRatio, 1);
    setScaleFactor(newScaleFactor);
    return newScaleFactor;
  }, []);

  // Define setters with useCallback
  const setOriginalImageCallback = useCallback((image) => setOriginalImage(image), []);
  const setDisplayImageCallback = useCallback((image) => setDisplayImage(image), []);
  const setImageIdCallback = useCallback((id) => setImageId(id), []);
  const setOriginalFileNameCallback = useCallback((name) => setOriginalFileName(name), []);
  const setOriginalDimensionsCallback = useCallback((dimensions) => setOriginalDimensions(dimensions), []);
  const setScaleFactorCallback = useCallback((factor) => setScaleFactor(factor), []);
  
  // Save image mask function
  const saveImageMask = useCallback(async (maskBlob) => {
    if (!imageId) {
      throw new Error('No image ID available');
    }
    
    try {
      return await saveMask(imageId, maskBlob);
    } catch (error) {
      console.error('Error saving mask:', error);
      throw error;
    }
  }, [imageId]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    originalImage,
    displayImage,
    imageId,
    originalFileName,
    originalDimensions,
    scaleFactor,
    
    // Setters
    setOriginalImage: setOriginalImageCallback,
    setDisplayImage: setDisplayImageCallback,
    setImageId: setImageIdCallback,
    setOriginalFileName: setOriginalFileNameCallback,
    setOriginalDimensions: setOriginalDimensionsCallback,
    setScaleFactor: setScaleFactorCallback,
    
    // Actions
    resetState,
    calculateScaleFactor,
    saveImageMask
  }), [
    originalImage,
    displayImage,
    imageId,
    originalFileName,
    originalDimensions,
    scaleFactor,
    setOriginalImageCallback,
    setDisplayImageCallback,
    setImageIdCallback,
    setOriginalFileNameCallback,
    setOriginalDimensionsCallback,
    setScaleFactorCallback,
    resetState,
    calculateScaleFactor,
    saveImageMask
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};