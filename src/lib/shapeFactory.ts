import { DEFAULT_PROPS } from './constants';

export const createShape = (type: string, x: number, y: number) => {
  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    width: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    height: type === 'line' || type === 'arrow' || type === 'pen' ? undefined : 0,
    stroke: DEFAULT_PROPS.stroke,
    fill: DEFAULT_PROPS.fill,
    strokeWidth: DEFAULT_PROPS.strokeWidth,
    points: type === 'line' || type === 'arrow' || type === 'pen' ? [x, y, x, y] : undefined,
    text: type === 'text' ? 'Double click to edit' : undefined,
    fontSize: type === 'text' ? DEFAULT_PROPS.fontSize : undefined,
    fontFamily: type === 'text' ? DEFAULT_PROPS.fontFamily : undefined,
    rotation: 0,
  };
};
