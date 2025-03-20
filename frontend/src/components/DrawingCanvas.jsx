import { useRef, useEffect, useState, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { useImageContext } from '../contexts/ImageContext';

const DrawingCanvas = ({ imageRef, onCanvasReady }) => {
  // Internal refs and state
  const canvasRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const strokesRef = useRef([]); // Add a ref to preserve strokes between renders
  const currentStroke = useRef(null);
  
  // Handle undoing last stroke
  const handleUndo = useCallback(() => {
    console.log('Undo requested');
    
    // First check strokesRef for actual stroke count
    console.log('Current strokes in ref before undo:', strokesRef.current.length);
    
    // If there are no strokes in ref either, nothing to do
    if (strokesRef.current.length === 0) {
      console.log('No strokes to undo in ref');
      return;
    }
    
    // Remove the last stroke from strokesRef
    const newStrokesRef = strokesRef.current.slice(0, -1);
    console.log('Updated strokesRef:', newStrokesRef.length);
    strokesRef.current = newStrokesRef;
    
    // Update state to match ref (this triggers redraw)
    setStrokes([...newStrokesRef]);
    
    // Also update savedStrokes in context to persist across unmounts
    setSavedStrokes([...newStrokesRef]);
    console.log('Updated strokes state and savedStrokes in context');
  }, []);
  
  // Notify parent component when canvas is ready and expose undo function
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Canvas is ready, notifying parent:', canvasRef.current);
      // Add undo method to canvas element
      canvasRef.current.undo = handleUndo;
      onCanvasReady(canvasRef.current);
    }
  }, [canvasRef.current, onCanvasReady, handleUndo]);
  
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  
  const {
    displayImage,
    drawingMode,
    brushSize,
    originalDimensions,
    scaleFactor,
    isLoading,
    setIsLoading,
    savedStrokes,
    setSavedStrokes
  } = useImageContext();
  
  // Monitor loading state changes
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
    if (isLoading) {
      console.log('App is in loading state - strokes count:', strokes.length, 'strokesRef count:', strokesRef.current.length);
    } else {
      console.log('App finished loading - strokes count:', strokes.length, 'strokesRef count:', strokesRef.current.length);
      // If we have strokes in ref but not in state after loading, restore them
      if (strokes.length === 0 && strokesRef.current.length > 0) {
        console.log('Restoring strokes from ref after loading state change');
        setStrokes([...strokesRef.current]);
      }
    }
  }, [isLoading, strokes.length]);

  // Function to set up canvas context with current drawing settings
  const setupContext = useCallback((ctx) => {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = drawingMode === 'draw' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    ctx.globalCompositeOperation = drawingMode === 'draw' ? 'source-over' : 'destination-out';
  }, [brushSize, drawingMode]);

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
    
    // Initialize strokes from saved strokes in context
    if (savedStrokes.length > 0) {
      console.log('Initializing strokes from savedStrokes in context:', savedStrokes.length);
      setStrokes([...savedStrokes]);
      strokesRef.current = [...savedStrokes];
    } else {
      // Clear canvas and strokes when image changes and no saved strokes
      setStrokes([]);
      strokesRef.current = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Set up initial context state
    setupContext(ctx);
  }, [displayImage, imageRef, setupContext, savedStrokes]);

  // We'll move this effect after redrawCanvas is defined

  // This effect has been replaced by the setupContext function and its effect above

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

  // setupContext is already defined above

  // Function to redraw all strokes
  const redrawCanvas = useCallback(() => {
    // Use strokesRef if strokes state is empty - this is critical for preserving strokes
    const strokesToUse = strokes.length > 0 ? strokes : strokesRef.current;
    console.log('Redrawing canvas with strokes:', strokesToUse);
    console.log('Current strokes state length:', strokes.length);
    console.log('Current strokesRef length:', strokesRef.current.length);
    
    if (!canvasRef.current) {
      console.warn('Canvas ref is null during redraw');
      return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Only attempt to redraw if there are strokes
    if (strokesToUse && strokesToUse.length > 0) {
      // Filter out any null strokes
      const validStrokes = strokesToUse.filter(stroke =>
        stroke !== null && stroke.points && stroke.points.length > 0
      );
      
      console.log('Drawing', validStrokes.length, 'valid strokes out of', strokes.length, 'total');
      
      // Process each stroke one by one
      for (let i = 0; i < validStrokes.length; i++) {
        const stroke = validStrokes[i];
        console.log('Processing stroke:', i, stroke);
        
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
        
        console.log('Drawing stroke with', stroke.points.length, 'points');
        
        if (stroke.points.length === 1) {
          // Draw a dot for single clicks
          ctx.beginPath();
          ctx.arc(firstPoint.x, firstPoint.y, stroke.brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
          console.log('Drew dot at', firstPoint.x, firstPoint.y);
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
          console.log('Drew line with', stroke.points.length, 'points');
        }
      }
    }
    
    // Reset context to current drawing settings
    setupContext(ctx);
  }, [strokes, setupContext]); // Removed brushSize and drawingMode dependencies since each stroke has its own

  // handleUndo is already defined at the top of the component

  // Update canvas when strokes change
  useEffect(() => {
    console.log('Strokes updated:', strokes);
    console.log('Calling redrawCanvas due to strokes change');
    redrawCanvas();
  }, [strokes, redrawCanvas]);
  
  // Update context when drawing mode or brush size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    console.log('BRUSH SIZE EFFECT TRIGGERED', {
      brushSize,
      strokesCount: strokes.length,
      strokesRefCount: strokesRef.current.length
    });
    
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    
    // If we have strokes in state, use those
    if (strokes.length > 0) {
      console.log('Using strokes state for redraw');
      // Force a redraw by creating a new array reference
      setStrokes(prevStrokes => [...prevStrokes]);
    }
    // If state is empty but we have strokes in the ref, restore them
    else if (strokesRef.current.length > 0) {
      console.log('RESTORING STROKES FROM REF:', strokesRef.current.length);
      // This is the key fix - restore strokes from ref if state is empty
      setStrokes([...strokesRef.current]);
    }
    // No strokes at all, just update the context
    else {
      console.log('No strokes to redraw');
    }
  }, [brushSize, drawingMode, setupContext, strokes.length]);

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
    console.log('Created new stroke at position:', { offsetX, offsetY });
    
    // Set up context and draw a single dot
    const ctx = canvasRef.current.getContext('2d');
    setupContext(ctx);
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    console.log('Drew dot at', offsetX, offsetY);
  };

  const draw = (e) => {
    if (!isDrawing || !displayImage) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    // Add point to current stroke
    if (currentStroke.current) {
      currentStroke.current.points.push({ x: offsetX, y: offsetY });
      // Reduce logging frequency for performance
      if (currentStroke.current.points.length % 5 === 0) {
        console.log('Drawing at position:', { offsetX, offsetY });
      }
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
      console.log('Adding stroke:', strokeToAdd);
      
      setStrokes(prevStrokes => {
        console.log('Previous strokes:', prevStrokes);
        // Filter out any null values from previous strokes
        const validPrevStrokes = prevStrokes.filter(stroke => stroke !== null);
        const newStrokes = [...validPrevStrokes, strokeToAdd];
        console.log('New strokes array:', newStrokes);
        
        // Update strokesRef to maintain strokes between renders
        strokesRef.current = newStrokes;
        console.log('Updated strokesRef with new strokes:', newStrokes.length);
        
        // Also update savedStrokes in context to persist across unmounts
        setSavedStrokes(newStrokes);
        console.log('Updated savedStrokes in context:', newStrokes.length);
        
        return newStrokes;
      });
      
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
    
    console.log('Coordinate calculation:', {
      clientX, clientY,
      rectLeft: rect.left, rectTop: rect.top,
      canvasWidth: canvas.width, canvasHeight: canvas.height,
      rectWidth: rect.width, rectHeight: rect.height,
      scaleX, scaleY,
      offsetX, offsetY
    });
    
    return { offsetX, offsetY };
  };

  // Clear the canvas and strokes array
  const clearCanvas = () => {
    console.log('Clearing canvas');
    if (!canvasRef.current) {
      console.warn('Canvas ref is null during clear');
      return;
    }
    
    // Clear strokes array, ref, and context
    setStrokes([]);
    strokesRef.current = [];
    setSavedStrokes([]);
    console.log('Strokes array, ref, and context cleared');
    
    // Clear canvas
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    console.log('Canvas cleared');
  };

  // Log when canvas is mounted or updated
  useEffect(() => {
    if (!canvasRef.current) return;
    console.log('Canvas element is mounted:', canvasRef.current);
  }, [canvasRef.current]);

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