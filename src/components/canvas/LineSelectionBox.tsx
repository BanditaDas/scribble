import React from 'react';
import { Circle } from 'react-konva';
import { Shape } from '../../store/canvasStore';

interface LineSelectionBoxProps {
  shape: Shape;
  onChange: (newAttrs: Partial<Shape>) => void;
  theme: 'light' | 'dark';
}

export const LineSelectionBox = ({ shape, onChange, theme }: LineSelectionBoxProps) => {
  if (!shape.points || shape.points.length < 4) return null;

  const startPoint = { x: shape.x + shape.points[0], y: shape.y + shape.points[1] };
  const endPoint = { x: shape.x + shape.points[2], y: shape.y + shape.points[3] };

  const handleColor = theme === 'dark' ? '#3B82F6' : '#2563EB';
  const handleStroke = theme === 'dark' ? '#FFFFFF' : '#FFFFFF';

  const onDragStartHandle = (e: any) => {
    e.cancelBubble = true; // Prevent dragging the whole line
  };

  const handleDrag = (index: 0 | 2) => (e: any) => {
    e.cancelBubble = true;
    const node = e.target;
    const newPoints = [...shape.points!];
    newPoints[index] = node.x() - shape.x;
    newPoints[index + 1] = node.y() - shape.y;
    onChange({ points: newPoints });
  };

  return (
    <>
      <Circle
        x={startPoint.x}
        y={startPoint.y}
        radius={5}
        fill={handleColor}
        stroke={handleStroke}
        strokeWidth={2}
        draggable
        onDragStart={onDragStartHandle}
        onDragMove={handleDrag(0)}
        onDragEnd={handleDrag(0)}
      />
      <Circle
        x={endPoint.x}
        y={endPoint.y}
        radius={5}
        fill={handleColor}
        stroke={handleStroke}
        strokeWidth={2}
        draggable
        onDragStart={onDragStartHandle}
        onDragMove={handleDrag(2)}
        onDragEnd={handleDrag(2)}
      />
    </>
  );
};
