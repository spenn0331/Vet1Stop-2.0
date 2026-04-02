// @ts-nocheck
'use client';

/**
 * EducationBrowseSection.tsx — MongoDB-powered browse experience for the Education Hub.
 * Tabs: All | Federal | Scholarships | State — search, tag filters, sort, pagination.
 * Uses /api/education/browse which queries educationResources collection.
 * Directly imports BrowseResourceCard from health/components — no new card component needed.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import BrowseResourceCard, {
  BrowseResourceSkeleton,
  readResourcePrefs,
} from '@/app/health/components/BrowseResourceCard';
import type { BrowseResource } from '@/app/health/components/BrowseResourceCard';

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = 'all' | 'federal' | 'ngo' | 'scholarships' | 'state';

const TABS: { id: Tab; label: string; ariaLabel: string }[] = [
  { id: 'all',          label: 'All',          ariaLabel: 'Browse all education resources' },
  { id: 'federal',      label: 'Federal',      ariaLabel: 'Browse VA and federal education programs' },
  { id: 'ngo',          label: 'NGO',          ariaLabel: 'Browse nonprofit and NGO education resources' },
  { id: 'scholarships', label: 'Scholarships', ariaLabel: 'Browse scholarships and grants' },
  { id: 'state',        label: 'State',        ariaLabel: 'Browse state education benefits' },
];

// ─── Tag filter chips ─────────────────────────────────────────────────────────

const TAG_FILTERS = [
  { label: 'GI Bill',       value: 'gi bill' },
  { label: 'Yellow Ribbon', value: 'yellow ribbon' },
  { label: 'STEM',          value: 'stem' },
  { label: 'Vocational',    value: 'vocational' },
  { label: 'Online',        value: 'online' },
  { label: 'Free',          value: 'free' },
  { label: 'Nursing',       value: 'nursing' },
  { label: 'IT / Cyber',    value: 'cybersecurity' },
];

// Used exclusively for the NGO tab — education-focused mega-categories
const NGO_FILTERS = [
  { label: 'Scholarships',          value: 'scholarship',  emoji: '🏆' },
  { label: 'Mentoring & Coaching',  value: 'mentoring',    emoji: '🤝' },
  { label: 'Career & Workforce',    value: 'career',       emoji: '💼' },
  { label: 'Women Veterans',        value: 'women',        emoji: '⭐' },
  { label: 'STEM & Tech',           value: 'stem',         emoji: '🔬' },
  { label: 'Transition Support',    value: 'transition',   emoji: '🪖' },
  { label: 'Free Services Only',    value: 'free',         emoji: '✅' },
];

const SCHOLARSHIP_FILTERS = [
  { label: 'Merit-Based',    value: 'merit', emoji: '🏆' },
  { label: 'Need-Based',     value: 'need-based', emoji: '💛' },
  { label: 'Women Veterans', value: 'women', emoji: '⭐' },
  { label: 'STEM Awards',    value: 'stem', emoji: '🔬' },
  { label: 'Graduate',       value: 'graduate', emoji: '🎓' },
  { label: 'Undergrad',      value: 'undergraduate', emoji: '📚' },
  { label: 'Free / Full Ride', value: 'free', emoji: '✅' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating',    label: 'Highest Rated' },
  { value: 'newest',    label: 'Newest' },
  { value: 'alpha',     label: 'A–Z' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function EducationBrowseSection() {
  const [activeTab, setActiveTab]       = useState<Tab>('all');
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [activeTag, setActiveTag]       = useState('');
  const [sortBy, setSortBy]             = useState('relevance');
  const [page, setPage]                 = useState(1);
  const [resources, setResources]       = useState<BrowseResource[]>([]);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [showSort, setShowSort]         = useState(false);
  const [prefs, setPrefs]               = useState<{ liked: string[]; disliked: string[] }>(() => {
    if (typeof window === 'undefined') return { liked: [], disliked: [] };
    return readResourcePrefs();
  });
  const [dislikeToast, setDislikeToast] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionRef  = useRef<HTMLDivElement>(null);

  // Listen for real-time pref updates from BrowseResourceCard
  useEffect(() => {
    function onPrefUpdate(e: Event) {
      const detail = (e as CustomEvent).detail as { direction: 'liked' | 'disliked' | null };
      setPrefs(readResourcePrefs());
      if (detail.direction === 'disliked') {
        setDislikeToast(true);
        setTimeout(() => setDislikeToast(false), 5000);
      }
    }
    window.addEventListener('vet1stop:pref-update', onPrefUpdate);
    return () => window.removeEventListener('vet1stop:pref-update', onPrefUpdate);
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Reset page on tab/tag/sort change
  useEffect(() => { setPage(1); }, [activeTab, activeTag, sortBy]);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '12', page: String(page), sortBy });
      // 'scholarships' is a virtual tab — API handles the mapping internally
      if (activeTab !== 'all') params.set('subcategory', activeTab);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (activeTag) params.set('tag', activeTag);

      const res = await fetch(`/api/education/browse?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResources(data.resources ?? []);
      setPrefs(readResourcePrefs());
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch (err) {
      setError('Unable to load resources. Please try again.');
      console.error('[EducationBrowseSection]', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, activeTag, sortBy, page]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  // Scroll section top on page change
  useEffect(() => {
    if (page > 1) sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSearch('');
    setDebounced('');
    setActiveTag('');
  }

  const tabCounts: Record<Tab, string> = {
    all:          String(total),
    federal:      activeTab === 'federal'      ? String(total) : '',
    ngo:          activeTab === 'ngo'          ? String(total) : '',
    scholarships: activeTab === 'scholarships' ? String(total) : '',
    state:        activeTab === 'state'        ? String(total) : '',
  };

  // Apply session preference re-ranking: liked float up, disliked sink down
  const rankedResources = [...resources].sort((a, b) => {
    const aL = prefs.liked.includes(a.title),     bL = prefs.liked.includes(b.title);
    const aD = prefs.disliked.includes(a.title),  bD = prefs.disliked.includes(b.title);
    if (aL && !bL) return -1; if (!aL && bL) return 1;
    if (aD && !bD) return 1;  if (!aD && bD) return -1;
    return 0;
  });

  return (
    <section
      ref={sectionRef}
      id="browse-resources"
      aria-labelledby="edu-browse-heading"
      className="py-14 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="edu-browse-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">
              Browse Education Resources
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Explore VA, scholarship, and state education programs directly</p>
          </div>
          {/* Sort control */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowSort(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#1A2C5B] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Change sort order"
              aria-expanded={showSort}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" />
              {SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort'}
            </button>
            {showSort && (
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                      sortBy === opt.value ? 'bg-blue-50 text-[#1A2C5B] font-semibold' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Education resource type filter"
          className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 shadow-sm mb-5 w-full sm:w-auto sm:inline-flex"
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              id={`edu-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls="edu-tabpanel-resources"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                activeTab === tab.id
                  ? 'bg-[#1A2C5B] text-white shadow-sm'
                  : 'text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-50'
              }`}
              aria-label={tab.ariaLabel}
            >
              {tab.label}
              {activeTab === tab.id && tabCounts[tab.id] && !loading && (
                <span className="ml-1.5 text-xs font-normal opacity-75">({tabCounts[tab.id]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search GI Bill, scholarships, STEM, nursing, vocational…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
            aria-label="Search education resources"
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setDebounced(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter chips */}
        {activeTab === 'ngo' ? (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Filter by organization type</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter NGO resources by type">
              {NGO_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setActiveTag(activeTag === f.value ? '' : f.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    activeTag === f.value
                      ? 'bg-[#1A2C5B] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
                  }`}
                  aria-pressed={activeTag === f.value}
                  aria-label={`Filter by ${f.label}`}
                >
                  <span aria-hidden="true">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
              {(activeTag || debouncedSearch) && (
                <button
                  onClick={() => { setActiveTag(''); setSearch(''); setDebounced(''); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label="Clear all filters"
                >
                  <ArrowPathIcon className="h-3 w-3" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
          </div>
        ) : activeTab === 'scholarships' ? (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Filter by scholarship type</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter scholarships by type">
              {SCHOLARSHIP_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setActiveTag(activeTag === f.value ? '' : f.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    activeTag === f.value
                      ? 'bg-[#1A2C5B] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
                  }`}
                  aria-pressed={activeTag === f.value}
                  aria-label={`Filter by ${f.label}`}
                >
                  <span aria-hidden="true">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
              {(activeTag || debouncedSearch) && (
                <button
                  onClick={() => { setActiveTag(''); setSearch(''); setDebounced(''); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label="Clear all filters"
                >
                  <ArrowPathIcon className="h-3 w-3" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by topic">
            {TAG_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setActiveTag(activeTag === f.value ? '' : f.value)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  activeTag === f.value
                    ? 'bg-[#1A2C5B] text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
                }`}
                aria-pressed={activeTag === f.value}
                aria-label={`Filter by ${f.label}`}
              >
                <FunnelIcon className="h-3 w-3" aria-hidden="true" />
                {f.label}
              </button>
            ))}
            {(activeTag || debouncedSearch) && (
              <button
                onClick={() => { setActiveTag(''); setSearch(''); setDebounced(''); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Clear all filters"
              >
                <ArrowPathIcon className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Resource grid */}
        <div
          id="edu-tabpanel-resources"
          role="tabpanel"
          aria-labelledby={`edu-tab-${activeTab}`}
        >
          {error ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-3">{error}</p>
              <button
                onClick={fetchResources}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A2C5B] text-white text-sm font-semibold hover:bg-[#243d7a] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <BrowseResourceSkeleton key={i} />
              ))}
            </div>
          ) : rankedResources.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <MagnifyingGlassIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-gray-500 font-medium">No resources found</p>
              <p className="text-sm text-gray-400 mt-1">Try broadening your search or clearing filters</p>
            </div>
          ) : (
            <>
              {/* Dislike toast — nudge toward MOS Translator */}
              {dislikeToast && (
                <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 shadow-sm">
                  <p className="text-sm text-[#1A2C5B]">
                    👎 Not finding what you need? Try the <strong>School Finder</strong> above for personalized results.
                  </p>
                  <a
                    href="#school-finder"
                    className="flex-shrink-0 text-xs font-bold text-white bg-[#1A2C5B] px-3 py-1.5 rounded-lg hover:bg-[#243d7a] transition-colors"
                  >
                    School Finder
                  </a>
                  <button
                    onClick={() => setDislikeToast(false)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    aria-label="Dismiss"
                  >×</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rankedResources.map((r, i) => (
                  <BrowseResourceCard key={(r._id as string) ?? i} resource={r} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages} · {total} resources
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-[#1A2C5B] hover:text-[#1A2C5B] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-[#1A2C5B] hover:text-[#1A2C5B] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
