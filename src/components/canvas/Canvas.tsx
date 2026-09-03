import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvasStore, Shape } from '../../store/canvasStore';
import { TOOLS } from '../../lib/constants';
import { createShape } from '../../lib/shapeFactory';
import { shapeIntersectsEraser } from '../../lib/geometry';
import { ShapeRenderer } from './ShapeRenderer';
import { SelectionBox } from './SelectionBox';
import { LineSelectionBox } from './LineSelectionBox';

const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M7 21L2.7 16.7c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21' fill='%23FFFFFF' stroke='%2318181B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M22 21H7' stroke='%2318181B' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M5 11l9 9' stroke='%23FF5A36' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 3 21, crosshair`;

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
  const deleteShapes = useCanvasStore((state) => state.deleteShapes);
  const commitHistory = useCanvasStore((state) => state.commitHistory);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const currentShapeId = useRef<string | null>(null);

  // Eraser state
  const isErasingRef = useRef(false);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const erasedIdsRef = useRef<Set<string>>(new Set());
  const stageRef = useRef<any>(null);
  
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

  const getCursorStyle = () => {
    if (activeTool === TOOLS.ERASER) return ERASER_CURSOR;
    if (activeTool === TOOLS.TEXT) return 'text';
    if (activeTool === TOOLS.SELECT) return 'default';
    return 'crosshair';
  };

  useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      if (container) {
        container.style.cursor = getCursorStyle();
      }
    }
  }, [activeTool]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isErasingRef.current) {
        isErasingRef.current = false;
        lastPointerPosRef.current = null;
        if (erasedIdsRef.current.size > 0) {
          commitHistory();
          erasedIdsRef.current.clear();
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [commitHistory]);

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

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    if (activeTool === TOOLS.ERASER) {
      isErasingRef.current = true;
      lastPointerPosRef.current = pos;
      erasedIdsRef.current = new Set<string>();

      const toDelete: string[] = [];

      // Check if direct node clicked
      if (e.target !== stage) {
        const id = e.target.id?.() || e.target.attrs?.id;
        if (id) {
          toDelete.push(id);
          erasedIdsRef.current.add(id);
        }
      }

      // Check Konva intersection at click point
      if (toDelete.length === 0) {
        const shapeNode = stage.getIntersection(pos);
        if (shapeNode && shapeNode !== stage) {
          const id = shapeNode.id?.() || shapeNode.attrs?.id;
          if (id) {
            toDelete.push(id);
            erasedIdsRef.current.add(id);
          }
        }
      }

      // Check geometric intersection with shapes
      if (toDelete.length === 0) {
        const currentShapes = useCanvasStore.getState().shapes;
        for (const shape of currentShapes.slice().reverse()) {
          if (shapeIntersectsEraser(shape, pos, pos, 12)) {
            toDelete.push(shape.id);
            erasedIdsRef.current.add(shape.id);
            break;
          }
        }
      }

      if (toDelete.length > 0) {
        deleteShapes(toDelete, false);
      }
      return;
    }

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
    if (activeTool === TOOLS.ERASER) {
      if (!isErasingRef.current) return;
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;

      const lastPos = lastPointerPosRef.current || pos;
      lastPointerPosRef.current = pos;

      const currentShapes = useCanvasStore.getState().shapes;
      const toDelete: string[] = [];

      // Check Konva intersection
      const shapeNode = stage.getIntersection(pos);
      if (shapeNode && shapeNode !== stage) {
        const id = shapeNode.id?.() || shapeNode.attrs?.id;
        if (id && !erasedIdsRef.current.has(id)) {
          toDelete.push(id);
          erasedIdsRef.current.add(id);
        }
      }

      // Check geometric intersection along the segment
      for (const shape of currentShapes) {
        if (!erasedIdsRef.current.has(shape.id)) {
          if (shapeIntersectsEraser(shape, lastPos, pos, 12)) {
            toDelete.push(shape.id);
            erasedIdsRef.current.add(shape.id);
          }
        }
      }

      if (toDelete.length > 0) {
        deleteShapes(toDelete, false);
      }
      return;
    }

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
    if (activeTool === TOOLS.ERASER || isErasingRef.current) {
      if (isErasingRef.current) {
        isErasingRef.current = false;
        lastPointerPosRef.current = null;
        if (erasedIdsRef.current.size > 0) {
          commitHistory();
          erasedIdsRef.current.clear();
        }
      }
      return;
    }

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
          setSelectedId(currentShape.id);
        }
      }
    }

    setIsDrawing(false);
    currentShapeId.current = null;
  };

  const editingShape = shapes.find(s => s.id === editingTextId);

  return (
    <div 
      className="absolute inset-0 z-0 select-none"
      style={{ cursor: getCursorStyle() }}
    >
      <Stage
        ref={stageRef}
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
                } else if (activeTool === TOOLS.ERASER) {
                  deleteShape(shape.id, true);
                }
              }}
              onChange={(newAttrs) => updateShape(shape.id, newAttrs, true)}
            />
          ))}
          {selectedId && !isDrawing && selectedId !== editingTextId && !['line', 'arrow'].includes(shapes.find(s => s.id === selectedId)?.type || '') && (
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
