import { useCallback, useRef, useState } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function DropZone({ onFileSelect }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (ACCEPTED_TYPES.includes(file.type)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const cornerMark = "absolute w-5 h-5 border-amber-glow/40";

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-6 rounded-xl border border-border-1/80 bg-surface-0/50 px-8 py-12 sm:p-14
        cursor-pointer transition-all duration-500 ease-out
        animate-slide-up
        ${isDragOver ? 'scale-[1.01] border-amber-glow/50 bg-amber-dim' : 'scale-100'}
      `}
    >
      {/* Corner crop marks */}
      <div className={`${cornerMark} top-0 left-0 border-t-[1.5px] border-l-[1.5px] ${isDragOver ? 'border-amber-glow/70' : ''} transition-colors duration-300`} />
      <div className={`${cornerMark} top-0 right-0 border-t-[1.5px] border-r-[1.5px] ${isDragOver ? 'border-amber-glow/70' : ''} transition-colors duration-300`} />
      <div className={`${cornerMark} bottom-0 left-0 border-b-[1.5px] border-l-[1.5px] ${isDragOver ? 'border-amber-glow/70' : ''} transition-colors duration-300`} />
      <div className={`${cornerMark} bottom-0 right-0 border-b-[1.5px] border-r-[1.5px] ${isDragOver ? 'border-amber-glow/70' : ''} transition-colors duration-300`} />

      {/* Center glow */}
      <div
        className={`
          absolute inset-0 rounded-2xl transition-opacity duration-700
          ${isDragOver ? 'opacity-100' : 'opacity-60'}
        `}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212, 160, 55, 0.06) 0%, transparent 70%)',
        }}
      />

      {/* Viewfinder icon */}
      <div className="relative">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={`transition-colors duration-300 ${isDragOver ? 'text-amber-glow' : 'text-text-3'}`}>
          {/* Outer viewfinder frame */}
          <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          {/* Center crosshair */}
          <line x1="24" y1="16" x2="24" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="24" y1="26" x2="24" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="16" y1="24" x2="22" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          <line x1="26" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          {/* Center dot */}
          <circle cx="24" cy="24" r="1.5" fill="currentColor" opacity="0.5" />
          {/* Upload arrow */}
          <path d="M24 40 L24 36" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
          <path d="M21 39 L24 36 L27 39" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        </svg>
        <div className={`absolute inset-0 blur-xl transition-opacity duration-700 ${isDragOver ? 'opacity-40' : 'opacity-0'}`} style={{ background: 'rgba(212, 160, 55, 0.3)' }} />
      </div>

      <div className="relative text-center space-y-2">
        <p className={`text-sm font-medium tracking-wide transition-colors duration-300 ${isDragOver ? 'text-text-1' : 'text-text-2'}`}>
          Drop your image here or click to browse
        </p>
        <p className="text-[11px] text-text-3 tracking-wider uppercase">
          PNG &middot; JPG &middot; WebP &middot; local processing
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
