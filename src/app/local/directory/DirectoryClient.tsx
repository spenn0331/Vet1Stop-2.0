'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  ListBulletIcon,
  MapIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  PlusCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

import FilterBar from '../components/FilterBar';
import BusinessCard from '../components/BusinessCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import type { Business } from '@/data/businesses';

// Dynamically import Leaflet map (SSR disabled — requires browser window)
const VOBMap = dynamic(() => import('../components/VOBMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-2xl">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1A2C5B] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

type ViewMode = 'split' | 'list' | 'map';

/* ─── Empty State Component ─── */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-16">
      <MagnifyingGlassIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <p className="text-lg font-semibold text-gray-600 mb-1">No businesses match your filters</p>
      <p className="text-sm text-gray-400 mb-6">Try adjusting your search or clearing filters</p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A2C5B] text-white font-semibold hover:bg-[#2d4d99] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        Clear All Filters
      </button>
    </div>
  );
}

export default function DirectoryClient() {
  const {
    filtered,
    filters,
    setFilters,
    totalCount,
    stateCount,
    categoryCount,
  } = useBusinesses();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  const handleSelect = useCallback(
    (biz: Business) => {
      setSelectedBiz(biz);
      if (viewMode === 'list') setViewMode('split');
    },
    [viewMode],
  );

  const clearAllFilters = useCallback(() => {
    setFilters({ keyword: '', category: '', status: '', stateCode: '', featuredOnly: false });
  }, [setFilters]);

  // Build active filter tags for display
  const activeFilterTags: { label: string; key: string }[] = [];
  if (filters.keyword) activeFilterTags.push({ label: `Search: "${filters.keyword}"`, key: 'keyword' });
  if (filters.category) activeFilterTags.push({ label: `Category: ${filters.category}`, key: 'category' });
  if (filters.status) activeFilterTags.push({ label: `Status: ${filters.status}`, key: 'status' });
  if (filters.stateCode) activeFilterTags.push({ label: `State: ${filters.stateCode}`, key: 'stateCode' });
  if (filters.featuredOnly) activeFilterTags.push({ label: 'Featured Only', key: 'featuredOnly' });

  function removeFilter(key: string) {
    if (key === 'keyword') setFilters({ ...filters, keyword: '' });
    else if (key === 'category') setFilters({ ...filters, category: '' });
    else if (key === 'status') setFilters({ ...filters, status: '' });
    else if (key === 'stateCode') setFilters({ ...filters, stateCode: '' });
    else if (key === 'featuredOnly') setFilters({ ...filters, featuredOnly: false });
  }

  return (
    <main className="bg-gray-50 min-h-screen" role="main">

      {/* ─── Breadcrumb Navigation ─── */}
      <nav
        className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10"
        aria-label="Breadcrumb"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/local"
            className="flex items-center gap-1.5 text-sm font-medium text-[#1A2C5B] hover:text-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Local Hub
          </Link>
          <ol className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            </li>
            <li><ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></li>
            <li>
              <Link href="/local" className="hover:text-[#1A2C5B] transition-colors">Local</Link>
            </li>
            <li><ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" /></li>
            <li className="text-[#1A2C5B] font-medium">Directory</li>
          </ol>
        </div>
      </nav>

      {/* ─── Mini Hero ─── */}
      <section
        aria-labelledby="directory-hero-heading"
        className="bg-gradient-to-br from-[#1A2C5B] to-[#2d4d99] text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-center gap-2 mb-3">
            <BuildingStorefrontIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
            <span className="text-sm font-semibold text-[#EAB308] uppercase tracking-widest">
              VOB Directory
            </span>
          </div>
          <h1
            id="directory-hero-heading"
            className="text-3xl font-bold tracking-tight mb-2"
          >
            Veteran-Owned Business Directory
          </h1>
          <p className="text-blue-100 max-w-2xl mb-4">
            Support those who served. Find veteran-owned businesses by category, location, or name.
          </p>
          <p className="text-blue-200 text-sm">
            {totalCount} Businesses &middot; {stateCount} States &middot; {categoryCount} Categories
          </p>
        </div>
      </section>

      {/* ─── Directory Content ─── */}
      <section aria-labelledby="directory-main-heading" className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="directory-main-heading" className="sr-only">Business Directory</h2>

          {/* FilterBar */}
          <div className="mb-5">
            <FilterBar filters={filters} onChange={setFilters} totalResults={filtered.length} />
          </div>

          {/* Active Filter Tags + Results Summary */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-[#1A2C5B]">
              Showing {filtered.length} of {totalCount} businesses
            </span>
            {activeFilterTags.length > 0 && (
              <>
                <span className="text-gray-300 mx-1">|</span>
                {activeFilterTags.map(tag => (
                  <button
                    key={tag.key}
                    onClick={() => removeFilter(tag.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A2C5B]/10 text-[#1A2C5B] hover:bg-[#1A2C5B]/20 transition-colors"
                    aria-label={`Remove filter: ${tag.label}`}
                  >
                    {tag.label}
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end mb-5">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {([
                { mode: 'split' as ViewMode, Icon: Squares2X2Icon, label: 'Split' },
                { mode: 'list' as ViewMode,  Icon: ListBulletIcon, label: 'List' },
                { mode: 'map' as ViewMode,   Icon: MapIcon,        label: 'Map' },
              ]).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    viewMode === mode
                      ? 'bg-white shadow-sm text-[#1A2C5B]'
                      : 'text-gray-500 hover:text-[#1A2C5B]'
                  }`}
                  aria-pressed={viewMode === mode}
                  aria-label={`${label} view`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Split View (default) ── */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* Business list — 2 cols */}
              <div className="lg:col-span-2 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 scrollbar-thin">
                {filtered.length === 0 ? (
                  <EmptyState onClear={clearAllFilters} />
                ) : (
                  filtered.map(biz => (
                    <BusinessCard
                      key={biz.id}
                      business={biz}
                      isHighlighted={selectedBiz?.id === biz.id}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </div>
              {/* Map — 3 cols */}
              <div className="lg:col-span-3 h-[calc(100vh-200px)] rounded-2xl overflow-hidden shadow-md border border-gray-100 sticky top-20">
                <VOBMap
                  businesses={filtered}
                  highlighted={selectedBiz}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          )}

          {/* ── List View ── */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState onClear={clearAllFilters} />
                </div>
              ) : (
                filtered.map(biz => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    isHighlighted={selectedBiz?.id === biz.id}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>
          )}

          {/* ── Map View ── */}
          {viewMode === 'map' && (
            <div className="relative">
              {/* Floating filter summary overlay */}
              {activeFilterTags.length > 0 && (
                <div className="absolute top-3 left-3 z-[500] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 max-w-xs">
                  <p className="text-xs font-semibold text-[#1A2C5B] mb-1.5">
                    {filtered.length} results
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {activeFilterTags.map(tag => (
                      <span
                        key={tag.key}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1A2C5B]/10 text-[#1A2C5B]"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="h-[calc(100vh-300px)] min-h-[500px] rounded-2xl overflow-hidden shadow-md border border-gray-100">
                <VOBMap
                  businesses={filtered}
                  highlighted={selectedBiz}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── List Your Business CTA ─── */}
      <section aria-labelledby="directory-cta-heading" className="bg-[#1A2C5B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <PlusCircleIcon className="h-6 w-6 text-[#EAB308] flex-shrink-0" aria-hidden="true" />
              <div>
                <h2 id="directory-cta-heading" className="text-lg font-bold">
                  Own a veteran business?
                </h2>
                <p className="text-blue-200 text-sm">
                  Get listed for free and reach thousands of supporters.
                </p>
              </div>
            </div>
            <a
              href="mailto:partners@vet1stop.com?subject=List My Business"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] font-bold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-lg hover:-translate-y-0.5 flex-shrink-0"
            >
              <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
              Get Listed Free
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
