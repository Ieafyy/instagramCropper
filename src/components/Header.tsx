export function Header() {
  return (
    <header className="relative flex items-center gap-4 px-6 py-4">
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
        <h1 className="font-display italic text-xl text-text-1 tracking-tight leading-none">
          Carousel Cropper
        </h1>
      </div>

      {/* Subtle bottom line */}
      <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-border-1 to-transparent" />
    </header>
  );
}
