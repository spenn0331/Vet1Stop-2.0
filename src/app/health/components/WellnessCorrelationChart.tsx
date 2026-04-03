// @ts-nocheck
'use client';

import React, { useMemo } from 'react';

interface WellnessScores {
  mood: number;
  energy: number;
  sleep: number;
  pain: number;
  social: number;
}

interface WellnessEntry {
  date: string;
  scores: WellnessScores;
}

interface WellnessCorrelationChartProps {
  log: WellnessEntry[];
}

const DIMS: { key: keyof WellnessScores; label: string; color: string }[] = [
  { key: 'mood',   label: 'Mood',   color: '#6366f1' },
  { key: 'energy', label: 'Energy', color: '#3b82f6' },
  { key: 'sleep',  label: 'Sleep',  color: '#8b5cf6' },
  { key: 'pain',   label: 'Pain',   color: '#ef4444' },
  { key: 'social', label: 'Social', color: '#10b981' },
];

// ─── Pearson correlation ─────────────────────────────────────────────────────

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num  += dx * dy;
    dx2  += dx * dx;
    dy2  += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

function corrColor(r: number): string {
  const abs = Math.abs(r);
  if (r > 0) {
    const g = Math.round(255 * abs);
    const rest = Math.round(255 * (1 - abs * 0.6));
    return `rgb(${rest},${rest + Math.round(g * 0.2)},${rest + g})`;
  }
  const g = Math.round(255 * abs);
  const rest = Math.round(255 * (1 - abs * 0.6));
  return `rgb(${rest + g},${rest},${rest})`;
}

// ─── Trend multi-line chart ──────────────────────────────────────────────────

function TrendLines({ log }: { log: WellnessEntry[] }) {
  const recent = log.slice(-30);
  if (recent.length < 2) return null;

  const W = 460, H = 110, PX = 24, PY = 12;
  const iW = W - PX * 2, iH = H - PY * 2;
  const n  = recent.length;

  const toX = (i: number) => PX + (i / (n - 1)) * iW;
  const toY = (v: number) => PY + iH - ((v - 1) / 9) * iH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="30-day wellness trend lines" role="img">
      {/* Grid lines */}
      {[2, 4, 6, 8, 10].map(v => (
        <line
          key={v}
          x1={PX} y1={toY(v)} x2={W - PX} y2={toY(v)}
          stroke="#f3f4f6" strokeWidth={1}
        />
      ))}

      {/* Dimension lines */}
      {DIMS.map(({ key, color }) => {
        const pts = recent.map((e, i) => `${toX(i)},${toY(e.scores[key])}`).join(' ');
        return (
          <polyline
            key={key}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={1.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}

      {/* Last-point dots */}
      {DIMS.map(({ key, color }) => {
        const last = recent[recent.length - 1];
        return (
          <circle
            key={key}
            cx={toX(n - 1)}
            cy={toY(last.scores[key])}
            r={3}
            fill={color}
          />
        );
      })}

      {/* Y labels */}
      {[1, 5, 10].map(v => (
        <text
          key={v}
          x={PX - 4}
          y={toY(v) + 3.5}
          fontSize={7}
          textAnchor="end"
          fill="#9ca3af"
        >{v}</text>
      ))}
    </svg>
  );
}

// ─── Correlation heatmap ─────────────────────────────────────────────────────

function HeatMap({ log }: { log: WellnessEntry[] }) {
  const matrix = useMemo(() => {
    const series = DIMS.map(({ key }) => log.map(e => e.scores[key]));
    return DIMS.map((_, i) => DIMS.map((_, j) => pearson(series[i], series[j])));
  }, [log]);

  const cell = 44;
  const labelW = 48;
  const W = labelW + DIMS.length * cell;
  const H = labelW + DIMS.length * cell;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto" aria-label="Wellness correlation matrix" role="img">
      {/* Column labels */}
      {DIMS.map((d, j) => (
        <text
          key={j}
          x={labelW + j * cell + cell / 2}
          y={labelW - 6}
          fontSize={8}
          textAnchor="middle"
          fill="#6b7280"
        >{d.label}</text>
      ))}

      {DIMS.map((rowDim, i) => (
        <g key={i}>
          {/* Row label */}
          <text
            x={labelW - 6}
            y={labelW + i * cell + cell / 2 + 3.5}
            fontSize={8}
            textAnchor="end"
            fill="#6b7280"
          >{rowDim.label}</text>

          {DIMS.map((_, j) => {
            const r   = matrix[i][j];
            const bg  = i === j ? '#f3f4f6' : corrColor(r);
            const abs = Math.abs(r);
            const txtColor = abs > 0.5 ? '#fff' : '#374151';
            return (
              <g key={j}>
                <rect
                  x={labelW + j * cell + 2}
                  y={labelW + i * cell + 2}
                  width={cell - 4}
                  height={cell - 4}
                  rx={6}
                  fill={bg}
                />
                <text
                  x={labelW + j * cell + cell / 2}
                  y={labelW + i * cell + cell / 2 + 4}
                  fontSize={9}
                  fontWeight="700"
                  textAnchor="middle"
                  fill={i === j ? '#9ca3af' : txtColor}
                >
                  {i === j ? '—' : r.toFixed(2)}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function WellnessCorrelationChart({ log }: WellnessCorrelationChartProps) {
  const hasEnough = log.length >= 7;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#1A2C5B]">Wellness Trends &amp; Correlations</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {hasEnough ? `Based on ${log.length} check-ins` : 'Need at least 7 check-ins for correlations'}
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-1">
          {DIMS.map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        {!hasEnough ? (
          <div className="h-32 flex items-center justify-center text-sm text-gray-300 text-center leading-relaxed">
            Complete {7 - log.length} more check-in{7 - log.length !== 1 ? 's' : ''} to unlock<br />
            trend lines and correlation analysis
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Trend lines */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Last 30 Days</p>
              <TrendLines log={log} />
            </div>
            {/* Heatmap */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Dimension Correlations</p>
              <HeatMap log={log} />
              <div className="mt-2 flex items-center gap-3 justify-center">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-3 h-2 rounded-sm bg-blue-400 inline-block" />
                  Positive
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-3 h-2 rounded-sm bg-red-400 inline-block" />
                  Negative
                </span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className="w-3 h-2 rounded-sm bg-gray-100 border border-gray-200 inline-block" />
                  None
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
