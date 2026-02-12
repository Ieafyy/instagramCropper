interface ToolbarProps {
  squareCount: number;
  isExporting: boolean;
  onAddSquare: () => void;
  onExport: () => void;
  onClear: () => void;
  onNewImage: () => void;
}

export function Toolbar({ squareCount, isExporting, onAddSquare, onExport, onClear, onNewImage }: ToolbarProps) {
  return (
    <div className="p-3 space-y-2">
      {/* Primary actions */}
      <div className="flex gap-2">
        <button
          onClick={onAddSquare}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border-1 text-text-2 text-xs font-medium tracking-wide hover:border-amber-glow/20 hover:text-text-1 hover:bg-amber-dim transition-all duration-200"
          title="Add crop square"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add
        </button>

        <button
          onClick={onExport}
          disabled={squareCount === 0 || isExporting}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-amber-glow text-surface-0 text-xs font-semibold tracking-wide hover:bg-amber-soft disabled:opacity-25 disabled:cursor-default transition-all duration-200"
        >
          {isExporting ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Exporting
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </>
          )}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            disabled={squareCount === 0}
            className="p-1.5 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] disabled:opacity-20 disabled:cursor-default transition-all duration-200"
            title="Clear all squares"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            onClick={onNewImage}
            className="p-1.5 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] transition-all duration-200"
            title="Load new image"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M21 21v-5h-5" />
            </svg>
          </button>
        </div>

        {squareCount > 0 && (
          <span className="text-[10px] text-text-3 tracking-wider uppercase">
            {squareCount} slide{squareCount !== 1 ? 's' : ''} &middot; 1080px
          </span>
        )}
      </div>
    </div>
  );
}
