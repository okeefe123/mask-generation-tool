import { createContext, useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from './AppContext';

// Create context
const CanvasContext = createContext();

// Custom hook for using this context
export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

// Provider component
export const CanvasProvider = ({ children }) => {
  const { saveImageMask } = useAppContext();
  
  // Canvas state
  const [strokes, setStrokes] = useState([]);
  const [currentTool, setCurrentTool] = useState('brush'); // 'brush', 'eraser', 'rectangle', 'circle'
  const [brushSize, setBrushSize] = useState(15);
  
  // Use a ref to track strokes for operations that don't need re-renders
  const strokesRef = useRef([]);
  
  // Keep strokesRef in sync with strokes state
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  // Add a new stroke
  const addStroke = useCallback((stroke) => {
    if (!stroke) return;
    
    setStrokes(prevStrokes => {
      const newStrokes = [...prevStrokes, stroke];
      strokesRef.current = newStrokes;
      return newStrokes;
    });
  }, []);

  // Undo the last stroke
  const handleUndo = useCallback(() => {
    setStrokes(prevStrokes => {
      if (prevStrokes.length === 0) return prevStrokes;
      
      const newStrokes = prevStrokes.slice(0, -1);
      strokesRef.current = newStrokes;
      return newStrokes;
    });
  }, []);

  // Clear all strokes
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    strokesRef.current = [];
  }, []);

  // Get current strokes (useful for components that need the latest strokes)
  const getCurrentStrokes = useCallback(() => {
    return strokesRef.current;
  }, []);
  
  // Save the mask to the server
  const saveMask = useCallback(async () => {
    if (!saveImageMask) {
      throw new Error('saveImageMask function not available');
    }
    
    try {
      // Get the canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      // Save the mask
      await saveImageMask(blob);
      
      return true;
    } catch (error) {
      console.error('Error saving mask:', error);
      throw error;
    }
  }, [saveImageMask]);

  // Create memoized callbacks for setters
  const memoizedSetCurrentTool = useCallback((tool) => setCurrentTool(tool), []);
  const memoizedSetBrushSize = useCallback((size) => setBrushSize(size), []);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    strokes,
    currentTool,
    brushSize,
    
    // Setters
    setCurrentTool: memoizedSetCurrentTool,
    setBrushSize: memoizedSetBrushSize,
    
    // Actions (all wrapped in useCallback to maintain reference equality)
    addStroke,
    handleUndo,
    clearCanvas,
    getCurrentStrokes,
    saveMask
  }), [
    strokes,
    currentTool,
    brushSize,
    memoizedSetCurrentTool,
    memoizedSetBrushSize,
    addStroke,
    handleUndo,
    clearCanvas,
    getCurrentStrokes,
    saveMask
  ]);

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};