import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider, useAppContext } from '../../contexts/AppContext';

// Create a test component that uses the context
const TestComponent = () => {
  const {
    originalImage, setOriginalImage,
    displayImage, setDisplayImage,
    imageId, setImageId,
    originalFileName, setOriginalFileName,
    originalDimensions, setOriginalDimensions,
    scaleFactor,
    resetState,
    calculateScaleFactor
  } = useAppContext();
  
  return (
    <div>
      <div data-testid="original-image">{originalImage || 'no-image'}</div>
      <div data-testid="display-image">{displayImage || 'no-image'}</div>
      <div data-testid="image-id">{imageId || 'no-id'}</div>
      <div data-testid="original-file-name">{originalFileName || 'no-filename'}</div>
      <div data-testid="width">{originalDimensions.width}</div>
      <div data-testid="height">{originalDimensions.height}</div>
      <div data-testid="scale-factor">{scaleFactor}</div>
      
      <button onClick={() => setOriginalImage('test-image.jpg')}>Set Original Image</button>
      <button onClick={() => setDisplayImage('test-display.jpg')}>Set Display Image</button>
      <button onClick={() => setImageId('123')}>Set Image ID</button>
      <button onClick={() => setOriginalFileName('test.jpg')}>Set Filename</button>
      <button onClick={() => setOriginalDimensions({ width: 1920, height: 1080 })}>Set Dimensions</button>
      <button onClick={() => calculateScaleFactor(1920, 1080, 800, 600)}>Calculate Scale</button>
      <button onClick={resetState}>Reset State</button>
    </div>
  );
};

describe('AppContext', () => {
  test('provides default values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Check default values
    expect(screen.getByTestId('original-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('image-id')).toHaveTextContent('no-id');
    expect(screen.getByTestId('original-file-name')).toHaveTextContent('no-filename');
    expect(screen.getByTestId('width')).toHaveTextContent('0');
    expect(screen.getByTestId('height')).toHaveTextContent('0');
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('1');
  });

  test('updates originalImage state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
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
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Click the button to update displayImage
    act(() => {
      screen.getByRole('button', { name: 'Set Display Image' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('display-image')).toHaveTextContent('test-display.jpg');
  });

  test('updates imageId state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Click the button to update imageId
    act(() => {
      screen.getByRole('button', { name: 'Set Image ID' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('image-id')).toHaveTextContent('123');
  });

  test('updates originalFileName state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Click the button to update originalFileName
    act(() => {
      screen.getByRole('button', { name: 'Set Filename' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('original-file-name')).toHaveTextContent('test.jpg');
  });

  test('updates originalDimensions state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Click the button to update originalDimensions
    act(() => {
      screen.getByRole('button', { name: 'Set Dimensions' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('width')).toHaveTextContent('1920');
    expect(screen.getByTestId('height')).toHaveTextContent('1080');
  });

  test('calculates scale factor correctly', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Click the button to calculate scale factor
    act(() => {
      screen.getByRole('button', { name: 'Calculate Scale' }).click();
    });
    
    // Check that the scale factor was calculated correctly
    // For 1920x1080 image in 800x600 container, scale should be 800/1920 = 0.4166...
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('0.4');
  });

  test('resets state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    
    // Update several state values
    act(() => {
      screen.getByRole('button', { name: 'Set Original Image' }).click();
      screen.getByRole('button', { name: 'Set Display Image' }).click();
      screen.getByRole('button', { name: 'Set Image ID' }).click();
      screen.getByRole('button', { name: 'Set Filename' }).click();
      screen.getByRole('button', { name: 'Set Dimensions' }).click();
    });
    
    // Verify states were updated
    expect(screen.getByTestId('original-image')).toHaveTextContent('test-image.jpg');
    expect(screen.getByTestId('display-image')).toHaveTextContent('test-display.jpg');
    
    // Click the button to reset state
    act(() => {
      screen.getByRole('button', { name: 'Reset State' }).click();
    });
    
    // Check that all state values were reset to defaults
    expect(screen.getByTestId('original-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    expect(screen.getByTestId('image-id')).toHaveTextContent('no-id');
    expect(screen.getByTestId('original-file-name')).toHaveTextContent('no-filename');
    expect(screen.getByTestId('width')).toHaveTextContent('0');
    expect(screen.getByTestId('height')).toHaveTextContent('0');
    expect(screen.getByTestId('scale-factor')).toHaveTextContent('1');
  });

  test('memoizes context value to prevent unnecessary re-renders', () => {
    // Create a mock component that counts renders
    let renderCount = 0;
    const RenderCounter = () => {
      const contextValue = useAppContext();
      renderCount++;
      return <div data-testid="render-count">{renderCount}</div>;
    };

    const { rerender } = render(
      <AppProvider>
        <RenderCounter />
      </AppProvider>
    );

    // Initial render
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    
    // Rerender parent without changing context
    rerender(
      <AppProvider>
        <RenderCounter />
      </AppProvider>
    );

    // Render count should still be 1 since context value is memoized
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
  });
});