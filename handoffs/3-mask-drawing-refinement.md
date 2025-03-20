# Mask Drawing Refinement Handoff - 2025-03-20

## Summary
After successfully implementing the visual design system, we now need to refine the mask drawing functionality. This phase focuses on improving the drawing experience by removing redundant UI elements, ensuring consistent brush stroke opacity, and guaranteeing that masks are represented as pure black/white. These refinements will make the tool more intuitive to use and produce more reliable masks for downstream processing.

## Priority Development Requirements (PDR)
- **HIGH**: Remove redundant image editing options at the bottom of the screen to eliminate UI confusion
- **HIGH**: Update brush logic to ensure consistent opacity regardless of layering or brush time
- **HIGH**: Ensure mask representation is pure black/white (255 for any brush stroke area)
- **MEDIUM**: Implement all changes using Test Driven Design principles

## Discoveries
- The current implementation allows transparency layering, creating inconsistent mask opacity
- There are redundant image editing options that appear at both the toolbar and bottom card
- The mask representation includes varying levels of transparency rather than a binary (black/white) state
- The canvas drawing logic needs significant refactoring to support consistent behavior

## Problems & Solutions
- **Problem**: Redundant UI elements causing user confusion
  **Solution**: Remove the image editing options at the bottom of the screen since these are already available in the toolbar

- **Problem**: Inconsistent stroke opacity depending on drawing time and layering
  **Solution**: Modify the brush logic to only track whether a pixel has been touched by the brush, not how many times or for how long

- **Problem**: Mask representation includes transparency rather than binary black/white
  **Solution**: Ensure any pixel touched by the brush is represented as pure white (255) in the mask, regardless of previous transparency

## Work in Progress
- [Phase 1: State Management Refactoring]: 100%
- [Phase 2: UI Layout Restructuring]: 100%
- [Phase 3: Visual Design System]: 100%
- [Phase 4: Mask Drawing Refinement]: 0%

## Deviations
- Our initial approach to brush strokes allowed for varying opacity, but we're now shifting to a binary mask representation for all pixels

## References
- [handoffs/2-visual-design-system.md]
- [frontend/src/components/DrawingCanvas.jsx]
- [frontend/src/components/Toolbar.jsx]

## Implementation Steps

### 1. Test-Driven Implementation Plan

#### Step 1: Remove Redundant UI Elements
1. Write tests to verify toolbar functionality
2. Write tests to verify the image editing options removal doesn't break functionality
3. Remove the redundant UI elements
4. Run tests to verify functionality is maintained

#### Step 2: Update Brush Logic
1. Write tests to verify expected brush behavior with single opacity
2. Test for cases where brush strokes overlap
3. Modify brush stroke drawing function to maintain consistent opacity
4. Run tests to verify new behavior

#### Step 3: Ensure Binary Mask Representation
1. Write tests to verify mask pixel values are binary (0 or 255)
2. Update mask generation code to convert any non-zero opacity to full white (255)
3. Test mask export functionality to ensure binary output
4. Run integration tests to verify end-to-end workflow

### 2. Component Modifications

```jsx
// Modify DrawingCanvas.jsx to update brush drawing logic
function draw(event) {
  if (!isDrawing) return;
  
  const ctx = canvasRef.current.getContext('2d');
  
  // Set consistent opacity (no transparency layering)
  ctx.globalAlpha = 1.0;
  
  // Draw the line
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.stroke();
  
  // Update for next frame
  [lastX, lastY] = [event.offsetX, event.offsetY];
}

// Update mask generation function in CanvasContext.jsx
function generateMask() {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = canvasWidth;
  maskCanvas.height = canvasHeight;
  const maskCtx = maskCanvas.getContext('2d');
  
  // Draw the canvas content
  maskCtx.drawImage(canvasRef.current, 0, 0);
  
  // Get the image data
  const imageData = maskCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;
  
  // Convert to binary mask (0 or 255)
  for (let i = 0; i < data.length; i += 4) {
    // If pixel has any opacity/value, set it to full white
    if (data[i+3] > 0) {
      data[i] = 255;    // R
      data[i+1] = 255;  // G
      data[i+2] = 255;  // B
      data[i+3] = 255;  // A
    } else {
      data[i] = 0;      // R
      data[i+1] = 0;    // G
      data[i+2] = 0;    // B
      data[i+3] = 255;  // A
    }
  }
  
  // Put the modified image data back
  maskCtx.putImageData(imageData, 0, 0);
  
  return maskCanvas;
}
```

### 3. Test Examples

```jsx
// Test for binary mask representation
test('ensures mask pixels are binary black or white', () => {
  // Setup canvas with some strokes
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Draw some strokes with different overlaps
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(50, 50);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.lineTo(80, 10);
  ctx.stroke();
  
  // Generate mask
  const mask = generateMask(canvas);
  const maskCtx = mask.getContext('2d');
  const imageData = maskCtx.getImageData(0, 0, mask.width, mask.height);
  const data = imageData.data;
  
  // Verify all non-transparent pixels are pure white
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] > 0) {
      expect(data[i]).toEqual(255);   // R
      expect(data[i+1]).toEqual(255); // G
      expect(data[i+2]).toEqual(255); // B
      expect(data[i+3]).toEqual(255); // A (fully opaque)
    } else {
      expect(data[i]).toEqual(0);     // R
      expect(data[i+1]).toEqual(0);   // G
      expect(data[i+2]).toEqual(0);   // B
      expect(data[i+3]).toEqual(255); // A (fully opaque)
    }
  }
});
