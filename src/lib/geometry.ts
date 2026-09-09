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

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const getShapeBounds = (shape: {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  fontSize?: number;
  text?: string;
}): BoundingBox => {
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    const w = shape.width || 0;
    const h = shape.height || 0;
    const rx = w < 0 ? shape.x + w : shape.x;
    const ry = h < 0 ? shape.y + h : shape.y;
    return {
      minX: rx,
      minY: ry,
      maxX: rx + Math.abs(w),
      maxY: ry + Math.abs(h),
    };
  }

  if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
    const pts = shape.points || [];
    if (pts.length < 2) {
      return { minX: shape.x, minY: shape.y, maxX: shape.x, maxY: shape.y };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      const px = shape.x + pts[i];
      const py = shape.y + pts[i + 1];
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    return { minX, minY, maxX, maxY };
  }

  if (shape.type === 'text') {
    const fontSize = shape.fontSize || 20;
    const textLength = Math.max(1, (shape.text || ' ').length);
    const textW = Math.max(40, textLength * fontSize * 0.65);
    const textH = Math.max(fontSize * 1.3, 24);
    return {
      minX: shape.x,
      minY: shape.y,
      maxX: shape.x + textW,
      maxY: shape.y + textH,
    };
  }

  return { minX: shape.x, minY: shape.y, maxX: shape.x, maxY: shape.y };
};

export const boxesIntersect = (a: BoundingBox, b: BoundingBox): boolean => {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
};

export const shapeIntersectsBox = (
  shape: {
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[];
    fontSize?: number;
    text?: string;
  },
  box: BoundingBox
): boolean => {
  const shapeBounds = getShapeBounds(shape);
  // Quick rejection if AABBs do not overlap
  if (!boxesIntersect(shapeBounds, box)) {
    return false;
  }

  // If bounding boxes overlap, for rectangle/ellipse/text, the bounds overlap is sufficient
  if (shape.type === 'rectangle' || shape.type === 'ellipse' || shape.type === 'text') {
    return true;
  }

  // For line / arrow / pen strokes:
  // Check if any point is inside the box
  const pts = shape.points || [];
  for (let i = 0; i < pts.length; i += 2) {
    const px = shape.x + pts[i];
    const py = shape.y + pts[i + 1];
    if (px >= box.minX && px <= box.maxX && py >= box.minY && py <= box.maxY) {
      return true;
    }
  }

  // Check if any line segment intersects any of the 4 borders of the box
  const boxBorders = [
    [box.minX, box.minY, box.maxX, box.minY],
    [box.maxX, box.minY, box.maxX, box.maxY],
    [box.maxX, box.maxY, box.minX, box.maxY],
    [box.minX, box.maxY, box.minX, box.minY],
  ];

  for (let i = 0; i < pts.length - 2; i += 2) {
    const p1x = shape.x + pts[i];
    const p1y = shape.y + pts[i + 1];
    const p2x = shape.x + pts[i + 2];
    const p2y = shape.y + pts[i + 3];

    for (const [bx1, by1, bx2, by2] of boxBorders) {
      if (segmentsIntersect(p1x, p1y, p2x, p2y, bx1, by1, bx2, by2)) {
        return true;
      }
    }
  }

  return false;
};

export const getClampedPosition = (
  shape: {
    type: string;
    width?: number;
    height?: number;
    points?: number[];
    fontSize?: number;
    text?: string;
  },
  newX: number,
  newY: number,
  stageWidth: number,
  stageHeight: number,
  minVisible = 24
): { x: number; y: number } => {
  if (shape.type === 'rectangle' || shape.type === 'ellipse') {
    const w = Math.abs(shape.width || 0);
    const h = Math.abs(shape.height || 0);
    const minVisibleX = Math.min(minVisible, Math.max(10, w * 0.3));
    const minVisibleY = Math.min(minVisible, Math.max(10, h * 0.3));

    return {
      x: Math.max(-w + minVisibleX, Math.min(stageWidth - minVisibleX, newX)),
      y: Math.max(-h + minVisibleY, Math.min(stageHeight - minVisibleY, newY)),
    };
  }

  if (shape.type === 'text') {
    const fontSize = shape.fontSize || 20;
    const textLen = Math.max(1, (shape.text || ' ').length);
    const textW = Math.max(40, textLen * fontSize * 0.65);
    const textH = Math.max(fontSize * 1.3, 24);
    const minVisibleX = Math.min(minVisible, Math.max(10, textW * 0.3));
    const minVisibleY = Math.min(20, Math.max(10, textH * 0.3));

    return {
      x: Math.max(-textW + minVisibleX, Math.min(stageWidth - minVisibleX, newX)),
      y: Math.max(-textH + minVisibleY, Math.min(stageHeight - minVisibleY, newY)),
    };
  }

  if (shape.type === 'line' || shape.type === 'arrow' || shape.type === 'pen') {
    const pts = shape.points || [];
    if (pts.length < 2) return { x: newX, y: newY };

    let minPtX = Infinity;
    let maxPtX = -Infinity;
    let minPtY = Infinity;
    let maxPtY = -Infinity;

    for (let i = 0; i < pts.length; i += 2) {
      const px = pts[i];
      const py = pts[i + 1];
      if (px < minPtX) minPtX = px;
      if (px > maxPtX) maxPtX = px;
      if (py < minPtY) minPtY = py;
      if (py > maxPtY) maxPtY = py;
    }

    const spanX = Math.max(20, maxPtX - minPtX);
    const spanY = Math.max(20, maxPtY - minPtY);
    const minVisibleX = Math.min(minVisible, Math.max(10, spanX * 0.3));
    const minVisibleY = Math.min(minVisible, Math.max(10, spanY * 0.3));

    return {
      x: Math.max(minVisibleX - maxPtX, Math.min(stageWidth - minPtX - minVisibleX, newX)),
      y: Math.max(minVisibleY - maxPtY, Math.min(stageHeight - minPtY - minVisibleY, newY)),
    };
  }

  return { x: newX, y: newY };
};

