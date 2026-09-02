export const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const distanceToSegment = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
};

export const segmentsIntersect = (
  a1x: number,
  a1y: number,
  a2x: number,
  a2y: number,
  b1x: number,
  b1y: number,
  b2x: number,
  b2y: number
): boolean => {
  const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
    return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
  };
  return (
    ccw(a1x, a1y, b1x, b1y, b2x, b2y) !== ccw(a2x, a2y, b1x, b1y, b2x, b2y) &&
    ccw(a1x, a1y, a2x, a2y, b1x, b1y) !== ccw(a1x, a1y, a2x, a2y, b2x, b2y)
  );
};

export const segmentDistanceToSegment = (
  a1x: number,
  a1y: number,
  a2x: number,
  a2y: number,
  b1x: number,
  b1y: number,
  b2x: number,
  b2y: number
): number => {
  if (segmentsIntersect(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y)) {
    return 0;
  }
  return Math.min(
    distanceToSegment(a1x, a1y, b1x, b1y, b2x, b2y),
    distanceToSegment(a2x, a2y, b1x, b1y, b2x, b2y),
    distanceToSegment(b1x, b1y, a1x, a1y, a2x, a2y),
    distanceToSegment(b2x, b2y, a1x, a1y, a2x, a2y)
  );
};

export interface Point {
  x: number;
  y: number;
}

export const shapeIntersectsEraser = (
  shape: {
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[];
    strokeWidth?: number;
    fontSize?: number;
    text?: string;
  },
  p1: Point,
  p2: Point,
  eraserRadius = 12
): boolean => {
  const threshold = eraserRadius + ((shape.strokeWidth || 2) / 2);

  if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
    const pts = shape.points || [];
    for (let i = 0; i < pts.length - 2; i += 2) {
      const dist = segmentDistanceToSegment(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        pts[i],
        pts[i + 1],
        pts[i + 2],
        pts[i + 3]
      );
      if (dist <= threshold) {
        return true;
      }
    }
    return false;
  }

  if (shape.type === 'rectangle') {
    const w = shape.width || 0;
    const h = shape.height || 0;
    const rx = w < 0 ? shape.x + w : shape.x;
    const ry = h < 0 ? shape.y + h : shape.y;
    const absW = Math.abs(w);
    const absH = Math.abs(h);

    // Check if points are inside the expanded box
    const inBox = (p: Point) =>
      p.x >= rx - threshold &&
      p.x <= rx + absW + threshold &&
      p.y >= ry - threshold &&
      p.y <= ry + absH + threshold;

    if (inBox(p1) || inBox(p2)) return true;

    // Check if segment intersects any of the 4 borders
    const borders = [
      [rx, ry, rx + absW, ry],
      [rx + absW, ry, rx + absW, ry + absH],
      [rx + absW, ry + absH, rx, ry + absH],
      [rx, ry + absH, rx, ry],
    ];

    for (const [bx1, by1, bx2, by2] of borders) {
      if (segmentDistanceToSegment(p1.x, p1.y, p2.x, p2.y, bx1, by1, bx2, by2) <= threshold) {
        return true;
      }
    }
    return false;
  }

  if (shape.type === 'ellipse') {
    const w = shape.width || 0;
    const h = shape.height || 0;
    const rx = w < 0 ? shape.x + w : shape.x;
    const ry = h < 0 ? shape.y + h : shape.y;
    const absW = Math.abs(w);
    const absH = Math.abs(h);
    const radiusX = absW / 2;
    const radiusY = absH / 2;
    const cx = rx + radiusX;
    const cy = ry + radiusY;

    // Check if p1 or p2 is inside or near the ellipse
    const checkPoint = (p: Point) => {
      if (radiusX <= 0 || radiusY <= 0) return false;
      const nx = (p.x - cx) / (radiusX + threshold);
      const ny = (p.y - cy) / (radiusY + threshold);
      return nx * nx + ny * ny <= 1;
    };

    if (checkPoint(p1) || checkPoint(p2)) return true;

    // Sample distance to center along segment
    const distToCenter = distanceToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y);
    return distToCenter <= Math.max(radiusX, radiusY) + threshold;
  }

  if (shape.type === 'text') {
    const fontSize = shape.fontSize || 20;
    const textLength = (shape.text || ' ').length;
    const textW = Math.max(60, textLength * fontSize * 0.65);
    const textH = Math.max(fontSize * 1.3, 24);

    const inTextBox = (p: Point) =>
      p.x >= shape.x - threshold &&
      p.x <= shape.x + textW + threshold &&
      p.y >= shape.y - threshold &&
      p.y <= shape.y + textH + threshold;

    if (inTextBox(p1) || inTextBox(p2)) return true;

    const borders = [
      [shape.x, shape.y, shape.x + textW, shape.y],
      [shape.x + textW, shape.y, shape.x + textW, shape.y + textH],
      [shape.x + textW, shape.y + textH, shape.x, shape.y + textH],
      [shape.x, shape.y + textH, shape.x, shape.y],
    ];

    for (const [bx1, by1, bx2, by2] of borders) {
      if (segmentDistanceToSegment(p1.x, p1.y, p2.x, p2.y, bx1, by1, bx2, by2) <= threshold) {
        return true;
      }
    }
    return false;
  }

  return false;
};
