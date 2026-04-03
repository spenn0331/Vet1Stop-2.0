// @ts-nocheck
'use client';

/**
 * MOSTranslatorCard.tsx — Career→Education flywheel mini-tool.
 * On mount: reads vet1stop_sea_bag (Auto-Fill localStorage) → extracts mos field.
 * If found: auto-displays 3 civilian job keywords + "View matching schools" scroll.
 * If not: shows a text input for manual MOS lookup.
 * Static lookup from mos-map.ts — zero API cost.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  BriefcaseIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { lookupMOS, searchMOS } from '@/data/mos-map';
import type { MOSEntry } from '@/data/mos-map';

const SEA_BAG_KEY = 'vet1stop_sea_bag';

// ─── Keyword chip ─────────────────────────────────────────────────────────────

function KeywordChip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1A2C5B]/10 text-[#1A2C5B] text-xs font-semibold">
      <SparklesIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function MOSResult({ entry, onViewSchools }: { entry: MOSEntry; onViewSchools: () => void }) {
  return (
    <div className="mt-4 bg-white rounded-xl border border-[#1A2C5B]/10 p-4 shadow-sm">
      {/* MOS header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-[#1A2C5B] text-white text-xs font-bold mb-1">
            {entry.branch} · {entry.code}
          </span>
          <p className="text-sm font-bold text-[#1A2C5B]">{entry.title}</p>
        </div>
        <ChevronRightIcon className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
      </div>

      {/* Keyword chips */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Civilian Equivalents</p>
        <div className="flex flex-wrap gap-2">
          {entry.keywords.map(kw => <KeywordChip key={kw} text={kw} />)}
        </div>
      </div>

      {/* Suggested degrees */}
      {entry.suggestedDegrees.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggested Degree Fields</p>
          <div className="flex flex-wrap gap-1.5">
            {entry.suggestedDegrees.map(d => (
              <span key={d} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{d}</span>
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={onViewSchools}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A2C5B] text-white text-xs font-bold hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="View matching schools for this MOS"
        >
          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
          View Matching Schools
        </button>
        <a
          href="/careers"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-[#1A2C5B] text-xs font-bold hover:border-[#1A2C5B] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label="See all career resources"
        >
          See All Careers
          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MOSTranslatorCard() {
  const [autoMOS,     setAutoMOS]     = useState<MOSEntry | null>(null);
  const [inputCode,   setInputCode]   = useState('');
  const [manualResult, setManualResult] = useState<MOSEntry | null>(null);
  const [suggestions, setSuggestions] = useState<MOSEntry[]>([]);
  const [isHydrated,  setIsHydrated]  = useState(false);

  // ── Read sea bag on mount ────────────────────────────────────────────────
  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem(SEA_BAG_KEY);
      if (!raw) return;
      const bag = JSON.parse(raw) as Record<string, string>;
      const mosCode = bag.mos || bag.MOS || bag.militaryOccupationalSpecialty || '';
      if (!mosCode) return;
      const found = lookupMOS(mosCode);
      if (found) setAutoMOS(found);
    } catch { /* non-fatal */ }
  }, []);

  // ── Manual input handlers ────────────────────────────────────────────────
  const handleInput = useCallback((val: string) => {
    setInputCode(val);
    setManualResult(null);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    setSuggestions(searchMOS(val).slice(0, 5));
  }, []);

  const handleSelect = useCallback((entry: MOSEntry) => {
    setManualResult(entry);
    setInputCode(entry.code);
    setSuggestions([]);
  }, []);

  const handleViewSchools = useCallback(() => {
    document.getElementById('school-finder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Don't render until hydrated to avoid SSR mismatch
  if (!isHydrated) return null;

  const activeResult = autoMOS || manualResult;

  return (
    <section
      id="mos-translator"
      aria-labelledby="mos-heading"
      className="py-12 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md">
              <BriefcaseIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="mos-heading" className="text-xl font-extrabold text-[#1A2C5B] tracking-tight">MOS Skills Translator</h2>
              <p className="text-sm text-gray-500">Turn your military experience into civilian career keywords</p>
            </div>
          </div>

          {/* Auto-fill banner — shown only when sea bag has MOS data */}
          {autoMOS && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 mb-4">
              <SparklesIcon className="h-4 w-4 text-[#1A2C5B] flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-[#1A2C5B]">
                <span className="font-bold">Auto-filled</span> from your Sea Bag — MOS{' '}
                <span className="font-bold">{autoMOS.code}</span> detected.
              </p>
            </div>
          )}

          {/* Manual lookup (shown when no auto-fill, or as fallback) */}
          {!autoMOS && (
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={inputCode}
                onChange={e => handleInput(e.target.value)}
                placeholder="Enter MOS / Rate / AFSC — e.g. 11B, 68W, IT, 3D0X2…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                aria-label="Enter MOS code or job title"
                aria-autocomplete="list"
                aria-controls="mos-suggestions"
                aria-expanded={suggestions.length > 0}
              />
              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && (
                <ul
                  id="mos-suggestions"
                  role="listbox"
                  className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
                >
                  {suggestions.map(s => (
                    <li key={s.code}>
                      <button
                        onClick={() => handleSelect(s)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                        role="option"
                        aria-selected={false}
                      >
                        <span className="font-bold text-[#1A2C5B]">{s.code}</span>
                        <span className="text-gray-500 ml-2">{s.title}</span>
                        <span className="text-xs text-gray-400 ml-2">({s.branch})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Result */}
          {activeResult && (
            <MOSResult entry={activeResult} onViewSchools={handleViewSchools} />
          )}

          {/* Prompt if no result yet */}
          {!activeResult && !inputCode && (
            <p className="text-xs text-gray-400 mt-2">
              Don&rsquo;t know your MOS? Complete <a href="/health/records-recon" className="text-[#1A2C5B] font-semibold hover:underline">Auto-Fill</a> to have it detected automatically.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
