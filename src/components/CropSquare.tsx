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
  onSelect: (id: string) => void;
}

const CORNERS = ['nw', 'ne', 'sw', 'se'] as const;

const CORNER_CLASSES: Record<string, string> = {
  nw: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
  ne: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
  sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
  se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
};

export function CropSquare({ square, bounds, snapTargets, onUpdate, onRemove, isSelected, onSelect }: CropSquareProps) {
  const { dragHandlers, resizeHandlers } = useDragResize(
    { x: square.x, y: square.y, size: square.size },
    bounds,
    (patch) => onUpdate(square.id, patch),
    snapTargets
  );

  return (
    <div
      className={`absolute group touch-none ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: square.x,
        top: square.y,
        width: square.size,
        height: square.size,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        onSelect(square.id);
        dragHandlers.onPointerDown(e);
      }}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
    >
      {/* Border frame */}
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          isSelected
            ? 'border border-amber-glow/80 shadow-[0_0_12px_rgba(212,160,55,0.15)]'
            : 'border border-amber-glow/30 group-hover:border-amber-glow/60'
        }`}
      />

      {/* Inner clear area indicator */}
      <div className={`absolute inset-0 transition-colors duration-200 ${
        isSelected ? 'bg-amber-glow/5' : 'bg-transparent group-hover:bg-amber-glow/3'
      }`} />

      {/* Order badge */}
      <div className={`absolute -top-3 -left-3 min-w-[22px] h-[22px] px-1.5 rounded-sm flex items-center justify-center text-[11px] font-semibold tracking-tight transition-all duration-200 ${
        isSelected
          ? 'bg-amber-glow text-surface-0 shadow-[0_0_8px_rgba(212,160,55,0.3)]'
          : 'bg-surface-3 text-text-2 group-hover:bg-amber-glow/80 group-hover:text-surface-0'
      }`}>
        {square.order}
      </div>

      {/* Delete button */}
      <button
        className="absolute -top-3 -right-3 w-[22px] h-[22px] rounded-sm bg-surface-3/90 text-text-3 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/80 hover:text-white"
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

      {/* Corner resize handles — L-shaped crop marks */}
      {CORNERS.map((corner) => (
        <div
          key={corner}
          className={`absolute w-3 h-3 ${CORNER_CLASSES[corner]} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          onPointerDown={(e) => resizeHandlers.onPointerDown(e, corner)}
          onPointerMove={resizeHandlers.onPointerMove}
          onPointerUp={resizeHandlers.onPointerUp}
        >
          <div className={`w-full h-full ${
            corner === 'nw' ? 'border-t border-l' :
            corner === 'ne' ? 'border-t border-r' :
            corner === 'sw' ? 'border-b border-l' :
            'border-b border-r'
          } border-amber-glow/90`} />
        </div>
      ))}
    </div>
  );
}
