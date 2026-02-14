import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { FilterState } from '../types/health';

/**
 * Extended filter state that includes additional UI-related properties
 * beyond the base FilterState type
 */
export interface ResourceFilters extends FilterState {
  resourceType: string;
  viewType: 'card' | 'list';
  currentPage: number;
  rating?: number;
  distanceInMiles?: number;
}

export interface FilterCounts {
  total: number;
  active: number;
}

interface UseResourceFiltersProps {
  initialFilters?: Partial<ResourceFilters>;
  syncWithUrl?: boolean;
}

/**
 * Custom hook for managing resource filtering state and logic
 * Centralizes all filtering functionality to improve maintainability
 *
 * @param initialFilters - Optional initial filter values
 * @param syncWithUrl - Whether to sync filter state with URL params (default: true)
 * @returns Filter state and methods to update it
 */
export default function useResourceFilters({ 
  initialFilters, 
  syncWithUrl = true 
}: UseResourceFiltersProps) {
  // Default filter values
  const defaultFilters: ResourceFilters = {
    searchTerm: '',
    category: 'all',
    tags: [],
    location: '',
    selectedState: '',
    veteranType: 'all',
    serviceBranch: 'all',
    eligibility: 'all',
    resourceType: 'all',
    viewType: 'card',
    currentPage: 1,
    rating: undefined,
    distanceInMiles: undefined
  };

  // Initialize with provided defaults or fallbacks
  const [filters, setFilters] = useState<ResourceFilters>({
    ...defaultFilters,
    ...initialFilters
  });

  // Router and search params for URL sync
  const router = useRouter();
  const searchParams = useSearchParams();

  // Compute active filter count
  const getFilterCounts = useCallback((): FilterCounts => {
    const countableKeys: (keyof ResourceFilters)[] = [
      'searchTerm', 'category', 'selectedState', 'veteranType',
      'serviceBranch', 'eligibility', 'resourceType', 'tags'
    ];
    
    const activeFilters = countableKeys.filter(key => {
      const defaultValue = defaultFilters[key];
      const currentValue = filters[key];
      
      if (key === 'searchTerm') {
        return currentValue !== '' && currentValue !== defaultValue;
      }
      
      if (key === 'tags') {
        return Array.isArray(currentValue) && currentValue.length > 0;
      }
      
      if (key === 'rating' || key === 'distanceInMiles') {
        return currentValue !== undefined && currentValue !== defaultValue;
      }
      
      return currentValue !== 'all' && currentValue !== defaultValue && currentValue !== '';
    });
    
    return {
      total: countableKeys.length,
      active: activeFilters.length
    };
  }, [filters]);

  // Update a single filter
  const updateFilter = useCallback(<K extends keyof ResourceFilters>(
    key: K, 
    value: ResourceFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when any filter changes (except pagination)
      ...(key !== 'currentPage' ? { currentPage: 1 } : {})
    }));
  }, []);

  // Reset all filters to default values
  const resetFilters = useCallback(() => {
    setFilters(prev => ({
      ...defaultFilters,
      // Preserve view type when resetting filters
      viewType: prev.viewType
    }));
  }, []);

  // Synchronize filters with URL if needed
  useEffect(() => {
    if (!syncWithUrl) return;

    // Read filters from URL on initial load
    const category = searchParams.get('category') || defaultFilters.category;
    const searchTerm = searchParams.get('q') || defaultFilters.searchTerm;
    const page = Number(searchParams.get('page')) || defaultFilters.currentPage;
    const state = searchParams.get('state') || defaultFilters.selectedState;
    const vType = searchParams.get('veteranType') || defaultFilters.veteranType;
    const branch = searchParams.get('branch') || defaultFilters.serviceBranch;
    const eligible = searchParams.get('eligibility') || defaultFilters.eligibility;
    const resType = searchParams.get('resourceType') || defaultFilters.resourceType;
    const view = (searchParams.get('view') as 'card' | 'list') || defaultFilters.viewType;

    setFilters(prev => ({
      ...prev,
      category,
      searchTerm,
      currentPage: page,
      selectedState: state,
      veteranType: vType,
      serviceBranch: branch,
      eligibility: eligible,
      resourceType: resType,
      viewType: view
    }));
  }, [syncWithUrl, searchParams]);

  // Update URL when filters change
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    
    // Only add non-default values to the URL
    if (filters.category !== defaultFilters.category) {
      params.set('category', filters.category);
    }
    
    if (filters.searchTerm) {
      params.set('q', filters.searchTerm);
    }
    
    if (filters.currentPage > 1) {
      params.set('page', filters.currentPage.toString());
    }
    
    if (filters.selectedState !== defaultFilters.selectedState) {
      params.set('state', filters.selectedState);
    }
    
    if (filters.veteranType !== defaultFilters.veteranType) {
      params.set('veteranType', filters.veteranType);
    }
    
    if (filters.serviceBranch !== defaultFilters.serviceBranch) {
      params.set('branch', filters.serviceBranch);
    }
    
    if (filters.eligibility !== defaultFilters.eligibility) {
      params.set('eligibility', filters.eligibility);
    }
    
    if (filters.resourceType !== defaultFilters.resourceType) {
      params.set('resourceType', filters.resourceType);
    }
    
    if (filters.viewType !== defaultFilters.viewType) {
      params.set('view', filters.viewType);
    }

    // Update URL without refreshing the page
    const url = params.toString() ? `?${params.toString()}` : '';
    router.push(url, { scroll: false });
  }, [filters, router, syncWithUrl]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filterCounts: getFilterCounts(),
    
    // Convenience methods for common updates
    setSearchTerm: (term: string) => updateFilter('searchTerm', term),
    setCategory: (category: string) => updateFilter('category', category),
    setPage: (page: number) => updateFilter('currentPage', page),
    setState: (state: string) => updateFilter('selectedState', state),
    setVeteranType: (type: string) => updateFilter('veteranType', type),
    setServiceBranch: (branch: string) => updateFilter('serviceBranch', branch),
    setEligibility: (eligibility: string) => updateFilter('eligibility', eligibility),
    setResourceType: (type: string) => updateFilter('resourceType', type),
    setViewType: (type: 'card' | 'list') => updateFilter('viewType', type),
    setTags: (tags: string[]) => updateFilter('tags', tags)
  };
}
