import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CropSquare } from './CropSquare';
import type { CropSquare as CropSquareType, LoadedImage } from '../types';

interface ImageWorkspaceProps {
  image: LoadedImage;
  squares: CropSquareType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddSquare: (x: number, y: number, size: number) => void;
  onUpdateSquare: (id: string, patch: Partial<Pick<CropSquareType, 'x' | 'y' | 'size'>>) => void;
  onRemoveSquare: (id: string) => void;
  onScaleFactorChange: (factor: number) => void;
}

const MAX_DISPLAY_WIDTH = 900;
const MAX_DISPLAY_HEIGHT = 600;

export function ImageWorkspace({
  image,
  squares,
  selectedId,
  onSelect,
  onAddSquare,
  onUpdateSquare,
  onRemoveSquare,
  onScaleFactorChange,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const { naturalWidth, naturalHeight } = image;
    const scaleX = MAX_DISPLAY_WIDTH / naturalWidth;
    const scaleY = MAX_DISPLAY_HEIGHT / naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const width = Math.round(naturalWidth * scale);
    const height = Math.round(naturalHeight * scale);
    setDisplaySize({ width, height });
    onScaleFactorChange(naturalWidth / width);
  }, [image, onScaleFactorChange]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const defaultSize = Math.min(displaySize.width, displaySize.height) * 0.2;
      const size = Math.max(50, defaultSize);

      const x = Math.max(0, Math.min(displaySize.width - size, clickX - size / 2));
      const y = Math.max(0, Math.min(displaySize.height - size, clickY - size / 2));

      onAddSquare(x, y, size);
    },
    [displaySize, onAddSquare]
  );

  if (displaySize.width === 0) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto animate-fade-in">
      <div className="relative">
        {/* Ambient glow behind image */}
        <div
          className="absolute -inset-8 opacity-30 blur-3xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(212, 160, 55, 0.08) 0%, transparent 70%)',
          }}
        />

        {/* Image container */}
        <div
          ref={containerRef}
          className="relative select-none shadow-2xl"
          style={{ width: displaySize.width, height: displaySize.height }}
          onClick={handleCanvasClick}
        >
          <img
            src={image.url}
            alt="Source"
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* Dimming overlay */}
          {squares.length > 0 && (
            <div className="absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-300" />
          )}

          {squares.map((sq) => (
            <CropSquare
              key={sq.id}
              square={sq}
              bounds={{ maxWidth: displaySize.width, maxHeight: displaySize.height }}
              snapTargets={squares.filter((s) => s.id !== sq.id)}
              onUpdate={onUpdateSquare}
              onRemove={onRemoveSquare}
              isSelected={selectedId === sq.id}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Image info */}
        <div className="absolute -bottom-7 left-0 right-0 flex justify-between text-[10px] text-text-3 tracking-wider uppercase">
          <span>{image.file.name}</span>
          <span>{image.naturalWidth} &times; {image.naturalHeight}</span>
        </div>
      </div>
    </div>
  );
}
