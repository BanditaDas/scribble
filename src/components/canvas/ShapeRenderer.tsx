import React, { useRef } from 'react';
import { Rect, Ellipse, Line, Arrow, Text } from 'react-konva';
import { Shape, useCanvasStore } from '../../store/canvasStore';
import { TOOLS, DEFAULT_PROPS } from '../../lib/constants';
import { getClampedPosition } from '../../lib/geometry';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onChange: (newAttrs: any) => void;
  onDragEnd?: (e: any, shape: Shape) => void;
}

export const ShapeRenderer = ({ 
  shape, 
  isSelected, 
  onSelect, 
  onChange,
  onDragEnd,
}: ShapeRendererProps) => {
  const shapeRef = useRef<any>(null);
  const isEditing = useCanvasStore((state) => state.editingTextId === shape.id);
  const activeTool = useCanvasStore((state) => state.activeTool);

  const strokeWidth = shape.strokeWidth !== undefined ? shape.strokeWidth : DEFAULT_PROPS.strokeWidth;
  const strokeStyle = shape.strokeStyle || DEFAULT_PROPS.strokeStyle;

  // Scale dash patterns and caps dynamically based on stroke width:
  // - Dashed: Flat (butt) rectangular dashes (~2.2x stroke width) with clean gaps (~1.4x stroke width)
  // - Dotted: True circular dots via [0, gap] with lineCap="round" (spacing = 2x stroke width, so space between dots equals dot diameter)
  // - Solid: Continuous stroke with smooth rounded ends on open paths
  const isDotted = strokeStyle === 'dotted';
  const isDashed = strokeStyle === 'dashed';

  const dash = isDashed
    ? [Math.max(8, Math.round(strokeWidth * 2.2)), Math.max(6, Math.round(strokeWidth * 1.4))]
    : isDotted
    ? [0, Math.max(6, Math.round(strokeWidth * 2))]
    : undefined;

  const lineCap: 'round' | 'butt' = isDashed ? 'butt' : 'round';
  const lineJoin: 'round' | 'miter' = shape.type === 'rectangle' && (!shape.cornerRadius || shape.cornerRadius === 0)
    ? 'miter'
    : 'round';

  const commonProps = {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation || 0,
    stroke: shape.stroke,
    fill: shape.fill,
    strokeWidth,
    opacity: shape.opacity ?? 1,
    dash,
    lineCap,
    lineJoin,
    draggable: activeTool === TOOLS.SELECT,
    dragBoundFunc: (pos: { x: number; y: number }) => {
      return getClampedPosition(shape, pos.x, pos.y, window.innerWidth, window.innerHeight);
    },
    perfectDrawEnabled: false,
    shadowForStrokeEnabled: false,
    onClick: (e: any) => onSelect(e),
    onTap: (e: any) => onSelect(e),
    onDragStart: (e: any) => {
      if (activeTool === TOOLS.SELECT) {
        const { selectedIds, setSelectedId } = useCanvasStore.getState();
        if (!selectedIds.includes(shape.id)) {
          setSelectedId(shape.id);
        }
      }
    },
    onMouseDown: (e: any) => {
      if (activeTool === TOOLS.SELECT) {
        const { selectedIds, setSelectedId } = useCanvasStore.getState();
        if (e.evt?.shiftKey) {
          // Handled on click
        } else if (!selectedIds.includes(shape.id)) {
          setSelectedId(shape.id);
        }
      }
    },
    onTouchStart: (e: any) => {
      if (activeTool === TOOLS.SELECT) {
        const { selectedIds, setSelectedId } = useCanvasStore.getState();
        if (e.evt?.shiftKey) {
          // Handled on tap
        } else if (!selectedIds.includes(shape.id)) {
          setSelectedId(shape.id);
        }
      }
    },
    onMouseEnter: (e: any) => {
      if (activeTool === TOOLS.SELECT) {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'move';
      }
    },
    onMouseLeave: (e: any) => {
      if (activeTool === TOOLS.SELECT) {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = 'default';
      }
    },
    onDblClick: (e: any) => {
      if (shape.type === 'text' && activeTool !== TOOLS.ERASER) {
        e?.cancelBubble && (e.cancelBubble = true);
        useCanvasStore.getState().setSelectedId(shape.id);
        useCanvasStore.getState().setEditingTextId(shape.id);
      }
    },
    onDblTap: (e: any) => {
      if (shape.type === 'text' && activeTool !== TOOLS.ERASER) {
        e?.cancelBubble && (e.cancelBubble = true);
        useCanvasStore.getState().setSelectedId(shape.id);
        useCanvasStore.getState().setEditingTextId(shape.id);
      }
    },
    onDragEnd: (e: any) => {
      if (onDragEnd) {
        onDragEnd(e, shape);
      } else {
        onChange({
          ...shape,
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    onTransformEnd: (e: any) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      
      if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
        const scaledPoints = (shape.points || []).map((p, index) => {
          return index % 2 === 0 ? p * scaleX : p * scaleY;
        });
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          points: scaledPoints,
        });
      } else if (shape.type === 'text') {
        const newFontSize = Math.max(10, Math.round((shape.fontSize || 20) * scaleX));
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          fontSize: newFontSize,
        });
      } else {
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, (shape.width || 0) * scaleX),
          height: Math.max(5, (shape.height || 0) * scaleY),
        });
      }
    },
  };

  switch (shape.type) {
    case 'rectangle': {
      const w = shape.width || 0;
      const h = shape.height || 0;
      const x = w < 0 ? shape.x + w : shape.x;
      const y = h < 0 ? shape.y + h : shape.y;
      const absW = Math.max(0, Math.abs(w));
      const absH = Math.max(0, Math.abs(h));
      return (
        <Rect
          {...commonProps}
          x={x}
          y={y}
          ref={shapeRef}
          width={absW}
          height={absH}
          cornerRadius={shape.cornerRadius || 0}
          hitFunc={(context, shapeNode) => {
            context.beginPath();
            const radius = shape.cornerRadius || 0;
            const width = shapeNode.width();
            const height = shapeNode.height();
            if (radius > 0 && typeof (context as any).roundRect === 'function') {
              (context as any).roundRect(0, 0, width, height, radius);
            } else {
              context.rect(0, 0, width, height);
            }
            context.closePath();
            context.fillStrokeShape(shapeNode);
            (context as any)._context?.fill();
          }}
        />
      );
    }
    case 'ellipse': {
      const w = shape.width || 0;
      const h = shape.height || 0;
      const x = w < 0 ? shape.x + w : shape.x;
      const y = h < 0 ? shape.y + h : shape.y;
      const absW = Math.max(0, Math.abs(w));
      const absH = Math.max(0, Math.abs(h));
      const radiusX = absW / 2;
      const radiusY = absH / 2;
      return (
        <Ellipse
          {...commonProps}
          x={x}
          y={y}
          ref={shapeRef}
          radiusX={radiusX}
          radiusY={radiusY}
          offsetX={-radiusX}
          offsetY={-radiusY}
          hitFunc={(context, shapeNode) => {
            const rx = (shapeNode as any).radiusX();
            const ry = (shapeNode as any).radiusY();
            context.beginPath();
            context.save();
            if (rx !== ry && rx > 0) {
              context.scale(1, ry / rx);
            }
            context.arc(0, 0, rx, 0, Math.PI * 2, false);
            context.restore();
            context.closePath();
            context.fillStrokeShape(shapeNode);
            (context as any)._context?.fill();
          }}
        />
      );
    }
    case 'line':
    case 'pen':
      return (
        <Line
          {...commonProps}
          ref={shapeRef}
          points={shape.points || []}
          tension={shape.type === 'pen' ? 0.5 : 0}
          hitStrokeWidth={Math.max(strokeWidth * 2, 20)}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
      );
    case 'arrow':
      const arrowPointerSize = Math.max(10, Math.round(strokeWidth * 2));
      return (
        <Arrow
          {...commonProps}
          ref={shapeRef}
          points={shape.points || []}
          pointerLength={arrowPointerSize}
          pointerWidth={arrowPointerSize}
          hitStrokeWidth={Math.max(strokeWidth * 2, 20)}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
        />
      );  
    case 'text':
      const textFill = shape.stroke || (useCanvasStore.getState().theme === 'dark' ? '#FFFFFF' : '#2D2D2D');
      return (
        <Text
          {...commonProps}
          ref={shapeRef}
          text={shape.text || ''}
          fontSize={shape.fontSize || 20}
          fontFamily={shape.fontFamily || 'Inter'}
          fill={textFill}
          stroke={undefined}
          strokeWidth={0}
          hitStrokeWidth={12}
          padding={4}
          lineHeight={1.2}
          visible={!isEditing}
          draggable={activeTool === TOOLS.SELECT && !isEditing}
        />
      );
    default:
      return null;
  }
};
