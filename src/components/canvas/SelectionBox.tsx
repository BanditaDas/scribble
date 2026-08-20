import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

interface SelectionBoxProps {
  selectedId: string;
}

export const SelectionBox = ({ selectedId }: SelectionBoxProps) => {
  const trRef = useRef<any>(null);

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
    />
  );
};
