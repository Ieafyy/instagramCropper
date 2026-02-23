export interface CropSquare {
  id: string;
  x: number;
  y: number;
  size: number;
  order: number;
}

export interface LoadedImage {
  file: File;
  url: string;
  element: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
}

export type QualityLevel = 'ok' | 'warning' | 'critical';

export interface ExposureMetrics {
  overexposedPct: number;
  clippedHighlightsPct: number;
  underexposedPct: number;
}

export interface ContrastMetrics {
  p5: number;
  p95: number;
  dynamicRangeNorm: number;
}

export interface SharpnessMetrics {
  laplacianVariance: number;
}

export interface ResolutionMetrics {
  sourceCropPixels: number;
  upsampleRatio: number;
}

export interface QualityAnalysis {
  level: QualityLevel;
  score: number;
  reasons: string[];
  exposure: ExposureMetrics;
  contrast: ContrastMetrics;
  sharpness: SharpnessMetrics;
  resolution?: ResolutionMetrics;
}

export interface ImageQualityReport {
  global: QualityAnalysis | null;
  bySquareId: Record<string, QualityAnalysis>;
  isAnalyzing: boolean;
  updatedAt: number | null;
}
