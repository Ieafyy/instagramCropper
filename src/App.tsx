import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

type AppTheme = 'dark' | 'light';
const THEME_STORAGE_KEY = 'carousel-cropper-theme';

function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });
  const { image, loadImage, reset: resetImage } = useImageLoader();
  const { squares, addSquare, updateSquare, removeSquare, moveSquare, clearAll, clampSquaresToBounds, rescaleSquaresToBounds } = useCropSquares();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mobilePanelExpanded, setMobilePanelExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [showExportQualityModal, setShowExportQualityModal] = useState(false);
  const previousDisplaySizeRef = useRef<{ width: number; height: number } | null>(null);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsMobileViewport(query.matches);
    update();
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileSelectionMode(false);
    }
  }, [isMobileViewport]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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

  const handleMobileLongPressSelect = useCallback((id: string) => {
    setMobileSelectionMode(true);
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleNewImage = useCallback(() => {
    clearAll();
    setSelectedIds(new Set());
    setMobilePanelExpanded(false);
    setMobileSelectionMode(false);
    setShowExportQualityModal(false);
    resetImage();
  }, [clearAll, resetImage]);

  const handleDisplaySizeChange = useCallback((width: number, height: number) => {
    setDisplaySize({ width, height });
  }, []);

  useEffect(() => {
    if (displaySize.width <= 0 || displaySize.height <= 0) return;
    const previousSize = previousDisplaySizeRef.current;

    if (
      previousSize &&
      (Math.abs(previousSize.width - displaySize.width) > 0.01 ||
        Math.abs(previousSize.height - displaySize.height) > 0.01)
    ) {
      rescaleSquaresToBounds(
        previousSize.width,
        previousSize.height,
        displaySize.width,
        displaySize.height
      );
    } else {
      clampSquaresToBounds(displaySize.width, displaySize.height);
    }

    previousDisplaySizeRef.current = displaySize;
  }, [clampSquaresToBounds, displaySize, rescaleSquaresToBounds]);

  const handleAddSquareCenter = useCallback(() => {
    addSquare(100, 100, 150);
  }, [addSquare]);

  const handleAutoFill = useCallback((count: number) => {
    if (displaySize.width === 0 || displaySize.height === 0) return;
    clearAll();
    const size = Math.max(1, Math.floor(Math.min(displaySize.width / count, displaySize.height)));
    const totalWidth = size * count;
    const offsetX = Math.floor((displaySize.width - totalWidth) / 2);
    const offsetY = Math.floor((displaySize.height - size) / 2);
    for (let i = 0; i < count; i++) {
      const x = Math.max(0, Math.min(displaySize.width - size, offsetX + i * size));
      addSquare(x, offsetY, size);
    }
  }, [displaySize, addSquare, clearAll]);

  return (
    <div className="h-screen flex flex-col bg-surface-0 text-text-1 font-body overflow-hidden">
      {/* Noise texture */}
      <div className="noise-overlay" />

      <Header
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {!image ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <DropZone onFileSelect={loadImage} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 animate-fade-in flex-col lg:flex-row">
          {/* Workspace */}
          <ImageWorkspace
            image={image}
            squares={squares}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onToggleSelect={toggleSelection}
            onLongPressSelect={handleMobileLongPressSelect}
            isMobileViewport={isMobileViewport}
            isMobileSelectionMode={isMobileViewport && mobileSelectionMode}
            onAddSquare={addSquare}
            onUpdateSquare={updateSquare}
            onRemoveSquare={removeSquare}
            onScaleFactorChange={setScaleFactor}
            onDisplaySizeChange={handleDisplaySizeChange}
            qualityById={qualityReport.bySquareId}
          />

          {/* Sidebar */}
          <div className="w-full lg:w-56 flex shrink-0 flex-col border-border-1 bg-surface-1/60 border-t lg:border-t-0 lg:border-l">
            <div className="px-3 py-2.5 border-b border-border-2 flex items-center justify-between">
              <h2 className="text-[11px] font-medium text-text-3 tracking-widest uppercase">
                Slides
              </h2>
              <button
                onClick={() => setMobilePanelExpanded((prev) => !prev)}
                className="lg:hidden flex items-center gap-1 px-2 py-1 rounded border border-border-1 text-[10px] text-text-3 tracking-wider uppercase"
                aria-label={mobilePanelExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                {mobilePanelExpanded ? 'Hide' : `${squares.length} slide${squares.length !== 1 ? 's' : ''}`}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={`transition-transform duration-200 ${mobilePanelExpanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
            <div className={`${mobilePanelExpanded ? 'flex' : 'hidden'} lg:flex min-h-0 flex-1 flex-col`}>
              <QualityPanel
                globalQuality={qualityReport.global}
                warningCount={warningSlidesCount}
                criticalCount={criticalSlidesCount}
                isAnalyzing={qualityReport.isAnalyzing}
              />
              <SquareList
                squares={squares}
                qualityById={qualityReport.bySquareId}
                scaleFactor={scaleFactor}
                selectedIds={selectedIds}
                onSelect={(id) => {
                  if (isMobileViewport && mobileSelectionMode) {
                    toggleSelection(id);
                    return;
                  }
                  handleSelect(id, false);
                }}
                onRemove={removeSquare}
                onMove={moveSquare}
              />
            </div>
            <div className="border-t border-border-2">
              <Toolbar
                squareCount={squares.length}
                isExporting={isExporting}
                onAddSquare={handleAddSquareCenter}
                onAutoFill={handleAutoFill}
                onExport={handleExport}
                onClear={clearAll}
                onNewImage={handleNewImage}
                isMobileViewport={isMobileViewport}
                isMobileSelectionMode={isMobileViewport && mobileSelectionMode}
                selectedCount={selectedIds.size}
                onToggleMobileSelectionMode={() => setMobileSelectionMode((prev) => !prev)}
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
