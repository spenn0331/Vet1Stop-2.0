'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  FunnelIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ResourceFiltersProps {
  category: string;
}

type FilterOptions = {
  subcategories: Array<{ id: string; name: string }>;
  sources: Array<{ id: string; name: string }>;
  tags: string[];
};

const ResourceFilters = ({ category }: ResourceFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Local state for form values
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  );

  // Category-specific filter options
  const getFilterOptions = (): FilterOptions => {
    switch (category) {
      case 'education':
        return {
          subcategories: [
            { id: 'gi-bill', name: 'GI Bill' },
            { id: 'scholarships', name: 'Scholarships' },
            { id: 'vocational', name: 'Vocational Training' },
            { id: 'certification', name: 'Certifications' },
            { id: 'tuition-assistance', name: 'Tuition Assistance' },
          ],
          sources: [
            { id: 'va', name: 'Veterans Affairs' },
            { id: 'dod', name: 'Department of Defense' },
            { id: 'nonprofit', name: 'Non-Profit Organizations' },
            { id: 'educational', name: 'Educational Institutions' },
          ],
          tags: [
            'Post-9/11', 'Montgomery', 'Dependents', 'Yellow Ribbon', 
            'Vocational Rehab', 'Online Learning', 'Coding Bootcamps',
            'STEM', 'Healthcare', 'Business', 'Trade Skills'
          ]
        };
      case 'health':
        return {
          subcategories: [
            { id: 'mental-health', name: 'Mental Health' },
            { id: 'physical-health', name: 'Physical Health' },
            { id: 'disability', name: 'Disability Services' },
            { id: 'wellness', name: 'Wellness Programs' },
          ],
          sources: [
            { id: 'va', name: 'Veterans Affairs' },
            { id: 'military', name: 'Military OneSource' },
            { id: 'nonprofit', name: 'Non-Profit Organizations' },
            { id: 'healthcare', name: 'Healthcare Providers' },
          ],
          tags: [
            'PTSD', 'Depression', 'Anxiety', 'Rehabilitation', 
            'Primary Care', 'Specialty Care', 'Telehealth',
            'Fitness', 'Nutrition', 'Support Groups'
          ]
        };
      // Add other categories as needed
      default:
        return {
          subcategories: [],
          sources: [],
          tags: []
        };
    }
  };

  const { subcategories, sources, tags } = getFilterOptions();

  // Handle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search parameters
    if (search) params.set('q', search);
    else params.delete('q');
    
    if (subcategory) params.set('subcategory', subcategory);
    else params.delete('subcategory');
    
    if (source) params.set('source', source);
    else params.delete('source');
    
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    else params.delete('tags');
    
    // Update URL with new search params
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSubcategory('');
    setSource('');
    setSelectedTags([]);
    
    // Reset URL to base path
    router.push(pathname);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2" aria-hidden="true" />
          Filter Resources
        </h3>
        
        {/* Only show clear button if filters are applied */}
        {(search || subcategory || source || selectedTags.length > 0) && (
          <button 
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            aria-label="Clear all filters"
          >
            <XMarkIcon className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear All
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Search Input */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search resources"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>
        
        {/* Subcategory Dropdown */}
        <div className="mb-6">
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            Resource Type
          </label>
          <select
            id="subcategory"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            aria-label="Filter by resource type"
          >
            <option value="">All Types</option>
            {subcategories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Source Dropdown */}
        <div className="mb-6">
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="Filter by source"
          >
            <option value="">All Sources</option>
            {sources.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Tags */}
        <div className="mb-6">
          <p className="block text-sm font-medium text-gray-700 mb-1">
            Topics
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topics">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={selectedTags.includes(tag)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        
        {/* Apply Filters Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          aria-label="Apply filters"
        >
          Apply Filters
        </button>
      </form>
    </div>
  );
};

export default ResourceFilters;
