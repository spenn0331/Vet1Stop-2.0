'use client';

import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ReconCondition {
  condition: string;
  category: string;
  firstMentionDate: string | null;
  firstMentionPage: number | null;
  mentionCount: number;
  pagesFound: number[];
  excerpts: Array<{ text: string; page: number | null; date: string | null }>;
}

interface ConditionsIndexProps {
  conditions: ReconCondition[];
  onPageClick: (page: number) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

const CATEGORY_STYLES: Record<string, string> = {
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

export default function ConditionsIndex({ conditions, onPageClick, onCopy, copiedId }: ConditionsIndexProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(conditions.map(c => c.category))).sort();

  // Filter conditions
  const filtered = conditions.filter(c => {
    const matchesSearch = !search || c.condition.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (conditions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#94A3B8] text-sm">No conditions indexed. Run a scan to populate the conditions index.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search conditions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1E293B] rounded-lg pl-9 pr-3 py-2 text-[#F1F5F9] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#4ADE80]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-[#F1F5F9] text-sm focus:outline-none focus:border-[#4ADE80]"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <p className="text-[#94A3B8] text-xs">
        Showing {filtered.length} of {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
      </p>

      {/* Conditions List */}
      <div className="space-y-3">
        {filtered.map((cond, i) => {
          const condId = `cond_${i}`;
          return (
            <div key={condId} id={condId} className="bg-[#111827] rounded-lg border border-[#1E293B] overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#F1F5F9] font-semibold text-sm">{cond.condition}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_STYLES[cond.category] || 'bg-gray-900/40 text-gray-300'}`}>
                    {cond.category}
                  </span>
                  <span className="text-[#4ADE80] text-xs font-mono">
                    {cond.mentionCount} mention{cond.mentionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cond.pagesFound.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {cond.pagesFound.map(page => (
                        <button
                          key={page}
                          onClick={() => onPageClick(page)}
                          className="text-[#38BDF8] text-xs font-mono hover:underline hover:text-[#7DD3FC] bg-[#1E293B] px-1.5 py-0.5 rounded"
                        >
                          p.{page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta */}
              {(cond.firstMentionDate || cond.firstMentionPage) && (
                <div className="px-4 pb-1">
                  <p className="text-[#94A3B8] text-xs font-mono">
                    First noted: {cond.firstMentionDate || 'date not specified'}
                    {cond.firstMentionPage ? ` — page ${cond.firstMentionPage}` : ''}
                  </p>
                </div>
              )}

              {/* Excerpts */}
              {cond.excerpts.length > 0 && (
                <div className="border-t border-[#1E293B] px-4 py-2 space-y-2">
                  {cond.excerpts.map((exc, j) => {
                    const excId = `${condId}_exc_${j}`;
                    return (
                      <div key={j} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#F1F5F9] text-xs font-mono leading-relaxed">&ldquo;{exc.text}&rdquo;</p>
                          <div className="flex gap-2 mt-0.5">
                            {exc.page && (
                              <button
                                onClick={() => onPageClick(exc.page!)}
                                className="text-[#38BDF8] text-[10px] font-mono hover:underline"
                              >
                                Page {exc.page}
                              </button>
                            )}
                            {exc.date && <span className="text-[#94A3B8] text-[10px] font-mono">{exc.date}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => onCopy(
                            `${cond.condition}: "${exc.text}"${exc.page ? ` (Page ${exc.page})` : ''}${exc.date ? ` [${exc.date}]` : ''}`,
                            excId
                          )}
                          className="text-[#94A3B8] hover:text-[#4ADE80] flex-shrink-0 mt-0.5"
                          title="Copy excerpt"
                        >
                          {copiedId === excId
                            ? <CheckIcon className="h-3.5 w-3.5 text-[#4ADE80]" />
                            : <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          }
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
