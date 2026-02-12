import { useCallback, useEffect, useRef, useState } from 'react';
import { CropSquare } from './CropSquare';
import { CropPreview } from './CropPreview';
import type { CropSquare as CropSquareType, LoadedImage } from '../types';

interface ImageWorkspaceProps {
  image: LoadedImage;
  squares: CropSquareType[];
  selectedIds: Set<string>;
  onSelect: (id: string, shiftKey: boolean) => void;
  onAddSquare: (x: number, y: number, size: number) => void;
  onUpdateSquare: (id: string, patch: Partial<Pick<CropSquareType, 'x' | 'y' | 'size'>>) => void;
  onRemoveSquare: (id: string) => void;
  onScaleFactorChange: (factor: number) => void;
  onDisplaySizeChange: (width: number, height: number) => void;
}

const MAX_DISPLAY_WIDTH = 900;
const MAX_DISPLAY_HEIGHT = 600;

export function ImageWorkspace({
  image,
  squares,
  selectedIds,
  onSelect,
  onAddSquare,
  onUpdateSquare,
  onRemoveSquare,
  onScaleFactorChange,
  onDisplaySizeChange,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [scaleFactor, setScaleFactor] = useState(1);

  // Group drag: store starting positions of all selected squares (except the one being dragged)
  const groupDragOrigins = useRef<Map<string, { x: number; y: number; size: number }>>(new Map());
  const draggingSquareId = useRef<string | null>(null);

  useEffect(() => {
    const { naturalWidth, naturalHeight } = image;
    const scaleX = MAX_DISPLAY_WIDTH / naturalWidth;
    const scaleY = MAX_DISPLAY_HEIGHT / naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const width = Math.round(naturalWidth * scale);
    const height = Math.round(naturalHeight * scale);
    setDisplaySize({ width, height });
    const factor = naturalWidth / width;
    setScaleFactor(factor);
    onScaleFactorChange(factor);
    onDisplaySizeChange(width, height);
  }, [image, onScaleFactorChange, onDisplaySizeChange]);

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

  const makeGroupDragStart = useCallback((squareId: string) => () => {
    draggingSquareId.current = squareId;
    if (selectedIds.size > 1 && selectedIds.has(squareId)) {
      const origins = new Map<string, { x: number; y: number; size: number }>();
      for (const sq of squares) {
        if (selectedIds.has(sq.id) && sq.id !== squareId) {
          origins.set(sq.id, { x: sq.x, y: sq.y, size: sq.size });
        }
      }
      groupDragOrigins.current = origins;
    } else {
      groupDragOrigins.current = new Map();
    }
  }, [selectedIds, squares]);

  const handleGroupDragDelta = useCallback((dx: number, dy: number) => {
    for (const [id, origin] of groupDragOrigins.current) {
      const newX = Math.max(0, Math.min(displaySize.width - origin.size, origin.x + dx));
      const newY = Math.max(0, Math.min(displaySize.height - origin.size, origin.y + dy));
      onUpdateSquare(id, { x: newX, y: newY });
    }
  }, [displaySize, onUpdateSquare]);

  const handleGroupDragEnd = useCallback(() => {
    groupDragOrigins.current = new Map();
    draggingSquareId.current = null;
  }, []);

  // Group resize: scale all selected squares proportionally from the group bounding box anchor
  const groupResizeData = useRef<{
    origins: Map<string, { x: number; y: number; size: number }>;
    primaryOrigSize: number;
    anchor: { x: number; y: number };
  } | null>(null);

  const makeGroupResizeStart = useCallback((squareId: string) => (corner: string) => {
    if (selectedIds.size > 1 && selectedIds.has(squareId)) {
      const selected = squares.filter((sq) => selectedIds.has(sq.id));
      const origins = new Map<string, { x: number; y: number; size: number }>();
      for (const sq of selected) {
        if (sq.id !== squareId) {
          origins.set(sq.id, { x: sq.x, y: sq.y, size: sq.size });
        }
      }

      // Compute bounding box of all selected squares
      const bbLeft = Math.min(...selected.map((s) => s.x));
      const bbTop = Math.min(...selected.map((s) => s.y));
      const bbRight = Math.max(...selected.map((s) => s.x + s.size));
      const bbBottom = Math.max(...selected.map((s) => s.y + s.size));

      // Anchor is the opposite corner of the one being dragged
      const anchor = corner === 'se' ? { x: bbLeft, y: bbTop }
        : corner === 'sw' ? { x: bbRight, y: bbTop }
        : corner === 'ne' ? { x: bbLeft, y: bbBottom }
        : /* nw */ { x: bbRight, y: bbBottom };

      const primary = selected.find((s) => s.id === squareId)!;
      groupResizeData.current = { origins, primaryOrigSize: primary.size, anchor };
    } else {
      groupResizeData.current = null;
    }
  }, [selectedIds, squares]);

  const handleGroupResizeDelta = useCallback((sizeDelta: number, _corner: string) => {
    const data = groupResizeData.current;
    if (!data) return;

    const scale = (data.primaryOrigSize + sizeDelta) / data.primaryOrigSize;
    if (scale <= 0) return;

    for (const [id, origin] of data.origins) {
      let newSize = Math.max(50, origin.size * scale);
      let newX = data.anchor.x + (origin.x - data.anchor.x) * scale;
      let newY = data.anchor.y + (origin.y - data.anchor.y) * scale;

      // Clamp to bounds
      newX = Math.max(0, Math.min(displaySize.width - newSize, newX));
      newY = Math.max(0, Math.min(displaySize.height - newSize, newY));
      newSize = Math.min(newSize, displaySize.width - newX, displaySize.height - newY);
      newSize = Math.max(50, newSize);

      onUpdateSquare(id, { x: newX, y: newY, size: newSize });
    }
  }, [displaySize, onUpdateSquare]);

  const handleGroupResizeEnd = useCallback(() => {
    groupResizeData.current = null;
  }, []);

  // For snap targets: exclude all selected squares when doing group drag
  const getSnapTargets = useCallback((squareId: string) => {
    if (selectedIds.size > 1 && selectedIds.has(squareId)) {
      return squares.filter((s) => !selectedIds.has(s.id));
    }
    return squares.filter((s) => s.id !== squareId);
  }, [squares, selectedIds]);

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
              snapTargets={getSnapTargets(sq.id)}
              onUpdate={onUpdateSquare}
              onRemove={onRemoveSquare}
              isSelected={selectedIds.has(sq.id)}
              onSelect={onSelect}
              onDragStart={makeGroupDragStart(sq.id)}
              onDragDelta={selectedIds.size > 1 && selectedIds.has(sq.id) ? handleGroupDragDelta : undefined}
              onDragEnd={handleGroupDragEnd}
              onResizeStart={makeGroupResizeStart(sq.id)}
              onResizeDelta={selectedIds.size > 1 && selectedIds.has(sq.id) ? handleGroupResizeDelta : undefined}
              onResizeEnd={handleGroupResizeEnd}
            />
          ))}
        </div>

        {/* Image info */}
        <div className="flex justify-between text-[10px] text-text-3 tracking-wider uppercase mt-3">
          <span>{image.file.name}</span>
          <span>{image.naturalWidth} &times; {image.naturalHeight}</span>
        </div>

        {/* Preview strip */}
        <CropPreview
          image={image}
          squares={squares}
          scaleFactor={scaleFactor}
          selectedIds={selectedIds}
          onSelect={(id) => onSelect(id, false)}
        />
      </div>
    </div>
  );
}
