import { useCallback, useRef } from 'react';

interface Bounds {
  maxWidth: number;
  maxHeight: number;
}

interface Position {
  x: number;
  y: number;
  size: number;
}

export interface SnapTarget {
  x: number;
  y: number;
  size: number;
}

const MIN_SIZE = 50;
const SNAP_THRESHOLD = 12;

function applySnap(x: number, y: number, size: number, targets: SnapTarget[]): { x: number; y: number } {
  let snappedX = x;
  let snappedY = y;
  let bestDx = SNAP_THRESHOLD + 1;
  let bestDy = SNAP_THRESHOLD + 1;

  const myLeft = x;
  const myRight = x + size;
  const myTop = y;
  const myBottom = y + size;

  for (const t of targets) {
    const tLeft = t.x;
    const tRight = t.x + t.size;
    const tTop = t.y;
    const tBottom = t.y + t.size;

    // Horizontal snaps: my left edge vs target edges
    const dLeftLeft = Math.abs(myLeft - tLeft);
    const dLeftRight = Math.abs(myLeft - tRight);
    // Horizontal snaps: my right edge vs target edges
    const dRightLeft = Math.abs(myRight - tLeft);
    const dRightRight = Math.abs(myRight - tRight);

    if (dLeftLeft < bestDx) { bestDx = dLeftLeft; snappedX = tLeft; }
    if (dLeftRight < bestDx) { bestDx = dLeftRight; snappedX = tRight; }
    if (dRightLeft < bestDx) { bestDx = dRightLeft; snappedX = tLeft - size; }
    if (dRightRight < bestDx) { bestDx = dRightRight; snappedX = tRight - size; }

    // Vertical snaps: my top edge vs target edges
    const dTopTop = Math.abs(myTop - tTop);
    const dTopBottom = Math.abs(myTop - tBottom);
    // Vertical snaps: my bottom edge vs target edges
    const dBottomTop = Math.abs(myBottom - tTop);
    const dBottomBottom = Math.abs(myBottom - tBottom);

    if (dTopTop < bestDy) { bestDy = dTopTop; snappedY = tTop; }
    if (dTopBottom < bestDy) { bestDy = dTopBottom; snappedY = tBottom; }
    if (dBottomTop < bestDy) { bestDy = dBottomTop; snappedY = tTop - size; }
    if (dBottomBottom < bestDy) { bestDy = dBottomBottom; snappedY = tBottom - size; }
  }

  return {
    x: bestDx <= SNAP_THRESHOLD ? snappedX : x,
    y: bestDy <= SNAP_THRESHOLD ? snappedY : y,
  };
}

export function useDragResize(
  position: Position,
  bounds: Bounds,
  onUpdate: (patch: Partial<Pick<Position, 'x' | 'y' | 'size'>>) => void,
  snapTargets: SnapTarget[] = []
) {
  const dragStart = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeStart = useRef<{ startX: number; startY: number; origX: number; origY: number; origSize: number; corner: string } | null>(null);

  const onDragPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragStart.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
      };
    },
    [position.x, position.y]
  );

  const onDragPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.startX;
      const dy = e.clientY - dragStart.current.startY;
      let newX = Math.max(0, Math.min(bounds.maxWidth - position.size, dragStart.current.origX + dx));
      let newY = Math.max(0, Math.min(bounds.maxHeight - position.size, dragStart.current.origY + dy));

      // Apply snapping
      if (snapTargets.length > 0) {
        const snapped = applySnap(newX, newY, position.size, snapTargets);
        newX = Math.max(0, Math.min(bounds.maxWidth - position.size, snapped.x));
        newY = Math.max(0, Math.min(bounds.maxHeight - position.size, snapped.y));
      }

      onUpdate({ x: newX, y: newY });
    },
    [bounds.maxWidth, bounds.maxHeight, position.size, onUpdate, snapTargets]
  );

  const onDragPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent, corner: string) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeStart.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: position.x,
        origY: position.y,
        origSize: position.size,
        corner,
      };
    },
    [position.x, position.y, position.size]
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resizeStart.current) return;
      const { startX, startY, origX, origY, origSize, corner } = resizeStart.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newSize = origSize;
      let newX = origX;
      let newY = origY;

      if (corner === 'se') {
        const delta = Math.max(dx, dy);
        newSize = Math.max(MIN_SIZE, origSize + delta);
        newSize = Math.min(newSize, bounds.maxWidth - origX, bounds.maxHeight - origY);
      } else if (corner === 'sw') {
        const delta = Math.max(-dx, dy);
        newSize = Math.max(MIN_SIZE, origSize + delta);
        newSize = Math.min(newSize, origX + origSize, bounds.maxHeight - origY);
        newX = origX + origSize - newSize;
      } else if (corner === 'ne') {
        const delta = Math.max(dx, -dy);
        newSize = Math.max(MIN_SIZE, origSize + delta);
        newSize = Math.min(newSize, bounds.maxWidth - origX, origY + origSize);
        newY = origY + origSize - newSize;
      } else if (corner === 'nw') {
        const delta = Math.max(-dx, -dy);
        newSize = Math.max(MIN_SIZE, origSize + delta);
        newSize = Math.min(newSize, origX + origSize, origY + origSize);
        newX = origX + origSize - newSize;
        newY = origY + origSize - newSize;
      }

      onUpdate({ x: newX, y: newY, size: newSize });
    },
    [bounds.maxWidth, bounds.maxHeight, onUpdate]
  );

  const onResizePointerUp = useCallback(() => {
    resizeStart.current = null;
  }, []);

  return {
    dragHandlers: {
      onPointerDown: onDragPointerDown,
      onPointerMove: onDragPointerMove,
      onPointerUp: onDragPointerUp,
    },
    resizeHandlers: {
      onPointerDown: onResizePointerDown,
      onPointerMove: onResizePointerMove,
      onPointerUp: onResizePointerUp,
    },
  };
}
