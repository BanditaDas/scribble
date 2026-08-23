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
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const theme = useCanvasStore((state) => state.theme);
  const addShape = useCanvasStore((state) => state.addShape);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const deleteShape = useCanvasStore((state) => state.deleteShape);
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
    if (editingTextId) {
      setEditingTextId(null);
    }

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
    
    if (activeTool === TOOLS.TEXT) {
      setEditingTextId(newShape.id);
      setActiveTool(TOOLS.SELECT);
      return;
    }

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

  const editingShape = shapes.find(s => s.id === editingTextId);

  return (
    <div className="absolute inset-0 z-0">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
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

      {editingShape && editingShape.type === 'text' && (
        <textarea
          value={editingShape.text || ''}
          placeholder="Type something..."
          onChange={(e) => updateShape(editingShape.id, { text: e.target.value })}
          onBlur={() => {
            setEditingTextId(null);
            if (!editingShape.text || editingShape.text.trim() === '') {
              deleteShape(editingShape.id);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditingTextId(null);
              if (!editingShape.text || editingShape.text.trim() === '') {
                deleteShape(editingShape.id);
              }
            }
            e.stopPropagation();
          }}
          autoFocus
          onFocus={(e) => {
            const val = e.target.value;
            e.target.value = '';
            e.target.value = val;
          }}
          className="absolute z-10 bg-transparent outline-none resize-none overflow-hidden whitespace-pre pointer-events-auto placeholder-gray-400 dark:placeholder-gray-500"
          style={{
            top: editingShape.y + 5,
            left: editingShape.x + 5,
            fontSize: `${editingShape.fontSize}px`,
            fontFamily: editingShape.fontFamily,
            color: editingShape.stroke,
            lineHeight: 1,
            width: `${Math.max(150, (editingShape.text || '').length * (editingShape.fontSize || 20) * 0.6)}px`,
            minHeight: `${(editingShape.fontSize || 20) * 1.5}px`
          }}
        />
      )}
    </div>
  );
};
