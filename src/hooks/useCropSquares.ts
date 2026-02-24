import { useState, useCallback, useRef } from 'react';
import type { CropSquare } from '../types';

let nextId = 1;
const HISTORY_LIMIT = 10;

interface CropSquaresState {
  squares: CropSquare[];
  past: CropSquare[][];
  future: CropSquare[][];
}

function areSquaresEqual(left: CropSquare[], right: CropSquare[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;

  for (let i = 0; i < left.length; i++) {
    const a = left[i];
    const b = right[i];
    if (
      a.id !== b.id ||
      a.x !== b.x ||
      a.y !== b.y ||
      a.size !== b.size ||
      a.order !== b.order
    ) {
      return false;
    }
  }

  return true;
}

function pushPastSnapshot(past: CropSquare[][], snapshot: CropSquare[]): CropSquare[][] {
  const nextPast = [...past, snapshot];
  if (nextPast.length <= HISTORY_LIMIT) return nextPast;
  return nextPast.slice(nextPast.length - HISTORY_LIMIT);
}

export function useCropSquares() {
  const [state, setState] = useState<CropSquaresState>({
    squares: [],
    past: [],
    future: [],
  });
  const gestureSnapshotRef = useRef<CropSquare[] | null>(null);

  const addSquare = useCallback((x: number, y: number, size: number) => {
    setState((prev) => {
      const nextSquares = [
        ...prev.squares,
        {
          id: String(nextId++),
          x,
          y,
          size,
          order: prev.squares.length + 1,
        },
      ];

      return {
        squares: nextSquares,
        past: pushPastSnapshot(prev.past, prev.squares),
        future: [],
      };
    });
  }, []);

  const updateSquare = useCallback((id: string, patch: Partial<Pick<CropSquare, 'x' | 'y' | 'size'>>) => {
    setState((prev) => {
      let changed = false;
      const nextSquares = prev.squares.map((sq) => {
        if (sq.id !== id) return sq;

        const nextSquare = { ...sq, ...patch };
        if (
          nextSquare.x === sq.x &&
          nextSquare.y === sq.y &&
          nextSquare.size === sq.size
        ) {
          return sq;
        }

        changed = true;
        return nextSquare;
      });

      if (!changed) return prev;

      if (gestureSnapshotRef.current) {
        return { ...prev, squares: nextSquares };
      }

      return {
        squares: nextSquares,
        past: pushPastSnapshot(prev.past, prev.squares),
        future: [],
      };
    });
  }, []);

  const removeSquare = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.squares.some((sq) => sq.id === id)) return prev;

      const nextSquares = prev.squares
        .filter((sq) => sq.id !== id)
        .map((sq, i) => ({ ...sq, order: i + 1 }));

      return {
        squares: nextSquares,
        past: pushPastSnapshot(prev.past, prev.squares),
        future: [],
      };
    });
  }, []);

  const moveSquare = useCallback((fromIndex: number, toIndex: number) => {
    setState((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.squares.length ||
        toIndex >= prev.squares.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const next = [...prev.squares];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return prev;
      next.splice(toIndex, 0, moved);
      const nextSquares = next.map((sq, i) => ({ ...sq, order: i + 1 }));

      return {
        squares: nextSquares,
        past: pushPastSnapshot(prev.past, prev.squares),
        future: [],
      };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState((prev) => {
      if (prev.squares.length === 0) return prev;
      return {
        squares: [],
        past: pushPastSnapshot(prev.past, prev.squares),
        future: [],
      };
    });
  }, []);

  const resetSquaresState = useCallback(() => {
    gestureSnapshotRef.current = null;
    setState({
      squares: [],
      past: [],
      future: [],
    });
  }, []);

  const beginGestureEdit = useCallback(() => {
    if (gestureSnapshotRef.current !== null) return;
    gestureSnapshotRef.current = state.squares;
  }, [state.squares]);

  const endGestureEdit = useCallback(() => {
    const snapshot = gestureSnapshotRef.current;
    gestureSnapshotRef.current = null;
    if (!snapshot) return;

    setState((prev) => {
      if (areSquaresEqual(snapshot, prev.squares)) return prev;
      return {
        squares: prev.squares,
        past: pushPastSnapshot(prev.past, snapshot),
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    gestureSnapshotRef.current = null;
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const previousSquares = prev.past[prev.past.length - 1];
      const nextPast = prev.past.slice(0, -1);
      return {
        squares: previousSquares,
        past: nextPast,
        future: [prev.squares, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    gestureSnapshotRef.current = null;
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const [nextSquares, ...remainingFuture] = prev.future;
      return {
        squares: nextSquares,
        past: pushPastSnapshot(prev.past, prev.squares),
        future: remainingFuture,
      };
    });
  }, []);

  const clampSquaresToBounds = useCallback((maxWidth: number, maxHeight: number) => {
    if (maxWidth <= 0 || maxHeight <= 0) return;

    setState((prev) => {
      let changed = false;

      const nextSquares = prev.squares.map((sq) => {
        const size = Math.max(1, Math.min(sq.size, maxWidth, maxHeight));
        const x = Math.max(0, Math.min(maxWidth - size, sq.x));
        const y = Math.max(0, Math.min(maxHeight - size, sq.y));

        if (x !== sq.x || y !== sq.y || size !== sq.size) {
          changed = true;
          return { ...sq, x, y, size };
        }
        return sq;
      });

      return changed ? { ...prev, squares: nextSquares } : prev;
    });
  }, []);

  const rescaleSquaresToBounds = useCallback(
    (fromWidth: number, fromHeight: number, toWidth: number, toHeight: number) => {
      if (fromWidth <= 0 || fromHeight <= 0 || toWidth <= 0 || toHeight <= 0) return;

      const scaleX = toWidth / fromWidth;
      const scaleY = toHeight / fromHeight;
      const sizeScale = Math.min(scaleX, scaleY);

      setState((prev) => {
        let changed = false;

        const nextSquares = prev.squares.map((sq) => {
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

        return changed ? { ...prev, squares: nextSquares } : prev;
      });
    },
    []
  );

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return {
    squares: state.squares,
    addSquare,
    updateSquare,
    removeSquare,
    moveSquare,
    clearAll,
    resetSquaresState,
    clampSquaresToBounds,
    rescaleSquaresToBounds,
    beginGestureEdit,
    endGestureEdit,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
