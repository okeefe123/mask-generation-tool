import { createContext, useContext, useState, useRef } from 'react';

const ImageContext = createContext();

export const useImageContext = () => useContext(ImageContext);

export const ImageProvider = ({ children }) => {
  const [originalImage, setOriginalImage] = useState(null);
  const [displayImage, setDisplayImage] = useState(null);
  const [imageId, setImageId] = useState(null); // Add image ID from backend
  const [originalFileName, setOriginalFileName] = useState(null); // Store original file name
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);
  const [drawingMode, setDrawingMode] = useState('draw'); // 'draw' or 'erase'
  const [brushSize, setBrushSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Add persistent strokes storage that survives component unmounts
  const [savedStrokes, setSavedStrokes] = useState([]);

  // Reset all state
  const resetState = () => {
    setOriginalImage(null);
    setDisplayImage(null);
    setImageId(null);
    setOriginalFileName(null); // Reset original file name
    setOriginalDimensions({ width: 0, height: 0 });
    setScaleFactor(1);
    setDrawingMode('draw');
    setBrushSize(10);
    setIsLoading(false);
    setError(null);
    setSavedStrokes([]); // Reset saved strokes
  };

  // Calculate scale factor based on viewport and image dimensions
  const calculateScaleFactor = (imageWidth, imageHeight, containerWidth, containerHeight) => {
    const widthRatio = containerWidth / imageWidth;
    const heightRatio = containerHeight / imageHeight;
    
    // Use the smaller ratio to ensure the image fits within the container
    const newScaleFactor = Math.min(widthRatio, heightRatio, 1);
    setScaleFactor(newScaleFactor);
    return newScaleFactor;
  };

  const value = {
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
    resetState,
    calculateScaleFactor,
    // Add saved strokes to context
    savedStrokes,
    setSavedStrokes,
  };

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>;
};