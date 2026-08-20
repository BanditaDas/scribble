import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { TOOLS } from '../lib/constants';

export const useKeyboardShortcuts = () => {
  const deleteShape = useCanvasStore((state) => state.deleteShape);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedId) {
          deleteShape(selectedId);
        }
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
        setActiveTool(TOOLS.SELECT);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }

      const toolMap: Record<string, string> = {
        v: TOOLS.SELECT,
        r: TOOLS.RECTANGLE,
        o: TOOLS.ELLIPSE,
        l: TOOLS.LINE,
        a: TOOLS.ARROW,
        p: TOOLS.PEN,
        t: TOOLS.TEXT,
      };

      if (toolMap[e.key.toLowerCase()]) {
        setActiveTool(toolMap[e.key.toLowerCase()]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteShape, selectedId, setSelectedId, undo, redo, setActiveTool]);
};
