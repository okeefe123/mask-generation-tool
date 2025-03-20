import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import React, { useEffect } from 'react';
import { CanvasProvider, useCanvasContext } from '../../contexts/CanvasContext';
import { AppProvider } from '../../contexts/AppContext';

// Mock the saveImageMask function
vi.mock('../../services/api', () => ({
  saveMask: vi.fn().mockResolvedValue({ id: 'mock-mask-id' })
}));

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
      <AppProvider>
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      </AppProvider>
    );
    
    // Check default values
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
    expect(screen.getByTestId('strokes-json')).toHaveTextContent('[]');
  });

  test('adds a stroke', () => {
    render(
      <AppProvider>
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      </AppProvider>
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
      <AppProvider>
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      </AppProvider>
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
      <AppProvider>
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      </AppProvider>
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

  test('provides memoized functions', () => {
    // This test simply verifies that the context provides the expected functions
    render(
      <AppProvider>
        <CanvasProvider>
          <TestComponent />
        </CanvasProvider>
      </AppProvider>
    );
    
    // Get the buttons that use the memoized functions
    const addButton = screen.getByRole('button', { name: 'Add Stroke' });
    const undoButton = screen.getByRole('button', { name: 'Undo' });
    const clearButton = screen.getByRole('button', { name: 'Clear Canvas' });
    
    // Verify that the buttons exist and are clickable
    expect(addButton).toBeInTheDocument();
    expect(undoButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
    
    // Test that the functions work as expected
    act(() => {
      addButton.click();
      addButton.click();
    });
    
    // Should have 2 strokes
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('2');
    
    // Undo one stroke
    act(() => {
      undoButton.click();
    });
    
    // Should have 1 stroke
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('1');
    
    // Clear all strokes
    act(() => {
      clearButton.click();
    });
    
    // Should have 0 strokes
    expect(screen.getByTestId('strokes-count')).toHaveTextContent('0');
  });
});