"use client";

import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/solid';
import { FilterOptions } from '../types/HealthResourceTypes';

// Define available categories, service types, branches, and eras
const CATEGORIES = [
  'Mental Health', 
  'Physical Health', 
  'Specialized Care', 
  'Preventive Care',
  'Family Support',
  'Crisis Services',
  'Rehabilitation',
  'Telehealth'
];

const SERVICE_TYPES = [
  'Counseling',
  'Treatment',
  'Support Groups',
  'Peer Support',
  'Therapy',
  'Medication',
  'Wellness Programs',
  'Screening',
  'Education'
];

const SERVICE_BRANCHES = [
  'Army',
  'Navy',
  'Air Force',
  'Marines',
  'Coast Guard',
  'Space Force',
  'National Guard',
  'Reserves'
];

const VETERAN_ERAS = [
  'Post-9/11',
  'Gulf War',
  'Vietnam Era',
  'Korean War',
  'World War II',
  'Peacetime',
  'Cold War'
];

interface NGOResourceFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onSearch: (searchTerm: string) => void;
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

const NGOResourceFilters: React.FC<NGOResourceFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  isMobile = false,
  onCloseMobile
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    serviceTypes: true,
    serviceBranches: false,
    veteranEras: false
  });

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle checkbox change for array filters
  const handleArrayFilterChange = (
    filterName: 'categories' | 'serviceTypes' | 'serviceBranches' | 'veteranEras',
    value: string
  ) => {
    const currentValues = filters[filterName] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({
      ...filters,
      [filterName]: newValues
    });
  };

  // Handle rating change
  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating
    });
  };

  // Handle toggle filters
  const handleToggleFilter = (filterName: 'veteranLed' | 'onlyVerified') => {
    onFilterChange({
      ...filters,
      [filterName]: !filters[filterName]
    });
  };

  // Handle sort change
  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    onFilterChange({
      ...filters,
      sortBy
    });
  };

  // Reset all filters
  const resetFilters = () => {
    onFilterChange({
      categories: [],
      serviceTypes: [],
      serviceBranches: [],
      veteranEras: [],
      rating: 0,
      veteranLed: false,
      onlyVerified: false,
      sortBy: 'relevance',
      searchTerm: ''
    });
    setSearchTerm('');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${isMobile ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      {/* Mobile Header */}
      {isMobile && onCloseMobile && (
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-bold text-blue-900">Filter Resources</h2>
          <button 
            onClick={onCloseMobile}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <button 
            type="submit"
            className="absolute right-2 top-2 bg-blue-900 text-white p-1 rounded-md hover:bg-blue-800"
          >
            <span className="sr-only">Search</span>
            <MagnifyingGlassIcon className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Categories Section */}
        <div className="border-b pb-3">
          <button 
            onClick={() => toggleSection('categories')}
            className="flex justify-between items-center w-full text-left font-medium text-blue-900"
          >
            <span>Categories</span>
            {expandedSections.categories ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          {expandedSections.categories && (
            <div className="mt-2 space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onChange={() => handleArrayFilterChange('categories', category)}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Types Section */}
        <div className="border-b pb-3">
          <button 
            onClick={() => toggleSection('serviceTypes')}
            className="flex justify-between items-center w-full text-left font-medium text-blue-900"
          >
            <span>Service Types</span>
            {expandedSections.serviceTypes ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          {expandedSections.serviceTypes && (
            <div className="mt-2 space-y-2">
              {SERVICE_TYPES.map((type) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`service-${type}`}
                    checked={filters.serviceTypes?.includes(type) || false}
                    onChange={() => handleArrayFilterChange('serviceTypes', type)}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`service-${type}`} className="ml-2 text-sm text-gray-700">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Branches Section */}
        <div className="border-b pb-3">
          <button 
            onClick={() => toggleSection('serviceBranches')}
            className="flex justify-between items-center w-full text-left font-medium text-blue-900"
          >
            <span>Service Branches</span>
            {expandedSections.serviceBranches ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          {expandedSections.serviceBranches && (
            <div className="mt-2 space-y-2">
              {SERVICE_BRANCHES.map((branch) => (
                <div key={branch} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`branch-${branch}`}
                    checked={filters.serviceBranches?.includes(branch) || false}
                    onChange={() => handleArrayFilterChange('serviceBranches', branch)}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`branch-${branch}`} className="ml-2 text-sm text-gray-700">
                    {branch}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Veteran Eras Section */}
        <div className="border-b pb-3">
          <button 
            onClick={() => toggleSection('veteranEras')}
            className="flex justify-between items-center w-full text-left font-medium text-blue-900"
          >
            <span>Veteran Eras</span>
            {expandedSections.veteranEras ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          
          {expandedSections.veteranEras && (
            <div className="mt-2 space-y-2">
              {VETERAN_ERAS.map((era) => (
                <div key={era} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`era-${era}`}
                    checked={filters.veteranEras?.includes(era) || false}
                    onChange={() => handleArrayFilterChange('veteranEras', era)}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`era-${era}`} className="ml-2 text-sm text-gray-700">
                    {era}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="border-b pb-3">
          <h3 className="font-medium text-blue-900 mb-2">Minimum Rating</h3>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className={`p-1 rounded-md ${
                  filters.rating >= star ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </button>
            ))}
            {filters.rating > 0 && (
              <button 
                onClick={() => handleRatingChange(0)} 
                className="ml-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="space-y-2 border-b pb-3">
          <div className="flex items-center justify-between">
            <label htmlFor="veteran-led" className="text-sm text-gray-700">Veteran-Led Organizations</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="veteran-led"
                checked={filters.veteranLed}
                onChange={() => handleToggleFilter('veteranLed')}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${filters.veteranLed ? 'bg-blue-900' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${filters.veteranLed ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="verified-only" className="text-sm text-gray-700">Verified Resources Only</label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none">
              <input
                type="checkbox"
                id="verified-only"
                checked={filters.onlyVerified}
                onChange={() => handleToggleFilter('onlyVerified')}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${filters.onlyVerified ? 'bg-blue-900' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${filters.onlyVerified ? 'translate-x-4' : ''}`}></div>
            </div>
          </div>
        </div>

        {/* Sort By */}
        <div className="pb-3">
          <h3 className="font-medium text-blue-900 mb-2">Sort By</h3>
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'])}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="relevance">Relevance</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Reset Filters */}
        <button
          onClick={resetFilters}
          className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default NGOResourceFilters;
