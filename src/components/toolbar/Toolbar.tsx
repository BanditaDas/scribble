import React from 'react';
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  PenTool, 
  Type 
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { TOOLS } from '../../lib/constants';
import { IconButton } from '../ui/IconButton';

export const Toolbar = () => {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  const tools = [
    { id: TOOLS.SELECT, icon: <MousePointer2 size={20} />, label: 'Select (V)' },
    { id: 'divider-1' },
    { id: TOOLS.RECTANGLE, icon: <Square size={20} />, label: 'Rectangle (R)' },
    { id: TOOLS.ELLIPSE, icon: <Circle size={20} />, label: 'Ellipse (O)' },
    { id: TOOLS.LINE, icon: <Minus size={20} />, label: 'Line (L)' },
    { id: TOOLS.ARROW, icon: <ArrowRight size={20} />, label: 'Arrow (A)' },
    { id: 'divider-2' },
    { id: TOOLS.PEN, icon: <PenTool size={20} />, label: 'Pen (P)' },
    { id: TOOLS.TEXT, icon: <Type size={20} />, label: 'Text (T)' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <div className="flex items-center gap-1 bg-white shadow-lg shadow-black/5 rounded-full px-3 py-2 border border-gray-200 pointer-events-auto">
        {tools.map((tool, index) => {
          if (tool.id.startsWith('divider')) {
            return <div key={tool.id} className="w-[1px] h-6 bg-gray-200 mx-1" />;
          }
          return (
            <IconButton
              key={tool.id}
              active={activeTool === tool.id}
              icon={tool.icon!}
              label={tool.label}
              onClick={() => setActiveTool(tool.id)}
              className="rounded-full"
            />
          );
        })}
      </div>
    </div>
  );
};
