'use client';

import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { BusinessCategory, VeteranStatus } from '@/data/businesses';
import { ALL_CATEGORIES, ALL_STATES_VOB, CATEGORY_ICONS } from '@/data/businesses';

export interface FilterState {
  keyword: string;
  category: BusinessCategory | '';
  status: VeteranStatus | '';
  stateCode: string;
  featuredOnly: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  totalResults: number;
}

const STATUS_OPTIONS: { label: string; value: VeteranStatus | '' }[] = [
  { label: 'All Statuses', value: '' },
  { label: 'Veteran-Owned', value: 'Veteran-Owned' },
  { label: 'SDVOSB', value: 'Service-Disabled Veteran-Owned' },
  { label: 'Veteran-Friendly', value: 'Veteran-Friendly' },
];

export default function FilterBar({ filters, onChange, totalResults }: FilterBarProps) {
  const hasActiveFilters = filters.keyword || filters.category || filters.status || filters.stateCode || filters.featuredOnly;

  function set(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({ keyword: '', category: '', status: '', stateCode: '', featuredOnly: false });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search businesses, services, or cities..."
          value={filters.keyword}
          onChange={e => set({ keyword: e.target.value })}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white transition-colors"
          aria-label="Search businesses"
        />
        {filters.keyword && (
          <button
            onClick={() => set({ keyword: '' })}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-200">
        {/* Category */}
        <div>
          <label htmlFor="filter-category" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={e => set({ category: e.target.value as BusinessCategory | '' })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="filter-status" className="block text-xs font-semibold text-gray-500 mb-1.5">
            Veteran Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={e => set({ status: e.target.value as VeteranStatus | '' })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label htmlFor="filter-state" className="block text-xs font-semibold text-gray-500 mb-1.5">
            State
          </label>
          <select
            id="filter-state"
            value={filters.stateCode}
            onChange={e => set({ stateCode: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="">All States</option>
            {ALL_STATES_VOB.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Featured toggle + results */}
        <div className="flex flex-col justify-between">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Options
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => set({ featuredOnly: !filters.featuredOnly })}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0 ${
                filters.featuredOnly ? 'bg-[#1A2C5B]' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={filters.featuredOnly}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && set({ featuredOnly: !filters.featuredOnly })}
              aria-label="Show featured businesses only"
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200 ${
                filters.featuredOnly ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
            <span className="text-xs text-gray-600 font-medium">Featured only</span>
          </label>
        </div>
      </div>

      {/* Active filter summary */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-semibold text-[#1A2C5B]">
          {totalResults} {totalResults === 1 ? 'business' : 'businesses'} found
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors focus:outline-none focus:underline"
            aria-label="Clear all filters"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Active filter tags */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.category && (
            <button
              onClick={() => set({ category: '' })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A2C5B]/10 text-[#1A2C5B] hover:bg-[#1A2C5B]/20 transition-colors"
              aria-label={`Remove category filter: ${filters.category}`}
            >
              Category: {filters.category}
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
          {filters.status && (
            <button
              onClick={() => set({ status: '' })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A2C5B]/10 text-[#1A2C5B] hover:bg-[#1A2C5B]/20 transition-colors"
              aria-label={`Remove status filter: ${filters.status}`}
            >
              Status: {filters.status}
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
          {filters.stateCode && (
            <button
              onClick={() => set({ stateCode: '' })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1A2C5B]/10 text-[#1A2C5B] hover:bg-[#1A2C5B]/20 transition-colors"
              aria-label={`Remove state filter: ${filters.stateCode}`}
            >
              State: {filters.stateCode}
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
          {filters.featuredOnly && (
            <button
              onClick={() => set({ featuredOnly: false })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAB308]/15 text-amber-800 hover:bg-[#EAB308]/25 transition-colors"
              aria-label="Remove featured only filter"
            >
              Featured Only
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Category quick-filter pills */}
      <div className="mt-3 flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => set({ category: filters.category === cat ? '' : cat })}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              filters.category === cat
                ? 'bg-[#1A2C5B] text-white border-[#1A2C5B]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
            }`}
            aria-pressed={filters.category === cat}
          >
            <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
