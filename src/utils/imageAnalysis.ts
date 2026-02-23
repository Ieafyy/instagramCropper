import type {
  CropSquare,
  QualityAnalysis,
  ResolutionMetrics,
} from '../types.js';

const GLOBAL_MAX_SIDE = 1024;
const SLIDE_SAMPLE_SIZE = 256;
const EXPORT_SIZE = 1080;

const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function sampleImageData(
  image: HTMLImageElement,
  outputWidth: number,
  outputHeight: number,
  sourceX?: number,
  sourceY?: number,
  sourceSize?: number
): ImageData {
  const canvas = createCanvas(outputWidth, outputHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D context for image analysis');
  }

  if (typeof sourceX === 'number' && typeof sourceY === 'number' && typeof sourceSize === 'number') {
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputWidth,
      outputHeight
    );
  } else {
    ctx.drawImage(image, 0, 0, outputWidth, outputHeight);
  }

  return ctx.getImageData(0, 0, outputWidth, outputHeight);
}

function quantileFromHistogram(
  histogram: Uint32Array,
  totalPixels: number,
  quantile: number
): number {
  const target = totalPixels * quantile;
  let cumulative = 0;
  for (let i = 0; i < histogram.length; i++) {
    cumulative += histogram[i];
    if (cumulative >= target) {
      return i;
    }
  }
  return histogram.length - 1;
}

function computeLaplacianVariance(
  grayscale: Float32Array,
  width: number,
  height: number
): number {
  if (width < 3 || height < 3) return 0;

  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    const rowUp = (y - 1) * width;
    const rowDown = (y + 1) * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = row + x;
      const lap =
        grayscale[rowUp + x] +
        grayscale[row + x - 1] +
        grayscale[row + x + 1] +
        grayscale[rowDown + x] -
        4 * grayscale[idx];

      sum += lap;
      sumSquares += lap * lap;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  return Math.max(0, sumSquares / count - mean * mean);
}

function buildReasons(
  overexposedPct: number,
  clippedHighlightsPct: number,
  underexposedPct: number,
  dynamicRangeNorm: number,
  laplacianVariance: number,
  resolution: ResolutionMetrics | undefined,
  level: 'ok' | 'warning' | 'critical'
): string[] {
  const reasons: string[] = [];

  const isCritical = level === 'critical';
  const overThreshold = isCritical ? 12 : 4;
  const clippedThreshold = isCritical ? 6 : 2;
  const underThreshold = isCritical ? 15 : 6;
  const rangeThreshold = isCritical ? 0.2 : 0.3;
  const sharpnessThreshold = isCritical ? 70 : 120;
  const resolutionThreshold = isCritical ? 1.4 : 1.15;

  if (overexposedPct >= overThreshold) {
    reasons.push(`High overexposure (${overexposedPct.toFixed(1)}%)`);
  }
  if (clippedHighlightsPct >= clippedThreshold) {
    reasons.push(`Clipped highlights (${clippedHighlightsPct.toFixed(1)}%)`);
  }
  if (underexposedPct >= underThreshold) {
    reasons.push(`Deep shadows (${underexposedPct.toFixed(1)}%)`);
  }
  if (dynamicRangeNorm < rangeThreshold) {
    reasons.push(`Low contrast (range ${(dynamicRangeNorm * 100).toFixed(1)}%)`);
  }
  if (laplacianVariance < sharpnessThreshold) {
    reasons.push(`Low sharpness (edge var ${laplacianVariance.toFixed(1)})`);
  }
  if (resolution && resolution.upsampleRatio > resolutionThreshold) {
    reasons.push(`Upscaled crop (${resolution.upsampleRatio.toFixed(2)}x)`);
  }

  return reasons;
}

