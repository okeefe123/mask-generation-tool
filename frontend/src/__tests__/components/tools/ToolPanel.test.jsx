import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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

  test('shows only image uploader when no image is displayed', () => {
    // Mock the useAppContext hook to return no display image
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: null
    });
    
    render(<ToolPanel />);
    
    // Check that the image uploader is rendered
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    
    // Check that drawing tools and action buttons are not rendered
    expect(screen.queryByTestId('drawing-tools')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-buttons')).not.toBeInTheDocument();
  });
  
  test('shows all sections when an image is displayed', () => {
    // Mock the useAppContext hook to return a display image
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      displayImage: 'test-image.jpg'
    });
    
    render(<ToolPanel />);
    
    // Check that all sections are rendered
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.getByTestId('drawing-tools')).toBeInTheDocument();
    expect(screen.getByTestId('action-buttons')).toBeInTheDocument();
    
    // Check that the section headings are rendered
    expect(screen.getByRole('heading', { name: 'Image' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Drawing Tools' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actions' })).toBeInTheDocument();
  });
});