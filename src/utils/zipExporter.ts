import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { cropRegion } from './cropEngine';
import type { CropSquare } from '../types';

export async function exportAsZip(
  image: HTMLImageElement,
  squares: CropSquare[],
  scaleFactor: number,
  originalFilename: string
): Promise<void> {
  const zip = new JSZip();
  const sorted = [...squares].sort((a, b) => a.order - b.order);

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
  const baseName = originalFilename.replace(/\.[^.]+$/, '');
  saveAs(zipBlob, `${baseName}.zip`);
}
