'use client';

import { useState, useMemo } from 'react';
import { BUSINESSES, filterBusinesses, ALL_CATEGORIES, ALL_STATES_VOB, CATEGORY_ICONS } from '@/data/businesses';
import type { Business } from '@/data/businesses';
import type { FilterState } from '@/app/local/components/FilterBar';

export type { FilterState };

export interface UseBusinessesReturn {
  businesses: Business[];
  filtered: Business[];
  featured: Business[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  totalCount: number;
  stateCount: number;
  categoryCount: number;
  allCategories: typeof ALL_CATEGORIES;
  allStates: typeof ALL_STATES_VOB;
  categoryIcons: typeof CATEGORY_ICONS;
}

export function useBusinesses(): UseBusinessesReturn {
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    category: '',
    status: '',
    stateCode: '',
    featuredOnly: false,
  });

  const filtered = useMemo(
    () =>
      filterBusinesses({
        category: filters.category || undefined,
        status: filters.status || undefined,
        stateCode: filters.stateCode || undefined,
        keyword: filters.keyword || undefined,
        featuredOnly: filters.featuredOnly,
      }),
    [filters],
  );

  const featured = useMemo(() => BUSINESSES.filter(b => b.featured), []);
  const stateCount = useMemo(() => new Set(BUSINESSES.map(b => b.stateCode)).size, []);

  return {
    businesses: BUSINESSES,
    filtered,
    featured,
    filters,
    setFilters,
    totalCount: BUSINESSES.length,
    stateCount,
    categoryCount: ALL_CATEGORIES.length,
    allCategories: ALL_CATEGORIES,
    allStates: ALL_STATES_VOB,
    categoryIcons: CATEGORY_ICONS,
  };
}
