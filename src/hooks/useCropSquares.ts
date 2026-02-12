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

  return { squares, addSquare, updateSquare, removeSquare, moveSquare, clearAll };
}
