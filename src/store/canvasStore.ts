import { create } from 'zustand';
import { TOOLS } from '../lib/constants';

export interface Shape {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  cornerRadius?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  rotation?: number;
}

interface CanvasState {
  shapes: Shape[];
  history: Shape[][];
  historyStep: number;
  selectedId: string | null;
  editingTextId: string | null;
  activeTool: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setEditingTextId: (id: string | null) => void;
  addShape: (shape: Shape, saveHistory?: boolean) => void;
  updateShape: (id: string, newProps: Partial<Shape>, saveHistory?: boolean) => void;
  deleteShape: (id: string, saveHistory?: boolean) => void;
  duplicateShape: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  commitHistory: () => void;
  setShapes: (shapes: Shape[]) => void;
  setSelectedId: (id: string | null) => void;
  setActiveTool: (tool: string) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  loadInitialState: (shapes: Shape[]) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  shapes: [],
  history: [[]],
  historyStep: 0,
  selectedId: null,
  editingTextId: null,
  activeTool: TOOLS.SELECT,
  theme: 'light',

  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (theme) => set({ theme }),
  setEditingTextId: (id) => set({ editingTextId: id }),

  loadInitialState: (shapes) => set({ shapes, history: [shapes], historyStep: 0 }),

  addShape: (shape, saveHistory = true) => set((state) => {
    const newShapes = [...state.shapes, shape];
    if (!saveHistory) {
      return {
        shapes: newShapes,
        selectedId: shape.id,
      };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: shape.id,
    };
  }),

  updateShape: (id, newProps, saveHistory = true) => set((state) => {
    const newShapes = state.shapes.map((shape) =>
      shape.id === id ? { ...shape, ...newProps } : shape
    );
    if (!saveHistory) {
      return { shapes: newShapes };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
    };
  }),

  deleteShape: (id, saveHistory = true) => set((state) => {
    const newShapes = state.shapes.filter((shape) => shape.id !== id);
    const newSelectedId = state.selectedId === id ? null : state.selectedId;
    if (!saveHistory) {
      return {
        shapes: newShapes,
        selectedId: newSelectedId,
      };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: newSelectedId,
    };
  }),

  duplicateShape: (id) => set((state) => {
    const shape = state.shapes.find((s) => s.id === id);
    if (!shape) return state;
    const duplicated: Shape = {
      ...shape,
      id: crypto.randomUUID(),
      x: shape.x + 20,
      y: shape.y + 20,
      points: shape.points ? shape.points.map((p, idx) => idx % 2 === 0 ? p + 20 : p + 20) : undefined,
    };
    const newShapes = [...state.shapes, duplicated];
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: duplicated.id,
    };
  }),

  bringToFront: (id) => set((state) => {
    const index = state.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === state.shapes.length - 1) return state;
    const shape = state.shapes[index];
    const newShapes = [...state.shapes.filter((s) => s.id !== id), shape];
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
    };
  }),

  sendToBack: (id) => set((state) => {
    const index = state.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === 0) return state;
    const shape = state.shapes[index];
    const newShapes = [shape, ...state.shapes.filter((s) => s.id !== id)];
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
    };
  }),

  bringForward: (id) => set((state) => {
    const index = state.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === state.shapes.length - 1) return state;
    const newShapes = [...state.shapes];
    const temp = newShapes[index];
    newShapes[index] = newShapes[index + 1];
    newShapes[index + 1] = temp;
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
    };
  }),

  sendBackward: (id) => set((state) => {
    const index = state.shapes.findIndex((s) => s.id === id);
    if (index === -1 || index === 0) return state;
    const newShapes = [...state.shapes];
    const temp = newShapes[index];
    newShapes[index] = newShapes[index - 1];
    newShapes[index - 1] = temp;
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
    };
  }),

  commitHistory: () => set((state) => {
    const currentShapes = state.shapes;
    const previousSnapshot = state.history[state.historyStep];
    if (JSON.stringify(currentShapes) === JSON.stringify(previousSnapshot)) {
      return state;
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      history: [...newHistory, currentShapes],
      historyStep: newHistory.length,
    };
  }),

  setShapes: (shapes) => set((state) => {
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes,
      history: [...newHistory, shapes],
      historyStep: newHistory.length,
    };
  }),

  setSelectedId: (id) => set({ selectedId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  
  undo: () => set((state) => {
    if (state.historyStep === 0) return state;
    return {
      historyStep: state.historyStep - 1,
      shapes: state.history[state.historyStep - 1],
      selectedId: null,
    };
  }),

  redo: () => set((state) => {
    if (state.historyStep === state.history.length - 1) return state;
    return {
      historyStep: state.historyStep + 1,
      shapes: state.history[state.historyStep + 1],
      selectedId: null,
    };
  }),

  clearCanvas: () => set((state) => {
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: [],
      history: [...newHistory, []],
      historyStep: newHistory.length,
      selectedId: null,
    };
  }),
}));
