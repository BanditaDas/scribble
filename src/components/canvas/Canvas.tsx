import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useCanvasStore, Shape } from '../../store/canvasStore';
import { TOOLS } from '../../lib/constants';
import { createShape } from '../../lib/shapeFactory';
import { shapeIntersectsEraser, shapeIntersectsBox, BoundingBox, getClampedPosition } from '../../lib/geometry';
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

  const theme = useCanvasStore((state) => state.theme);
  const textColor = shape.stroke || (theme === 'dark' ? '#FFFFFF' : '#2D2D2D');

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
      className="absolute z-20 bg-transparent outline-none resize-none overflow-hidden placeholder-gray-400 dark:placeholder-gray-500 border border-dashed border-[#FF5A36] rounded-xs"
      style={{
        top: Math.max(0, shape.y),
        left: Math.max(0, shape.x),
        fontSize: `${shape.fontSize || 20}px`,
        fontFamily: shape.fontFamily || 'Inter',
        color: textColor,
        backgroundColor: 'transparent',
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
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const editingTextId = useCanvasStore((state) => state.editingTextId);
  const setEditingTextId = useCanvasStore((state) => state.setEditingTextId);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const theme = useCanvasStore((state) => state.theme);
  const addShape = useCanvasStore((state) => state.addShape);
  const updateShape = useCanvasStore((state) => state.updateShape);
  const updateShapes = useCanvasStore((state) => state.updateShapes);
  const deleteShape = useCanvasStore((state) => state.deleteShape);
  const deleteShapes = useCanvasStore((state) => state.deleteShapes);
  const commitHistory = useCanvasStore((state) => state.commitHistory);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);
  const setSelectedIds = useCanvasStore((state) => state.setSelectedIds);
  const toggleSelectId = useCanvasStore((state) => state.toggleSelectId);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const currentShapeId = useRef<string | null>(null);

  // Marquee selection state
  const [marqueeBox, setMarqueeBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const isMarqueeSelectingRef = useRef(false);
  const marqueeInitialSelectionRef = useRef<string[]>([]);

  // Batch/debounce multi-shape drag-end handler
  const dragEndFrameRef = useRef<number | null>(null);

  const handleShapeDragEnd = (e: any, shape: Shape) => {
    const currentSelectedIds = useCanvasStore.getState().selectedIds;
    if (currentSelectedIds.length <= 1) {
      const clamped = getClampedPosition(shape, e.target.x(), e.target.y(), window.innerWidth, window.innerHeight);
      e.target.position(clamped);
      updateShape(shape.id, { x: clamped.x, y: clamped.y }, true);
      return;
    }

    // When multiple shapes are selected, Konva's Transformer._proxyDrag
    // handles multi-node drag at native 60+ FPS in canvas. On mouse release,
    // we debounce dragend with requestAnimationFrame so that all updated positions
    // are committed in a single atomic history transaction.
    if (dragEndFrameRef.current !== null) {
      cancelAnimationFrame(dragEndFrameRef.current);
    }
    dragEndFrameRef.current = requestAnimationFrame(() => {
      dragEndFrameRef.current = null;
      const stage = stageRef.current;
      if (!stage) return;
      const currentSelected = useCanvasStore.getState().selectedIds;
      const allShapes = useCanvasStore.getState().shapes;
      const updates: Array<{ id: string; x: number; y: number }> = [];
      for (const id of currentSelected) {
        const node = stage.findOne(`#${id}`);
        const shp = allShapes.find((s) => s.id === id);
        if (node && shp) {
          const clamped = getClampedPosition(shp, node.x(), node.y(), window.innerWidth, window.innerHeight);
          node.position(clamped);
          updates.push({ id, x: clamped.x, y: clamped.y });
        }
      }
      if (updates.length > 0) {
        useCanvasStore.getState().updateShapes(updates, true);
      }
    });
  };

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
      if (isMarqueeSelectingRef.current) {
        isMarqueeSelectingRef.current = false;
        setMarqueeBox(null);
        marqueeInitialSelectionRef.current = [];
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

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const clickedOnEmpty = e.target === stage;

    if (activeTool === TOOLS.SELECT) {
      if (clickedOnEmpty) {
        isMarqueeSelectingRef.current = true;
        setMarqueeBox({
          startX: pos.x,
          startY: pos.y,
          currentX: pos.x,
          currentY: pos.y,
        });
        marqueeInitialSelectionRef.current = e.evt?.shiftKey ? [...useCanvasStore.getState().selectedIds] : [];
        if (!e.evt?.shiftKey) {
          clearSelection();
        }
      }
      return;
    }

    if (clickedOnEmpty) {
      clearSelection();
    }

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

    if (activeTool === TOOLS.SELECT) {
      if (isMarqueeSelectingRef.current && marqueeBox) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;

        const updatedBox = {
          ...marqueeBox,
          currentX: pos.x,
          currentY: pos.y,
        };
        setMarqueeBox(updatedBox);

        const minX = Math.min(updatedBox.startX, updatedBox.currentX);
        const maxX = Math.max(updatedBox.startX, updatedBox.currentX);
        const minY = Math.min(updatedBox.startY, updatedBox.currentY);
        const maxY = Math.max(updatedBox.startY, updatedBox.currentY);

        if (maxX - minX > 2 || maxY - minY > 2) {
          const currentShapes = useCanvasStore.getState().shapes;
          const boxRect: BoundingBox = { minX, minY, maxX, maxY };
          const intersecting = currentShapes
            .filter((s) => shapeIntersectsBox(s, boxRect))
            .map((s) => s.id);

          const combined = Array.from(new Set([...marqueeInitialSelectionRef.current, ...intersecting]));
          setSelectedIds(combined);
        }
      }
      return;
    }

    if (!isDrawing || !currentShapeId.current) return;

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

    if (isMarqueeSelectingRef.current) {
      isMarqueeSelectingRef.current = false;
      if (marqueeBox) {
        const w = Math.abs(marqueeBox.currentX - marqueeBox.startX);
        const h = Math.abs(marqueeBox.currentY - marqueeBox.startY);
        if (w < 4 && h < 4) {
          if (marqueeInitialSelectionRef.current.length === 0) {
            clearSelection();
          }
        }
      }
      setMarqueeBox(null);
      marqueeInitialSelectionRef.current = [];
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
  const isSingleLineOrArrow = selectedIds.length === 1 && ['line', 'arrow'].includes(shapes.find(s => s.id === selectedIds[0])?.type || '');

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
              isSelected={selectedIds.includes(shape.id)}
              onSelect={(e: any) => {
                if (activeTool === TOOLS.SELECT) {
                  if (e?.evt?.shiftKey) {
                    toggleSelectId(shape.id);
                  } else {
                    setSelectedId(shape.id);
                  }
                } else if (activeTool === TOOLS.ERASER) {
                  deleteShape(shape.id, true);
                }
              }}
              onChange={(newAttrs) => updateShape(shape.id, newAttrs, true)}
              onDragEnd={handleShapeDragEnd}
            />
          ))}

          {/* Marquee Selection Rectangle */}
          {marqueeBox && (
            <Rect
              x={Math.min(marqueeBox.startX, marqueeBox.currentX)}
              y={Math.min(marqueeBox.startY, marqueeBox.currentY)}
              width={Math.abs(marqueeBox.currentX - marqueeBox.startX)}
              height={Math.abs(marqueeBox.currentY - marqueeBox.startY)}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#3B82F6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}

          {/* Unified Transformer for 1 or more shapes (excluding single line/arrow) */}
          {selectedIds.length > 0 && !isDrawing && selectedId !== editingTextId && !isSingleLineOrArrow && (
            <SelectionBox selectedIds={selectedIds} />
          )}

          {/* Single Line/Arrow handle selection */}
          {isSingleLineOrArrow && !isDrawing && (
            <LineSelectionBox 
              shape={shapes.find(s => s.id === selectedIds[0])!} 
              theme={theme}
              onChange={(newAttrs, saveHistory) => updateShape(selectedIds[0], newAttrs, saveHistory)} 
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
