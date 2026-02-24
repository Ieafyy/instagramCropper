import type { CropSquare, QualityAnalysis } from '../types';

interface SquareListProps {
  squares: CropSquare[];
  qualityById: Record<string, QualityAnalysis>;
  scaleFactor: number;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

function qualityDotClasses(level: QualityAnalysis['level'] | undefined): string {
  if (level === 'critical') return 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]';
  if (level === 'warning') return 'bg-amber-glow shadow-[0_0_10px_rgba(212,160,55,0.45)]';
  if (level === 'ok') return 'bg-emerald-300/80 shadow-[0_0_8px_rgba(110,231,183,0.35)]';
  return 'bg-border-1';
}

export function SquareList({
  squares,
  qualityById,
  scaleFactor,
  selectedIds,
  onSelect,
  onRemove,
  onMove,
}: SquareListProps) {
  if (squares.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-text-3/50">
          <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="16" y1="11" x2="16" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="11" y1="16" x2="21" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>
        <p className="text-text-3 text-xs text-center leading-relaxed">
          Tap the image<br />to add crop areas
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {squares.map((sq, index) => {
        const quality = qualityById[sq.id];
        const firstReason = quality?.reasons[0] ?? 'Pending analysis';
        const sourceSize = Math.max(
          1,
          Math.round(
            sq.size * (Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1)
          )
        );

        return (
          <div
            key={sq.id}
            onClick={() => onSelect(sq.id)}
            title={firstReason}
            className={`
              relative flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer
              transition-all duration-200 group/item
              ${selectedIds.has(sq.id)
                ? 'bg-amber-muted'
                : 'hover:bg-white/[0.03]'
              }
            `}
          >
            {/* Active indicator bar */}
            {selectedIds.has(sq.id) && (
              <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-amber-glow" />
            )}

            <span className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-semibold shrink-0 transition-colors duration-200 ${
              selectedIds.has(sq.id)
                ? 'bg-amber-glow/20 text-amber-glow'
                : 'bg-surface-3/50 text-text-3'
            }`}>
              {sq.order}
            </span>

            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${qualityDotClasses(quality?.level)}`} />

            <span className="text-text-3 text-[11px] flex-1 truncate font-light tracking-wide">
              {sourceSize} &times; {sourceSize}px source
            </span>

            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/item:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) onMove(index, index - 1);
                }}
                disabled={index === 0}
                className="p-1.5 md:p-1 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] disabled:opacity-20 disabled:cursor-default transition-colors"
                title="Move up"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < squares.length - 1) onMove(index, index + 1);
                }}
                disabled={index === squares.length - 1}
                className="p-1.5 md:p-1 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] disabled:opacity-20 disabled:cursor-default transition-colors"
                title="Move down"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(sq.id);
                }}
                className="p-1.5 md:p-1 rounded text-text-3 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Remove"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
