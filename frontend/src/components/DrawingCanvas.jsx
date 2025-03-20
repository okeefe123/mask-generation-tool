import { useRef, useEffect, useState, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { useAppContext, useUIContext, useCanvasContext } from '../contexts/AppContexts';

const DrawingCanvas = ({ onCanvasReady }) => {
  // Create a ref to the parent image element
  const imageRef = useRef(null);
  // Internal refs and state
  const canvasRef = useRef(null);
  const currentStroke = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  // Get state from contexts
  const {
    displayImage,
    originalDimensions,
    scaleFactor,
  } = useAppContext();
  
  const {
    drawingMode,
    brushSize,
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
  }, [canvasRef.current, onCanvasReady, undoHandler]);
  
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
  
  // Monitor loading state changes
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  // Function to set up canvas context with current drawing settings
  const setupContext = useCallback((ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = drawingMode === 'draw' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    ctx.globalCompositeOperation = drawingMode === 'draw' ? 'source-over' : 'destination-out';
  }, [brushSize, drawingMode]);

  // Find the image element in the parent
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Find the image element in the parent container
    const parentContainer = canvasRef.current.parentElement.parentElement;
    const imgElement = parentContainer.querySelector('img');
    
    if (imgElement) {
      console.log('Found image element:', imgElement);
      imageRef.current = imgElement;
    } else {
      console.warn('Could not find image element in parent container');
    }
  }, [canvasRef.current]);

  // Initialize canvas when component mounts or when display image changes
  useEffect(() => {
    if (!displayImage || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the displayed image
    canvas.width = imageRef.current.clientWidth;
    canvas.height = imageRef.current.clientHeight;
    
    // Log canvas and image dimensions for debugging
    console.log('Canvas dimensions set:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      imageClientWidth: imageRef.current.clientWidth,
      imageClientHeight: imageRef.current.clientHeight,
      canvasCSSWidth: canvas.style.width,
      canvasCSSHeight: canvas.style.height,
      canvasBoundingRect: canvas.getBoundingClientRect()
    });
    
    // Set up initial context state
    setupContext(ctx);
    
    // Initial redraw
    redrawCanvas();
  }, [displayImage, imageRef, setupContext]);

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
      
      // Process each stroke one by one
      for (let i = 0; i < validStrokes.length; i++) {
        const stroke = validStrokes[i];
        
        // Set up context for this stroke
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = stroke.brushSize;
        ctx.strokeStyle = stroke.mode === 'draw' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
        ctx.globalCompositeOperation = stroke.mode === 'draw' ? 'source-over' : 'destination-out';
        
        // Draw the stroke
        const firstPoint = stroke.points[0];
        if (!firstPoint) {
          console.warn('Stroke has no points:', stroke);
          continue;
        }
        
        if (stroke.points.length === 1) {
          // Draw a dot for single clicks
          ctx.beginPath();
          ctx.arc(firstPoint.x, firstPoint.y, stroke.brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw lines for multi-point strokes
          ctx.beginPath();
          ctx.moveTo(firstPoint.x, firstPoint.y);
          
          for (let j = 1; j < stroke.points.length; j++) {
            const point = stroke.points[j];
            if (!point) continue;
            ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();
        }
      }
    }
    
    // Reset context to current drawing settings
    setupContext(ctx);
  }, [getCurrentStrokes, setupContext]);

  // Update canvas when strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);
  
  // Update context when drawing mode or brush size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    
    // Redraw with current settings
    redrawCanvas();
  }, [brushSize, drawingMode, setupContext, redrawCanvas]);

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
      points: [{ x: offsetX, y: offsetY }]
    };
    
    // Set up context and draw a single dot
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    
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

  // Clear the canvas and strokes array
  const clearCanvas = () => {
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
  };

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
          cursor: displayImage ? 'crosshair' : 'default',
        }}
        role="presentation"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
    </Box>
  );
};

export default DrawingCanvas;