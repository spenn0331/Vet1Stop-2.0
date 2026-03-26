'use client';

/**
 * SchoolFinderPanel.tsx — Inline School Finder panel for the Education Hub.
 * Filters: state, Yellow Ribbon toggle, degree type.
 * Comparison mode: select up to 3 schools for side-by-side comparison table.
 * Smart Bridge: "Analyze in GI Bill Pathfinder →" scrolls to #gi-bill and writes
 *   vet1stop_edu_bridge_data to localStorage.
 * Rate limiting: useFreeTierUsage('school_compare_daily', 5) — 5/day free, Premium unlimited.
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon,
  FunnelIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid, CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import { SCHOOLS, ALL_STATES, filterSchools } from '@/data/schools';
import type { School, DegreeType } from '@/data/schools';
import { EDU_BRIDGE_KEY } from '@/types/education-bridge';
import { useFreeTierUsage } from '@/lib/useFreeTierUsage';
import { isPremium } from '@/lib/premium';

const DEV_UNLOCKED = process.env.NEXT_PUBLIC_DEV_PREMIUM === 'true';

const DEGREE_TYPES: { label: string; value: DegreeType | '' }[] = [
  { label: 'All Degrees',  value: '' },
  { label: "Bachelor's",   value: 'Bachelor' },
  { label: "Master's",     value: 'Master' },
  { label: 'Doctoral',     value: 'Doctoral' },
  { label: "Associate's",  value: 'Associate' },
  { label: 'Certificate',  value: 'Certificate' },
];

// ─── Star rating display ───────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: full  }).map((_, i) => <StarSolid   key={`f${i}`} className="h-3.5 w-3.5 text-[#EAB308]" />)}
      {half && <StarIcon className="h-3.5 w-3.5 text-[#EAB308]" />}
      {Array.from({ length: empty }).map((_, i) => <StarIcon     key={`e${i}`} className="h-3.5 w-3.5 text-gray-300" />)}
      <span className="ml-1 text-xs text-gray-500 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}

// ─── Comparison row helper ────────────────────────────────────────────────────

function CompareRow({ label, values, highlight }: {
  label: string;
  values: (string | React.ReactNode)[];
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? 'bg-emerald-50' : 'bg-white even:bg-gray-50'}>
      <td className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap w-40">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`px-4 py-3 text-sm text-center font-medium ${highlight ? 'text-emerald-700' : 'text-[#1A2C5B]'}`}>{v}</td>
      ))}
      {/* Fill remaining columns if fewer than 3 schools */}
      {Array.from({ length: Math.max(0, 3 - values.length) }).map((_, i) => (
        <td key={`empty-${i}`} className="px-4 py-3" />
      ))}
    </tr>
  );
}

// ─── School card ──────────────────────────────────────────────────────────────

interface SchoolCardProps {
  school: School;
  isSelected: boolean;
  canSelect: boolean;
  onToggleSelect: (school: School) => void;
}

