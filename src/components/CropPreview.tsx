import { useCallback, useEffect, useRef, useState } from 'react';
import type { CropSquare, LoadedImage, QualityAnalysis } from '../types';

interface CropPreviewProps {
  image: LoadedImage;
  squares: CropSquare[];
  qualityById: Record<string, QualityAnalysis>;
  scaleFactor: number;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}

const THUMB_SIZE = 72;

function PreviewThumb({
  image,
  square,
  scaleFactor,
  quality,
  isSelected,
  onClick,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  quality?: QualityAnalysis;
  isSelected: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = square.x * scaleFactor;
    const cropY = square.y * scaleFactor;
    const cropSize = square.size * scaleFactor;

    ctx.clearRect(0, 0, THUMB_SIZE, THUMB_SIZE);
    ctx.drawImage(
      image.element,
      cropX, cropY, cropSize, cropSize,
      0, 0, THUMB_SIZE, THUMB_SIZE
    );
  }, [image, square.x, square.y, square.size, scaleFactor]);

  const qualityTitle = quality?.reasons[0] ?? 'Pending analysis';
  const hasAlert = quality?.level === 'warning' || quality?.level === 'critical';
  const alertColor = quality?.level === 'critical' ? 'bg-red-400' : 'bg-amber-glow';

  return (
    <button
      onClick={onClick}
      title={qualityTitle}
      className={`
        relative shrink-0 rounded-sm overflow-hidden
        transition-all duration-200 group/thumb
        ${isSelected
          ? 'ring-1 ring-amber-glow/80 shadow-[0_0_10px_rgba(212,160,55,0.15)]'
          : 'ring-1 ring-border-1 hover:ring-amber-glow/30'
        }
      `}
    >
      <canvas
        ref={canvasRef}
        width={THUMB_SIZE}
        height={THUMB_SIZE}
        className="block"
        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
      />
      {/* Order badge */}
      <div className={`
        absolute top-1 left-1 min-w-[16px] h-[16px] px-1 rounded-sm
        flex items-center justify-center
        text-[9px] font-semibold leading-none
        transition-all duration-200
        ${isSelected
          ? 'bg-amber-glow text-surface-0'
          : 'bg-black/60 text-text-2 group-hover/thumb:bg-amber-glow/80 group-hover/thumb:text-surface-0'
        }
      `}>
        {square.order}
      </div>
      {hasAlert && (
        <div className={`absolute top-1 right-1 w-[8px] h-[8px] rounded-full ${alertColor} shadow-[0_0_10px_rgba(0,0,0,0.4)]`} />
      )}
    </button>
  );
}

function Lightbox({
  image,
  square,
  scaleFactor,
  onClose,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSize = Math.round(square.size);
  const sourceSize = Math.max(
    1,
    Math.round(
      square.size * (Number.isFinite(scaleFactor) && scaleFactor > 0 ? scaleFactor : 1)
    )
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = square.x * scaleFactor;
    const cropY = square.y * scaleFactor;
    const cropSize = square.size * scaleFactor;

    ctx.clearRect(0, 0, renderSize, renderSize);
    ctx.drawImage(
      image.element,
      cropX, cropY, cropSize, cropSize,
      0, 0, renderSize, renderSize
    );
  }, [image, square, scaleFactor, renderSize]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Order badge */}
        <div className="absolute -top-3 -left-3 z-10 min-w-[24px] h-[24px] px-1.5 rounded-sm bg-amber-glow text-surface-0 text-xs font-semibold flex items-center justify-center shadow-[0_0_10px_rgba(212,160,55,0.3)]">
          {square.order}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-[24px] h-[24px] rounded-sm bg-surface-3 text-text-3 flex items-center justify-center hover:bg-surface-3 hover:text-text-1 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        </button>

        <canvas
          ref={canvasRef}
          width={renderSize}
          height={renderSize}
          className="block rounded-sm shadow-2xl ring-1 ring-border-1"
          style={{ width: renderSize, height: renderSize }}
        />

        <p className="text-center text-[10px] text-text-3 tracking-wider uppercase mt-3">
          {sourceSize} &times; {sourceSize}px source &middot; 1080 &times; 1080px export
        </p>
      </div>
    </div>
  );
}

export function CropPreview({
  image,
  squares,
  qualityById,
  scaleFactor,
  selectedIds,
  onSelect,
}: CropPreviewProps) {
  const [lightboxId, setLightboxId] = useState<string | null>(null);

  const handleThumbClick = useCallback((id: string) => {
    onSelect(id);
    setLightboxId(id);
  }, [onSelect]);

  const closeLightbox = useCallback(() => {
    setLightboxId(null);
  }, []);

  if (squares.length === 0) return null;

  const sorted = [...squares].sort((a, b) => a.order - b.order);
  const lightboxSquare = lightboxId ? squares.find((s) => s.id === lightboxId) : null;

  return (
    <>
      <div className="flex items-center gap-2 mt-10">
        <span className="text-[10px] text-text-3 tracking-widest uppercase mr-1">Preview</span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {sorted.map((sq) => (
            <PreviewThumb
              key={sq.id}
              image={image}
              square={sq}
              scaleFactor={scaleFactor}
              quality={qualityById[sq.id]}
              isSelected={selectedIds.has(sq.id)}
              onClick={() => handleThumbClick(sq.id)}
            />
          ))}
        </div>
      </div>

      {lightboxSquare && (
        <Lightbox
          image={image}
          square={lightboxSquare}
          scaleFactor={scaleFactor}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
