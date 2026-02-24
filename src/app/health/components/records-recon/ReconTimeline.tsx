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
  onPageClick: (page: number) => void;
}

export default function ReconTimeline({ entries, onPageClick }: ReconTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#94A3B8] text-sm">No dated entries found. Upload records with date stamps for timeline view.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="text-[#F1F5F9] font-bold text-sm mb-4 uppercase tracking-wider">Chronological Timeline</h3>

      {/* Vertical line */}
      <div className="absolute left-4 top-12 bottom-4 w-0.5 bg-gradient-to-b from-[#4ADE80] via-[#38BDF8] to-[#1E293B]" />

      <div className="space-y-3 pl-10">
        {entries.map((entry, i) => {
          const dotColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];
          return (
            <div key={i} className="relative bg-[#111827] rounded-lg p-3 border border-[#1E293B] hover:border-[#38BDF8]/50 transition-colors">
              {/* Timeline dot */}
              <div className={`absolute -left-[26px] top-4 h-3 w-3 rounded-full ${dotColor} ring-2 ring-[#0A0F1A]`} />

              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {entry.date && (
                  <span className="text-[#4ADE80] text-xs font-mono font-bold">{entry.date}</span>
                )}
                {!entry.date && (
                  <span className="text-[#94A3B8] text-xs font-mono italic">Date not specified</span>
                )}
                {entry.page && (
                  <button
                    onClick={() => onPageClick(entry.page!)}
                    className="text-[#38BDF8] text-xs font-mono hover:underline hover:text-[#7DD3FC] transition-colors"
                  >
                    Page {entry.page}
                  </button>
                )}
                {entry.section && (
                  <span className="text-[#94A3B8] text-xs bg-[#1E293B] px-1.5 py-0.5 rounded">{entry.section}</span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  getCategoryStyle(entry.category)
                }`}>
                  {entry.category}
                </span>
              </div>

              {/* Excerpt */}
              <p className="text-[#F1F5F9] text-sm font-mono leading-relaxed">&ldquo;{entry.entry}&rdquo;</p>

              {/* Provider */}
              {entry.provider && (
                <p className="text-[#94A3B8] text-xs mt-1">Provider: {entry.provider}</p>
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
    'Musculoskeletal': 'bg-orange-900/40 text-orange-300',
    'Mental Health': 'bg-purple-900/40 text-purple-300',
    'Hearing': 'bg-yellow-900/40 text-yellow-300',
    'Respiratory': 'bg-cyan-900/40 text-cyan-300',
    'Sleep': 'bg-indigo-900/40 text-indigo-300',
    'Cardiovascular': 'bg-red-900/40 text-red-300',
    'Neurological': 'bg-pink-900/40 text-pink-300',
    'GI': 'bg-lime-900/40 text-lime-300',
    'Endocrine': 'bg-teal-900/40 text-teal-300',
    'Genitourinary': 'bg-blue-900/40 text-blue-300',
    'Dermatological': 'bg-amber-900/40 text-amber-300',
    'Ophthalmological': 'bg-emerald-900/40 text-emerald-300',
    'Oncological': 'bg-rose-900/40 text-rose-300',
  };
  return styles[category] || 'bg-gray-900/40 text-gray-300';
}