function SchoolCard({ school, isSelected, canSelect, onToggleSelect }: SchoolCardProps) {
  const isPrivate = school.tuitionInState === school.tuitionOutState;
  const yrLabel   = school.yellowRibbonMaxAmt === 0
    ? 'Unlimited YR'
    : school.yellowRibbon
      ? `YR: $${(school.yellowRibbonMaxAmt ?? 0).toLocaleString()}/yr`
      : 'No Yellow Ribbon';

  return (
    <div className={`relative bg-white rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
      isSelected ? 'border-[#1A2C5B] ring-2 ring-[#1A2C5B]/20' : 'border-gray-100'
    }`}>
      {/* Selection toggle */}
      <button
        onClick={() => onToggleSelect(school)}
        disabled={!isSelected && !canSelect}
        className={`absolute top-3 right-3 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed ${
          isSelected
            ? 'border-[#1A2C5B] bg-[#1A2C5B]'
            : 'border-gray-300 bg-white hover:border-[#1A2C5B]'
        }`}
        aria-label={isSelected ? `Deselect ${school.name}` : `Compare ${school.name}`}
        aria-pressed={isSelected}
      >
        {isSelected && <CheckSolid className="h-4 w-4 text-white" aria-hidden="true" />}
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="mb-3 pr-8">
          <h3 className="text-sm font-extrabold text-[#1A2C5B] leading-snug">{school.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{school.city}, {school.stateCode}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {school.yellowRibbon && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              school.yellowRibbonMaxAmt === 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
              <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
              {yrLabel}
            </span>
          )}
          {school.online && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
              <GlobeAltIcon className="h-3 w-3" aria-hidden="true" />
              Online
            </span>
          )}
        </div>

        {/* Key metrics */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Tuition (in-state)</span>
            <span className="font-bold text-[#1A2C5B]">${school.tuitionInState.toLocaleString()}/yr</span>
          </div>
          {!isPrivate && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Out-of-state</span>
              <span className="font-medium text-gray-700">${school.tuitionOutState.toLocaleString()}/yr</span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Graduation rate</span>
            <span className="font-bold text-[#1A2C5B]">{school.graduationRate}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Avg loan debt</span>
            <span className="font-medium text-gray-700">${school.avgDebt.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <StarRating rating={school.veteranServicesRating} />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{school.description}</p>

        {/* Degree chips */}
        <div className="flex flex-wrap gap-1 mb-4">
          {school.degrees.map(d => (
            <span key={d} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{d}</span>
          ))}
        </div>

        <a
          href={school.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
          aria-label={`Visit ${school.name} website`}
        >
          Visit Website
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SchoolFinderPanel() {
  const router = useRouter();
  const [stateFilter,   setStateFilter]   = useState('');
  const [yrOnly,        setYrOnly]         = useState(false);
  const [degreeFilter,  setDegreeFilter]  = useState<DegreeType | ''>('');
  const [keyword,       setKeyword]       = useState('');
  const [selected,      setSelected]      = useState<School[]>([]);
  const [showCompare,   setShowCompare]   = useState(false);
  const [bridgeSent,    setBridgeSent]    = useState(false);

  const compareUsage = useFreeTierUsage('school_compare_daily', 5);

  const filtered = filterSchools({
    state:           stateFilter || undefined,
    yellowRibbonOnly: yrOnly,
    degreeType:       degreeFilter || undefined,
    keyword:          keyword || undefined,
  });

  const handleToggleSelect = useCallback((school: School) => {
    setSelected(prev => {
      const already = prev.some(s => s.id === school.id);
      if (already) return prev.filter(s => s.id !== school.id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, school];
    });
    setBridgeSent(false);
  }, []);

  const handleCompare = useCallback(() => {
    if (!DEV_UNLOCKED && !isPremium() && !compareUsage.canUse) return;
    compareUsage.increment();
    setShowCompare(true);
    setTimeout(() => {
      document.getElementById('school-comparison-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [compareUsage]);

  const handleBridgeToGiBill = useCallback((school: School) => {
    const payload = {
      school: {
        name:    school.name,
        tuition: school.tuitionOutState,
        state:   school.state,
      },
      timestamp: new Date().toISOString(),
    };
    try { localStorage.setItem(EDU_BRIDGE_KEY, JSON.stringify(payload)); } catch { /* non-fatal */ }
    setBridgeSent(true);
    router.push('/education/gi-bill');
  }, [router]);

  return (
    <section
      id="school-finder"
      aria-labelledby="school-finder-heading"
      className="py-14 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-[#1A2C5B] flex items-center justify-center shadow-md">
              <AcademicCapIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            </div>
            <div>
              <h2 id="school-finder-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">School Finder</h2>
              <p className="text-sm text-gray-500">Filter, compare, and bridge to the GI Bill calculator</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-600">Filter Schools</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* State */}
            <div>
              <label htmlFor="school-state" className="block text-xs font-semibold text-gray-500 mb-1.5">State</label>
              <select
                id="school-state"
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="">All States</option>
                {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Degree */}
            <div>
              <label htmlFor="school-degree" className="block text-xs font-semibold text-gray-500 mb-1.5">Degree Type</label>
              <select
                id="school-degree"
                value={degreeFilter}
                onChange={e => setDegreeFilter(e.target.value as DegreeType | '')}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                {DEGREE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Keyword search */}
            <div>
              <label htmlFor="school-keyword" className="block text-xs font-semibold text-gray-500 mb-1.5">Search</label>
              <input
                id="school-keyword"
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="School name, city, program…"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {/* Yellow Ribbon toggle */}
            <div className="flex items-end pb-0.5">
              <button
                onClick={() => setYrOnly(v => !v)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  yrOnly
                    ? 'bg-[#1A2C5B] text-white border-[#1A2C5B] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
                }`}
                aria-pressed={yrOnly}
              >
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                Yellow Ribbon Only
              </button>
            </div>
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 tabular-nums">
              Showing <strong className="text-[#1A2C5B]">{filtered.length}</strong> of {SCHOOLS.length} schools
            </p>
            {(stateFilter || yrOnly || degreeFilter || keyword) && (
              <button
                onClick={() => { setStateFilter(''); setYrOnly(false); setDegreeFilter(''); setKeyword(''); }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors focus:outline-none"
                aria-label="Clear all filters"
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* School grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
            <AcademicCapIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-500 font-medium">No schools match your filters</p>
            <p className="text-sm text-gray-400 mt-1">Try broadening your search</p>
          </div>
        ) : (
          <>
            {/* Compare toolbar */}
            {selected.length > 0 && (
              <div className="bg-[#1A2C5B] rounded-2xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <TableCellsIcon className="h-5 w-5 text-[#EAB308] flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      {selected.length} school{selected.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-white/60">
                      {selected.map(s => s.name.split(' ').slice(0, 2).join(' ')).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selected.length >= 2 && (
                    <button
                      onClick={handleCompare}
                      disabled={!DEV_UNLOCKED && !isPremium() && !compareUsage.canUse}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAB308] text-[#1A2C5B] text-sm font-bold hover:bg-[#FACC15] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-300"
                      aria-label="Compare selected schools"
                    >
                      <TableCellsIcon className="h-4 w-4" aria-hidden="true" />
                      Compare Side-by-Side
                    </button>
                  )}
                  {selected.length === 1 && (
                    <button
                      onClick={() => handleBridgeToGiBill(selected[0])}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      aria-label={`Analyze ${selected[0].name} in GI Bill Pathfinder`}
                    >
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                      {bridgeSent ? 'Sent to GI Bill ↓' : 'Analyze in GI Bill Pathfinder →'}
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected([]); setShowCompare(false); setBridgeSent(false); }}
                    className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label="Clear selection"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {!DEV_UNLOCKED && !isPremium() && (
                  <p className="text-xs text-white/50 text-right tabular-nums">
                    {compareUsage.canUse
                      ? `${compareUsage.remaining} of ${compareUsage.dailyLimit} free comparisons remaining today`
                      : 'Daily limit reached — resets at midnight'}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filtered.map(school => (
                <SchoolCard
                  key={school.id}
                  school={school}
                  isSelected={selected.some(s => s.id === school.id)}
                  canSelect={selected.length < 3}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>

            {/* Comparison table */}
            {showCompare && selected.length >= 2 && (
              <div id="school-comparison-table" className="bg-white rounded-2xl border border-[#1A2C5B]/20 shadow-md overflow-hidden mb-8">
                <div className="px-6 py-4 bg-[#1A2C5B] flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <TableCellsIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
                    Side-by-Side Comparison
                  </h3>
                  <button
                    onClick={() => setShowCompare(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label="Close comparison"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">Metric</th>
                        {selected.map(s => (
                          <th key={s.id} className="px-4 py-3 text-center">
                            <p className="font-extrabold text-[#1A2C5B] text-sm leading-snug">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.city}, {s.stateCode}</p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <CompareRow
                        label="In-State Tuition"
                        values={selected.map(s => `$${s.tuitionInState.toLocaleString()}/yr`)}
                      />
                      <CompareRow
                        label="Out-of-State"
                        values={selected.map(s => `$${s.tuitionOutState.toLocaleString()}/yr`)}
                      />
                      <CompareRow
                        label="Yellow Ribbon"
                        values={selected.map(s =>
                          !s.yellowRibbon ? '✗ None' :
                          s.yellowRibbonMaxAmt === 0 ? '✓ Unlimited' :
                          `✓ $${s.yellowRibbonMaxAmt!.toLocaleString()}/yr`
                        )}
                        highlight
                      />
                      <CompareRow
                        label="Grad Rate"
                        values={selected.map(s => `${s.graduationRate}%`)}
                      />
                      <CompareRow
                        label="Avg Loan Debt"
                        values={selected.map(s => `$${s.avgDebt.toLocaleString()}`)}
                      />
                      <CompareRow
                        label="Vet Services"
                        values={selected.map(s => <StarRating key={s.id} rating={s.veteranServicesRating} />)}
                      />
                      <CompareRow
                        label="Online Options"
                        values={selected.map(s => s.online ? '✓ Yes' : '–')}
                      />
                      <CompareRow
                        label="Degrees Offered"
                        values={selected.map(s => s.degrees.join(', '))}
                      />
                    </tbody>
                  </table>
                </div>

                {/* Bridge buttons below comparison */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3">
                  <p className="text-xs text-gray-500 w-full mb-1">Analyze tuition &amp; BAH for a specific school:</p>
                  {selected.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleBridgeToGiBill(s)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      aria-label={`Analyze ${s.name} in GI Bill Pathfinder`}
                    >
                      <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {s.name.split(' ').slice(0, 3).join(' ')} → GI Bill
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Helper text */}
        <p className="text-xs text-gray-400 text-center mt-4">
          Select up to 3 schools for side-by-side comparison. Use &ldquo;Analyze in GI Bill Pathfinder&rdquo; to calculate your monthly net income for any school.
        </p>
      </div>
    </section>
  );
}
