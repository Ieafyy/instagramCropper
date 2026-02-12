import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ImageWorkspace } from './components/ImageWorkspace';
import { SquareList } from './components/SquareList';
import { Toolbar } from './components/Toolbar';
import { useImageLoader } from './hooks/useImageLoader';
import { useCropSquares } from './hooks/useCropSquares';
import { exportAsZip } from './utils/zipExporter';

function App() {
  const { image, loadImage, reset: resetImage } = useImageLoader();
  const { squares, addSquare, updateSquare, removeSquare, moveSquare, clearAll } = useCropSquares();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scaleFactor, setScaleFactor] = useState(1);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!image || squares.length === 0) return;
    setIsExporting(true);
    try {
      await exportAsZip(image.element, squares, scaleFactor, image.file.name);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  }, [image, squares, scaleFactor]);

  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      if (shiftKey) {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      }
      // If already selected (part of multi-selection), keep the group
      if (prev.has(id) && prev.size > 1) {
        return prev;
      }
      return new Set([id]);
    });
  }, []);

  const handleNewImage = useCallback(() => {
    clearAll();
    setSelectedIds(new Set());
    resetImage();
  }, [clearAll, resetImage]);

  const handleDisplaySizeChange = useCallback((width: number, height: number) => {
    setDisplaySize({ width, height });
  }, []);

  const handleAddSquareCenter = useCallback(() => {
    addSquare(100, 100, 150);
  }, [addSquare]);

  const handleAutoFill = useCallback((count: number) => {
    if (displaySize.width === 0 || displaySize.height === 0) return;
    clearAll();
    const size = Math.min(displaySize.width / count, displaySize.height);
    const totalWidth = size * count;
    const offsetX = (displaySize.width - totalWidth) / 2;
    const offsetY = (displaySize.height - size) / 2;
    for (let i = 0; i < count; i++) {
      addSquare(offsetX + i * size, offsetY, size);
    }
  }, [displaySize, addSquare, clearAll]);

  return (
    <div className="h-screen flex flex-col bg-surface-0 text-text-1 font-body overflow-hidden">
      {/* Noise texture */}
      <div className="noise-overlay" />

      <Header />

      {!image ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <DropZone onFileSelect={loadImage} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 animate-fade-in">
          {/* Workspace */}
          <ImageWorkspace
            image={image}
            squares={squares}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onAddSquare={addSquare}
            onUpdateSquare={updateSquare}
            onRemoveSquare={removeSquare}
            onScaleFactorChange={setScaleFactor}
            onDisplaySizeChange={handleDisplaySizeChange}
          />

          {/* Sidebar */}
          <div className="w-56 flex flex-col border-l border-border-1 bg-surface-1/60">
            <div className="px-3 py-3 border-b border-border-2">
              <h2 className="text-[11px] font-medium text-text-3 tracking-widest uppercase">
                Slides
              </h2>
            </div>
            <SquareList
              squares={squares}
              selectedIds={selectedIds}
              onSelect={(id) => handleSelect(id, false)}
              onRemove={removeSquare}
              onMove={moveSquare}
            />
            <div className="border-t border-border-2">
              <Toolbar
                squareCount={squares.length}
                isExporting={isExporting}
                onAddSquare={handleAddSquareCenter}
                onAutoFill={handleAutoFill}
                onExport={handleExport}
                onClear={clearAll}
                onNewImage={handleNewImage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
