import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasStore, Shape } from '../../store/canvasStore';
import { TOOLS } from '../../lib/constants';
import { createShape } from '../../lib/shapeFactory';
import { ShapeRenderer } from './ShapeRenderer';
import { SelectionBox } from './SelectionBox';
import { LineSelectionBox } from './LineSelectionBox';

interface TextEditorOverlayProps {
  shape: Shape;
  onUpdate: (text: string) => void;
  onFinish: (text: string) => void;
  onCancel: () => void;
}

const TextEditorOverlay = ({ shape, onUpdate, onFinish, onCancel }: TextEditorOverlayProps) => {
  const [text, setText] = useState(shape.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [shape.id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max((shape.fontSize || 20) * 1.4, textareaRef.current.scrollHeight)}px`;
    }
  }, [text, shape.fontSize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    onUpdate(val);
  };

  const handleBlur = () => {
    onFinish(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onFinish(text);
    }
  };

  const textColor = shape.stroke || (useCanvasStore.getState().theme === 'dark' ? '#FFFFFF' : '#2D2D2D');

  return (
    <textarea
      ref={textareaRef}
      value={text}
      placeholder="Type something..."
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="absolute z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs outline-none resize-none overflow-hidden placeholder-gray-400 dark:placeholder-gray-500 border border-dashed border-[#FF5A36] rounded-xs shadow-sm"
      style={{
        top: Math.max(0, shape.y),
        left: Math.max(0, shape.x),
        fontSize: `${shape.fontSize || 20}px`,
        fontFamily: shape.fontFamily || 'Inter',
        color: textColor,
        lineHeight: 1.2,
        padding: '4px',
        minWidth: '140px',
        width: `${Math.max(140, (text || 'Type something...').length * (shape.fontSize || 20) * 0.65)}px`,
        maxWidth: '80vw',
        boxSizing: 'border-box',
      }}
    />
  );
};

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
  const commitHistory = useCanvasStore((state) => state.commitHistory);
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
      const currentEditing = shapes.find(s => s.id === editingTextId);
      if (currentEditing && (!currentEditing.text || currentEditing.text.trim() === '')) {
        deleteShape(currentEditing.id, false);
      } else {
        commitHistory();
      }
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
    if (!pos) return;

    const newShape = createShape(activeTool, pos.x, pos.y);
    
    if (activeTool === TOOLS.TEXT) {
      addShape(newShape, false);
      setSelectedId(newShape.id);
      setEditingTextId(newShape.id);
      setActiveTool(TOOLS.SELECT);
      return;
    }

    addShape(newShape, false);
    currentShapeId.current = newShape.id;
    setIsDrawing(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !currentShapeId.current) return;
    
    if (activeTool === TOOLS.SELECT) return;

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const currentShapes = useCanvasStore.getState().shapes;
    const currentShape = currentShapes.find(s => s.id === currentShapeId.current);
    
    if (!currentShape) return;

    if (activeTool === TOOLS.PEN) {
      const newPoints = currentShape.points ? [...currentShape.points, pos.x, pos.y] : [pos.x, pos.y];
      updateShape(currentShape.id, { points: newPoints }, false);
    } else if (activeTool === TOOLS.LINE || activeTool === TOOLS.ARROW) {
      const points = currentShape.points ? [currentShape.points[0], currentShape.points[1], pos.x, pos.y] : [];
      updateShape(currentShape.id, { points }, false);
    } else if (activeTool === TOOLS.RECTANGLE || activeTool === TOOLS.ELLIPSE) {
      let dx = pos.x - currentShape.x;
      let dy = pos.y - currentShape.y;
      if (e.evt?.shiftKey) {
        const maxDist = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -maxDist : maxDist;
        dy = dy < 0 ? -maxDist : maxDist;
      }
      updateShape(currentShape.id, {
        width: dx,
        height: dy,
      }, false);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentShapeId.current) {
      const currentShapes = useCanvasStore.getState().shapes;
      const currentShape = currentShapes.find(s => s.id === currentShapeId.current);

      if (currentShape) {
        let isValid = true;
        if (currentShape.type === 'rectangle' || currentShape.type === 'ellipse') {
          let x = currentShape.x;
          let y = currentShape.y;
          let width = currentShape.width || 0;
          let height = currentShape.height || 0;

          if (width < 0) {
            x += width;
            width = Math.abs(width);
          }
          if (height < 0) {
            y += height;
            height = Math.abs(height);
          }

          if (width < 4 && height < 4) {
            isValid = false;
          } else {
            updateShape(currentShape.id, { x, y, width, height }, false);
          }
        } else if (currentShape.type === 'line' || currentShape.type === 'arrow') {
          const pts = currentShape.points || [];
          if (pts.length < 4 || Math.hypot(pts[2] - pts[0], pts[3] - pts[1]) < 4) {
            isValid = false;
          }
        } else if (currentShape.type === 'pen') {
          const pts = currentShape.points || [];
          if (pts.length < 4) {
            isValid = false;
          }
        }

        if (!isValid) {
          deleteShape(currentShape.id, false);
        } else {
          commitHistory();
        }
      }
    }

    setIsDrawing(false);
    currentShapeId.current = null;
  };

  const getCursorClass = () => {
    if (activeTool === TOOLS.TEXT) return 'cursor-text';
    if (activeTool === TOOLS.SELECT) return 'cursor-default';
    return 'cursor-crosshair';
  };

  const editingShape = shapes.find(s => s.id === editingTextId);

  return (
    <div className={`absolute inset-0 z-0 ${getCursorClass()}`}>
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
              onChange={(newAttrs) => updateShape(shape.id, newAttrs, true)}
            />
          ))}
          {selectedId && !isDrawing && selectedId !== editingTextId && !['line', 'arrow', 'pen'].includes(shapes.find(s => s.id === selectedId)?.type || '') && (
            <SelectionBox selectedId={selectedId} />
          )}
          {selectedId && !isDrawing && ['line', 'arrow'].includes(shapes.find(s => s.id === selectedId)?.type || '') && (
            <LineSelectionBox 
              shape={shapes.find(s => s.id === selectedId)!} 
              theme={theme}
              onChange={(newAttrs, saveHistory) => updateShape(selectedId, newAttrs, saveHistory)} 
            />
          )}
        </Layer>
      </Stage>

      {editingShape && editingShape.type === 'text' && (
        <TextEditorOverlay
          key={editingShape.id}
          shape={editingShape}
          onUpdate={(val) => {
            updateShape(editingShape.id, { text: val }, false);
          }}
          onFinish={(val) => {
            setEditingTextId(null);
            if (!val || val.trim() === '') {
              deleteShape(editingShape.id, false);
            } else {
              updateShape(editingShape.id, { text: val }, true);
            }
          }}
          onCancel={() => {
            setEditingTextId(null);
            if (!editingShape.text || editingShape.text.trim() === '') {
              deleteShape(editingShape.id, false);
            }
          }}
        />
      )}
    </div>
  );
};
