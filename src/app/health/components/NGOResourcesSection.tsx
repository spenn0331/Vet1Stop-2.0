"use client";

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  FireIcon, 
  UserGroupIcon,
  HeartIcon as HeartIconSolid,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { 
  StarIcon, 
  HeartIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

// Import components
import NGOResourceCard from './NGOResourceCard';
import NGOResourceFilters from './NGOResourceFilters';
import NGOResourceDetailModal from './NGOResourceDetailModal';
import StandaloneRequestModal from './StandaloneRequestModal';

// Import types
import { 
  HealthResource, 
  FilterOptions, 
  SavedResource,
  RequestInfoFormData
} from '../types/HealthResourceTypes';

// Sample data for testing
import { sampleHealthResources } from '../data/sampleHealthResources';

interface NGOResourcesSectionProps {
  initialResources?: HealthResource[];
}

export default function NGOResourcesSection({ initialResources = [] }: NGOResourcesSectionProps) {
  // State for resources
  const [resources, setResources] = useState<HealthResource[]>(initialResources.length > 0 ? initialResources : sampleHealthResources);
  const [featuredResources, setFeaturedResources] = useState<HealthResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [resourcesPerPage] = useState(9);
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
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
  
  // State for resource details
  const [selectedResource, setSelectedResource] = useState<HealthResource | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  // State for saved resources
  const [savedResources, setSavedResources] = useState<string[]>([]);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // State for UI
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Fetch resources on component mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would fetch from an API
        // For now, we'll use the sample data or initialResources
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter featured resources
        const featured = resources.filter(resource => resource.isFeatured);
        setFeaturedResources(featured);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load resources. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchResources();
    
    // Load saved resources from localStorage
    const loadSavedResources = () => {
      try {
        const saved = localStorage.getItem('savedHealthResources');
        if (saved) {
          setSavedResources(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load saved resources:', err);
      }
    };
    
    loadSavedResources();
  }, [resources.length]);

  // Update total pages when resources or filters change
  useEffect(() => {
    const filteredResources = getFilteredResources();
    setTotalPages(Math.ceil(filteredResources.length / resourcesPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters, resources, resourcesPerPage]);

  // Save resources to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('savedHealthResources', JSON.stringify(savedResources));
    } catch (err) {
      console.error('Failed to save resources:', err);
    }
  }, [savedResources]);

  // Get filtered resources based on current filters
  const getFilteredResources = (): HealthResource[] => {
    return resources.filter(resource => {
      // Filter by search term
      if (filters.searchTerm && !resource.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) && 
          !resource.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by categories
      if (filters.categories.length > 0 && !resource.categories.some(cat => filters.categories.includes(cat))) {
        return false;
      }
      
      // Filter by service types
      if (filters.serviceTypes && filters.serviceTypes.length > 0 && 
          (!resource.availableServices || !resource.availableServices.some(service => filters.serviceTypes?.includes(service)))) {
        return false;
      }
      
      // Filter by service branches
      if (filters.serviceBranches && filters.serviceBranches.length > 0 && 
          (!resource.serviceBranches || !resource.serviceBranches.some(branch => filters.serviceBranches?.includes(branch)))) {
        return false;
      }
      
      // Filter by veteran eras
      if (filters.veteranEras && filters.veteranEras.length > 0 && 
          (!resource.veteranEras || !resource.veteranEras.some(era => filters.veteranEras?.includes(era)))) {
        return false;
      }
      
      // Filter by rating (using either minRating or rating property)
      const ratingThreshold = filters.minRating ?? filters.rating ?? 0;
      if (ratingThreshold > 0 && resource.rating < ratingThreshold) {
        return false;
      }
      
      // Filter by veteran-led
      if (filters.veteranLed && !resource.isVeteranLed) {
        return false;
      }
      
      // Filter by verified
      if (filters.onlyVerified && !resource.isVerified) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Sort resources based on sort option
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'relevance':
        default:
          // For relevance, prioritize featured, then verified, then veteran-led
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;
          if (a.isVeteranLed && !b.isVeteranLed) return -1;
          if (!a.isVeteranLed && b.isVeteranLed) return 1;
          return b.rating - a.rating;
      }
    });
  };
  
  // Get current page resources
  const getCurrentPageResources = (): HealthResource[] => {
    const filteredResources = getFilteredResources();
    const startIndex = (currentPage - 1) * resourcesPerPage;
    return filteredResources.slice(startIndex, startIndex + resourcesPerPage);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of resources section
    document.getElementById('ngo-resources-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle search
  const handleSearch = (term: string) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: term
    }));
  };
  
  // Handle filter change
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };
  
  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };
  
  // Toggle mobile filters
  const toggleMobileFilters = () => {
    setShowFiltersMobile(prev => !prev);
  };
  
  // Handle save resource
  const handleSaveResource = (resourceId: string) => {
    setSavedResources(prev => {
      if (prev.includes(resourceId)) {
        return prev.filter(id => id !== resourceId);
      } else {
        return [...prev, resourceId];
      }
    });
  };
  
  // Handle view resource details
  const handleViewDetails = (resource: HealthResource) => {
    setSelectedResource(resource);
    setIsDetailModalOpen(true);
  };
  
  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    // Small delay to allow animation to complete
    setTimeout(() => setSelectedResource(null), 300);
  };
  
  // Handle request info
  const handleRequestInfo = (resource: HealthResource) => {
    setSelectedResource(resource);
    setIsDetailModalOpen(false);
    // Small delay to allow animation to complete
    setTimeout(() => setIsRequestModalOpen(true), 300);
  };
  
  // Handle submit request form
  const handleSubmitRequest = async (formData: RequestInfoFormData) => {
    // In a real implementation, this would send the data to an API
    console.log('Submitting request:', formData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Close modal after submission
    setIsRequestModalOpen(false);
    // Small delay to allow animation to complete
    setTimeout(() => setSelectedResource(null), 300);
  };
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
    // In a real implementation, this would update a global theme setting
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-8">
        <nav className="inline-flex rounded-md shadow-sm" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Previous</span>
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            const isCurrentPage = page === currentPage;
            
            // Only show a few page numbers around the current page
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  aria-current={isCurrentPage ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${isCurrentPage ? 'z-10 bg-blue-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              );
            }
            
            // Show ellipsis for skipped pages
            if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span
                  key={`ellipsis-${page}`}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium"
                >
                  ...
                </span>
              );
            }
            
            return null;
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium`}
          >
            <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Next</span>
          </button>
        </nav>
      </div>
    );
  };
  
  // Render featured resources section
  const renderFeaturedResources = () => {
    if (featuredResources.length === 0) return null;
    
    return (
      <div className="mb-12">
        <div className="flex items-center mb-4">
          <FireIcon className="h-6 w-6 text-red-600 mr-2" />
          <h2 className="text-2xl font-bold text-blue-900">Featured Resources</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredResources.slice(0, 3).map(resource => (
            <NGOResourceCard
              key={resource.id}
              resource={resource}
              isSaved={savedResources.includes(resource.id)}
              onSave={handleSaveResource}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <section id="ngo-resources-section" className={`py-12 ${isHighContrast ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${isHighContrast ? 'text-white' : 'text-blue-900'} mb-2`}>Non-Governmental Health Resources</h2>
            <p className={`text-lg ${isHighContrast ? 'text-gray-300' : 'text-gray-600'}`}>
              Discover veteran-focused health resources from non-profit organizations, foundations, and community groups.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <button
              onClick={toggleHighContrast}
              className="mr-4 flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
              aria-label={isHighContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            >
              {isHighContrast ? "Standard View" : "High Contrast"}
            </button>
            
            <button
              onClick={toggleMobileFilters}
              className="md:hidden flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-1" />
              Filters
            </button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters sidebar - desktop */}
          <div className="hidden md:block w-full md:w-64 lg:w-72 flex-shrink-0">
            <NGOResourceFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>
          
          {/* Mobile filters */}
          {showFiltersMobile && (
            <div className="md:hidden">
              <NGOResourceFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                isMobile={true}
                onCloseMobile={toggleMobileFilters}
              />
            </div>
          )}
          
          {/* Resources content */}
          <div className="flex-1">
            {/* Featured resources */}
            {renderFeaturedResources()}
            
            {/* Search and filter bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchTerm); }} className="w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search resources..."
                    className="w-full sm:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </form>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={toggleFilters}
                  className="hidden md:flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Sort by: Relevance</option>
                  <option value="rating">Sort by: Highest Rated</option>
                  <option value="newest">Sort by: Newest</option>
                  <option value="alphabetical">Sort by: A-Z</option>
                </select>
              </div>
            </div>
            
            {/* Resources grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <ArrowPathIcon className="h-8 w-8 text-blue-900 animate-spin" />
                <span className="ml-2 text-lg font-medium">Loading resources...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XMarkIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            ) : getCurrentPageResources().length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                  <InformationCircleIcon className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">No resources found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your search or filter criteria to find what you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setFilters({
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
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentPageResources().map(resource => (
                  <NGOResourceCard
                    key={resource.id}
                    resource={resource}
                    isSaved={savedResources.includes(resource.id)}
                    onSave={handleSaveResource}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {!loading && !error && getCurrentPageResources().length > 0 && renderPagination()}
          </div>
        </div>
      </div>
      
      {/* Resource detail modal */}
      {selectedResource && (
        <NGOResourceDetailModal
          resource={selectedResource}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          isSaved={savedResources.includes(selectedResource.id)}
          onSave={handleSaveResource}
          onRequestInfo={handleRequestInfo}
        />
      )}
      
      {/* Request info modal */}
      {selectedResource && (
        <StandaloneRequestModal
          resource={selectedResource}
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false);
            setTimeout(() => setSelectedResource(null), 300);
          }}
          onSubmit={handleSubmitRequest}
        />
      )}
    </section>
  );
}
