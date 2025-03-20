import { useRef, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useImageContext } from '../contexts/ImageContext';

const DrawingCanvas = ({ imageRef, onCanvasReady }) => {
  // Internal ref
  const canvasRef = useRef(null);
  
  // Notify parent component when canvas is ready
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Canvas is ready, notifying parent:', canvasRef.current);
      onCanvasReady(canvasRef.current);
    }
  }, [canvasRef.current, onCanvasReady]);
  
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
    scaleFactor
  } = useImageContext();

  // Initialize canvas when component mounts or when display image changes
  useEffect(() => {
    if (!displayImage || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match the displayed image
    canvas.width = imageRef.current.clientWidth;
    canvas.height = imageRef.current.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set default drawing style
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    
    // Set drawing color based on mode
    if (drawingMode === 'draw') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.globalCompositeOperation = 'destination-out';
    }
  }, [displayImage, drawingMode, brushSize, imageRef]);

  // Update canvas when drawing mode or brush size changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = brushSize;
    
    if (drawingMode === 'draw') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.globalCompositeOperation = 'destination-out';
    }
  }, [drawingMode, brushSize]);

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

  // Drawing functions
  const startDrawing = (e) => {
    if (!displayImage) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    setIsDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });
    
    // Draw a single dot if the user just clicks
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e) => {
    if (!isDrawing || !displayImage) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
    
    setLastPosition({ x: offsetX, y: offsetY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Helper function to get coordinates from different event types
  const getCoordinates = (event) => {
    let offsetX, offsetY;
    
    if (event.type.includes('touch')) {
      const rect = canvasRef.current.getBoundingClientRect();
      const touch = event.touches[0] || event.changedTouches[0];
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } else {
      offsetX = event.nativeEvent.offsetX;
      offsetY = event.nativeEvent.offsetY;
    }
    
    return { offsetX, offsetY };
  };

  // Clear the canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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