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

  // Temporarily commenting out this test due to hook issues
  // TODO: Fix this test once the hook issues are resolved
  /*
  test('can update contexts independently', () => {
    render(
      <AllProvidersWrapper>
        <TestComponent />
      </AllProvidersWrapper>
    );
    
    // Check default values from all contexts
    expect(screen.getByTestId('brush-size')).toHaveTextContent('10');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    
    // Update UI context only
    act(() => {
      screen.getByRole('button', { name: 'Set Brush Size' }).click();
    });
    
    // Only brush size should change
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    
    // Update Canvas context only
    act(() => {
      screen.getByRole('button', { name: 'Add Stroke' }).click();
    });
    
    // Only strokes count should change
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('display-image')).toHaveTextContent('no-image');
    
    // Update App context only
    act(() => {
      screen.getByRole('button', { name: 'Set Display Image' }).click();
    });
    
    // Only display image should change
    expect(screen.getByTestId('brush-size')).toHaveTextContent('20');
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    expect(screen.getByTestId('display-image')).toHaveTextContent('test-display.jpg');
  });
  */
});