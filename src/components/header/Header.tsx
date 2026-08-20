import React from 'react';
import { Undo2, Redo2, Trash2, Download } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { IconButton } from '../ui/IconButton';

export const Header = () => {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  
  const historyStep = useCanvasStore((state) => state.historyStep);
  const historyLength = useCanvasStore((state) => state.history.length);

  const handleExport = () => {
    const stageContainer = document.querySelector('.konvajs-content');
    const canvas = stageContainer?.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'scribble.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
        <h1 className="font-semibold text-gray-900 jetbrains-mono">Scribble</h1>
      </div>

      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <IconButton
            icon={<Undo2 size={18} />}
            label="Undo (Ctrl+Z)"
            onClick={undo}
            disabled={historyStep === 0}
            className={historyStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <IconButton
            icon={<Redo2 size={18} />}
            label="Redo (Ctrl+Y)"
            onClick={redo}
            disabled={historyStep === historyLength - 1}
            className={historyStep === historyLength - 1 ? 'opacity-50 cursor-not-allowed' : ''}
          />
        </div>

        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <IconButton
            icon={<Trash2 size={18} />}
            label="Clear Canvas"
            onClick={clearCanvas}
            className="hover:text-red-600 hover:bg-red-50"
          />
          <div className="w-[1px] h-4 bg-gray-200 mx-1" />
          <IconButton
            icon={<Download size={18} />}
            label="Export PNG"
            onClick={handleExport}
          />
        </div>
      </div>
    </div>
  );
};
