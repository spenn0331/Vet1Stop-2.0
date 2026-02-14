"use client";

import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { ResourceFilterOptions } from '../../types/health-types';
import { 
  RESOURCE_TYPES, 
  VETERAN_TYPES, 
  SERVICE_BRANCHES 
} from '../../utils/health-constants';

interface FilterPanelProps {
  filters: ResourceFilterOptions;
  onFilterChange: (filters: ResourceFilterOptions) => void;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
}

/**
 * FilterPanel Component
 * 
 * A reusable filter panel for health resources with search, category filters,
 * and advanced filtering options.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  showAdvancedFilters = false,
  onToggleAdvancedFilters
}) => {
  // Local state for filter dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Toggle dropdown open/closed
  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  // Handle resource type selection
  const handleResourceTypeChange = (type: string) => {
    const currentTypes = filters.resourceType || [];
    let newTypes: string[];
    
    if (type === 'all') {
      newTypes = ['all'];
    } else if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = ['all'];
    } else {
      newTypes = currentTypes.filter(t => t !== 'all').concat(type);
    }
    
    onFilterChange({
      ...filters,
      resourceType: newTypes
    });
  };

  // Handle veteran type selection
  const handleVeteranTypeChange = (type: string) => {
    const currentTypes = filters.veteranType || [];
    let newTypes: string[];
    
    if (type === 'all') {
      newTypes = ['all'];
    } else if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
      if (newTypes.length === 0) newTypes = ['all'];
    } else {
      newTypes = currentTypes.filter(t => t !== 'all').concat(type);
    }
    
    onFilterChange({
      ...filters,
      veteranType: newTypes
    });
  };

  // Handle service branch selection
  const handleServiceBranchChange = (branch: string) => {
    const currentBranches = filters.serviceBranch || [];
    let newBranches: string[];
    
    if (branch === 'all') {
      newBranches = ['all'];
    } else if (currentBranches.includes(branch)) {
      newBranches = currentBranches.filter(b => b !== branch);
      if (newBranches.length === 0) newBranches = ['all'];
    } else {
      newBranches = currentBranches.filter(b => b !== 'all').concat(branch);
    }
    
    onFilterChange({
      ...filters,
      serviceBranch: newBranches
    });
  };

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating
    });
  };

  // Handle verified only toggle
  const handleVerifiedOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      verifiedOnly: e.target.checked
    });
  };

  // Handle saved only toggle
  const handleSavedOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      savedOnly: e.target.checked
    });
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as 'relevance' | 'rating' | 'name' | 'date'
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFilterChange({
      searchTerm: '',
      resourceType: ['all'],
      veteranType: ['all'],
      serviceBranch: ['all'],
      rating: 0,
      verifiedOnly: false,
      savedOnly: false,
      sortBy: 'relevance'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Search bar */}
      <div className="relative mb-4">
        <input
          type="text"
          value={filters.searchTerm || ''}
          onChange={handleSearchChange}
          placeholder="Search health resources..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#1A2C5B] focus:border-[#1A2C5B] outline-none"
          aria-label="Search health resources"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        
        {filters.searchTerm && (
          <button
            onClick={() => onFilterChange({ ...filters, searchTerm: '' })}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Basic filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Resource type dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('resourceType')}
            className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-expanded={openDropdown === 'resourceType'}
            aria-haspopup="true"
          >
            <span>Resource Type</span>
            {openDropdown === 'resourceType' ? (
              <ChevronUpIcon className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 ml-1" />
            )}
          </button>
          
          {openDropdown === 'resourceType' && (
            <div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-2 max-h-60 overflow-auto">
                {RESOURCE_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center px-2 py-1 hover:bg-gray-100 rounded-md">
                    <input
                      type="checkbox"
                      id={`resource-type-${type.value}`}
                      checked={(filters.resourceType || ['all']).includes(type.value)}
                      onChange={() => handleResourceTypeChange(type.value)}
                      className="h-4 w-4 text-[#1A2C5B] border-gray-300 rounded focus:ring-[#1A2C5B]"
                    />
                    <label
                      htmlFor={`resource-type-${type.value}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sort dropdown */}
        <div className="relative">
          <select
            value={filters.sortBy || 'relevance'}
            onChange={handleSortChange}
            className="appearance-none px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 pr-8"
            aria-label="Sort by"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest Rating</option>
            <option value="name">Name (A-Z)</option>
            <option value="date">Recently Updated</option>
          </select>
          <ChevronDownIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
        
        {/* Advanced filters toggle */}
        {onToggleAdvancedFilters && (
          <button
            onClick={onToggleAdvancedFilters}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            aria-expanded={showAdvancedFilters}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
          </button>
        )}
        
        {/* Clear filters button - only show if filters are applied */}
        {(filters.searchTerm || 
          (filters.resourceType && !filters.resourceType.includes('all')) ||
          (filters.veteranType && !filters.veteranType.includes('all')) ||
          (filters.serviceBranch && !filters.serviceBranch.includes('all')) ||
          filters.rating || 
          filters.verifiedOnly || 
          filters.savedOnly) && (
          <button
            onClick={clearAllFilters}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            aria-label="Clear all filters"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            <span>Clear All</span>
          </button>
        )}
      </div>
      
      {/* Advanced filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Veteran Type filter */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 text-sm">Veteran Type</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {VETERAN_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`veteran-type-${type.value}`}
                      checked={(filters.veteranType || ['all']).includes(type.value)}
                      onChange={() => handleVeteranTypeChange(type.value)}
                      className="h-4 w-4 text-[#1A2C5B] border-gray-300 rounded focus:ring-[#1A2C5B]"
                    />
                    <label
                      htmlFor={`veteran-type-${type.value}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Service Branch filter */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 text-sm">Service Branch</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {SERVICE_BRANCHES.map((branch) => (
                  <div key={branch.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`service-branch-${branch.value}`}
                      checked={(filters.serviceBranch || ['all']).includes(branch.value)}
                      onChange={() => handleServiceBranchChange(branch.value)}
                      className="h-4 w-4 text-[#1A2C5B] border-gray-300 rounded focus:ring-[#1A2C5B]"
                    />
                    <label
                      htmlFor={`service-branch-${branch.value}`}
                      className="ml-2 text-sm text-gray-700 cursor-pointer"
                    >
                      {branch.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional filters */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 text-sm">Additional Filters</h4>
              
              {/* Rating filter */}
              <div className="mb-3">
                <label htmlFor="rating-filter" className="block text-sm text-gray-700 mb-1">
                  Minimum Rating
                </label>
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(rating)}
                      className={`h-8 w-8 flex items-center justify-center rounded-full mr-1 ${
                        (filters.rating || 0) === rating
                          ? 'bg-[#1A2C5B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      aria-label={rating === 0 ? 'Any rating' : `${rating} stars or higher`}
                    >
                      {rating === 0 ? 'Any' : rating}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Verified only toggle */}
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="verified-only"
                  checked={filters.verifiedOnly || false}
                  onChange={handleVerifiedOnlyChange}
                  className="h-4 w-4 text-[#1A2C5B] border-gray-300 rounded focus:ring-[#1A2C5B]"
                />
                <label
                  htmlFor="verified-only"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Verified Resources Only
                </label>
              </div>
              
              {/* Saved only toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saved-only"
                  checked={filters.savedOnly || false}
                  onChange={handleSavedOnlyChange}
                  className="h-4 w-4 text-[#1A2C5B] border-gray-300 rounded focus:ring-[#1A2C5B]"
                />
                <label
                  htmlFor="saved-only"
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  Saved Resources Only
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
