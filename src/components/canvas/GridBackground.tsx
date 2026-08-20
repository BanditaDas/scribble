import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

export const GridBackground = () => {
  const theme = useCanvasStore((state) => state.theme);
  const dotColor = theme === 'dark' ? '#3f3f46' : '#d1d5db';

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 transition-colors duration-200"
      style={{
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    />
  );
};
