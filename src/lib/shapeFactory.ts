import { DEFAULT_PROPS, COLORS } from './constants';
import { useCanvasStore } from '../store/canvasStore';

export const createShape = (type: string, x: number, y: number) => {
  const theme = useCanvasStore.getState().theme;
  const defaultStroke = theme === 'dark' ? COLORS.white : COLORS.graphite;

  return {
    id: crypto.randomUUID(),
    type,
    x: type === 'line' || type === 'arrow' || type === 'pen' ? 0 : x,
    y: type === 'line' || type === 'arrow' || type === 'pen' ? 0 : y,
    width: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    height: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    stroke: defaultStroke,
    fill: DEFAULT_PROPS.fill,
    strokeWidth: DEFAULT_PROPS.strokeWidth,
    points: type === 'line' || type === 'arrow' || type === 'pen' ? [x, y, x, y] : undefined,
    text: type === 'text' ? 'Text' : undefined,
    fontSize: type === 'text' ? DEFAULT_PROPS.fontSize : undefined,
    fontFamily: type === 'text' ? DEFAULT_PROPS.fontFamily : undefined,
    rotation: 0,
  };
};
