import { useRef, useEffect, useState } from 'react';
import type { HistogramData } from '../types';

interface HistogramPanelProps {
  histogram: HistogramData;
  p5: number;
  p95: number;
}

const CHANNELS = [
  { key: 'luma', label: 'L', color: 'rgba(255,255,255,0.22)', dot: '#ccc' },
  { key: 'r',    label: 'R', color: 'rgba(255,80,80,0.30)',   dot: '#f55' },
  { key: 'g',    label: 'G', color: 'rgba(80,200,100,0.30)',  dot: '#4c8' },
  { key: 'b',    label: 'B', color: 'rgba(80,140,255,0.30)',  dot: '#58f' },
] as const;

type ChannelKey = typeof CHANNELS[number]['key'];

export function HistogramPanel({ histogram, p5, p95 }: HistogramPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState<Record<ChannelKey, boolean>>({
    luma: true, r: true, g: true, b: true,
  });

  const toggle = (key: ChannelKey) =>
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);

    const activeChannels = CHANNELS.filter(c => visible[c.key]);

    const maxCount = Math.max(
      ...(visible.luma ? Array.from(histogram.luma) : [0]),
      ...(visible.r    ? Array.from(histogram.r)    : [0]),
      ...(visible.g    ? Array.from(histogram.g)    : [0]),
      ...(visible.b    ? Array.from(histogram.b)    : [0]),
    );
    if (maxCount === 0) {
      // Zone dividers only
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (const zone of [64, 128, 192]) {
        const x = Math.round((zone / 255) * W) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      return;
    }

    const logMax = Math.log1p(maxCount);

    const drawChannel = (data: Uint32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * W;
        const y = H - (Math.log1p(data[i]) / logMax) * H;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    for (const ch of activeChannels) {
      drawChannel(histogram[ch.key], ch.color);
    }

    // Zone dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (const zone of [64, 128, 192]) {
      const x = Math.round((zone / 255) * W) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // p5 / p95 indicators
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = 'rgba(212,160,55,0.6)';
    if (p5 > 0) {
      const x = Math.round((p5 / 255) * W) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    if (p95 < 255) {
      const x = Math.round((p95 / 255) * W) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.setLineDash([]);
  }, [histogram, p5, p95, visible]);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] text-text-3 tracking-wider uppercase">Histogram</p>
        <div className="flex gap-1.5">
          {CHANNELS.map(ch => (
            <button
              key={ch.key}
              onClick={() => toggle(ch.key)}
              title={ch.key === 'luma' ? 'Luminance' : ch.key.toUpperCase()}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold tracking-wider transition-opacity"
              style={{
                color: visible[ch.key] ? ch.dot : 'var(--color-text-3)',
                opacity: visible[ch.key] ? 1 : 0.4,
                border: `1px solid ${visible[ch.key] ? ch.dot + '66' : 'transparent'}`,
                background: visible[ch.key] ? ch.dot + '18' : 'transparent',
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={256}
        height={60}
        className="w-full rounded"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-text-3">Shadows</span>
        <span className="text-[8px] text-text-3">Midtones</span>
        <span className="text-[8px] text-text-3">Highlights</span>
      </div>
    </div>
  );
}
