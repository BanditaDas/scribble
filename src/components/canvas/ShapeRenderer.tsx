import React, { useRef } from 'react';
import { Rect, Ellipse, Line, Arrow, Text } from 'react-konva';
import { Shape, useCanvasStore } from '../../store/canvasStore';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}

export const ShapeRenderer = ({ shape, isSelected, onSelect, onChange }: ShapeRendererProps) => {
  const shapeRef = useRef<any>(null);
  const isEditing = useCanvasStore((state) => state.editingTextId === shape.id);

  const commonProps = {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation || 0,
    stroke: shape.stroke,
    fill: shape.fill,
    strokeWidth: shape.strokeWidth,
    draggable: isSelected,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: (e: any) => {
      if (shape.type === 'text') {
        e?.cancelBubble && (e.cancelBubble = true);
        useCanvasStore.getState().setSelectedId(shape.id);
        useCanvasStore.getState().setEditingTextId(shape.id);
      }
    },
    onDblTap: (e: any) => {
      if (shape.type === 'text') {
        e?.cancelBubble && (e.cancelBubble = true);
        useCanvasStore.getState().setSelectedId(shape.id);
        useCanvasStore.getState().setEditingTextId(shape.id);
      }
    },
    onDragEnd: (e: any) => {
      onChange({
        ...shape,
        x: e.target.x(),
        y: e.target.y(),
      });
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
          lineCap="round"
          lineJoin="round"
        />
      );
    case 'arrow':
      return (
        <Arrow
          {...commonProps}
          ref={shapeRef}
          points={shape.points || []}
          pointerLength={10}
          pointerWidth={10}
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
          padding={4}
          lineHeight={1.2}
          visible={!isEditing}
          draggable={isSelected && !isEditing}
        />
      );
    default:
      return null;
  }
};
