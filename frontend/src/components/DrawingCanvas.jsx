import { useRef, useEffect, useState, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { useImageContext, useUIContext, useCanvasContext } from '../contexts/AppContexts';

const DrawingCanvas = ({ onCanvasReady }) => {
  // Create a ref to the parent image element
  const imageRef = useRef(null);
  // Internal refs and state
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const currentStroke = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  
  // Get state from contexts
  const {
    displayImage,
    originalDimensions,
    scaleFactor,
  } = useImageContext();
  
  const {
    drawingMode,
    brushSize,
    brushShape,
    isLoading,
    setIsLoading,
  } = useUIContext();
  
  const {
    strokes,
    addStroke,
    handleUndo,
    clearCanvas: clearCanvasStrokes,
    getCurrentStrokes
  } = useCanvasContext();
  
  // Handle undoing last stroke - delegate to context
  const undoHandler = useCallback(() => {
    console.log('Undo requested');
    handleUndo();
  }, [handleUndo]);
  
  // Monitor loading state changes
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  // Function to set up canvas context with current drawing settings
  const setupContext = useCallback((ctx) => {
    // Set line style based on brush shape
    if (brushShape === 'circle') {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
    } else {
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
    }
    
    ctx.lineWidth = brushSize;
    // Use transparent strokes for drawing mode, but solid black for eraser
    ctx.strokeStyle = drawingMode === 'draw' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 1)';
    // Add fillStyle to match strokeStyle for fill operations (dots)
    ctx.fillStyle = drawingMode === 'draw' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 1)';
    // Use 'destination-out' for eraser to completely remove pixels
    ctx.globalCompositeOperation = drawingMode === 'draw' ? 'source-over' : 'destination-out';
  }, [brushSize, drawingMode, brushShape]);
  
  // Function to redraw all strokes
  const redrawCanvas = useCallback(() => {
    // Get current strokes from context
    const currentStrokes = getCurrentStrokes();
    console.log('Redrawing canvas with strokes:', currentStrokes.length);
    
    if (!canvasRef.current) {
      console.warn('Canvas ref is null during redraw');
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Only attempt to redraw if there are strokes
    if (currentStrokes && currentStrokes.length > 0) {
      // Filter out any null strokes
      const validStrokes = currentStrokes.filter(stroke =>
        stroke !== null && stroke.points && stroke.points.length > 0
      );
      
      console.log('Drawing', validStrokes.length, 'valid strokes');
      
      // Create a temporary canvas to track areas that have been drawn on
      // This helps prevent opacity layering while maintaining visual feedback
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = 'black';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Process each stroke one by one
      for (let i = 0; i < validStrokes.length; i++) {
        const stroke = validStrokes[i];
        
        // Set up context for this stroke
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = stroke.brushSize;
        // Use transparent strokes for both drawing and erasing modes
        ctx.strokeStyle = stroke.mode === 'draw' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 1)';
        ctx.fillStyle = stroke.mode === 'draw' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 1)';
        
        // Use appropriate compositing mode
        if (stroke.mode === 'draw') {
          // Use source-over for drawing with semi-transparency
          ctx.globalCompositeOperation = 'source-over';
          // Ensure consistent alpha for drawing
          ctx.globalAlpha = 0.6;
        } else {
          // For erasing: use destination-out with full opacity to completely remove pixels
          ctx.globalCompositeOperation = 'destination-out';
          ctx.globalAlpha = 1.0;
        }
        
        // Draw the stroke
        const firstPoint = stroke.points[0];
        if (!firstPoint) {
          console.warn('Stroke has no points:', stroke);
          continue;
        }
        
        // Determine shape - default to circle for backward compatibility
        const shape = stroke.brushShape || 'circle';
        
        // Set line style based on brush shape
        if (shape === 'circle') {
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
        } else {
          ctx.lineJoin = 'miter';
          ctx.lineCap = 'butt';
        }
        
        if (stroke.points.length === 1) {
          // Draw a dot for single clicks
          if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(firstPoint.x, firstPoint.y, stroke.brushSize / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Draw a square
            const halfSize = stroke.brushSize / 2;
            ctx.fillRect(firstPoint.x - halfSize, firstPoint.y - halfSize, stroke.brushSize, stroke.brushSize);
          }
        } else {
          // Draw lines for multi-point strokes
          
          if (shape === 'circle') {
            // For circle brushes, use standard stroke method
            ctx.beginPath();
            ctx.moveTo(firstPoint.x, firstPoint.y);
            
            for (let j = 1; j < stroke.points.length; j++) {
              const point = stroke.points[j];
              if (!point) continue;
              ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
          } else {
            // For square brushes, draw a series of squares along the path
            const halfSize = stroke.brushSize / 2;
            
            // Use a separate canvas to prevent overlapping areas from becoming darker
            const squareCanvas = document.createElement('canvas');
            squareCanvas.width = canvasRef.current.width;
            squareCanvas.height = canvasRef.current.height;
            const squareCtx = squareCanvas.getContext('2d');
            
            // Set same opacity as circle
            squareCtx.fillStyle = 'rgb(255, 255, 255)';
            squareCtx.globalAlpha = 1.0;
            
            // Draw a square at the first point
            squareCtx.fillRect(firstPoint.x - halfSize, firstPoint.y - halfSize, stroke.brushSize, stroke.brushSize);
            
            // Draw squares along each line segment
            for (let j = 1; j < stroke.points.length; j++) {
              const point = stroke.points[j];
              const prevPoint = stroke.points[j-1];
              if (!point || !prevPoint) continue;
              
              // Draw a square at the current point
              squareCtx.fillRect(point.x - halfSize, point.y - halfSize, stroke.brushSize, stroke.brushSize);
              
              // Calculate distance between points
              const dx = point.x - prevPoint.x;
              const dy = point.y - prevPoint.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // If distance is larger than half the brush size, interpolate points
              if (distance > stroke.brushSize / 2) {
                const steps = Math.ceil(distance / (stroke.brushSize / 2));
                for (let k = 1; k < steps; k++) {
                  const t = k / steps;
                  const interpX = prevPoint.x + dx * t;
                  const interpY = prevPoint.y + dy * t;
                  squareCtx.fillRect(interpX - halfSize, interpY - halfSize, stroke.brushSize, stroke.brushSize);
                }
              }
            }
            
            // Now draw the square brush content onto the main canvas with proper opacity
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.drawImage(squareCanvas, 0, 0);
            ctx.restore();
          }
        }
        
        // Reset global alpha to default after this stroke is complete
        ctx.globalAlpha = 1.0;
      }
    }
    
    // Reset context to current drawing settings
    setupContext(ctx);
  }, [getCurrentStrokes, setupContext]);
  
  // Clear the canvas and strokes array
  const clearCanvas = useCallback(() => {
    console.log('Clearing canvas');
    if (!canvasRef.current) {
      console.warn('Canvas ref is null during clear');
      return;
    }
    
    // Clear strokes in context
    clearCanvasStrokes();
    
    // Clear canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, [clearCanvasStrokes]);
  
  // Notify parent component when canvas is ready and expose undo function
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Canvas is ready, notifying parent:', canvasRef.current);
      // Add undo method to canvas element
      canvasRef.current.undo = undoHandler;
      // Add clear method to canvas element
      canvasRef.current.clear = clearCanvas;
      onCanvasReady(canvasRef.current);
    }
  }, [canvasRef.current, onCanvasReady, undoHandler, clearCanvas]);
  
  // Debug - log when the canvas element is created or changes
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Canvas element:', canvasRef.current);
      console.log('Canvas is valid:', canvasRef.current.tagName === 'CANVAS');
      
      // Add a data attribute to help with debugging
      canvasRef.current.setAttribute('data-component', 'DrawingCanvas');
    } else {
      console.warn('Canvas ref is null!');
    }
  }, [canvasRef.current]);

  // Find the image element in the parent
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Find the image element using the ID (more reliable than DOM traversal)
    const imgElement = document.getElementById('source-image');
    
    if (imgElement) {
      console.log('Found source image element by ID:', imgElement);
      imageRef.current = imgElement;
    } else {
      console.warn('Could not find image element with ID "source-image"');
      
      // Fallback to the old parent container approach
      try {
        const parentContainer = canvasRef.current.parentElement.parentElement;
        const fallbackImage = parentContainer.querySelector('img');
        
        if (fallbackImage) {
          console.log('Found image element via fallback approach:', fallbackImage);
          imageRef.current = fallbackImage;
        } else {
          console.error('Could not find any image element for canvas to overlay');
        }
      } catch (err) {
        console.error('Error finding parent image element:', err);
      }
    }
  }, [canvasRef.current, displayImage]);

  // Initialize canvas when displayImage changes
  useEffect(() => {
    if (!displayImage || !canvasRef.current) {
      console.log('Cannot initialize canvas - missing displayImage or canvas', {
        hasDisplayImage: !!displayImage,
        hasCanvas: !!canvasRef.current
      });
      return;
    }
    
    const canvas = canvasRef.current;
    
    // Function to set up the canvas
    const initializeCanvas = () => {
      // Try to get the source image from various methods
      let sourceImg = imageRef.current || document.getElementById('source-image');
      
      if (!sourceImg) {
        console.warn('Image reference not found during initialization, trying fallback methods');
        
        // Try to find image using DOM traversal
        try {
          sourceImg = canvas.parentElement.parentElement.querySelector('img');
        } catch (err) {
          console.error('Error finding image element:', err);
        }
      }
      
      if (!sourceImg) {
        console.error('Cannot find source image for canvas dimensions');
        return;
      }
      
      console.log('Setting canvas dimensions to match image:', {
        imgWidth: sourceImg.clientWidth,
        imgHeight: sourceImg.clientHeight,
        naturalWidth: sourceImg.naturalWidth,
        naturalHeight: sourceImg.naturalHeight,
        sourceImgId: sourceImg.id
      });
      
      // Get dimensions while preserving aspect ratio
      let width, height;
      
      // If we have original dimensions, use them to calculate proper aspect ratio
      if (originalDimensions.width && originalDimensions.height) {
        const originalAspectRatio = originalDimensions.width / originalDimensions.height;
        
        // Use client width as base but ensure correct aspect ratio
        if (sourceImg.clientWidth && sourceImg.clientHeight) {
          // Calculate what dimensions should be to maintain aspect ratio
          const containerHeight = sourceImg.clientHeight;
          const containerWidth = sourceImg.clientWidth;
          
          console.log('Original vs Container dimensions:', {
            originalWidth: originalDimensions.width,
            originalHeight: originalDimensions.height,
            containerWidth,
            containerHeight,
            originalAspectRatio,
            containerAspectRatio: containerWidth / containerHeight
          });
          
          // Use container width and calculate height based on aspect ratio
          width = containerWidth;
          height = width / originalAspectRatio;
          
          // If this makes height too big, use container height and calculate width
          if (height > containerHeight) {
            height = containerHeight;
            width = height * originalAspectRatio;
          }
        } else {
          // Fallback to original dimensions
          width = originalDimensions.width;
          height = originalDimensions.height;
        }
      } else {
        // Fallback to client dimensions or defaults
        width = sourceImg.clientWidth || 500;
        height = sourceImg.clientHeight || 500;
      }
      
      console.log('Setting canvas dimensions with corrected aspect ratio:', {
        width,
        height,
        aspectRatio: width / height
      });
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Also set cursor canvas dimensions
      if (cursorRef.current) {
        const cursorCanvas = cursorRef.current;
        cursorCanvas.width = width;
        cursorCanvas.height = height;
      }
      
      // Store original image dimensions as data attributes for mask generation
      if (originalDimensions.width && originalDimensions.height) {
        canvas.setAttribute('data-original-width', originalDimensions.width);
        canvas.setAttribute('data-original-height', originalDimensions.height);
        console.log('Stored original dimensions as data attributes:', originalDimensions.width, 'x', originalDimensions.height);
      } else if (sourceImg.naturalWidth && sourceImg.naturalHeight) {
        // Fallback to image natural dimensions if available
        canvas.setAttribute('data-original-width', sourceImg.naturalWidth);
        canvas.setAttribute('data-original-height', sourceImg.naturalHeight);
        console.log('Stored natural dimensions as data attributes:', sourceImg.naturalWidth, 'x', sourceImg.naturalHeight);
      }
      
      // Log canvas dimensions for debugging
      console.log('Canvas initialized:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        imageClientWidth: sourceImg.clientWidth,
        imageClientHeight: sourceImg.clientHeight,
        canvasBoundingRect: canvas.getBoundingClientRect()
      });
      
      // Set up initial context state and redraw
      const ctx = canvas.getContext('2d');
      setupContext(ctx);
      redrawCanvas();
      
      // Mark as initialized to prevent multiple initializations
      setInitialized(true);
    };
    
    // Initialize once
    if (!initialized) {
      initializeCanvas();
    }
    
  }, [displayImage, setupContext, redrawCanvas, imageRef, originalDimensions, initialized]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !imageRef.current || !displayImage) return;
      
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      // Save current drawing
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);
      
      // Resize canvas to match image
      canvas.width = imageRef.current.clientWidth;
      canvas.height = imageRef.current.clientHeight;
      
      // Restore drawing
      canvas.getContext('2d').drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayImage, imageRef]);

  // Update canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);
  
  // Add a specific effect to clear the canvas when a new image is loaded
  useEffect(() => {
    if (displayImage) {
      console.log('New image loaded, clearing canvas');
      if (canvasRef.current) {
        // Full canvas clearing operation
        const ctx = canvasRef.current.getContext('2d');
        
        // Save context state
        ctx.save();
        
        // Ensure composite operation is set to source-over for proper clearing
        ctx.globalCompositeOperation = 'source-over';
        
        // Clear the entire canvas
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // For extra measure, try to force a visual reset by drawing a transparent rect
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Restore context state
        ctx.restore();
        
        console.log('Canvas fully cleared for new image');
      }
      
      // Reset drawing state completely
      setCursorPosition({ x: 0, y: 0 });
      setLastPosition({ x: 0, y: 0 });
      setIsDrawing(false);
      currentStroke.current = null;
      
      // Make sure we redraw with proper context settings
      if (canvasRef.current) {
        setupContext(canvasRef.current.getContext('2d'));
      }
    }
  }, [displayImage, setupContext]);
  
  // Update context when drawing mode or brush size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    
    // Redraw with current settings
    redrawCanvas();
  }, [brushSize, drawingMode, setupContext, redrawCanvas]);

  // Helper function to get coordinates from different event types
  const getCoordinates = (event) => {
    let clientX, clientY;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get client coordinates based on event type
    if (event.type.includes('touch')) {
      const touch = event.touches[0] || event.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Calculate the scaling ratio between CSS size and actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Calculate the correct coordinates within the canvas
    const offsetX = (clientX - rect.left) * scaleX;
    const offsetY = (clientY - rect.top) * scaleY;
    
    return { offsetX, offsetY };
  };

  // Drawing functions
  const startDrawing = (e) => {
    if (!displayImage) return;
    console.log('Start drawing', e.type);
    
    const { offsetX, offsetY } = getCoordinates(e);
    setIsDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });
    
    // Initialize current stroke
    currentStroke.current = {
      mode: drawingMode,
      brushSize: brushSize,
      brushShape: brushShape,
      points: [{ x: offsetX, y: offsetY }]
    };
    
    // Set up context and draw a single dot
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    
    if (brushShape === 'circle') {
      // Draw a circle
      ctx.beginPath();
      ctx.arc(offsetX, offsetY, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw a square
      const halfSize = brushSize / 2;
      ctx.fillRect(offsetX - halfSize, offsetY - halfSize, brushSize, brushSize);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !displayImage) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    // Add point to current stroke
    if (currentStroke.current) {
      currentStroke.current.points.push({ x: offsetX, y: offsetY });
    } else {
      console.warn('currentStroke is null during draw');
    }
    
    // Ensure context is properly set up
    setupContext(ctx);
    
    // Set appropriate opacity based on mode
    if (drawingMode === 'draw') {
      // For drawing: semi-transparent for visual feedback
      ctx.globalAlpha = 0.6;
    } else {
      // For erasing: full opacity to completely remove pixels
      ctx.globalAlpha = 1.0;
    }
    
    if (brushShape === 'square') {
      // For square brushes, create a separate canvas to prevent opacity buildup
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Use solid white on the temp canvas
      tempCtx.fillStyle = 'rgb(255, 255, 255)';
      
      // Draw a square at the current position
      const halfSize = brushSize / 2;
      tempCtx.fillRect(offsetX - halfSize, offsetY - halfSize, brushSize, brushSize);
      
      // To create a continuous trail, draw squares along the line between last position and current position
      // Calculate distance between points
      const dx = offsetX - lastPosition.x;
      const dy = offsetY - lastPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If distance is larger than half the brush size, interpolate points for a continuous trail
      if (distance > brushSize / 2) {
        const steps = Math.ceil(distance / (brushSize / 2));
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const interpX = lastPosition.x + dx * t;
          const interpY = lastPosition.y + dy * t;
          tempCtx.fillRect(interpX - halfSize, interpY - halfSize, brushSize, brushSize);
        }
      }
      
      // Draw the temp canvas onto the main canvas with the desired opacity
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.restore();
    } else {
      // For circle brushes, continue with the traditional line drawing
      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
    
    // // Reset globalAlpha to default
    // ctx.globalAlpha = 0.6;
    
    setLastPosition({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.current) {
      // Save the completed stroke - create a deep copy to avoid reference issues
      const strokeToAdd = {
        ...currentStroke.current,
        points: [...currentStroke.current.points] // Deep copy the points array
      };
      
      // Add stroke to context
      addStroke(strokeToAdd);
      
      // Only set to null after we've created a copy
      currentStroke.current = null;
    }
    setIsDrawing(false);
  };

  // Handle mouse movement to update cursor
  const updateCursorPosition = useCallback((e) => {
    if (!displayImage || !canvasRef.current) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    setCursorPosition({ x: offsetX, y: offsetY });
    
    // Update cursor canvas
    if (cursorRef.current) {
      const cursorCanvas = cursorRef.current;
      const ctx = cursorCanvas.getContext('2d');
      
      // Clear previous cursor
      ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      
      // Draw new cursor based on brush settings
      ctx.beginPath();
      ctx.strokeStyle = drawingMode === 'draw' ? 'rgba(32, 31, 31, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      ctx.fillStyle = drawingMode === 'draw' ? 'rgba(227, 227, 227, 0.6)' : 'rgba(255, 0, 0, 0.2)';
      ctx.lineWidth = 1.5;
      
      if (brushShape === 'circle') {
        ctx.arc(offsetX, offsetY, brushSize / 2, 0, Math.PI * 2);
      } else {
        const halfSize = brushSize / 2;
        ctx.rect(offsetX - halfSize, offsetY - halfSize, brushSize, brushSize);
      }
      
      ctx.fill();
      ctx.stroke();
    }
  }, [displayImage, drawingMode, brushSize, brushShape]);

  return (
    <Box
      position="absolute"
      top="0"
      left="0"
      width="100%"
      height="100%"
      zIndex="10"
      pointerEvents={displayImage ? 'auto' : 'none'}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'none', // Hide default cursor
        }}
        role="presentation"
        onMouseDown={startDrawing}
        onMouseMove={(e) => {
          updateCursorPosition(e);
          draw(e);
        }}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
      />
      
      {/* Cursor canvas */}
      <canvas
        ref={cursorRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Pass through events to main canvas
          zIndex: 3
        }}
        role="presentation"
      />
    </Box>
  );
};

export default DrawingCanvas;