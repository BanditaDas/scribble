import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';
import { TOOLS } from '../../lib/constants';
import { createShape } from '../../lib/shapeFactory';
import { ShapeRenderer } from './ShapeRenderer';
import { SelectionBox } from './SelectionBox';
import { LineSelectionBox } from './LineSelectionBox';

export const Canvas = () => {
  const shapes = useCanvasStore((state) => state.shapes);
  const activeTool = useCanvasStore((state) => state.activeTool);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const theme = useCanvasStore((state) => state.theme);
  const addShape = useCanvasStore((state) => state.addShape);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const currentShapeId = useRef<string | null>(null);
  
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }

    if (activeTool === TOOLS.SELECT) {
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    const newShape = createShape(activeTool, pos.x, pos.y);
    addShape(newShape);
    currentShapeId.current = newShape.id;
    setIsDrawing(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentShapeId.current) return;
    
    if (activeTool === TOOLS.SELECT) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const currentShapes = useCanvasStore.getState().shapes;
    const currentShape = currentShapes.find(s => s.id === currentShapeId.current);
    
    if (!currentShape) return;

    if (activeTool === TOOLS.PEN) {
      const newPoints = currentShape.points ? [...currentShape.points, pos.x, pos.y] : [pos.x, pos.y];
      updateShape(currentShape.id, { points: newPoints });
    } else if (activeTool === TOOLS.LINE || activeTool === TOOLS.ARROW) {
      const points = currentShape.points ? [currentShape.points[0], currentShape.points[1], pos.x, pos.y] : [];
      updateShape(currentShape.id, { points });
    } else if (activeTool === TOOLS.RECTANGLE || activeTool === TOOLS.ELLIPSE) {
      updateShape(currentShape.id, {
        width: pos.x - currentShape.x,
        height: pos.y - currentShape.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    currentShapeId.current = null;
  };

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={handleMouseDown}
      onMousemove={handleMouseMove}
      onMouseup={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className="absolute inset-0 z-0"
    >
      <Layer>
        {shapes.map((shape) => (
          <ShapeRenderer
            key={shape.id}
            shape={shape}
            isSelected={shape.id === selectedId}
            onSelect={() => {
              if (activeTool === TOOLS.SELECT) {
                setSelectedId(shape.id);
              }
            }}
            onChange={(newAttrs) => updateShape(shape.id, newAttrs)}
          />
        ))}
        {selectedId && !isDrawing && !['line', 'arrow', 'pen'].includes(shapes.find(s => s.id === selectedId)?.type || '') && (
          <SelectionBox selectedId={selectedId} />
        )}
        {selectedId && !isDrawing && ['line', 'arrow'].includes(shapes.find(s => s.id === selectedId)?.type || '') && (
          <LineSelectionBox 
            shape={shapes.find(s => s.id === selectedId)!} 
            theme={theme}
            onChange={(newAttrs) => updateShape(selectedId, newAttrs)} 
          />
        )}
      </Layer>
    </Stage>
  );
};
