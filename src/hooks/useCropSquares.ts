import { useState, useCallback } from 'react';
import type { CropSquare } from '../types';

let nextId = 1;

export function useCropSquares() {
  const [squares, setSquares] = useState<CropSquare[]>([]);

  const addSquare = useCallback((x: number, y: number, size: number) => {
    setSquares((prev) => [
      ...prev,
      {
        id: String(nextId++),
        x,
        y,
        size,
        order: prev.length + 1,
      },
    ]);
  }, []);

  const updateSquare = useCallback((id: string, patch: Partial<Pick<CropSquare, 'x' | 'y' | 'size'>>) => {
    setSquares((prev) =>
      prev.map((sq) => (sq.id === id ? { ...sq, ...patch } : sq))
    );
  }, []);

  const removeSquare = useCallback((id: string) => {
    setSquares((prev) =>
      prev
        .filter((sq) => sq.id !== id)
        .map((sq, i) => ({ ...sq, order: i + 1 }))
    );
  }, []);

  const moveSquare = useCallback((fromIndex: number, toIndex: number) => {
    setSquares((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((sq, i) => ({ ...sq, order: i + 1 }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setSquares([]);
  }, []);

  const clampSquaresToBounds = useCallback((maxWidth: number, maxHeight: number) => {
    if (maxWidth <= 0 || maxHeight <= 0) return;

    setSquares((prev) => {
      let changed = false;

      const next = prev.map((sq) => {
        const size = Math.max(1, Math.min(sq.size, maxWidth, maxHeight));
        const x = Math.max(0, Math.min(maxWidth - size, sq.x));
        const y = Math.max(0, Math.min(maxHeight - size, sq.y));

        if (x !== sq.x || y !== sq.y || size !== sq.size) {
          changed = true;
          return { ...sq, x, y, size };
        }
        return sq;
      });

      return changed ? next : prev;
    });
  }, []);

  const rescaleSquaresToBounds = useCallback(
    (fromWidth: number, fromHeight: number, toWidth: number, toHeight: number) => {
      if (fromWidth <= 0 || fromHeight <= 0 || toWidth <= 0 || toHeight <= 0) return;

      const scaleX = toWidth / fromWidth;
      const scaleY = toHeight / fromHeight;
      const sizeScale = Math.min(scaleX, scaleY);

      setSquares((prev) => {
        let changed = false;

        const next = prev.map((sq) => {
          const scaledSize = sq.size * sizeScale;
          const scaledX = sq.x * scaleX;
          const scaledY = sq.y * scaleY;

          const size = Math.max(1, Math.min(scaledSize, toWidth, toHeight));
          const x = Math.max(0, Math.min(toWidth - size, scaledX));
          const y = Math.max(0, Math.min(toHeight - size, scaledY));

          if (x !== sq.x || y !== sq.y || size !== sq.size) {
            changed = true;
            return { ...sq, x, y, size };
          }
          return sq;
        });

        return changed ? next : prev;
      });
    },
    []
  );

  return {
    squares,
    addSquare,
    updateSquare,
    removeSquare,
    moveSquare,
    clearAll,
    clampSquaresToBounds,
    rescaleSquaresToBounds,
  };
}
