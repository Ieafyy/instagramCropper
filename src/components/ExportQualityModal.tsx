interface CriticalSlide {
  id: string;
  order: number;
  score: number;
  reason: string;
}

interface ExportQualityModalProps {
  open: boolean;
  criticalSlides: CriticalSlide[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExportQualityModal({
  open,
  criticalSlides,
  onCancel,
  onConfirm,
}: ExportQualityModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-[420px] max-w-[92vw] max-h-[80vh] overflow-hidden rounded-lg border border-border-1 bg-surface-1 shadow-2xl animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border-2">
          <p className="text-[10px] text-text-3 tracking-widest uppercase">Export warning</p>
          <h3 className="text-sm text-text-1 font-medium mt-1">
            Critical quality issues found
          </h3>
          <p className="text-[11px] text-text-3 mt-2 leading-relaxed">
            {criticalSlides.length} slide{criticalSlides.length !== 1 ? 's' : ''} may lose quality after export.
          </p>
        </div>

        <div className="px-5 py-3 max-h-[44vh] overflow-y-auto space-y-2">
          {criticalSlides.map((slide) => (
            <div key={slide.id} className="rounded-md border border-red-500/25 bg-red-500/8 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-red-200 font-medium">
                  Slide {slide.order}
                </p>
                <p className="text-[10px] text-red-200/80">Score {slide.score}</p>
              </div>
              <p className="text-[10px] text-red-100/80 mt-1 leading-relaxed">{slide.reason}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-border-2 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 rounded-md border border-border-1 text-text-2 text-xs font-medium hover:border-border-2 hover:text-text-1 transition-colors"
          >
            Go back and adjust
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 rounded-md bg-amber-glow text-surface-0 text-xs font-semibold hover:bg-amber-soft transition-colors"
          >
            Export anyway
          </button>
        </div>
      </div>
    </div>
  );
}
