import { useState, useCallback, useEffect } from 'react';
import { HealthResource } from '@/types/health';

interface FilterOptions {
  searchTerm?: string;
  category?: string;
  selectedState?: string;
  veteranType?: string;
  serviceBranch?: string;
  eligibility?: string;
  tags?: string[];
  initialConcerns?: string;
  useNeedsBasedAPI?: boolean;
}

interface UseResourceFilteringReturn {
  resources: HealthResource[];
  loading: boolean;
  error: string | null;
  totalResources: number;
  currentPage: number;
  hasMore: boolean;
  setCurrentPage: (page: number) => void;
  fetchResources: () => Promise<void>;
  filterResources: (resources: HealthResource[]) => HealthResource[];
  applyClientSideFilters: (resources: HealthResource[]) => HealthResource[];
}

/**
 * Custom hook for handling resource filtering logic
 * 
 * This hook manages resource fetching, filtering and pagination
 */
export function useResourceFiltering({
  searchTerm = '',
  category = 'all',
  selectedState = '',
  veteranType = 'all',
  serviceBranch = 'all',
  eligibility = 'all',
  tags = [],
  initialConcerns = '',
  useNeedsBasedAPI = false
}: FilterOptions): UseResourceFilteringReturn {
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResources, setTotalResources] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  // Function to apply client-side filtering
  const applyClientSideFilters = useCallback((resources: HealthResource[]): HealthResource[] => {
    return resources.filter(resource => {
      const searchMatch = !searchTerm || 
        resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = category === 'all' || 
        resource.category?.toLowerCase() === category.toLowerCase();
      
      const tagsMatch = tags.length === 0 || 
        tags.some(tag => resource.tags?.includes(tag));
      
      const locationMatch = !resource.location || 
        resource.location?.toLowerCase().includes(selectedState.toLowerCase());
      
      // For state matching (if selected state is set)
      const stateMatch = !selectedState || !resource.location || 
        (resource.location?.includes(selectedState));
      
      // For eligibility check - handle string or array types
      const eligibilityText = typeof resource.eligibility === 'string' 
        ? resource.eligibility
        : Array.isArray(resource.eligibility) 
          ? resource.eligibility.join(' ') 
          : '';
          
      // For veteran type check - handle string or array types
      const veteranTypeText = typeof resource.veteranType === 'string'
        ? resource.veteranType
        : Array.isArray(resource.veteranType)
          ? resource.veteranType.join(' ')
          : '';
      
      const veteranTypeMatch = veteranType === 'all' || 
        resource.veteranType === veteranType ||
        !resource.veteranType ||
        eligibilityText.toLowerCase().includes(veteranType.toLowerCase());
      
      const branchMatch = serviceBranch === 'all' || 
        resource.serviceBranch === serviceBranch ||
        !resource.serviceBranch ||
        eligibilityText.toLowerCase().includes(serviceBranch.toLowerCase());
      
      const eligibilityMatch = eligibility === 'all' || 
        eligibilityText.toLowerCase().includes(eligibility.toLowerCase());
        
      return searchMatch && categoryMatch && locationMatch && tagsMatch && 
             stateMatch && veteranTypeMatch && branchMatch && eligibilityMatch;
    });
  }, [searchTerm, category, tags, selectedState, veteranType, serviceBranch, eligibility]);

  // Fetch resources from API
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/health-resources?';
      const params = new URLSearchParams();
      
      // Add basic filters
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (category && category !== 'all') params.append('category', category);
      
      // Add advanced filters if they're set
      if (selectedState) params.append('state', selectedState);
      if (veteranType && veteranType !== 'all') params.append('veteranType', veteranType);
      if (serviceBranch && serviceBranch !== 'all') params.append('serviceBranch', serviceBranch);
      if (eligibility && eligibility !== 'all') params.append('eligibility', eligibility);
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('limit', '12');
      
      // Add tags if available
      if (tags.length > 0) {
        params.append('tags', tags.join(','));
      }
      
      // If using needs-based navigation, use the dedicated API
      if (useNeedsBasedAPI && initialConcerns) {
        url = '/api/health-needs?';
        params.append('concerns', initialConcerns);
      }
      
      const response = await fetch(`${url}${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching resources: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If response has resources property, use it
      const resourcesData = data.resources || data.data || [];
      
      setResources(resourcesData);
      setTotalResources(data.totalItems || resourcesData.length);
      
      // Calculate if there are more pages
      setHasMore(currentPage < (data.totalPages || 1));
      
    } catch (err) {
      setError(`Failed to fetch resources: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error fetching resources:', err);
    } finally {
      setLoading(false);
    }
  }, [
    searchTerm, 
    category, 
    tags, 
    currentPage, 
    useNeedsBasedAPI, 
    initialConcerns, 
    selectedState, 
    veteranType, 
    serviceBranch, 
    eligibility
  ]);

  // Function to filter resources (for API compatibility)
  const filterResources = useCallback((resources: HealthResource[]): HealthResource[] => {
    return applyClientSideFilters(resources);
  }, [applyClientSideFilters]);

  // Fetch resources when dependencies change
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    totalResources,
    currentPage,
    hasMore,
    setCurrentPage,
    fetchResources,
    filterResources,
    applyClientSideFilters
  };
}

export default useResourceFiltering;
