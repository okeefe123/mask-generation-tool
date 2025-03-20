import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AppHeader from '../../../components/layout/AppHeader';

describe('AppHeader', () => {
  test('renders correctly', () => {
    render(<AppHeader />);
    
    // Check that the title is rendered
    expect(screen.getByRole('heading', { name: /mask generator tool/i })).toBeInTheDocument();
    
    // Check that the subtitle is rendered
    expect(screen.getByText(/create precise masks for your images/i)).toBeInTheDocument();
  });
});