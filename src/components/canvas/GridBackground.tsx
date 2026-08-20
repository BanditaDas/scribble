import React from 'react';

export const GridBackground = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  );
};