function analyzeFromImageData(
  imageData: ImageData,
  resolution?: ResolutionMetrics
): QualityAnalysis {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  const histogram = new Uint32Array(256);
  const grayscale = new Float32Array(totalPixels);

  let overexposed = 0;
  let clippedHighlights = 0;
  let underexposed = 0;

  let pixelIndex = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = LUMA_R * r + LUMA_G * g + LUMA_B * b;

    grayscale[pixelIndex] = luminance;
    histogram[Math.round(clamp(luminance, 0, 255))]++;

    if (luminance >= 245) overexposed++;
    if (r >= 250 || g >= 250 || b >= 250) clippedHighlights++;
    if (luminance <= 15) underexposed++;

    pixelIndex++;
  }

  const overexposedPct = (overexposed / totalPixels) * 100;
  const clippedHighlightsPct = (clippedHighlights / totalPixels) * 100;
  const underexposedPct = (underexposed / totalPixels) * 100;

  const p5 = quantileFromHistogram(histogram, totalPixels, 0.05);
  const p95 = quantileFromHistogram(histogram, totalPixels, 0.95);
  const dynamicRangeNorm = (p95 - p5) / 255;
  const laplacianVariance = computeLaplacianVariance(grayscale, width, height);

  const critical =
    overexposedPct >= 12 ||
    clippedHighlightsPct >= 6 ||
    underexposedPct >= 15 ||
    dynamicRangeNorm < 0.2 ||
    laplacianVariance < 70 ||
    (resolution ? resolution.upsampleRatio > 1.4 : false);

  const warning =
    overexposedPct >= 4 ||
    clippedHighlightsPct >= 2 ||
    underexposedPct >= 6 ||
    dynamicRangeNorm < 0.3 ||
    laplacianVariance < 120 ||
    (resolution ? resolution.upsampleRatio > 1.15 : false);

  const level = critical ? 'critical' : warning ? 'warning' : 'ok';

  const exposurePenalty = Math.min(
    35,
    overexposedPct * 2 + clippedHighlightsPct * 3 + underexposedPct * 1.2
  );
  const contrastPenalty = dynamicRangeNorm < 0.3 ? Math.min(20, (0.3 - dynamicRangeNorm) * 100) : 0;
  const sharpnessPenalty = laplacianVariance < 120 ? Math.min(30, (120 - laplacianVariance) / 2) : 0;
  const resolutionPenalty =
    resolution && resolution.upsampleRatio > 1
      ? Math.min(15, (resolution.upsampleRatio - 1) * 30)
      : 0;

  const score = Math.round(
    clamp(100 - (exposurePenalty + contrastPenalty + sharpnessPenalty + resolutionPenalty), 0, 100)
  );

  const reasons = level === 'ok'
    ? ['No significant quality issues detected']
    : buildReasons(
      overexposedPct,
      clippedHighlightsPct,
      underexposedPct,
      dynamicRangeNorm,
      laplacianVariance,
      resolution,
      level
    );

  return {
    level,
    score,
    reasons,
    exposure: {
      overexposedPct,
      clippedHighlightsPct,
      underexposedPct,
    },
    contrast: {
      p5,
      p95,
      dynamicRangeNorm,
    },
    sharpness: {
      laplacianVariance,
    },
    resolution,
  };
}

export async function analyzeGlobalQuality(image: HTMLImageElement): Promise<QualityAnalysis> {
  const scale = Math.min(1, GLOBAL_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const imageData = sampleImageData(image, width, height);
  return analyzeFromImageData(imageData);
}

export async function analyzeSquareQuality(
  image: HTMLImageElement,
  square: CropSquare,
  scaleFactor: number
): Promise<QualityAnalysis> {
  const cropX = square.x * scaleFactor;
  const cropY = square.y * scaleFactor;
  const cropSize = square.size * scaleFactor;
  const imageData = sampleImageData(
    image,
    SLIDE_SAMPLE_SIZE,
    SLIDE_SAMPLE_SIZE,
    cropX,
    cropY,
    cropSize
  );

  const sourceCropPixels = cropSize;
  const upsampleRatio = EXPORT_SIZE / sourceCropPixels;

  return analyzeFromImageData(imageData, {
    sourceCropPixels,
    upsampleRatio,
  });
}

export const __qualityTestUtils = {
  analyzeFromImageData,
};
