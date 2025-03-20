import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Workspace from '../../../components/layout/Workspace';
import { AppProvider } from '../../../contexts/AppContext';

// Mock components
const MockToolPanel = () => <div data-testid="tool-panel">Tool Panel</div>;
const MockCanvasArea = () => <div data-testid="canvas-area">Canvas Area</div>;

describe('Workspace', () => {
  test('renders tool panel and canvas area', () => {
    render(
      <AppProvider>
        <Workspace 
          toolPanel={<MockToolPanel />} 
          canvasArea={<MockCanvasArea />} 
        />
      </AppProvider>
    );
    
    // Check that the tool panel is rendered
    expect(screen.getByTestId('tool-panel')).toBeInTheDocument();
    
    // Check that the canvas area is rendered
    expect(screen.getByTestId('canvas-area')).toBeInTheDocument();
  });
  
  test('properly handles responsive layout', () => {
    render(
      <AppProvider>
        <Workspace 
          toolPanel={<MockToolPanel />} 
          canvasArea={<MockCanvasArea />} 
        />
      </AppProvider>
    );
    
    // Get the main flex container
    const mainContainer = screen.getByRole('main');
    
    // Check that it has the correct flex properties
    expect(mainContainer).toHaveStyle('display: flex');
    expect(mainContainer).toHaveStyle('flex: 1');
  });
});