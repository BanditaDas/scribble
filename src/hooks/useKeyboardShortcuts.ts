import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { TOOLS } from '../lib/constants';

export const useKeyboardShortcuts = () => {
  const deleteShape = useCanvasStore((state) => state.deleteShape);
  const duplicateShape = useCanvasStore((state) => state.duplicateShape);
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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const shapes = useCanvasStore.getState().shapes;
        if (shapes.length > 0) {
          e.preventDefault();
          useCanvasStore.getState().setActiveTool(TOOLS.SELECT);
          useCanvasStore.getState().selectAll();
        }
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        const { selectedIds, deleteShapes } = useCanvasStore.getState();
        if (selectedIds.length > 0) {
          deleteShapes(selectedIds);
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        const { selectedIds, duplicateShapes } = useCanvasStore.getState();
        if (selectedIds.length > 0) {
          e.preventDefault();
          duplicateShapes(selectedIds);
        }
      }

      if (e.key === 'Enter' && selectedId) {
        const shapes = useCanvasStore.getState().shapes;
        const selectedShape = shapes.find((s) => s.id === selectedId);
        if (selectedShape?.type === 'text') {
          useCanvasStore.getState().setEditingTextId(selectedId);
          e.preventDefault();
          return;
        }
      }

      if (e.key === 'Escape') {
        useCanvasStore.getState().clearSelection();
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
        e: TOOLS.ERASER,
      };

      if (toolMap[e.key.toLowerCase()]) {
        setActiveTool(toolMap[e.key.toLowerCase()]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteShape, duplicateShape, selectedId, setSelectedId, undo, redo, setActiveTool]);
};
