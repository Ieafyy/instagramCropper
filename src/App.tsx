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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
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

  const handleNewImage = useCallback(() => {
    clearAll();
    setSelectedId(null);
    resetImage();
  }, [clearAll, resetImage]);

  const handleAddSquareCenter = useCallback(() => {
    addSquare(100, 100, 150);
  }, [addSquare]);

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
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAddSquare={addSquare}
            onUpdateSquare={updateSquare}
            onRemoveSquare={removeSquare}
            onScaleFactorChange={setScaleFactor}
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
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeSquare}
              onMove={moveSquare}
            />
            <div className="border-t border-border-2">
              <Toolbar
                squareCount={squares.length}
                isExporting={isExporting}
                onAddSquare={handleAddSquareCenter}
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
