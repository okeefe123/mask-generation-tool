import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StatusFooter from '../../../components/layout/StatusFooter';
import * as UIContextModule from '../../../contexts/UIContext';

describe('StatusFooter', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  test('displays the correct status message', () => {
    // Mock the useUIContext hook
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: false,
      statusMessage: 'Test status message'
    });
    
    render(<StatusFooter />);
    
    // Check that the status message is displayed
    expect(screen.getByText('Test status message')).toBeInTheDocument();
  });
  
  test('displays "Ready" when no status message is provided', () => {
    // Mock the useUIContext hook
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: false,
      statusMessage: ''
    });
    
    render(<StatusFooter />);
    
    // Check that "Ready" is displayed when no status message is provided
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
  
  test('displays loading state correctly', () => {
    // Mock the useUIContext hook
    vi.spyOn(UIContextModule, 'useUIContext').mockReturnValue({
      isLoading: true,
      statusMessage: 'Loading...'
    });
    
    render(<StatusFooter />);
    
    // Check that the loading message is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});