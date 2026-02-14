'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

interface FilterBannerProps {
  category: string;
}

const FilterBanner = ({ category }: FilterBannerProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get active filters from URL
  const query = searchParams.get('q');
  const subcategory = searchParams.get('subcategory');
  const source = searchParams.get('source');
  const tags = searchParams.get('tags')?.split(',') || [];
  
  // Check if any filters are active
  const hasActiveFilters = query || subcategory || source || tags.length > 0;
  
  // If no filters are active, don't render the banner
  if (!hasActiveFilters) {
    return null;
  }
  
  // Format filter name for display
  const formatName = (key: string, value: string): string => {
    // For subcategory, replace hyphens with spaces and capitalize
    if (key === 'subcategory') {
      return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // For source, replace hyphens with spaces and capitalize
    if (key === 'source') {
      return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Return the value as is for other filters
    return value;
  };
  
  // Remove a single filter
  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === 'tags' && value) {
      // For tags, we need to remove just one tag from the comma-separated list
      const currentTags = params.get('tags')?.split(',') || [];
      const updatedTags = currentTags.filter((tag: string) => tag !== value);
      
      if (updatedTags.length > 0) {
        params.set('tags', updatedTags.join(','));
      } else {
        params.delete('tags');
      }
    } else {
      // For other filters, we remove the entire parameter
      params.delete(key);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    router.push(pathname);
  };
  
  return (
    <div className="bg-gray-100 p-3 rounded-lg mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <FunnelIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          Active Filters
        </h3>
        
        <button 
          onClick={clearAllFilters}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
          aria-label="Clear all filters"
        >
          <XMarkIcon className="h-3 w-3 mr-1" aria-hidden="true" />
          Clear All
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Search Query Badge */}
        {query && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            Search: {query}
            <button 
              onClick={() => removeFilter('q')}
              className="ml-1"
              aria-label={`Remove search filter: ${query}`}
            >
              <XMarkIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
            </button>
          </span>
        )}
        
        {/* Subcategory Badge */}
        {subcategory && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            Type: {formatName('subcategory', subcategory)}
            <button 
              onClick={() => removeFilter('subcategory')}
              className="ml-1"
              aria-label={`Remove type filter: ${formatName('subcategory', subcategory)}`}
            >
              <XMarkIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
            </button>
          </span>
        )}
        
        {/* Source Badge */}
        {source && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            Source: {formatName('source', source)}
            <button 
              onClick={() => removeFilter('source')}
              className="ml-1"
              aria-label={`Remove source filter: ${formatName('source', source)}`}
            >
              <XMarkIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
            </button>
          </span>
        )}
        
        {/* Tags Badges */}
        {tags.map((tag: string) => (
          <span 
            key={tag}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
          >
            Topic: {tag}
            <button 
              onClick={() => removeFilter('tags', tag)}
              className="ml-1"
              aria-label={`Remove topic filter: ${tag}`}
            >
              <XMarkIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default FilterBanner;
