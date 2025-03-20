import { createContext, useContext, useState, useMemo, useCallback, useRef } from 'react';

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
  // Canvas state
  const [strokes, setStrokes] = useState([]);
  
  // Use a ref to track strokes for operations that don't need re-renders
  const strokesRef = useRef([]);
  
  // Keep strokesRef in sync with strokes state
  useRef(() => {
    strokesRef.current = strokes;
  }).current = strokes;

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

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    strokes,
    
    // Actions (all wrapped in useCallback to maintain reference equality)
    addStroke,
    handleUndo,
    clearCanvas,
    getCurrentStrokes
  }), [
    strokes,
    addStroke,
    handleUndo,
    clearCanvas,
    getCurrentStrokes
  ]);

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
};