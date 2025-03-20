import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('should render the application structure with Chakra components', () => {
    render(<App />);
    
    // Check basic app structure is present - use more specific queries to avoid duplicate matches
    const headerHeading = screen.getByRole('heading', { name: /Mask Generator Tool/i });
    expect(headerHeading).toBeInTheDocument();
    
    expect(screen.getByText(/Create precise masks for your images/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload an image to start editing/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready/i)).toBeInTheDocument();
    
    // Check for footer copyright
    expect(screen.getByText(/© 2025 Mask Generator Tool/i)).toBeInTheDocument();
  });
});