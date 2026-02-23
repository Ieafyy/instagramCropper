import { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ImageWorkspace } from './components/ImageWorkspace';
import { SquareList } from './components/SquareList';
import { Toolbar } from './components/Toolbar';
import { QualityPanel } from './components/QualityPanel';
import { ExportQualityModal } from './components/ExportQualityModal';
import { useImageLoader } from './hooks/useImageLoader';
import { useCropSquares } from './hooks/useCropSquares';
import { useImageQuality } from './hooks/useImageQuality';
import { exportAsZip } from './utils/zipExporter';

function App() {
  const { image, loadImage, reset: resetImage } = useImageLoader();
  const { squares, addSquare, updateSquare, removeSquare, moveSquare, clearAll } = useCropSquares();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scaleFactor, setScaleFactor] = useState(1);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [showExportQualityModal, setShowExportQualityModal] = useState(false);
  const qualityReport = useImageQuality(image, squares, scaleFactor);

  const sortedSquares = useMemo(() => [...squares].sort((a, b) => a.order - b.order), [squares]);
  const criticalSlides = useMemo(
    () =>
      sortedSquares
        .map((square) => {
          const quality = qualityReport.bySquareId[square.id];
          if (!quality || quality.level !== 'critical') return null;
          return {
            id: square.id,
            order: square.order,
            score: quality.score,
            reason: quality.reasons[0] ?? 'Critical image quality issue',
          };
        })
        .filter((item): item is { id: string; order: number; score: number; reason: string } => item !== null),
    [sortedSquares, qualityReport.bySquareId]
  );

  const warningSlidesCount = useMemo(
    () =>
      sortedSquares.filter((square) => {
        const quality = qualityReport.bySquareId[square.id];
        return quality?.level === 'warning';
      }).length,
    [sortedSquares, qualityReport.bySquareId]
  );

  const criticalSlidesCount = criticalSlides.length;

  const executeExport = useCallback(async () => {
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

  const handleExport = useCallback(async () => {
    if (!image || squares.length === 0) return;
    if (criticalSlides.length > 0) {
      setShowExportQualityModal(true);
      return;
    }
    await executeExport();
  }, [image, squares.length, criticalSlides.length, executeExport]);

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
    setShowExportQualityModal(false);
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
            qualityById={qualityReport.bySquareId}
          />

          {/* Sidebar */}
          <div className="w-56 flex flex-col border-l border-border-1 bg-surface-1/60">
            <div className="px-3 py-3 border-b border-border-2">
              <h2 className="text-[11px] font-medium text-text-3 tracking-widest uppercase">
                Slides
              </h2>
            </div>
            <QualityPanel
              globalQuality={qualityReport.global}
              warningCount={warningSlidesCount}
              criticalCount={criticalSlidesCount}
              isAnalyzing={qualityReport.isAnalyzing}
            />
            <SquareList
              squares={squares}
              qualityById={qualityReport.bySquareId}
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

      <ExportQualityModal
        open={showExportQualityModal}
        criticalSlides={criticalSlides}
        onCancel={() => setShowExportQualityModal(false)}
        onConfirm={() => {
          setShowExportQualityModal(false);
          void executeExport();
        }}
      />
    </div>
  );
}

export default App;
