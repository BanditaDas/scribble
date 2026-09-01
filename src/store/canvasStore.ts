import { create } from 'zustand';
import { TOOLS, COLORS, DEFAULT_PROPS } from '../lib/constants';

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

export interface ActiveStyle {
  stroke: string;
  fill: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  cornerRadius: number;
  fontSize: number;
  fontFamily: string;
}

interface CanvasState {
  shapes: Shape[];
  history: Shape[][];
  historyStep: number;
  selectedId: string | null;
  editingTextId: string | null;
  activeTool: string;
  activeStyle: ActiveStyle;
  setActiveStyle: (style: Partial<ActiveStyle>) => void;
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
  activeStyle: {
    stroke: COLORS.graphite,
    fill: COLORS.transparent,
    strokeWidth: DEFAULT_PROPS.strokeWidth,
    strokeStyle: 'solid',
    opacity: 1,
    cornerRadius: 0,
    fontSize: DEFAULT_PROPS.fontSize,
    fontFamily: DEFAULT_PROPS.fontFamily,
  },
  theme: 'light',

  setActiveStyle: (style) => set((state) => ({
    activeStyle: { ...state.activeStyle, ...style },
  })),

  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    let nextStroke = state.activeStyle.stroke;
    if (state.theme === 'light' && nextStroke === COLORS.graphite) {
      nextStroke = COLORS.white;
    } else if (state.theme === 'dark' && nextStroke === COLORS.white) {
      nextStroke = COLORS.graphite;
    }
    return {
      theme: nextTheme,
      activeStyle: { ...state.activeStyle, stroke: nextStroke },
    };
  }),

  setTheme: (theme) => set((state) => {
    let nextStroke = state.activeStyle.stroke;
    if (state.theme === 'light' && theme === 'dark' && nextStroke === COLORS.graphite) {
      nextStroke = COLORS.white;
    } else if (state.theme === 'dark' && theme === 'light' && nextStroke === COLORS.white) {
      nextStroke = COLORS.graphite;
    }
    return {
      theme,
      activeStyle: { ...state.activeStyle, stroke: nextStroke },
    };
  }),

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
    const targetShape = state.shapes.find((s) => s.id === id);
    const newShapes = state.shapes.map((shape) =>
      shape.id === id ? { ...shape, ...newProps } : shape
    );

    let nextActiveStyle = state.activeStyle;
    if (state.selectedId === id && targetShape) {
      const shapeType = newProps.type || targetShape.type;
      const styleUpdates: Partial<ActiveStyle> = {};
      if (newProps.stroke !== undefined) styleUpdates.stroke = newProps.stroke;
      if (newProps.fill !== undefined && (shapeType === 'rectangle' || shapeType === 'ellipse')) {
        styleUpdates.fill = newProps.fill;
      }
      if (newProps.strokeWidth !== undefined) styleUpdates.strokeWidth = newProps.strokeWidth;
      if (newProps.strokeStyle !== undefined) styleUpdates.strokeStyle = newProps.strokeStyle;
      if (newProps.opacity !== undefined) styleUpdates.opacity = newProps.opacity;
      if (newProps.cornerRadius !== undefined && shapeType === 'rectangle') {
        styleUpdates.cornerRadius = newProps.cornerRadius;
      }
      if (newProps.fontSize !== undefined && shapeType === 'text') {
        styleUpdates.fontSize = newProps.fontSize;
      }
      if (newProps.fontFamily !== undefined && shapeType === 'text') {
        styleUpdates.fontFamily = newProps.fontFamily;
      }

      if (Object.keys(styleUpdates).length > 0) {
        nextActiveStyle = { ...state.activeStyle, ...styleUpdates };
      }
    }

    if (!saveHistory) {
      return { shapes: newShapes, activeStyle: nextActiveStyle };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      activeStyle: nextActiveStyle,
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
      points: shape.points ? [...shape.points] : undefined,
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

  setSelectedId: (id) => set((state) => {
    if (!id) return { selectedId: null };
    const shape = state.shapes.find((s) => s.id === id);
    if (!shape) return { selectedId: id };

    const updatedActiveStyle: ActiveStyle = { ...state.activeStyle };
    if (shape.stroke) updatedActiveStyle.stroke = shape.stroke;
    if (shape.fill && (shape.type === 'rectangle' || shape.type === 'ellipse')) {
      updatedActiveStyle.fill = shape.fill;
    }
    if (shape.strokeWidth !== undefined) updatedActiveStyle.strokeWidth = shape.strokeWidth;
    if (shape.strokeStyle) updatedActiveStyle.strokeStyle = shape.strokeStyle;
    if (shape.opacity !== undefined) updatedActiveStyle.opacity = shape.opacity;
    if (shape.cornerRadius !== undefined && shape.type === 'rectangle') {
      updatedActiveStyle.cornerRadius = shape.cornerRadius;
    }
    if (shape.fontSize !== undefined && shape.type === 'text') {
      updatedActiveStyle.fontSize = shape.fontSize;
    }
    if (shape.fontFamily && shape.type === 'text') {
      updatedActiveStyle.fontFamily = shape.fontFamily;
    }

    return {
      selectedId: id,
      activeStyle: updatedActiveStyle,
    };
  }),

  setActiveTool: (tool) => set((state) => ({
    activeTool: tool,
    selectedId: tool !== TOOLS.SELECT ? null : state.selectedId,
  })),
  
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
