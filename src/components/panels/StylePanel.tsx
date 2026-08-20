import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { COLORS } from '../../lib/constants';

export const StylePanel = () => {
  const shapes = useCanvasStore((state) => state.shapes);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const updateShape = useCanvasStore((state) => state.updateShape);

  const selectedShape = shapes.find((s) => s.id === selectedId);

  if (!selectedShape) return null;

  const handleColorChange = (key: 'stroke' | 'fill', color: string) => {
    updateShape(selectedShape.id, { [key]: color });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateShape(selectedShape.id, { strokeWidth: Number(e.target.value) });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateShape(selectedShape.id, { text: e.target.value });
  };

  const colors = [
    COLORS.black,
    COLORS.graphite,
    '#9CA3AF',
    COLORS.white,
    COLORS.accent,
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    'transparent'
  ];

  return (
    <div className="absolute right-6 top-24 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-4 pointer-events-auto z-10">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 jetbrains-mono">Properties</h3>
      
      <div className="space-y-4">
        {selectedShape.type === 'text' && (
          <>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Text</label>
              <input
                type="text"
                value={selectedShape.text || ''}
                onChange={handleTextChange}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#FF5A36] focus:ring-1 focus:ring-[#FF5A36]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Font Size: {selectedShape.fontSize}px</label>
              <input
                type="range"
                min="10"
                max="120"
                value={selectedShape.fontSize || 20}
                onChange={(e) => updateShape(selectedShape.id, { fontSize: Number(e.target.value) })}
                className="w-full accent-[#FF5A36]"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm text-gray-700 mb-1">Stroke</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={`stroke-${c}`}
                className={`w-6 h-6 rounded-full border ${selectedShape.stroke === c ? 'ring-2 ring-offset-1 ring-[#FF5A36]' : 'border-gray-200'}`}
                style={{ backgroundColor: c === 'transparent' ? '#fff' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}
                onClick={() => handleColorChange('stroke', c)}
                title={c}
              />
            ))}
          </div>
        </div>

        {selectedShape.type !== 'line' && selectedShape.type !== 'arrow' && selectedShape.type !== 'pen' && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Fill</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={`fill-${c}`}
                  className={`w-6 h-6 rounded-full border ${selectedShape.fill === c ? 'ring-2 ring-offset-1 ring-[#FF5A36]' : 'border-gray-200'}`}
                  style={{ backgroundColor: c === 'transparent' ? '#fff' : c, backgroundImage: c === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none', backgroundPosition: '0 0, 4px 4px', backgroundSize: '8px 8px' }}
                  onClick={() => handleColorChange('fill', c)}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}

        {selectedShape.type !== 'text' && (
          <div>
            <label className="block text-sm text-gray-700 mb-1">Stroke Width: {selectedShape.strokeWidth}px</label>
            <input
              type="range"
              min="1"
              max="20"
              value={selectedShape.strokeWidth || 2}
              onChange={handleWidthChange}
              className="w-full accent-[#FF5A36]"
            />
          </div>
        )}
      </div>
    </div>
  );
};
