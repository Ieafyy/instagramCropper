import { useState, useCallback } from 'react';
import type { LoadedImage } from '../types';

export function useImageLoader() {
  const [image, setImage] = useState<LoadedImage | null>(null);

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage({
        file,
        url,
        element: img,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.src = url;
  }, []);

  const reset = useCallback(() => {
    if (image) {
      URL.revokeObjectURL(image.url);
    }
    setImage(null);
  }, [image]);

  return { image, loadImage, reset };
}
