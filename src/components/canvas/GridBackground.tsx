import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

export const GridBackground = () => {
  const theme = useCanvasStore((state) => state.theme);
  const dotColor = theme === 'dark' ? '#4a4a4a' : '#d1d5db';
  const backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f8f9fa';

  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 transition-colors duration-200"
      style={{
        backgroundColor: backgroundColor,
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    />
  );
};
