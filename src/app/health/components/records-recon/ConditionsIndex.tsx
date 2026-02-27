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
  onPageClick: (page: number, searchText?: string) => void;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

const CATEGORY_STYLES: Record<string, string> = {
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
        <p className="text-gray-500 text-sm">No conditions indexed. Run a scan to populate the conditions index.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar — sticky */}
      <div className="sticky top-0 bg-white z-10 pb-2 border-b border-gray-100 space-y-2">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conditions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <p className="text-gray-500 text-xs">
          Showing {filtered.length} of {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Conditions List */}
      <div className="space-y-3">
        {filtered.map((cond, i) => {
          const condId = `cond_${i}`;
          return (
            <div key={condId} id={condId} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-900 font-semibold text-sm">{cond.condition}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${CATEGORY_STYLES[cond.category] || 'bg-gray-100 text-gray-700'}`}>
                    {cond.category}
                  </span>
                  <span className="text-[#1A2C5B] text-xs font-mono">
                    {cond.mentionCount} mention{cond.mentionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {cond.pagesFound.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {cond.pagesFound.map(page => (
                        <button
                          key={page}
                          onClick={() => onPageClick(page, cond.excerpts[0]?.text)}
                          className="text-[#2563EB] text-xs font-mono hover:underline hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded"
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
                  <p className="text-gray-500 text-xs font-mono">
                    First noted: {cond.firstMentionDate || 'date not specified'}
                    {cond.firstMentionPage ? ` — page ${cond.firstMentionPage}` : ''}
                  </p>
                </div>
              )}

              {/* Excerpts */}
              {cond.excerpts.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 space-y-2">
                  {cond.excerpts.map((exc, j) => {
                    const excId = `${condId}_exc_${j}`;
                    return (
                      <div key={j} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 text-xs font-mono leading-relaxed">&ldquo;{exc.text}&rdquo;</p>
                          <div className="flex gap-2 mt-0.5">
                            {exc.page && (
                              <button
                                onClick={() => onPageClick(exc.page!, exc.text)}
                                className="text-[#2563EB] text-[10px] font-mono hover:underline"
                              >
                                Page {exc.page}
                              </button>
                            )}
                            {exc.date && <span className="text-gray-500 text-[10px] font-mono">{exc.date}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => onCopy(
                            `${cond.condition}: "${exc.text}"${exc.page ? ` (Page ${exc.page})` : ''}${exc.date ? ` [${exc.date}]` : ''}`,
                            excId
                          )}
                          className="text-gray-400 hover:text-[#1A2C5B] flex-shrink-0 mt-0.5"
                          title="Copy excerpt"
                        >
                          {copiedId === excId
                            ? <CheckIcon className="h-3.5 w-3.5 text-[#1A2C5B]" />
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
