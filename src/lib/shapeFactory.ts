import { DEFAULT_PROPS, COLORS } from './constants';
import { useCanvasStore } from '../store/canvasStore';

export const createShape = (type: string, x: number, y: number) => {
  const state = useCanvasStore.getState();
  const theme = state.theme;
  const activeStyle = state.activeStyle;

  // Determine stroke color
  let stroke = activeStyle.stroke;
  // If stroke is transparent, text/pen/line/arrow would be invisible, so fallback to theme stroke
  if ((type === 'text' || type === 'pen' || type === 'line' || type === 'arrow') && stroke === 'transparent') {
    stroke = theme === 'dark' ? COLORS.white : COLORS.graphite;
  }
  if (!stroke) {
    stroke = theme === 'dark' ? COLORS.white : COLORS.graphite;
  }

  // Determine fill color (only rectangle and ellipse use fill)
  const fill = (type === 'rectangle' || type === 'ellipse')
    ? (activeStyle.fill ?? DEFAULT_PROPS.fill)
    : DEFAULT_PROPS.fill;

  return {
    id: crypto.randomUUID(),
    type,
    x: type === 'line' || type === 'arrow' || type === 'pen' ? 0 : x,
    y: type === 'line' || type === 'arrow' || type === 'pen' ? 0 : y,
    width: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    height: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    stroke,
    fill,
    strokeWidth: activeStyle.strokeWidth ?? DEFAULT_PROPS.strokeWidth,
    strokeStyle: activeStyle.strokeStyle ?? 'solid',
    opacity: activeStyle.opacity ?? 1,
    cornerRadius: type === 'rectangle' ? (activeStyle.cornerRadius ?? 0) : undefined,
    points: type === 'line' || type === 'arrow' || type === 'pen' ? [x, y, x, y] : undefined,
    text: type === 'text' ? '' : undefined,
    fontSize: type === 'text' ? (activeStyle.fontSize ?? DEFAULT_PROPS.fontSize) : undefined,
    fontFamily: type === 'text' ? (activeStyle.fontFamily ?? DEFAULT_PROPS.fontFamily) : undefined,
    rotation: 0,
  };
};
