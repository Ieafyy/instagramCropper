interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="relative flex items-center justify-between gap-4 px-4 sm:px-6 py-4">
      {/* Logo mark */}
      <div className="flex items-center gap-3">
        <div className="relative w-7 h-7">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-amber-glow">
            {/* Outer frame */}
            <rect x="1" y="1" width="26" height="26" rx="3" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
            {/* Vertical dividers */}
            <line x1="10" y1="1" x2="10" y2="27" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
            <line x1="18.5" y1="1" x2="18.5" y2="27" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
            {/* Active frame highlight */}
            <rect x="3" y="3" width="5.5" height="22" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.8" />
          </svg>
        </div>
        <div className="leading-none">
          <h1 className="font-display italic text-xl text-text-1 tracking-tight">
            Carousel Cropper
          </h1>
          <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-text-3">
            Local-first editor
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="h-9 px-2.5 sm:px-3 rounded-md border border-border-1 bg-surface-2/60 text-text-2 hover:text-text-1 hover:border-border-2 transition-colors flex items-center gap-2"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1.5" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22.5" y2="12" />
            <line x1="4.5" y1="4.5" x2="6.3" y2="6.3" />
            <line x1="17.7" y1="17.7" x2="19.5" y2="19.5" />
            <line x1="17.7" y1="6.3" x2="19.5" y2="4.5" />
            <line x1="4.5" y1="19.5" x2="6.3" y2="17.7" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3c0.04 0 0.08 0 0.12 0a7 7 0 0 0 9.67 9.79z" />
          </svg>
        )}
        <span className="text-[10px] sm:text-[11px] tracking-wider uppercase">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      </button>

      {/* Subtle bottom line */}
      <div className="absolute bottom-0 left-4 right-4 sm:left-6 sm:right-6 h-px bg-gradient-to-r from-transparent via-border-1 to-transparent" />
    </header>
  );
}
