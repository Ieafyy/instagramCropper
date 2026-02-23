import type { QualityAnalysis } from '../types';

interface QualityPanelProps {
  globalQuality: QualityAnalysis | null;
  warningCount: number;
  criticalCount: number;
  isAnalyzing: boolean;
}

function levelClasses(level: QualityAnalysis['level']) {
  if (level === 'critical') {
    return 'text-red-300 bg-red-500/12 border-red-500/30';
  }
  if (level === 'warning') {
    return 'text-amber-glow bg-amber-muted border-amber-glow/30';
  }
  return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
}

export function QualityPanel({
  globalQuality,
  warningCount,
  criticalCount,
  isAnalyzing,
}: QualityPanelProps) {
  if (!globalQuality && !isAnalyzing) {
    return (
      <div className="m-2 p-3 rounded-md border border-border-1 bg-surface-2/70">
        <p className="text-[10px] text-text-3 tracking-widest uppercase">Quality</p>
        <p className="mt-2 text-[11px] text-text-3 leading-relaxed">
          Load an image to analyze exposure, contrast and sharpness.
        </p>
      </div>
    );
  }

  const quality = globalQuality;

  return (
    <div className="m-2 p-3 rounded-md border border-border-1 bg-surface-2/70 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-text-3 tracking-widest uppercase">Quality</p>
        {isAnalyzing && (
          <span className="text-[9px] text-amber-glow tracking-wider uppercase">Analyzing...</span>
        )}
      </div>

      {quality ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-text-3 tracking-wider uppercase">Global score</p>
              <p className="text-lg text-text-1 font-medium leading-none mt-1">{quality.score}</p>
            </div>
            <span
              className={`px-2 py-1 rounded border text-[10px] font-semibold tracking-wider uppercase ${levelClasses(quality.level)}`}
            >
              {quality.level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-3">
            <div className="rounded border border-border-2 bg-surface-1/60 px-2 py-1.5">
              <p className="text-[9px] text-text-3 tracking-wider uppercase">Exposure</p>
              <p className="text-[11px] text-text-2 mt-0.5">
                Over {quality.exposure.overexposedPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded border border-border-2 bg-surface-1/60 px-2 py-1.5">
              <p className="text-[9px] text-text-3 tracking-wider uppercase">Contrast</p>
              <p className="text-[11px] text-text-2 mt-0.5">
                {(quality.contrast.dynamicRangeNorm * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded border border-border-2 bg-surface-1/60 px-2 py-1.5">
              <p className="text-[9px] text-text-3 tracking-wider uppercase">Sharpness</p>
              <p className="text-[11px] text-text-2 mt-0.5">
                {quality.sharpness.laplacianVariance.toFixed(0)}
              </p>
            </div>
            <div className="rounded border border-border-2 bg-surface-1/60 px-2 py-1.5">
              <p className="text-[9px] text-text-3 tracking-wider uppercase">Resolution</p>
              <p className="text-[11px] text-text-2 mt-0.5">
                {criticalCount} crit / {warningCount} warn
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {quality.reasons.slice(0, 2).map((reason) => (
              <p key={reason} className="text-[10px] text-text-3 leading-relaxed">
                {reason}
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-text-3">Running quality checks...</p>
      )}
    </div>
  );
}
