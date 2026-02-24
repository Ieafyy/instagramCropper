import { DropZone } from './DropZone';

interface LandingIntroProps {
  onFileSelect: (file: File) => void;
}

export function LandingIntro({ onFileSelect }: LandingIntroProps) {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-12 h-48 w-48 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212, 160, 55, 0.16) 0%, rgba(212, 160, 55, 0) 72%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-2 h-56 w-56 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212, 160, 55, 0.1) 0%, rgba(212, 160, 55, 0) 74%)' }}
      />

      <div className="relative grid items-start gap-8 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-7 animate-slide-up">
          <div className="space-y-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-text-3">Instagram Carousel Tool</p>
            <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-text-1 sm:text-5xl lg:text-[3.4rem]">
              Transform one wide image into a clean multi-slide carousel.
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-text-2 sm:text-base">
              Minimal controls, accurate framing, and instant export. Build your carousel sequence faster while keeping visual consistency from the first slide to the last.
            </p>
          </div>
        </div>

        <div className="animate-slide-up space-y-4" style={{ animationDelay: '140ms' }}>
          <div className="rounded-2xl border border-border-1 bg-surface-1/70 p-2 shadow-2xl backdrop-blur-sm sm:p-3">
            <DropZone onFileSelect={onFileSelect} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <article className="rounded-lg border border-border-1/80 bg-surface-1/55 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-3">Privacy</p>
              <p className="mt-1 text-xs leading-relaxed text-text-2">No accounts, no tracking walls, and no external uploads required to start editing.</p>
            </article>
            <article className="rounded-lg border border-border-1/80 bg-surface-1/55 p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-text-3">Precision</p>
              <p className="mt-1 text-xs leading-relaxed text-text-2">Snap guides and quality checks help keep every slide aligned and visually sharp.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
