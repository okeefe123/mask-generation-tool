import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ActionButtons from '../../../components/tools/ActionButtons';
import { useCanvasContext } from '../../../contexts/CanvasContext';
import { useUIContext } from '../../../contexts/UIContext';
import { useAppContext } from '../../../contexts/AppContext';

// Mock the context hooks
vi.mock('../../../contexts/CanvasContext', () => ({
  useCanvasContext: vi.fn()
}));

vi.mock('../../../contexts/UIContext', () => ({
  useUIContext: vi.fn()
}));

vi.mock('../../../contexts/AppContext', () => ({
  useAppContext: vi.fn()
}));

describe('ActionButtons Component', () => {
  // Set up default mock values
  const mockClearCanvas = vi.fn();
  const mockHandleUndo = vi.fn();
  const mockSetStatusMessage = vi.fn();
  const mockSetIsLoading = vi.fn();
  const mockSetError = vi.fn();
  const mockDisplayImage = { id: '123', url: 'test-image.jpg' };
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    
    // Set up the canvas context mock
    useCanvasContext.mockReturnValue({
      clearCanvas: mockClearCanvas,
      handleUndo: mockHandleUndo
    });
    
    // Set up the UI context mock
    useUIContext.mockReturnValue({
      setStatusMessage: mockSetStatusMessage,
      setIsLoading: mockSetIsLoading,
      setError: mockSetError
    });
    
    // Set up the App context mock
    useAppContext.mockReturnValue({
      displayImage: mockDisplayImage
    });
  });
  
  it('renders action buttons with correct styling', () => {
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Check that all buttons are rendered with appropriate text
    const saveButton = screen.getByRole('button', { name: /save mask/i });
    const undoButton = screen.getByRole('button', { name: /undo/i });
    const clearButton = screen.getByRole('button', { name: /clear/i });
    
    expect(saveButton).toBeInTheDocument();
    expect(undoButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
    
    // Visual checks would be done in a separate UI test, but we can check for existence
    expect(saveButton).toHaveClass('chakra-button');
    expect(undoButton).toHaveClass('chakra-button');
    expect(clearButton).toHaveClass('chakra-button');
  });
  
  it('calls clearCanvas when Clear button is clicked', () => {
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the clear button
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    
    // Check that clearCanvas was called
    expect(mockClearCanvas).toHaveBeenCalled();
  });
  
  it('calls handleUndo when Undo button is clicked', () => {
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the undo button
    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    
    // Check that handleUndo was called
    expect(mockHandleUndo).toHaveBeenCalled();
  });
  
  it('starts saving process when Save Mask button is clicked', async () => {
    // Use fake timers to control the timeout
    vi.useFakeTimers();
    
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the save mask button
    fireEvent.click(screen.getByRole('button', { name: /save mask/i }));
    
    // Initial state checks
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    expect(mockSetStatusMessage).toHaveBeenCalledWith('Saving mask...');
    
    // Fast forward time to complete the timeout
    await vi.runAllTimersAsync();
    
    // Check final state
    expect(mockSetIsLoading).toHaveBeenCalledWith(false);
    expect(mockSetStatusMessage).toHaveBeenCalledWith('Mask saved successfully');
    
    // Restore real timers
    vi.useRealTimers();
  });
});