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
  selectedIds: string[];
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
  updateShapes: (updates: Array<{ id: string } & Partial<Shape>>, saveHistory?: boolean) => void;
  deleteShape: (id: string, saveHistory?: boolean) => void;
  deleteShapes: (ids: string[], saveHistory?: boolean) => void;
  duplicateShape: (id: string) => void;
  duplicateShapes: (ids: string[]) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  commitHistory: () => void;
  setShapes: (shapes: Shape[]) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
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
  selectedIds: [],
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
        selectedIds: [shape.id],
      };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: shape.id,
      selectedIds: [shape.id],
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

  updateShapes: (updates, saveHistory = true) => set((state) => {
    if (updates.length === 0) return state;
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    const newShapes = state.shapes.map((shape) => {
      const u = updateMap.get(shape.id);
      return u ? { ...shape, ...u } : shape;
    });

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
    const newSelectedIds = state.selectedIds.filter((item) => item !== id);
    const newSelectedId = newSelectedIds[0] || null;
    if (!saveHistory) {
      return {
        shapes: newShapes,
        selectedId: newSelectedId,
        selectedIds: newSelectedIds,
      };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: newSelectedId,
      selectedIds: newSelectedIds,
    };
  }),

  deleteShapes: (ids, saveHistory = true) => set((state) => {
    if (ids.length === 0) return state;
    const idSet = new Set(ids);
    const newShapes = state.shapes.filter((shape) => !idSet.has(shape.id));
    const newSelectedIds = state.selectedIds.filter((id) => !idSet.has(id));
    const newSelectedId = newSelectedIds[0] || null;
    if (!saveHistory) {
      return {
        shapes: newShapes,
        selectedId: newSelectedId,
        selectedIds: newSelectedIds,
      };
    }
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedId: newSelectedId,
      selectedIds: newSelectedIds,
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
      selectedIds: [duplicated.id],
    };
  }),

  duplicateShapes: (ids) => set((state) => {
    if (ids.length === 0) return state;
    const targetShapes = state.shapes.filter((s) => ids.includes(s.id));
    if (targetShapes.length === 0) return state;

    const duplicatedList: Shape[] = targetShapes.map((shape) => ({
      ...shape,
      id: crypto.randomUUID(),
      x: shape.x + 20,
      y: shape.y + 20,
      points: shape.points ? [...shape.points] : undefined,
    }));

    const newShapes = [...state.shapes, ...duplicatedList];
    const newHistory = state.history.slice(0, state.historyStep + 1);
    const newSelectedIds = duplicatedList.map((d) => d.id);

    return {
      shapes: newShapes,
      history: [...newHistory, newShapes],
      historyStep: newHistory.length,
      selectedIds: newSelectedIds,
      selectedId: newSelectedIds[0] || null,
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
    if (!id) return { selectedId: null, selectedIds: [] };
    const shape = state.shapes.find((s) => s.id === id);
    if (!shape) return { selectedId: id, selectedIds: [id] };

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
      selectedIds: [id],
      activeStyle: updatedActiveStyle,
    };
  }),

  setSelectedIds: (ids) => set((state) => {
    const validIds = ids.filter((id) => state.shapes.some((s) => s.id === id));
    if (validIds.length === 0) {
      return { selectedId: null, selectedIds: [] };
    }
    const firstShape = state.shapes.find((s) => s.id === validIds[0]);
    let nextActiveStyle = state.activeStyle;
    if (firstShape) {
      const updated: ActiveStyle = { ...state.activeStyle };
      if (firstShape.stroke) updated.stroke = firstShape.stroke;
      if (firstShape.fill && (firstShape.type === 'rectangle' || firstShape.type === 'ellipse')) {
        updated.fill = firstShape.fill;
      }
      if (firstShape.strokeWidth !== undefined) updated.strokeWidth = firstShape.strokeWidth;
      if (firstShape.strokeStyle) updated.strokeStyle = firstShape.strokeStyle;
      if (firstShape.opacity !== undefined) updated.opacity = firstShape.opacity;
      if (firstShape.cornerRadius !== undefined && firstShape.type === 'rectangle') {
        updated.cornerRadius = firstShape.cornerRadius;
      }
      if (firstShape.fontSize !== undefined && firstShape.type === 'text') {
        updated.fontSize = firstShape.fontSize;
      }
      if (firstShape.fontFamily && firstShape.type === 'text') {
        updated.fontFamily = firstShape.fontFamily;
      }
      nextActiveStyle = updated;
    }
    return {
      selectedIds: validIds,
      selectedId: validIds[0] || null,
      activeStyle: nextActiveStyle,
    };
  }),

  toggleSelectId: (id) => set((state) => {
    const isSelected = state.selectedIds.includes(id);
    const newSelectedIds = isSelected
      ? state.selectedIds.filter((item) => item !== id)
      : [...state.selectedIds, id];
    return {
      selectedIds: newSelectedIds,
      selectedId: newSelectedIds[0] || null,
    };
  }),

  selectAll: () => set((state) => {
    const allIds = state.shapes.map((s) => s.id);
    return {
      selectedIds: allIds,
      selectedId: allIds[0] || null,
    };
  }),

  clearSelection: () => set({
    selectedIds: [],
    selectedId: null,
  }),

  setActiveTool: (tool) => set((state) => ({
    activeTool: tool,
    selectedId: tool !== TOOLS.SELECT ? null : state.selectedId,
    selectedIds: tool !== TOOLS.SELECT ? [] : state.selectedIds,
  })),
  
  undo: () => set((state) => {
    if (state.historyStep === 0) return state;
    return {
      historyStep: state.historyStep - 1,
      shapes: state.history[state.historyStep - 1],
      selectedId: null,
      selectedIds: [],
    };
  }),

  redo: () => set((state) => {
    if (state.historyStep === state.history.length - 1) return state;
    return {
      historyStep: state.historyStep + 1,
      shapes: state.history[state.historyStep + 1],
      selectedId: null,
      selectedIds: [],
    };
  }),

  clearCanvas: () => set((state) => {
    const newHistory = state.history.slice(0, state.historyStep + 1);
    return {
      shapes: [],
      history: [...newHistory, []],
      historyStep: newHistory.length,
      selectedId: null,
      selectedIds: [],
    };
  }),
}));
