import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { CanvasProvider, useCanvasContext } from '../../contexts/CanvasContext';

// Create a test component that uses the context
const TestComponent = () => {
  const { 
    strokes,
    addStroke,
    clearCanvas,
    handleUndo
  } = useCanvasContext();
  
  return (
    <div>
      <div data-testid="strokes-count">{strokes.length}</div>
      <div data-testid="strokes-json">{JSON.stringify(strokes)}</div>
      <button onClick={() => addStroke({ 
        mode: 'draw', 
        brushSize: 10, 
        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }] 
      })}>
        Add Stroke
      </button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={clearCanvas}>Clear Canvas</button>
    </div>
  );
};

describe('CanvasContext', () => {
  test('provides default values', () => {
    render(
      <CanvasProvider>
        <TestComponent />
      </CanvasProvider>
    );
    
    // Check default values
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('strokes-json')).toHaveTextContent('[]');
  });

  test('adds a stroke', () => {
    render(
      <CanvasProvider>
        <TestComponent />
      </CanvasProvider>
    );
    
    // Click the button to add a stroke
    act(() => {
      screen.getByRole('button', { name: 'Add Stroke' }).click();
    });
    
    // Check that the stroke was added
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    
    // Verify stroke data
    const strokesJson = JSON.parse(screen.getByTestId('strokes-json').textContent);
    expect(strokesJson).toHaveLength(1);
    expect(strokesJson[0].mode).toBe('draw');
    expect(strokesJson[0].brushSize).toBe(10);
    expect(strokesJson[0].points).toHaveLength(2);
  });

  test('undoes a stroke', () => {
    render(
      <CanvasProvider>
        <TestComponent />
      </CanvasProvider>
    );
    
    // Add a stroke
    act(() => {
      screen.getByRole('button', { name: 'Add Stroke' }).click();
    });
    
    // Verify stroke was added
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    
    // Click the button to undo
    act(() => {
      screen.getByRole('button', { name: 'Undo' }).click();
    });
    
    // Check that the stroke was removed
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
  });

  test('clears all strokes', () => {
    render(
      <CanvasProvider>
        <TestComponent />
      </CanvasProvider>
    );
    
    // Add multiple strokes
    act(() => {
      screen.getByRole('button', { name: 'Add Stroke' }).click();
      screen.getByRole('button', { name: 'Add Stroke' }).click();
      screen.getByRole('button', { name: 'Add Stroke' }).click();
    });
    
    // Verify strokes were added
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('3');
    
    // Click the button to clear canvas
    act(() => {
      screen.getByRole('button', { name: 'Clear Canvas' }).click();
    });
    
    // Check that all strokes were removed
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
  });

  test('memoizes context value to prevent unnecessary re-renders', () => {
    // Create a mock component that counts renders
    let renderCount = 0;
    const RenderCounter = () => {
      const contextValue = useCanvasContext();
      renderCount++;
      return <div data-testid="render-count">{renderCount}</div>;
    };

    const { rerender } = render(
      <CanvasProvider>
        <RenderCounter />
      </CanvasProvider>
    );

    // Initial render
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
    
    // Rerender parent without changing context
    rerender(
      <CanvasProvider>
        <RenderCounter />
      </CanvasProvider>
    );

    // Render count should still be 1 since context value is memoized
    expect(screen.getByTestId('render-count')).toHaveTextContent('1');
  });

  test('memoizes callback functions to prevent unnecessary re-renders', () => {
    // Create a component that renders when callbacks change
    const CallbackTester = () => {
      const { addStroke, handleUndo, clearCanvas } = useCanvasContext();
      
      // This effect will run if any of the callbacks change identity
      React.useEffect(() => {
        renderCount++;
      }, [addStroke, handleUndo, clearCanvas]);
      
      return null;
    };

    let renderCount = 0;
    
    const { rerender } = render(
      <CanvasProvider>
        <CallbackTester />
        <div data-testid="render-count">{renderCount}</div>
      </CanvasProvider>
    );

    // Initial render
    expect(renderCount).toBe(1);
    
    // Rerender parent
    rerender(
      <CanvasProvider>
        <CallbackTester />
        <div data-testid="render-count">{renderCount}</div>
      </CanvasProvider>
    );

    // Render count should still be 1 since callbacks are memoized
    expect(renderCount).toBe(1);
  });
});