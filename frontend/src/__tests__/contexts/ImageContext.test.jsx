import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ImageProvider, useImageContext } from '../../contexts/ImageContext';

// Create a test component that uses the context
const TestComponent = () => {
  const context = useImageContext();
  return (
    <div>
      <div data-testid="original-image">{context.originalImage || 'no-image'}</div>
      <div data-testid="display-image">{context.displayImage || 'no-image'}</div>
      <div data-testid="width">{context.originalDimensions.width}</div>
      <div data-testid="height">{context.originalDimensions.height}</div>
      <div data-testid="scale-factor">{context.scaleFactor}</div>
      <div data-testid="drawing-mode">{context.drawingMode}</div>
      <div data-testid="brush-size">{context.brushSize}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error || 'no-error'}</div>
      <button onClick={() => context.setOriginalImage('test-image.jpg')}>Set Original Image</button>
      <button onClick={() => context.setDisplayImage('test-display.jpg')}>Set Display Image</button>
      <button onClick={() => context.setOriginalDimensions({ width: 1920, height: 1080 })}>Set Dimensions</button>
      <button onClick={() => context.setScaleFactor(0.5)}>Set Scale Factor</button>
      <button onClick={() => context.setDrawingMode('erase')}>Set Drawing Mode</button>
      <button onClick={() => context.setBrushSize(20)}>Set Brush Size</button>
      <button onClick={() => context.setIsLoading(true)}>Set Loading</button>
      <button onClick={() => context.setError('Test error')}>Set Error</button>
      <button onClick={context.resetState}>Reset State</button>
      <button onClick={() => context.calculateScaleFactor(1920, 1080, 800, 600)}>Calculate Scale</button>
    </div>
  );
};

describe('ImageContext', () => {
  test('provides default values', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
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
  });

  test('updates originalImage state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update originalImage
    act(() => {
      screen.getByRole('button', { name: 'Set Original Image' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('original-image')).toHaveTextContent('test-image.jpg');
  });

  test('updates displayImage state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update displayImage
    act(() => {
      screen.getByRole('button', { name: 'Set Display Image' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('display-image')).toHaveTextContent('test-display.jpg');
  });

  test('updates originalDimensions state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update originalDimensions
    act(() => {
      screen.getByRole('button', { name: 'Set Dimensions' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('width')).toHaveTextContent('1920');
    expect(screen.getByTestId('height')).toHaveTextContent('1080');
  });

  test('updates scaleFactor state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update scaleFactor
    act(() => {
      screen.getByRole('button', { name: 'Set Scale Factor' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('0.5');
  });

  test('updates drawingMode state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update drawingMode
    act(() => {
      screen.getByRole('button', { name: 'Set Drawing Mode' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('drawing-mode')).toHaveTextContent('erase');
  });

  test('updates brushSize state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update brushSize
    act(() => {
      screen.getByRole('button', { name: 'Set Brush Size' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
  });

  test('updates isLoading state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update isLoading
    act(() => {
      screen.getByRole('button', { name: 'Set Loading' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  test('updates error state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to update error
    act(() => {
      screen.getByRole('button', { name: 'Set Error' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  test('resets state', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Update several state values
    act(() => {
      screen.getByRole('button', { name: 'Set Original Image' }).click();
      screen.getByRole('button', { name: 'Set Display Image' }).click();
      screen.getByRole('button', { name: 'Set Dimensions' }).click();
      screen.getByRole('button', { name: 'Set Scale Factor' }).click();
      screen.getByRole('button', { name: 'Set Drawing Mode' }).click();
      screen.getByRole('button', { name: 'Set Brush Size' }).click();
      screen.getByRole('button', { name: 'Set Loading' }).click();
      screen.getByRole('button', { name: 'Set Error' }).click();
    });
    
    // Click the button to reset state
    act(() => {
      screen.getByRole('button', { name: 'Reset State' }).click();
    });
    
    // Check that all state values were reset to defaults
    expect(screen.getByTestId('original-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('width')).toHaveTextContent('0');
    expect(screen.getByTestId('height')).toHaveTextContent('0');
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('1');
    expect(screen.getByTestId('drawing-mode')).toHaveTextContent('draw');
    expect(screen.getByTestId('brush-size')).toHaveTextContent('10');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('calculates scale factor correctly', () => {
    render(
      <ImageProvider>
        <TestComponent />
      </ImageProvider>
    );
    
    // Click the button to calculate scale factor
    act(() => {
      screen.getByRole('button', { name: 'Calculate Scale' }).click();
    });
    
    // Check that the scale factor was calculated correctly
    // For 1920x1080 image in 800x600 container, scale should be 800/1920 = 0.4166...
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('0.4');
  });
});