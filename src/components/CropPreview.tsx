import { useCallback, useEffect, useRef, useState } from 'react';
import { drawCropToCanvas } from '../utils/cropEngine';
import type { CropSquare, LoadedImage, PrintBorderSettings, QualityAnalysis } from '../types';

interface CropPreviewProps {
  image: LoadedImage;
  squares: CropSquare[];
  qualityById: Record<string, QualityAnalysis>;
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
  showPrintBorderControls: boolean;
  onPrintBorderEnabledChange: (enabled: boolean) => void;
  onPrintBorderSizeChange: (sizePercent: number) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}

const THUMB_SIZE = 72;
const DETAIL_PREVIEW_SIZE = 156;

function PreviewThumb({
  image,
  square,
  scaleFactor,
  printBorder,
  quality,
  isSelected,
  onClick,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
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
    drawCropToCanvas(ctx, image.element, cropX, cropY, cropSize, THUMB_SIZE, printBorder);
  }, [image, printBorder, scaleFactor, square.x, square.y, square.size]);

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
  printBorder,
  onClose,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
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
    drawCropToCanvas(ctx, image.element, cropX, cropY, cropSize, renderSize, printBorder);
  }, [image, printBorder, square, scaleFactor, renderSize]);

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

function PrintBorderPanel({
  image,
  square,
  scaleFactor,
  printBorder,
  onEnabledChange,
  onSizeChange,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
  onEnabledChange: (enabled: boolean) => void;
  onSizeChange: (sizePercent: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const borderEnabled = printBorder?.enabled ?? false;
  const borderSize = printBorder?.sizePercent ?? 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = square.x * scaleFactor;
    const cropY = square.y * scaleFactor;
    const cropSize = square.size * scaleFactor;

    drawCropToCanvas(
      ctx,
      image.element,
      cropX,
      cropY,
      cropSize,
      DETAIL_PREVIEW_SIZE,
      printBorder
    );
  }, [image, printBorder, scaleFactor, square.x, square.y, square.size]);

  return (
    <div className="mt-4 rounded-2xl border border-border-1 bg-surface-1/80 p-3 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative shrink-0 self-center md:self-start">
          <div
            className="absolute inset-0 scale-110 rounded-[28px] opacity-60 blur-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(212, 160, 55, 0.18) 0%, transparent 72%)',
            }}
          />
          <div className="relative rounded-[24px] bg-linear-to-br from-white via-[#faf8f4] to-[#ede6da] p-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
            <canvas
              ref={canvasRef}
              width={DETAIL_PREVIEW_SIZE}
              height={DETAIL_PREVIEW_SIZE}
              className="block rounded-[16px] ring-1 ring-black/6"
              style={{ width: DETAIL_PREVIEW_SIZE, height: DETAIL_PREVIEW_SIZE }}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-text-3 tracking-[0.28em] uppercase">Printed Border</p>
              <h3 className="mt-1 text-sm font-medium text-text-1">Preview do export final</h3>
              <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-text-3">
                A borda branca entra no PNG exportado e reduz a area util da foto para criar o efeito de impressao.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEnabledChange(!borderEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 ${
                borderEnabled
                  ? 'border-amber-glow/30 bg-amber-glow/90'
                  : 'border-border-1 bg-surface-2'
              }`}
              aria-pressed={borderEnabled}
              aria-label="Toggle printed border"
            >
              <span
                className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all duration-200 ${
                  borderEnabled ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] text-text-3 tracking-[0.22em] uppercase">
              <span>Border size</span>
              <span>{borderSize}%</span>
            </div>
            <input
              type="range"
              min={3}
              max={18}
              step={1}
              value={borderSize}
              disabled={!borderEnabled}
              onChange={(event) => onSizeChange(Number(event.target.value))}
              className="mt-2 w-full accent-[var(--color-amber-glow)] disabled:cursor-default"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-text-3/80">
              <span>Photo area {Math.max(0, 100 - borderSize * 2)}%</span>
              <span>{borderEnabled ? 'Border on' : 'Border off'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CropPreview({
  image,
  squares,
  qualityById,
  scaleFactor,
  printBorder,
  showPrintBorderControls,
  onPrintBorderEnabledChange,
  onPrintBorderSizeChange,
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
  const framedSquare = showPrintBorderControls && sorted.length === 1 ? sorted[0] : null;

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
              printBorder={printBorder}
              quality={qualityById[sq.id]}
              isSelected={selectedIds.has(sq.id)}
              onClick={() => handleThumbClick(sq.id)}
            />
          ))}
        </div>
      </div>

      {framedSquare && (
        <PrintBorderPanel
          image={image}
          square={framedSquare}
          scaleFactor={scaleFactor}
          printBorder={printBorder}
          onEnabledChange={onPrintBorderEnabledChange}
          onSizeChange={onPrintBorderSizeChange}
        />
      )}

      {lightboxSquare && (
        <Lightbox
          image={image}
          square={lightboxSquare}
          scaleFactor={scaleFactor}
          printBorder={printBorder}
          onClose={closeLightbox}
        />
      )}
    </>
  );
}
