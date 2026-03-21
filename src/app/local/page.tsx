'use client';

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPinIcon,
  ListBulletIcon,
  MapIcon,
  BuildingStorefrontIcon,
  PlusCircleIcon,
  StarIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';

import FilterBar, { type FilterState } from './components/FilterBar';
import BusinessCard from './components/BusinessCard';
import RealEstatePanel from './components/RealEstatePanel';
import { BUSINESSES, filterBusinesses, type Business } from '@/data/businesses';

// Dynamically import Leaflet map (SSR disabled — requires browser window)
const VOBMap = dynamic(() => import('./components/VOBMap'), {
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

const TRUST_STATS = [
  { Icon: BuildingStorefrontIcon, label: '25+ Verified VOBs' },
  { Icon: ShieldCheckIcon,        label: 'SDVOSB Certified Partners' },
  { Icon: StarIcon,               label: '4.8 Avg Rating' },
  { Icon: CheckBadgeIcon,         label: 'VetBiz Verified Listings' },
];

export default function LocalPage() {
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    category: '',
    status: '',
    stateCode: '',
    featuredOnly: false,
  });
  const [viewMode, setViewMode]       = useState<ViewMode>('split');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  const filtered = useMemo(
    () =>
      filterBusinesses({
        category:     filters.category || undefined,
        status:       filters.status   || undefined,
        stateCode:    filters.stateCode || undefined,
        keyword:      filters.keyword  || undefined,
        featuredOnly: filters.featuredOnly,
      }),
    [filters],
  );

  const featured = useMemo(() => BUSINESSES.filter(b => b.featured), []);

  const handleSelect = useCallback((biz: Business) => {
    setSelectedBiz(biz);
    if (viewMode === 'list') setViewMode('split');
  }, [viewMode]);

  return (
    <main className="bg-gray-50 min-h-screen" role="main">

      {/* ─── Hero ─── */}
      <section
        aria-labelledby="local-hero-heading"
        className="bg-gradient-to-br from-[#0F1D3D] via-[#1A2C5B] to-[#1e3a7a] text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#EAB308]/5 rounded-full translate-x-24 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-x-16 translate-y-12" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPinIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#EAB308] uppercase tracking-widest">Local VOB Directory</span>
            </div>
            <h1 id="local-hero-heading" className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Support Veteran<br />
              <span className="text-[#EAB308]">Owned Businesses Near You.</span>
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl leading-relaxed">
              Find and support verified veteran-owned businesses across the country. From coffee shops to HVAC contractors — every purchase supports a veteran entrepreneur.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#directory"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] text-[#0F1D3D] font-bold hover:bg-[#FACC15] focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all shadow-lg hover:-translate-y-0.5"
              >
                <MapPinIcon className="h-5 w-5" aria-hidden="true" />
                Find Businesses
              </a>
              <a
                href="#real-estate"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all backdrop-blur-sm"
              >
                <HomeModernIcon className="h-5 w-5" aria-hidden="true" />
                VA Home Loans
              </a>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all backdrop-blur-sm"
                onClick={() => document.getElementById('list-your-biz')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
                List My Business
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Banner ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5">
          {TRUST_STATS.map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Featured Businesses ─── */}
      <section aria-labelledby="featured-heading" className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="featured-heading" className="text-xl font-extrabold text-[#1A2C5B]">Featured Businesses</h2>
              <p className="text-sm text-gray-500">Verified veteran-owned partners across the country</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(biz => (
              <BusinessCard
                key={biz.id}
                business={biz}
                isHighlighted={selectedBiz?.id === biz.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Main Directory ─── */}
      <section id="directory" aria-labelledby="directory-heading" className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 id="directory-heading" className="text-xl font-extrabold text-[#1A2C5B]">Business Directory</h2>
              <p className="text-sm text-gray-500">Search and filter all {BUSINESSES.length} verified listings</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              {(
                [
                  { mode: 'split', Icon: MapIcon,          label: 'Split' },
                  { mode: 'list',  Icon: ListBulletIcon,   label: 'List'  },
                  { mode: 'map',   Icon: MapPinIcon,       label: 'Map'   },
                ] as const
              ).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    viewMode === mode
                      ? 'bg-[#1A2C5B] text-white'
                      : 'text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-50'
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

          {/* Filters */}
          <div className="mb-5">
            <FilterBar filters={filters} onChange={setFilters} totalResults={filtered.length} />
          </div>

          {/* Split / Map / List layout */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* List side */}
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <BuildingStorefrontIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No businesses match your filters</p>
                    <p className="text-sm">Try clearing some filters to see more results</p>
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
              {/* Map side */}
              <div className="h-[75vh] rounded-2xl overflow-hidden shadow-md border border-gray-100 sticky top-4">
                <VOBMap
                  businesses={filtered}
                  highlighted={selectedBiz}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <BuildingStorefrontIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No businesses match your filters</p>
                  <p className="text-sm">Try clearing some filters to see more results</p>
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

          {viewMode === 'map' && (
            <div className="h-[80vh] rounded-2xl overflow-hidden shadow-md border border-gray-100">
              <VOBMap
                businesses={filtered}
                highlighted={selectedBiz}
                onSelect={handleSelect}
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── Real Estate / Golden Goose ─── */}
      <RealEstatePanel />

      {/* ─── List Your Business CTA ─── */}
      <section
        id="list-your-biz"
        aria-labelledby="list-biz-heading"
        className="py-14 bg-white border-t border-gray-100"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#1A2C5B]/5 flex items-center justify-center mx-auto mb-5">
            <PlusCircleIcon className="h-7 w-7 text-[#1A2C5B]" aria-hidden="true" />
          </div>
          <h2 id="list-biz-heading" className="text-2xl font-extrabold text-[#1A2C5B] mb-3">
            Own a Veteran Business?
          </h2>
          <p className="text-gray-600 mb-2 max-w-xl mx-auto leading-relaxed">
            List your veteran-owned or service-disabled veteran-owned business in the Vet1Stop directory. Reach thousands of veterans, military families, and consumers who actively seek to support VOBs.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Basic listings are free. Featured placement available for verified SDVOSB and VetBiz-certified businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:partners@vet1stop.com?subject=List My Business"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1A2C5B] text-white font-extrabold hover:bg-[#2d4d99] focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-lg hover:-translate-y-0.5"
            >
              <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
              Submit My Business
            </a>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckBadgeIcon className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              VetBiz verification required
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Free Basic Listing', desc: 'Name, category, contact info, and description visible to all visitors.' },
              { title: 'Featured Placement', desc: 'Pin to top of category and map. Starting at $250/month for SDVOSB-certified.' },
              { title: 'Verified Badge', desc: 'Gold SDVOSB or Veteran-Owned badge added after VetBiz/CVE verification review.' },
            ].map(item => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <h3 className="text-sm font-extrabold text-[#1A2C5B] mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Explore Related ─── */}
      <section aria-labelledby="local-related-heading" className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="local-related-heading" className="text-xl font-extrabold text-[#1A2C5B] mb-6 text-center">
            Explore More Vet1Stop Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/careers"
              className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <BuildingStorefrontIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Careers</h3>
              <p className="text-center text-sm text-gray-500">MOS translation, job board, and federal hiring tools</p>
            </Link>
            <Link
              href="/education"
              className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <MapIcon className="h-10 w-10 text-[#1A2C5B] mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Education</h3>
              <p className="text-center text-sm text-gray-500">GI Bill calculator, school finder, and scholarship tools</p>
            </Link>
            <Link
              href="/health"
              className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ShieldCheckIcon className="h-10 w-10 text-[#EAB308] mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-[#1A2C5B] mb-1">Health</h3>
              <p className="text-center text-sm text-gray-500">Symptom finder, records recon, and wellness tools</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
