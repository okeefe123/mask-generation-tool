import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import ToolPanel from '../../../components/tools/ToolPanel';
import * as AppContextModule from '../../../contexts/AppContext';

// Mock the components used in ToolPanel
vi.mock('../../../components/ImageUploader', () => ({
  default: () => <div data-testid="image-uploader">Image Uploader</div>
}));

vi.mock('../../../components/tools/DrawingTools', () => ({
  default: () => <div data-testid="drawing-tools">Drawing Tools</div>
}));

vi.mock('../../../components/tools/ActionButtons', () => ({
  default: () => <div data-testid="action-buttons">Action Buttons</div>
}));

describe('ToolPanel', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  test('shows only image uploader with Required badge when no image is displayed', () => {
    // Mock the useAppContext hook to return no display image
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: null
    });
    
    render(
      <ChakraProvider>
        <ToolPanel />
      </ChakraProvider>
    );
    
    // Check that the image uploader is rendered
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    
    // Check that the Required badge is displayed
    expect(screen.getByText(/required/i)).toBeInTheDocument();
    
    // Check that drawing tools and action buttons are not rendered
    expect(screen.queryByTestId('drawing-tools')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
  });
  
  test('shows all sections when an image is displayed', () => {
    // Mock the useAppContext hook to return a display image
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg'
    });
    
    render(
      <ChakraProvider>
        <ToolPanel />
      </ChakraProvider>
    );
    
    // Check that all sections are rendered
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-tools')).toBeInTheDocument();
    expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    
    // Check that the section headings are rendered
    expect(screen.getByRole('heading', { name: 'Image' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drawing Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actions' })).toBeInTheDocument();
    
    // Check that the Required badge is NOT displayed
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });
  
  test('applies proper styling from the theme', () => {
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg'
    });
    
    render(
      <ChakraProvider>
        <ToolPanel />
      </ChakraProvider>
    );
    
    // Check that the component structure is properly styled with Chakra UI components
    const toolPanel = screen.getByRole('heading', { name: 'Image' }).closest('.chakra-stack');
    expect(toolPanel).toBeInTheDocument();
    
    // Check that the toolPanel has chakra styling classes
    expect(toolPanel.className).toContain('chakra-stack');
    
    // Check that section headings have proper styling
    const imageHeading = screen.getByRole('heading', { name: 'Image' });
    expect(imageHeading).toHaveClass('chakra-heading');
    
    // Check that dividers are present
    const dividers = document.querySelectorAll('hr.chakra-divider');
    expect(dividers.length).toBe(2); // Two dividers for the three sections
  });
});