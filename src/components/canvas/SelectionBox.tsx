import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import { useCanvasStore } from '../../store/canvasStore';

interface SelectionBoxProps {
  selectedId: string;
}

export const SelectionBox = ({ selectedId }: SelectionBoxProps) => {
  const trRef = useRef<any>(null);
  const shapes = useCanvasStore((state) => state.shapes);
  const selectedShape = shapes.find((s) => s.id === selectedId);
  const isText = selectedShape?.type === 'text';

  useEffect(() => {
    if (trRef.current) {
      const stage = trRef.current.getStage();
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        trRef.current.nodes([selectedNode]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <Transformer
      ref={trRef}
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
      anchorStroke="#FF5A36"
      anchorFill="#FFFFFF"
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#FF5A36"
      borderDash={[4, 4]}
    />
  );
};
