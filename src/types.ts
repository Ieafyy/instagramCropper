export interface CropSquare {
  id: string;
  x: number;
  y: number;
  size: number;
  order: number;
}

export interface PrintBorderSettings {
  enabled: boolean;
  sizePercent: number;
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

export interface HistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  luma: Uint32Array;
}

export interface QualityAnalysis {
  level: QualityLevel;
  score: number;
  reasons: string[];
  exposure: ExposureMetrics;
  contrast: ContrastMetrics;
  sharpness: SharpnessMetrics;
  resolution?: ResolutionMetrics;
  histogram: HistogramData;
}

export interface ImageQualityReport {
  global: QualityAnalysis | null;
  bySquareId: Record<string, QualityAnalysis>;
  isAnalyzing: boolean;
  updatedAt: number | null;
}
