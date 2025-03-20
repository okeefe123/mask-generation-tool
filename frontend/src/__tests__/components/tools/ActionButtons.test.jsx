import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ActionButtons from '../../../components/tools/ActionButtons';

// Mock the useCanvasContext and useUIContext hooks
jest.mock('../../../contexts/AppContexts', () => ({
  useCanvasContext: jest.fn(),
  useUIContext: jest.fn()
}));

// Mock the Chakra UI toast
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    ...originalModule,
    useToast: () => jest.fn()
  };
});

describe('ActionButtons Component', () => {
  // Set up default mock values
  const mockClearCanvas = jest.fn();
  const mockSaveMask = jest.fn();
  const mockSetStatusMessage = jest.fn();
  const mockSetIsLoading = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    mockClearCanvas.mockReset();
    mockSaveMask.mockReset();
    mockSetStatusMessage.mockReset();
    mockSetIsLoading.mockReset();
    
    // Set up the canvas context mock
    const mockUseCanvasContext = require('../../../contexts/AppContexts').useCanvasContext;
    mockUseCanvasContext.mockReturnValue({
      clearCanvas: mockClearCanvas,
      saveMask: mockSaveMask
    });
    
    // Set up the UI context mock
    const mockUseUIContext = require('../../../contexts/AppContexts').useUIContext;
    mockUseUIContext.mockReturnValue({
      setStatusMessage: mockSetStatusMessage,
      setIsLoading: mockSetIsLoading
    });
  });
  
  test('renders save and clear buttons', () => {
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Check that both buttons are rendered
    expect(screen.getByRole('button', { name: /save mask/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear canvas/i })).toBeInTheDocument();
  });
  
  test('calls clearCanvas when Clear Canvas button is clicked', () => {
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the clear canvas button
    fireEvent.click(screen.getByRole('button', { name: /clear canvas/i }));
    
    // Check that clearCanvas was called
    expect(mockClearCanvas).toHaveBeenCalled();
    
    // Check that status message was updated
    expect(mockSetStatusMessage).toHaveBeenCalledWith('Canvas cleared');
  });
  
  test('calls saveMask when Save Mask button is clicked', async () => {
    // Set up saveMask to resolve successfully
    mockSaveMask.mockResolvedValue();
    
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the save mask button
    fireEvent.click(screen.getByRole('button', { name: /save mask/i }));
    
    // Check that isLoading was set to true
    expect(mockSetIsLoading).toHaveBeenCalledWith(true);
    
    // Check that status message was updated
    expect(mockSetStatusMessage).toHaveBeenCalledWith('Saving mask...');
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // Check that saveMask was called
      expect(mockSaveMask).toHaveBeenCalled();
      
      // Check that isLoading was set back to false
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      
      // Check that status message was updated
      expect(mockSetStatusMessage).toHaveBeenCalledWith('Mask saved successfully');
    });
  });
  
  test('handles errors when saving mask fails', async () => {
    // Set up saveMask to reject with an error
    const error = new Error('Failed to save mask');
    mockSaveMask.mockRejectedValue(error);
    
    render(
      <ChakraProvider>
        <ActionButtons />
      </ChakraProvider>
    );
    
    // Click the save mask button
    fireEvent.click(screen.getByRole('button', { name: /save mask/i }));
    
    // Wait for the async operation to complete
    await waitFor(() => {
      // Check that isLoading was set back to false
      expect(mockSetIsLoading).toHaveBeenCalledWith(false);
      
      // Check that status message was updated with error
      expect(mockSetStatusMessage).toHaveBeenCalledWith('Error saving mask');
    });
  });
});