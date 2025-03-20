import { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Create context
const UIContext = createContext();

// Custom hook for using this context
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};

// Provider component
export const UIProvider = ({ children }) => {
  // UI state
  const [drawingMode, setDrawingMode] = useState('draw'); // 'draw' or 'erase'
  const [brushSize, setBrushSize] = useState(10);
  const [brushShape, setBrushShape] = useState('circle'); // 'circle' or 'square'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Reset UI state
  const resetUIState = useCallback(() => {
    setDrawingMode('draw');
    setBrushSize(10);
    setBrushShape('circle');
    setIsLoading(false);
    setError(null);
    setStatusMessage('');
  }, []);

  // Create memoized callbacks for setters
  const memoizedSetDrawingMode = useCallback((mode) => setDrawingMode(mode), []);
  const memoizedSetBrushSize = useCallback((size) => setBrushSize(size), []);
  const memoizedSetBrushShape = useCallback((shape) => setBrushShape(shape), []);
  const memoizedSetIsLoading = useCallback((loading) => setIsLoading(loading), []);
  const memoizedSetError = useCallback((err) => setError(err), []);
  const memoizedSetStatusMessage = useCallback((message) => setStatusMessage(message), []);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    drawingMode,
    brushSize,
    brushShape,
    isLoading,
    error,
    statusMessage,
    
    // Setters
    setDrawingMode: memoizedSetDrawingMode,
    setBrushSize: memoizedSetBrushSize,
    setBrushShape: memoizedSetBrushShape,
    setIsLoading: memoizedSetIsLoading,
    setError: memoizedSetError,
    setStatusMessage: memoizedSetStatusMessage,
    
    // Actions
    resetUIState
  }), [
    drawingMode,
    brushSize,
    brushShape,
    isLoading,
    error,
    statusMessage,
    memoizedSetDrawingMode,
    memoizedSetBrushSize,
    memoizedSetBrushShape,
    memoizedSetIsLoading,
    memoizedSetError,
    memoizedSetStatusMessage,
    resetUIState
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};