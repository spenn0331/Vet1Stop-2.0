"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import { HealthResource } from '../types/HealthResourceTypes';
import { RequestInfoFormData } from '../types/HealthResourceTypes';
import { filterResources, sortResources, normalizeResources } from '../utils/health-utils';
import { COLORS, PAGINATION } from '../utils/health-constants';
import FilterPanel from './shared/FilterPanel';
import ResourceGrid from './shared/ResourceGrid';
import Pagination from './shared/Pagination';
import ResourceDetailView from './shared/ResourceDetailView';
import StandaloneModal from './shared/StandaloneModal';
import StandaloneRequestModal from './StandaloneRequestModal';

// Define FilterOptions interface locally to avoid type conflicts
interface FilterOptions {
  searchTerm?: string;
  resourceType?: string[];
  veteranType?: string[];
  serviceBranch?: string[];
  rating?: number;
  sortBy?: 'relevance' | 'rating' | 'name' | 'date';
}

interface ResourceFinderSectionProps {
  initialResources?: HealthResource[];
}

/**
 * ResourceFinderSection Component
 * 
 * A component that finds resources based on search parameters.
 * Uses shared types, constants, and components for consistency.
 */
const ResourceFinderSection: React.FC<ResourceFinderSectionProps> = ({ 
  initialResources = [] 
}) => {
  // State for resources and loading
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<HealthResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for saved resources
  const [savedResources, setSavedResources] = useState<string[]>([]);
  
  // State for filters
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    resourceType: ['all'],
    veteranType: ['all'],
    serviceBranch: ['all'],
    rating: 0,
    sortBy: 'relevance'
  });
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(PAGINATION.ITEMS_PER_PAGE);
  
  // State for mobile filters
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // State for selected resource and modals
  const [selectedResource, setSelectedResource] = useState<HealthResource | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // Fetch resources from API
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters based on filters
      const queryParams = new URLSearchParams();
      
      // Add search term if provided
      if (filters.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }
      
      // Add resource type filter if not 'all'
      if (filters.resourceType?.length === 1 && filters.resourceType[0] !== 'all') {
        queryParams.append('resourceType', filters.resourceType[0]);
      }
      
      // Add veteran type filter if not 'all'
      if (filters.veteranType?.length === 1 && filters.veteranType[0] !== 'all') {
        queryParams.append('veteranType', filters.veteranType[0]);
      }
      
      // Add service branch filter if not 'all'
      if (filters.serviceBranch?.length === 1 && filters.serviceBranch[0] !== 'all') {
        queryParams.append('serviceBranch', filters.serviceBranch[0]);
      }
      
      // Add rating filter if greater than 0
      if (filters.rating && filters.rating > 0) {
        queryParams.append('minRating', filters.rating.toString());
      }
      
      // Add sort parameter
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      
      // Fetch resources from API
      const response = await fetch(`/api/health/resources?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch health resources');
      }
      
      const data = await response.json();
      
      // Normalize resources to ensure consistent structure
      const normalizedResources = normalizeResources(data);
      
      setResources(normalizedResources);
      setFilteredResources(normalizedResources);
      
      // Load saved resources from localStorage
      const saved = localStorage.getItem('savedHealthResources');
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          setSavedResources(parsedSaved.map((item: any) => item.id || item));
        } catch (e) {
          console.error('Error parsing saved resources:', e);
          setSavedResources([]);
        }
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [initialResources]);
  
  // Apply filters to resources
  const applyFilters = useCallback((filterOptions: FilterOptions) => {
    if (resources.length === 0) return;
    
    // Apply filters
    const filtered = filterResources(resources, filterOptions);
    
    // Apply sorting
    const sorted = sortResources(filtered, filterOptions.sortBy || 'relevance');
    
    // Update filtered resources
    setFilteredResources(sorted);
    
    // Update pagination
    setTotalPages(Math.ceil(sorted.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [resources, itemsPerPage]);
  
  // Debounced filter application
  const debouncedApplyFilters = useCallback(
    debounce(() => {
      applyFilters(filters);
    }, 300),
    [applyFilters, filters]
  );
  
  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle view details
  const handleViewDetails = useCallback((resource: HealthResource) => {
    setSelectedResource(resource);
    setIsDetailModalOpen(true);
  }, []);
  
  // Handle toggle save resource
  const handleToggleSave = useCallback((resourceId: string) => {
    setSavedResources(prev => {
      if (prev.includes(resourceId)) {
        return prev.filter(id => id !== resourceId);
      } else {
        return [...prev, resourceId];
      }
    });
    
    // Update local storage
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      const updatedSavedResources = savedResources.includes(resourceId) 
        ? savedResources.filter(id => id !== resourceId)
        : [...savedResources, resourceId];
        
      localStorage.setItem('savedHealthResources', JSON.stringify(
        updatedSavedResources.map(id => ({ id }))
      ));
    }
  }, [savedResources, resources]);
  
  // Handle form submission for request info
  const handleRequestSubmit = useCallback((formData: RequestInfoFormData) => {
    // Here you would typically send the form data to your API
    console.log('Form submitted:', formData);
    
    // Show success message and close modal after submission
    setTimeout(() => {
      setIsRequestModalOpen(false);
    }, 2000);
  }, []);
  
  // Handle request info
  const handleRequestInfo = (resource: HealthResource) => {
    setSelectedResource(resource);
    setIsRequestModalOpen(true);
  };
  
  // Get current page items
  const getCurrentPageItems = (): HealthResource[] => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResources.slice(startIndex, endIndex);
  };
  
  // Toggle mobile filters
  const toggleMobileFilters = useCallback(() => {
    setShowMobileFilters(!showMobileFilters);
  }, [showMobileFilters]);
  
  // Fetch resources on initial load
  useEffect(() => {
    fetchResources();
  }, []);
  
  // Apply filters when resources or filters change
  useEffect(() => {
    applyFilters(filters);
  }, [filters, applyFilters]);
  
  // Additional effect for search term
  useEffect(() => {
    if (filters.searchTerm) {
      debouncedApplyFilters();
    } else {
      applyFilters();
    }
  }, [resources, filters, debouncedApplyFilters, applyFilters]);
  
  // Get current page items
  const currentItems = getCurrentPageItems();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" id="resource-finder">
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-gray-200"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.WHITE }}
      >
        <h2 className="text-xl font-bold">Find Health Resources</h2>
        <p className="text-sm opacity-90">
          Search for health resources based on your specific needs and eligibility
        </p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Search and filter section */}
        <div className="mb-6">
          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search health resources..."
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            
            {filters.searchTerm && (
              <button
                onClick={() => handleFilterChange({ ...filters, searchTerm: '' })}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Mobile filters toggle */}
          <div className="md:hidden mb-4">
            <button
              onClick={toggleMobileFilters}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {/* Filters panel */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block`}>
            <FilterPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
        
        {/* Results section */}
        <div>
          {/* Results header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Results {filteredResources.length > 0 ? `(${filteredResources.length})` : ''}
              </h3>
              {filteredResources.length > 0 && (
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
                </p>
              )}
            </div>
            
            {/* Refresh button */}
            <button
              onClick={fetchResources}
              className="flex items-center text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading resources...</span>
            </div>
          )}
          
          {/* Error state */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p>{error}</p>
              <button
                onClick={fetchResources}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && filteredResources.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search terms to find more resources.
              </p>
              <button
                onClick={() => handleFilterChange({
                  searchTerm: '',
                  resourceType: ['all'],
                  veteranType: ['all'],
                  serviceBranch: ['all'],
                  rating: 0,
                  sortBy: 'relevance'
                })}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear All Filters
              </button>
            </div>
          )}
          
          {/* Results grid */}
          {!isLoading && !error && filteredResources.length > 0 && (
            <>
              <ResourceGrid 
                resources={currentItems}
                savedResources={savedResources}
                onToggleSave={handleToggleSave}
                onViewDetails={handleViewDetails}
                onRequestInfo={handleRequestInfo}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Resource detail modal */}
      {selectedResource && (
        <StandaloneModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedResource.title}
        >
          <ResourceDetailView 
            resource={selectedResource}
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            onSave={(resource) => handleToggleSave(resource.id || '')}
            isSaved={selectedResource ? savedResources.includes(selectedResource.id || '') : false}
            relatedResources={resources}
            onViewRelated={(resource) => {
              setSelectedResource(resource);
              // No need to close and reopen the modal, just update the content
            }}
            onShare={(resource) => {
              // Implement share functionality if needed
              console.log('Share resource:', resource);
            }}
            onRate={(rating: number) => {
              // Implement rating functionality if needed
              console.log('Rate resource:', rating);
            }}
          />
        </StandaloneModal>
      )}
      
      {/* Request info modal */}
      {selectedResource && (
        <StandaloneRequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          resource={selectedResource}
          onSubmit={handleRequestSubmit}
        />
      )}
    </div>
  );
};

export default ResourceFinderSection;
