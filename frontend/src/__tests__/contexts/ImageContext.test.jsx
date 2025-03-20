import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AllProvidersWrapper } from '../../contexts/AppContexts';
import { useAppContext, useUIContext, useCanvasContext } from '../../contexts/AppContexts';

// Create a test component that uses all contexts
const TestComponent = () => {
  const app = useAppContext();
  const ui = useUIContext();
  const canvas = useCanvasContext();
  
  return (
    <div>
      <div data-testid="original-image">{app.originalImage || 'no-image'}</div>
      <div data-testid="display-image">{app.displayImage || 'no-image'}</div>
      <div data-testid="width">{app.originalDimensions.width}</div>
      <div data-testid="height">{app.originalDimensions.height}</div>
      <div data-testid="scale-factor">{app.scaleFactor}</div>
      <div data-testid="drawing-mode">{ui.drawingMode}</div>
      <div data-testid="brush-size">{ui.brushSize}</div>
      <div data-testid="is-loading">{ui.isLoading.toString()}</div>
      <div data-testid="error">{ui.error || 'no-error'}</div>
      <div data-testid="strokes-count">{canvas.strokes.length}</div>
    </div>
  );
};

describe('Combined Contexts', () => {
  test('provides default values', () => {
    render(
      <AllProvidersWrapper>
        <TestComponent />
      </AllProvidersWrapper>
    );
    
    // Check default values
    expect(screen.getByTestId('original-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('width')).toHaveTextContent('0');
    expect(screen.getByTestId('height')).toHaveTextContent('0');
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('1');
    expect(screen.getByTestId('drawing-mode')).toHaveTextContent('draw');
    expect(screen.getByTestId('brush-size')).toHaveTextContent('10');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
  });
});