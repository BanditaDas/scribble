import React, { useRef } from 'react';
import { Rect, Ellipse, Line, Arrow, Text } from 'react-konva';
import { Shape } from '../../store/canvasStore';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
}

export const ShapeRenderer = ({ shape, isSelected, onSelect, onChange }: ShapeRendererProps) => {
  const shapeRef = useRef<any>(null);

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
    onDragEnd: (e: any) => {
      onChange({
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
      
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(5, (shape.width || 0) * scaleX),
        height: Math.max(5, (shape.height || 0) * scaleY),
      });
    },
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Rect
          {...commonProps}
          ref={shapeRef}
          width={shape.width}
          height={shape.height}
        />
      );
    case 'ellipse':
      return (
        <Ellipse
          {...commonProps}
          ref={shapeRef}
          radiusX={Math.abs((shape.width || 0) / 2)}
          radiusY={Math.abs((shape.height || 0) / 2)}
        />
      );
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
      return (
        <Text
          {...commonProps}
          ref={shapeRef}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          padding={5}
        />
      );
    default:
      return null;
  }
};
