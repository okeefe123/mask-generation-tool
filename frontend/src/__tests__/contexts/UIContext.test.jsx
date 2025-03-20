import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { UIProvider, useUIContext } from '../../contexts/UIContext';

// Create a test component that uses the context
const TestComponent = () => {
  const { 
    drawingMode, setDrawingMode,
    brushSize, setBrushSize,
    isLoading, setIsLoading,
    error, setError
  } = useUIContext();
  
  return (
    <div>
      <div data-testid="drawing-mode">{drawingMode}</div>
      <div data-testid="brush-size">{brushSize}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => setDrawingMode('erase')}>Set Drawing Mode</button>
      <button onClick={() => setBrushSize(20)}>Set Brush Size</button>
      <button onClick={() => setIsLoading(true)}>Set Loading</button>
      <button onClick={() => setError('Test error')}>Set Error</button>
    </div>
  );
};

describe('UIContext', () => {
  test('provides default values', () => {
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );
    
    // Check default values
    expect(screen.getByTestId('drawing-mode')).toHaveTextContent('draw');
    expect(screen.getByTestId('brush-size')).toHaveTextContent('10');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  test('updates drawingMode state', () => {
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
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
      <UIProvider>
        <TestComponent />
      </UIProvider>
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
      <UIProvider>
        <TestComponent />
      </UIProvider>
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
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );
    
    // Click the button to update error
    act(() => {
      screen.getByRole('button', { name: 'Set Error' }).click();
    });
    
    // Check that the state was updated
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  test('memoizes context value to prevent unnecessary re-renders', () => {
    // Create a mock component that counts renders
    let renderCount = 0;
    const RenderCounter = () => {
      const contextValue = useUIContext();
      renderCount++;
      return <div data-testid="render-count">{renderCount}</div>;
    };

    const { rerender } = render(
      <UIProvider>
        <RenderCounter />
      </UIProvider>
    );

    // Initial render
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    
    // Rerender parent without changing context
    rerender(
      <UIProvider>
        <RenderCounter />
      </UIProvider>
    );

    // Render count should still be 1 since context value is memoized
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
  });
});