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
