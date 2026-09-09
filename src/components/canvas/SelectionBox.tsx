import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import { useCanvasStore, Shape } from '../../store/canvasStore';

interface SelectionBoxProps {
  selectedIds?: string[];
  selectedId?: string;
}

export const SelectionBox = ({ selectedIds, selectedId }: SelectionBoxProps) => {
  const trRef = useRef<any>(null);
  const shapes = useCanvasStore((state) => state.shapes);
  const ids = selectedIds || (selectedId ? [selectedId] : []);
  const singleShape = ids.length === 1 ? shapes.find((s) => s.id === ids[0]) : null;
  const isText = singleShape?.type === 'text';

  useEffect(() => {
    if (trRef.current) {
      const stage = trRef.current.getStage();
      if (!stage) return;
      const selectedNodes = ids
        .map((id) => stage.findOne(`#${id}`))
        .filter(Boolean);
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [ids.join(',')]);

  const handleTransformEnd = () => {
    if (!trRef.current) return;
    const nodes = trRef.current.nodes();
    if (nodes.length <= 1) return; // single nodes handle their own onTransformEnd

    const updates: Array<{ id: string } & Partial<Shape>> = [];
    for (const node of nodes) {
      const id = node.id();
      const shape = shapes.find((s) => s.id === id);
      if (!shape) continue;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
        const scaledPoints = (shape.points || []).map((p, index) => {
          return index % 2 === 0 ? p * scaleX : p * scaleY;
        });
        updates.push({
          id: shape.id,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          points: scaledPoints,
        });
      } else if (shape.type === 'text') {
        const newFontSize = Math.max(10, Math.round((shape.fontSize || 20) * scaleX));
        updates.push({
          id: shape.id,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          fontSize: newFontSize,
        });
      } else {
        updates.push({
          id: shape.id,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, (shape.width || 0) * scaleX),
          height: Math.max(5, (shape.height || 0) * scaleY),
        });
      }
    }

    if (updates.length > 0) {
      useCanvasStore.getState().updateShapes(updates, true);
    }
  };

  return (
    <Transformer
      ref={trRef}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
          return oldBox;
        }
        return newBox;
      }}
      enabledAnchors={
        isText
          ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
          : ['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']
      }
      keepRatio={isText}
      anchorStroke="#6366F1"
      anchorFill="#FFFFFF"
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#6366F1"
      borderDash={[4, 4]}
      shouldOverdrawWholeArea={true}
    />
  );
};
