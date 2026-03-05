import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drawCropToCanvas } from '../utils/cropEngine';
import type { CropSquare, LoadedImage, PrintBorderSettings } from '../types';

const CANVAS_SIZE = 360;
const MAX_DOTS = 7;
const SWIPE_THRESHOLD = 40;

interface Props {
  image: LoadedImage;
  squares: CropSquare[];
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
  onClose: () => void;
}

function getVisibleDots(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= MAX_DOTS) return Array.from({ length: total }, (_, i) => i);

  const result: (number | 'ellipsis')[] = [];
  const half = Math.floor(MAX_DOTS / 2);
  let start = Math.max(0, Math.min(current - half, total - MAX_DOTS));
  const end = Math.min(total - 1, start + MAX_DOTS - 1);
  start = Math.max(0, end - MAX_DOTS + 1);

  if (start > 0) {
    result.push(0);
    if (start > 1) result.push('ellipsis');
  }
  for (let i = start; i <= end; i++) result.push(i);
  if (end < total - 1) {
    if (end < total - 2) result.push('ellipsis');
    result.push(total - 1);
  }

  return result;
}

function SlideCanvas({
  image,
  square,
  scaleFactor,
  printBorder,
}: {
  image: LoadedImage;
  square: CropSquare;
  scaleFactor: number;
  printBorder?: PrintBorderSettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCropToCanvas(
      ctx,
      image.element,
      square.x * scaleFactor,
      square.y * scaleFactor,
      square.size * scaleFactor,
      CANVAS_SIZE,
      printBorder
    );
  }, [image, square, scaleFactor, printBorder]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

export function CarouselPreviewModal({ image, squares, scaleFactor, printBorder, onClose }: Props) {
  const sortedSquares = useMemo(() => [...squares].sort((a, b) => a.order - b.order), [squares]);
  const total = sortedSquares.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      setIsSnapping(true);
      setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
    },
    [total]
  );
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (total <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragStartX.current = e.clientX;
    setDragOffset(0);
  }, [total]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    // clamp at edges
    const clamped =
      currentIndex === 0 ? Math.min(0, delta) :
      currentIndex === total - 1 ? Math.max(0, delta) :
      delta;
    setDragOffset(clamped);
  }, [currentIndex, total]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = e.clientX - dragStartX.current;
    setIsSnapping(true);
    setDragOffset(0);
    if (delta < -SWIPE_THRESHOLD) goNext();
    else if (delta > SWIPE_THRESHOLD) goPrev();
  }, [goNext, goPrev]);

  const slidePercent = 100 / total;
  const trackTransform = `translateX(calc(${-currentIndex * slidePercent}% + ${dragOffset}px))`;
  const dots = getVisibleDots(total, currentIndex);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-border-1 bg-surface-1 shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors"
          aria-label="Fechar preview"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Instagram-style header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border-1/60">
          <div
            className="h-8 w-8 shrink-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-1 leading-none">preview</p>
            <p className="text-[10px] text-text-3 mt-0.5">Original file</p>
          </div>
          <button className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors">
            Follow
          </button>
          <button className="p-1 text-text-3 hover:text-text-2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        {/* Image viewport */}
        <div
          className="relative overflow-hidden"
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            cursor: total > 1 ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => { isDragging.current = false; setIsSnapping(true); setDragOffset(0); }}
        >
          {/* Track — all slides side by side */}
          <div
            onTransitionEnd={() => setIsSnapping(false)}
            style={{
              display: 'flex',
              width: `${total * 100}%`,
              height: '100%',
              transform: trackTransform,
              transition: isSnapping ? 'transform 0.28s ease-out' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {sortedSquares.map((square) => (
              <div key={square.id} style={{ flex: `0 0 ${slidePercent}%`, height: '100%' }}>
                <SlideCanvas
                  image={image}
                  square={square}
                  scaleFactor={scaleFactor}
                  printBorder={printBorder}
                />
              </div>
            ))}
          </div>

          {/* Slide counter badge */}
          {total > 1 && (
            <div className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm pointer-events-none">
              {currentIndex + 1} / {total}
            </div>
          )}

          {/* Prev arrow */}
          {total > 1 && currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white transition-colors"
              aria-label="Slide anterior"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Next arrow */}
          {total > 1 && currentIndex < total - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black shadow-md hover:bg-white transition-colors"
              aria-label="Próximo slide"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1 py-2">
            {dots.map((dot, i) =>
              dot === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} className="text-[8px] text-text-3 leading-none px-0.5">
                  •••
                </span>
              ) : (
                <button
                  key={dot}
                  onClick={() => goTo(dot)}
                  className={`rounded-full transition-all duration-200 ${
                    dot === currentIndex
                      ? 'w-2 h-2 bg-sky-400'
                      : 'w-1.5 h-1.5 bg-text-3/50 hover:bg-text-3/80'
                  }`}
                  aria-label={`Ir para slide ${dot + 1}`}
                />
              )
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center px-3 pb-3 pt-1">
          <div className="flex items-center gap-3 flex-1">
            <button className="text-text-2 hover:text-red-400 transition-colors" aria-label="Curtir">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button className="text-text-2 hover:text-text-1 transition-colors" aria-label="Comentar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button className="text-text-2 hover:text-text-1 transition-colors" aria-label="Compartilhar">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <button className="text-text-2 hover:text-text-1 transition-colors" aria-label="Salvar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
