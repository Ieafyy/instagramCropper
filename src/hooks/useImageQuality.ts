import { useEffect, useReducer, useRef } from 'react';
import type { CropSquare, ImageQualityReport, LoadedImage } from '../types';
import { analyzeGlobalQuality, analyzeSquareQuality } from '../utils/imageAnalysis';

const DEBOUNCE_MS = 150;

const INITIAL_REPORT: ImageQualityReport = {
  global: null,
  bySquareId: {},
  isAnalyzing: false,
  updatedAt: null,
};

type QualityAction =
  | { type: 'reset' }
  | { type: 'global-start' }
  | { type: 'global-success'; payload: ImageQualityReport['global'] }
  | { type: 'global-error' }
  | { type: 'squares-start' }
  | { type: 'squares-success'; payload: ImageQualityReport['bySquareId'] }
  | { type: 'squares-clear' }
  | { type: 'squares-error' };

function qualityReducer(state: ImageQualityReport, action: QualityAction): ImageQualityReport {
  switch (action.type) {
    case 'reset':
      return INITIAL_REPORT;
    case 'global-start':
      return {
        ...state,
        global: null,
        bySquareId: {},
        isAnalyzing: true,
        updatedAt: null,
      };
    case 'global-success':
      return {
        ...state,
        global: action.payload,
        isAnalyzing: false,
        updatedAt: Date.now(),
      };
    case 'global-error':
      return {
        ...state,
        global: null,
        isAnalyzing: false,
        updatedAt: Date.now(),
      };
    case 'squares-start':
      return {
        ...state,
        isAnalyzing: true,
      };
    case 'squares-success':
      return {
        ...state,
        bySquareId: action.payload,
        isAnalyzing: false,
        updatedAt: Date.now(),
      };
    case 'squares-clear':
      return {
        ...state,
        bySquareId: {},
        isAnalyzing: false,
        updatedAt: Date.now(),
      };
    case 'squares-error':
      return {
        ...state,
        isAnalyzing: false,
        updatedAt: Date.now(),
      };
    default:
      return state;
  }
}

export function useImageQuality(
  image: LoadedImage | null,
  squares: CropSquare[],
  scaleFactor: number
): ImageQualityReport {
  const [report, dispatch] = useReducer(qualityReducer, INITIAL_REPORT);
  const globalTokenRef = useRef(0);
  const squaresTokenRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!image) {
      globalTokenRef.current++;
      squaresTokenRef.current++;
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      dispatch({ type: 'reset' });
      return;
    }

    const token = ++globalTokenRef.current;
    dispatch({ type: 'global-start' });

    void (async () => {
      try {
        const global = await analyzeGlobalQuality(image.element);
        if (token !== globalTokenRef.current) return;

        dispatch({ type: 'global-success', payload: global });
      } catch (error) {
        if (token !== globalTokenRef.current) return;
        console.warn('Global quality analysis failed:', error);
        dispatch({ type: 'global-error' });
      }
    })();
  }, [image]);

  useEffect(() => {
    if (!image) return;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    if (squares.length === 0) {
      squaresTokenRef.current++;
      dispatch({ type: 'squares-clear' });
      return;
    }

    dispatch({ type: 'squares-start' });
    const token = ++squaresTokenRef.current;

    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        try {
          const entries = await Promise.all(
            squares.map(async (square) => {
              const analysis = await analyzeSquareQuality(image.element, square, scaleFactor);
              return [square.id, analysis] as const;
            })
          );

          if (token !== squaresTokenRef.current) return;
          const bySquareId = Object.fromEntries(entries);

          dispatch({ type: 'squares-success', payload: bySquareId });
        } catch (error) {
          if (token !== squaresTokenRef.current) return;
          console.warn('Per-slide quality analysis failed:', error);
          dispatch({ type: 'squares-error' });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [image, squares, scaleFactor]);

  return report;
}
