'use client';

import React from 'react';

interface ReconTimelineEntry {
  date: string | null;
  page: number | null;
  section: string | null;
  provider: string | null;
  entry: string;
  category: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Musculoskeletal': 'bg-orange-400',
  'Mental Health': 'bg-purple-400',
  'Hearing': 'bg-yellow-400',
  'Respiratory': 'bg-cyan-400',
  'Sleep': 'bg-indigo-400',
  'Cardiovascular': 'bg-red-400',
  'Neurological': 'bg-pink-400',
  'GI': 'bg-lime-400',
  'Endocrine': 'bg-teal-400',
  'Genitourinary': 'bg-blue-400',
  'Dermatological': 'bg-amber-400',
  'Ophthalmological': 'bg-emerald-400',
  'Oncological': 'bg-rose-400',
  'Other': 'bg-gray-400',
};

interface ReconTimelineProps {
  entries: ReconTimelineEntry[];
  onPageClick: (page: number, searchText?: string) => void;
}

export default function ReconTimeline({ entries, onPageClick }: ReconTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No dated entries found. Upload records with date stamps for timeline view.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="text-[#1A2C5B] font-bold text-sm mb-4 uppercase tracking-wider">Chronological Timeline</h3>

      {/* Vertical line */}
      <div className="absolute left-4 top-12 bottom-4 w-0.5 bg-gradient-to-b from-[#1A2C5B] via-[#2563EB] to-blue-200" />

      <div className="space-y-3 pl-10">
        {entries.map((entry, i) => {
          const dotColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
          return (
            <div key={i} className="relative bg-white rounded-lg p-3 border border-gray-200 hover:border-[#2563EB]/50 shadow-sm transition-colors">
              {/* Timeline dot */}
              <div className={`absolute -left-[26px] top-4 h-3 w-3 rounded-full ${dotColor} ring-2 ring-white`} />

              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {entry.date && (
                  <span className="text-[#1A2C5B] text-xs font-mono font-bold">{entry.date}</span>
                )}
                {!entry.date && (
                  <span className="text-gray-400 text-xs font-mono italic">Date not specified</span>
                )}
                {entry.page && (
                  <button
                    onClick={() => onPageClick(entry.page!, entry.entry)}
                    className="text-[#2563EB] text-xs font-mono hover:underline hover:text-blue-800 transition-colors"
                  >
                    Page {entry.page}
                  </button>
                )}
                {entry.section && (
                  <span className="text-gray-500 text-xs bg-blue-50 px-1.5 py-0.5 rounded">{entry.section}</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  getCategoryStyle(entry.category)
                }`}>
                  {entry.category}
                </span>
              </div>

              {/* Excerpt */}
              <p className="text-gray-700 text-sm font-mono leading-relaxed">&ldquo;{entry.entry}&rdquo;</p>

              {/* Provider */}
              {entry.provider && (
                <p className="text-gray-500 text-xs mt-1">Provider: {entry.provider}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getCategoryStyle(category: string): string {
  const styles: Record<string, string> = {
    'Musculoskeletal': 'bg-orange-100 text-orange-800',
    'Mental Health': 'bg-purple-100 text-purple-800',
    'Hearing': 'bg-yellow-100 text-yellow-800',
    'Respiratory': 'bg-cyan-100 text-cyan-800',
    'Sleep': 'bg-indigo-100 text-indigo-800',
    'Cardiovascular': 'bg-red-100 text-red-800',
    'Neurological': 'bg-pink-100 text-pink-800',
    'GI': 'bg-lime-100 text-lime-800',
    'Endocrine': 'bg-teal-100 text-teal-800',
    'Genitourinary': 'bg-blue-100 text-blue-800',
    'Dermatological': 'bg-amber-100 text-amber-800',
    'Ophthalmological': 'bg-emerald-100 text-emerald-800',
    'Oncological': 'bg-rose-100 text-rose-800',
  };
  return styles[category] || 'bg-gray-100 text-gray-700';
}
