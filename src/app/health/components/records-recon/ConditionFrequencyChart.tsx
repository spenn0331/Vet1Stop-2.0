'use client';

import React from 'react';
import type { ReconKeywordFrequency } from '@/types/records-recon';

interface ConditionFrequencyChartProps {
  data: ReconKeywordFrequency[];
  onBarClick?: (term: string) => void;
}

export default function ConditionFrequencyChart({ data, onBarClick }: ConditionFrequencyChartProps) {
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const top10 = data.slice(0, 10);

  return (
    <div className="space-y-2">
      {top10.map((item, i) => {
        const widthPct = Math.max((item.count / maxCount) * 100, 8);
        return (
          <button
            key={i}
            onClick={() => onBarClick?.(item.term)}
            className="w-full flex items-center gap-3 group hover:bg-blue-50 rounded px-1 py-1 transition-colors text-left"
          >
            <span className="text-gray-800 text-xs font-mono w-40 truncate flex-shrink-0" title={item.term}>
              {item.term}
            </span>
            <div className="flex-1 bg-blue-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] rounded-full transition-all duration-500 group-hover:from-[#2563EB] group-hover:to-[#EAB308]"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="text-[#1A2C5B] text-xs font-mono font-bold w-6 text-right flex-shrink-0">
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
