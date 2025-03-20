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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset UI state
  const resetUIState = useCallback(() => {
    setDrawingMode('draw');
    setBrushSize(10);
    setIsLoading(false);
    setError(null);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    drawingMode,
    brushSize,
    isLoading,
    error,
    
    // Setters (wrapped in useCallback to maintain reference equality)
    setDrawingMode: useCallback((mode) => setDrawingMode(mode), []),
    setBrushSize: useCallback((size) => setBrushSize(size), []),
    setIsLoading: useCallback((loading) => setIsLoading(loading), []),
    setError: useCallback((err) => setError(err), []),
    
    // Actions
    resetUIState
  }), [
    drawingMode, 
    brushSize, 
    isLoading, 
    error, 
    resetUIState
  ]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};