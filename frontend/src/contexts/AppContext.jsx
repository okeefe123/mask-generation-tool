import { createContext, useContext, useState, useMemo, useCallback } from 'react';

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

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    originalImage,
    displayImage,
    imageId,
    originalFileName,
    originalDimensions,
    scaleFactor,
    
    // Setters (wrapped in useCallback to maintain reference equality)
    setOriginalImage: useCallback((image) => setOriginalImage(image), []),
    setDisplayImage: useCallback((image) => setDisplayImage(image), []),
    setImageId: useCallback((id) => setImageId(id), []),
    setOriginalFileName: useCallback((name) => setOriginalFileName(name), []),
    setOriginalDimensions: useCallback((dimensions) => setOriginalDimensions(dimensions), []),
    setScaleFactor: useCallback((factor) => setScaleFactor(factor), []),
    
    // Actions
    resetState,
    calculateScaleFactor
  }), [
    originalImage,
    displayImage,
    imageId,
    originalFileName,
    originalDimensions,
    scaleFactor,
    resetState,
    calculateScaleFactor
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};