import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AllProvidersWrapper } from '../../contexts/AppContexts';
import { useUIContext } from '../../contexts/UIContext';
import { useCanvasContext } from '../../contexts/CanvasContext';
import { useAppContext } from '../../contexts/AppContext';

// Create a test component that uses all contexts
const TestComponent = () => {
  const { brushSize, setBrushSize } = useUIContext();
  const { strokes, addStroke } = useCanvasContext();
  const { displayImage, setDisplayImage } = useAppContext();
  
  return (
    <div>
      <div data-testid="brush-size">{brushSize}</div>
      <div data-testid="strokes-count">{strokes.length}</div>
      <div data-testid="display-image">{displayImage || 'no-image'}</div>
      
      <button onClick={() => setBrushSize(20)}>Set Brush Size</button>
      <button onClick={() => addStroke({ 
        mode: 'draw', 
        brushSize: 10, 
        points: [{ x: 10, y: 10 }] 
      })}>
        Add Stroke
      </button>
      <button onClick={() => setDisplayImage('test-display.jpg')}>Set Display Image</button>
    </div>
  );
};

describe('Combined Context Providers', () => {
  test('provides access to all contexts', () => {
    render(
      <AllProvidersWrapper>
        <TestComponent />
      </AllProvidersWrapper>
    );
    
    // Check default values from all contexts
    expect(screen.getByTestId('brush-size')).toHaveTextContent('10');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    
    // Update values in all contexts
    act(() => {
      screen.getByRole('button', { name: 'Set Brush Size' }).click();
      screen.getByRole('button', { name: 'Add Stroke' }).click();
      screen.getByRole('button', { name: 'Set Display Image' }).click();
    });
    
    // Check that all values were updated
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('display-image')).toHaveTextContent('test-display.jpg');
  });

  test('contexts do not interfere with each other', () => {
    // Create a component that tracks render counts for each context
    let uiRenderCount = 0;
    let canvasRenderCount = 0;
    let appRenderCount = 0;
    
    const RenderCounter = () => {
      const ui = useUIContext();
      uiRenderCount++;
      
      const canvas = useCanvasContext();
      canvasRenderCount++;
      
      const app = useAppContext();
      appRenderCount++;
      
      return (
        <div>
          <div data-testid="ui-renders">{uiRenderCount}</div>
          <div data-testid="canvas-renders">{canvasRenderCount}</div>
          <div data-testid="app-renders">{appRenderCount}</div>
          <button onClick={() => ui.setBrushSize(20)}>Update UI</button>
          <button onClick={() => canvas.addStroke({})}>Update Canvas</button>
          <button onClick={() => app.setDisplayImage('test.jpg')}>Update App</button>
        </div>
      );
    };

    render(
      <AllProvidersWrapper>
        <RenderCounter />
      </AllProvidersWrapper>
    );
    
    // Initial render counts
    expect(screen.getByTestId('ui-renders')).toHaveTextContent('1');
    expect(screen.getByTestId('canvas-renders')).toHaveTextContent('1');
    expect(screen.getByTestId('app-renders')).toHaveTextContent('1');
    
    // Update only UI context
    act(() => {
      screen.getByRole('button', { name: 'Update UI' }).click();
    });
    
    // Only UI render count should increase
    expect(screen.getByTestId('ui-renders')).toHaveTextContent('2');
    expect(screen.getByTestId('canvas-renders')).toHaveTextContent('1');
    expect(screen.getByTestId('app-renders')).toHaveTextContent('1');
    
    // Update only Canvas context
    act(() => {
      screen.getByRole('button', { name: 'Update Canvas' }).click();
    });
    
    // Only Canvas render count should increase
    expect(screen.getByTestId('ui-renders')).toHaveTextContent('2');
    expect(screen.getByTestId('canvas-renders')).toHaveTextContent('2');
    expect(screen.getByTestId('app-renders')).toHaveTextContent('1');
    
    // Update only App context
    act(() => {
      screen.getByRole('button', { name: 'Update App' }).click();
    });
    
    // Only App render count should increase
    expect(screen.getByTestId('ui-renders')).toHaveTextContent('2');
    expect(screen.getByTestId('canvas-renders')).toHaveTextContent('2');
    expect(screen.getByTestId('app-renders')).toHaveTextContent('2');
  });
});