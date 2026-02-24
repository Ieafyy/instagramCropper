import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { cropRegion } from './cropEngine';
import type { CropSquare } from '../types';

export type ExportFormat = 'zip' | 'images';

function getSortedSquares(squares: CropSquare[]): CropSquare[] {
  return [...squares].sort((a, b) => a.order - b.order);
}

function getBaseName(originalFilename: string): string {
  return originalFilename.replace(/\.[^.]+$/, '');
}

export async function exportAsZip(
  image: HTMLImageElement,
  squares: CropSquare[],
  scaleFactor: number,
  originalFilename: string
): Promise<void> {
  const zip = new JSZip();
  const sorted = getSortedSquares(squares);

  for (let i = 0; i < sorted.length; i++) {
    const sq = sorted[i];
    const blob = await cropRegion(
      image,
      sq.x * scaleFactor,
      sq.y * scaleFactor,
      sq.size * scaleFactor
    );
    zip.file(`${i + 1}.png`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const baseName = getBaseName(originalFilename);
  saveAs(zipBlob, `${baseName}.zip`);
}

export async function exportAsImages(
  image: HTMLImageElement,
  squares: CropSquare[],
  scaleFactor: number,
  originalFilename: string
): Promise<void> {
  const sorted = getSortedSquares(squares);
  const baseName = getBaseName(originalFilename);
  const pad = Math.max(2, String(sorted.length).length);

  for (let i = 0; i < sorted.length; i++) {
    const sq = sorted[i];
    const blob = await cropRegion(
      image,
      sq.x * scaleFactor,
      sq.y * scaleFactor,
      sq.size * scaleFactor
    );
    const slideNumber = String(i + 1).padStart(pad, '0');
    saveAs(blob, `${baseName}-${slideNumber}.png`);
  }
}
