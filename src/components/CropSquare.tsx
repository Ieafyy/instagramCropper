import { useEffect, useRef } from 'react';
import { useDragResize } from '../hooks/useDragResize';
import type { SnapTarget } from '../hooks/useDragResize';
import type { CropSquare as CropSquareType } from '../types';

interface CropSquareProps {
  square: CropSquareType;
  bounds: { maxWidth: number; maxHeight: number };
  snapTargets: SnapTarget[];
  onUpdate: (id: string, patch: Partial<Pick<CropSquareType, 'x' | 'y' | 'size'>>) => void;
  onRemove: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onToggleSelect: (id: string) => void;
  onLongPressSelect: (id: string) => void;
  isMobileViewport: boolean;
  isMobileSelectionMode: boolean;
  onDragStart?: () => void;
  onDragDelta?: (dx: number, dy: number) => void;
  onDragEnd?: () => void;
  onResizeStart?: (corner: string) => void;
  onResizeDelta?: (sizeDelta: number, corner: string) => void;
  onResizeEnd?: () => void;
}

const CORNERS = ['nw', 'ne', 'sw', 'se'] as const;
const LONG_PRESS_MS = 420;
const LONG_PRESS_MOVE_TOLERANCE = 8;

const CORNER_CLASSES: Record<string, string> = {
  nw: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
  ne: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
  sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
  se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
};

export function CropSquare({
  square,
  bounds,
  snapTargets,
  onUpdate,
  onRemove,
  isSelected,
  onSelect,
  onToggleSelect,
  onLongPressSelect,
  isMobileViewport,
  isMobileSelectionMode,
  onDragStart,
  onDragDelta,
  onDragEnd,
  onResizeStart,
  onResizeDelta,
  onResizeEnd,
}: CropSquareProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, []);

  const { dragHandlers, resizeHandlers } = useDragResize(
    { x: square.x, y: square.y, size: square.size },
    bounds,
    (patch) => onUpdate(square.id, patch),
    { snapTargets, onDragStart, onDragDelta, onDragEnd, onResizeStart, onResizeDelta, onResizeEnd }
  );

  const isTouchLikePointer = (pointerType: string) => pointerType === 'touch' || pointerType === 'pen';
  const isSelectionModeTouch = isMobileViewport && isMobileSelectionMode;
  const showEditControls = !isSelectionModeTouch;

  return (
    <div
      data-selection-interactive="true"
      className={`absolute group touch-none ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: square.x,
        top: square.y,
        width: square.size,
        height: square.size,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        const touchLike = isTouchLikePointer(e.pointerType);
        if (touchLike && isSelectionModeTouch) {
          e.stopPropagation();
          e.preventDefault();
          onToggleSelect(square.id);
          return;
        }

        onSelect(square.id, e.shiftKey);

        if (isMobileViewport && touchLike) {
          pointerStartRef.current = { x: e.clientX, y: e.clientY };
          longPressTriggeredRef.current = false;
          clearLongPressTimer();
          longPressTimerRef.current = window.setTimeout(() => {
            longPressTriggeredRef.current = true;
            onLongPressSelect(square.id);
          }, LONG_PRESS_MS);
        }

        dragHandlers.onPointerDown(e);
      }}
      onPointerMove={(e) => {
        if (pointerStartRef.current && longPressTimerRef.current !== null) {
          const dx = Math.abs(e.clientX - pointerStartRef.current.x);
          const dy = Math.abs(e.clientY - pointerStartRef.current.y);
          if (dx > LONG_PRESS_MOVE_TOLERANCE || dy > LONG_PRESS_MOVE_TOLERANCE) {
            clearLongPressTimer();
          }
        }

        if (longPressTriggeredRef.current) {
          return;
        }
        dragHandlers.onPointerMove(e);
      }}
      onPointerUp={() => {
        clearLongPressTimer();
        pointerStartRef.current = null;
        longPressTriggeredRef.current = false;
        dragHandlers.onPointerUp();
      }}
      onPointerCancel={() => {
        clearLongPressTimer();
        pointerStartRef.current = null;
        longPressTriggeredRef.current = false;
        dragHandlers.onPointerUp();
      }}
    >
      {/* Border frame */}
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-inset ring-white/85 shadow-[0_0_12px_rgba(255,255,255,0.22)]'
            : 'ring-1 ring-inset ring-zinc-200/45 md:group-hover:ring-zinc-100/70'
        }`}
      />

      {/* Inner clear area indicator */}
      <div className={`absolute inset-0 transition-colors duration-200 ${
        isSelected ? 'bg-white/8' : 'bg-transparent group-hover:bg-zinc-100/5'
      }`} />

      {/* Order badge */}
      <div className={`absolute -top-3 -left-3 min-w-[22px] h-[22px] px-1.5 rounded-sm flex items-center justify-center text-[11px] font-semibold tracking-tight transition-all duration-200 ${
        isSelected
          ? 'bg-zinc-100 text-zinc-900 shadow-[0_0_8px_rgba(255,255,255,0.28)]'
          : 'bg-surface-3 text-text-1 group-hover:bg-zinc-200/85 group-hover:text-zinc-900'
      }`}>
        {square.order}
      </div>

      {/* Delete button */}
      {showEditControls && (
        <button
          className={`absolute -top-3 -right-3 w-7 h-7 md:w-[22px] md:h-[22px] rounded-sm bg-surface-3/95 text-text-3 text-xs flex items-center justify-center transition-all duration-200 hover:bg-red-500/80 hover:text-white ${
            isSelected ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
          }`}
          onPointerDown={(e) => {
            e.stopPropagation();
            onRemove(square.id);
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </button>
      )}

      {/* Corner resize handles */}
      {showEditControls && CORNERS.map((corner) => (
        <div
          key={corner}
          className={`absolute w-7 h-7 md:w-4 md:h-4 ${CORNER_CLASSES[corner]} transition-opacity duration-200 ${
            isSelected ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
          }`}
          onPointerDown={(e) => resizeHandlers.onPointerDown(e, corner)}
          onPointerMove={resizeHandlers.onPointerMove}
          onPointerUp={resizeHandlers.onPointerUp}
        >
          <div className="absolute inset-0 rounded-full bg-surface-0/70 border border-zinc-200/40 md:bg-transparent md:border-0" />
          <div className={`absolute inset-2 md:inset-[3px] ${
            corner === 'nw' ? 'border-t border-l' :
            corner === 'ne' ? 'border-t border-r' :
            corner === 'sw' ? 'border-b border-l' :
            'border-b border-r'
          } border-zinc-100/95`} />
        </div>
      ))}
    </div>
  );
}
