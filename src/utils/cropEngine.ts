import type { PrintBorderSettings } from '../types';

export const OUTPUT_SIZE = 1080;

function getBorderInset(outputSize: number, printBorder?: PrintBorderSettings): number {
  if (!printBorder?.enabled) return 0;
  const clampedPercent = Math.max(0, Math.min(30, printBorder.sizePercent));
  return Math.round((outputSize * clampedPercent) / 100);
}

export function drawCropToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropSize: number,
  outputSize: number,
  printBorder?: PrintBorderSettings
): void {
  const borderInset = getBorderInset(outputSize, printBorder);
  const drawSize = Math.max(1, outputSize - borderInset * 2);

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropSize,
    cropSize,
    borderInset,
    borderInset,
    drawSize,
    drawSize
  );
}

export async function cropRegion(
  image: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropSize: number,
  printBorder?: PrintBorderSettings
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d')!;
  drawCropToCanvas(ctx, image, cropX, cropY, cropSize, OUTPUT_SIZE, printBorder);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob from canvas'));
    }, 'image/png');
  });
}
