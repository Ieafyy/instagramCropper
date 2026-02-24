import { useCallback, useEffect, useRef, useState } from 'react';

interface ToolbarProps {
  squareCount: number;
  isExporting: boolean;
  onAddSquare: () => void;
  onAutoFill: (count: number) => void;
  onExport: () => void;
  onClear: () => void;
  onNewImage: () => void;
  isMobileViewport: boolean;
  isMobileSelectionMode: boolean;
  selectedCount: number;
  onToggleMobileSelectionMode: () => void;
}

function AutoFillModal({ onConfirm, onClose }: { onConfirm: (count: number) => void; onClose: () => void }) {
  const [count, setCount] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (count >= 1 && count <= 20) {
      onConfirm(count);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-1 border border-border-1 rounded-lg p-5 w-72 shadow-2xl animate-slide-up"
      >
        <h3 className="text-sm font-medium text-text-1 mb-1">Auto Fill</h3>
        <p className="text-[11px] text-text-3 mb-4 leading-relaxed">
          Create squares filling the full image width.
        </p>

        <label className="block text-[11px] text-text-3 tracking-wider uppercase mb-1.5">
          Number of slides
        </label>
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={20}
          value={count}
          onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
          className="w-full px-3 py-2 rounded-md bg-surface-0 border border-border-1 text-text-1 text-sm outline-none focus:border-amber-glow/50 transition-colors"
        />

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 rounded-md border border-border-1 text-text-3 text-xs font-medium hover:text-text-2 hover:border-border-2 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-3 py-2 rounded-md bg-amber-glow text-surface-0 text-xs font-semibold hover:bg-amber-soft transition-all duration-200"
          >
            Create {count}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Toolbar({
  squareCount,
  isExporting,
  onAddSquare,
  onAutoFill,
  onExport,
  onClear,
  onNewImage,
  isMobileViewport,
  isMobileSelectionMode,
  selectedCount,
  onToggleMobileSelectionMode,
}: ToolbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [dropdownOpen]);

  const handleAdd = useCallback(() => {
    onAddSquare();
    setDropdownOpen(false);
  }, [onAddSquare]);

  const handleAutoClick = useCallback(() => {
    setDropdownOpen(false);
    setShowAutoModal(true);
  }, []);

  return (
    <>
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Primary actions */}
        <div className="flex gap-2">
          <div ref={dropdownRef} className="relative flex-1">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-full min-h-10 sm:min-h-9 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border-1 text-text-2 text-xs font-medium tracking-wide hover:border-amber-glow/20 hover:text-text-1 hover:bg-amber-dim transition-all duration-200"
              title="Add crop square"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="ml-0.5 opacity-50">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-2 border border-border-1 rounded-md shadow-xl overflow-hidden animate-fade-in z-30">
                <button
                  onClick={handleAdd}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-2 hover:bg-white/[0.05] hover:text-text-1 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add single
                </button>
                <button
                  onClick={handleAutoClick}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-2 hover:bg-white/[0.05] hover:text-text-1 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="4" width="6" height="16" rx="1" />
                    <rect x="10" y="4" width="6" height="16" rx="1" />
                    <rect x="18" y="4" width="4" height="16" rx="1" />
                  </svg>
                  Auto fill...
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onExport}
            disabled={squareCount === 0 || isExporting}
            className="flex-1 min-h-10 sm:min-h-9 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-amber-glow text-surface-0 text-xs font-semibold tracking-wide hover:bg-amber-soft disabled:opacity-25 disabled:cursor-default transition-all duration-200"
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
            {isMobileViewport && squareCount > 0 && (
              <button
                onClick={onToggleMobileSelectionMode}
                className={`px-2.5 py-1.5 rounded text-[10px] font-medium tracking-wider uppercase transition-all duration-200 ${
                  isMobileSelectionMode
                    ? 'bg-amber-glow text-surface-0'
                    : 'border border-border-1 text-text-3 hover:text-text-2'
                }`}
                title={isMobileSelectionMode ? 'Finish multi-selection mode' : 'Enable multi-selection mode'}
              >
                {isMobileSelectionMode ? `Done (${selectedCount})` : 'Select'}
              </button>
            )}
            <button
              onClick={onClear}
              disabled={squareCount === 0}
              className="p-2 sm:p-1.5 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] disabled:opacity-20 disabled:cursor-default transition-all duration-200"
              title="Clear all squares"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <button
              onClick={onNewImage}
              className="p-2 sm:p-1.5 rounded text-text-3 hover:text-text-2 hover:bg-white/[0.03] transition-all duration-200"
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
            <span className="text-[10px] text-text-3 tracking-wider uppercase hidden sm:inline">
              {squareCount} slide{squareCount !== 1 ? 's' : ''} &middot; 1080px
            </span>
          )}
        </div>
      </div>

      {showAutoModal && (
        <AutoFillModal
          onConfirm={onAutoFill}
          onClose={() => setShowAutoModal(false)}
        />
      )}
    </>
  );
}
