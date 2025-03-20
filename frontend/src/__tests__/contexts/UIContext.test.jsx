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

  test('provides memoized functions', () => {
    // This test verifies that the context provides the expected functions
    render(
      <UIProvider>
        <TestComponent />
      </UIProvider>
    );
    
    // Get the buttons that use the memoized functions
    const setDrawingModeButton = screen.getByRole('button', { name: 'Set Drawing Mode' });
    const setBrushSizeButton = screen.getByRole('button', { name: 'Set Brush Size' });
    const setLoadingButton = screen.getByRole('button', { name: 'Set Loading' });
    const setErrorButton = screen.getByRole('button', { name: 'Set Error' });
    
    // Verify that the buttons exist and are clickable
    expect(setDrawingModeButton).toBeInTheDocument();
    expect(setBrushSizeButton).toBeInTheDocument();
    expect(setLoadingButton).toBeInTheDocument();
    expect(setErrorButton).toBeInTheDocument();
    
    // Test that the functions work as expected
    act(() => {
      setDrawingModeButton.click();
    });
    expect(screen.getByTestId('drawing-mode')).toHaveTextContent('erase');
    
    act(() => {
      setBrushSizeButton.click();
    });
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
    
    act(() => {
      setLoadingButton.click();
    });
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    
    act(() => {
      setErrorButton.click();
    });
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });
});