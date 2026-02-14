"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { HealthResource } from '../types/HealthResourceTypes';
import { RequestInfoFormData } from '../types/HealthResourceTypes';
import ResourceGrid from './shared/ResourceGrid';
import ResourceDetailView from './shared/ResourceDetailView';
import StandaloneModal from './shared/StandaloneModal';
import StandaloneRequestModal from './StandaloneRequestModal';

// US States array for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' }
];

const StateResourcesSection: React.FC = () => {
  // State for resources and loading
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<HealthResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for location detection
  const [selectedState, setSelectedState] = useState<string>('');
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modals
  const [selectedResource, setSelectedResource] = useState<HealthResource | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Fetch resources on component mount
  useEffect(() => {
    fetchResources();
  }, []);

  // Filter resources when state or search term changes
  useEffect(() => {
    filterResourcesByState();
  }, [selectedState, searchTerm, resources]);

  // Fetch resources from API
  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/health/resources?type=state');
      
      if (!response.ok) {
        throw new Error('Failed to fetch state resources');
      }
      
      const data = await response.json();
      
      // Transform data to match the HealthResource interface if needed
      const transformedData = data.map((item: any) => ({
        id: item.id || item._id,
        title: item.title,
        description: item.description,
        url: item.website || '',
        categories: item.category ? [item.category] : [],
        tags: item.tags || [],
        rating: item.rating || 0,
        reviewCount: item.reviewCount || 0,
        provider: item.provider || '',
        isVerified: item.isVerified || false,
        isVeteranLed: item.isVeteranLed || false,
        contactInfo: {
          phone: item.phone || item.contact?.phone,
          email: item.email || item.contact?.email,
          website: item.website || item.contact?.website,
          address: item.address || item.contact?.address
        },
        location: {
          address: item.address || item.location?.address,
          city: item.city || item.location?.city,
          state: item.state || item.location?.state,
          zipCode: item.zipCode || item.location?.zipCode
        },
        eligibility: item.eligibility || '',
        serviceBranches: item.serviceBranch || [],
        veteranEras: item.veteranType || [],
        lastUpdated: item.lastUpdated || new Date().toISOString()
      }));
      
      setResources(transformedData);
      setFilteredResources(transformedData);
      
      // Attempt to detect user's location
      detectUserLocation();
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load state resources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter resources by state and search term
  const filterResourcesByState = () => {
    if (!resources.length) return;
    
    let filtered = [...resources];
    
    // Filter by state if selected
    if (selectedState) {
      filtered = filtered.filter(resource => 
        resource.location?.state === selectedState
      );
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(term) || 
        resource.description.toLowerCase().includes(term) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredResources(filtered);
  };

  // Detect user's location using browser geolocation API
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsDetectingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding API to get state from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location information');
          }
          
          const data = await response.json();
          const state = data.principalSubdivisionCode?.split('-')[1]; // Format: "US-CA" -> "CA"
          
          if (state) {
            setDetectedState(state);
            setSelectedState(state);
          } else {
            setLocationError('Could not determine your state');
          }
        } catch (err) {
          console.error('Error detecting location:', err);
          setLocationError('Failed to detect your location');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(
          error.code === 1
            ? 'Location access denied. Please select your state manually.'
            : 'Could not detect your location. Please select your state manually.'
        );
        setIsDetectingLocation(false);
      }
    );
  };

  // Handle state selection change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // View resource details
  const handleViewDetails = (resource: HealthResource) => {
    setSelectedResource(resource);
    setIsDetailModalOpen(true);
  };

  // Request more information
  const handleRequestInfo = (resource: HealthResource) => {
    setSelectedResource(resource);
    setIsRequestModalOpen(true);
  };

  // Handle form submission for request info
  const handleRequestSubmit = useCallback((formData: RequestInfoFormData) => {
    // Here you would typically send the form data to your API
    console.log('Form submitted:', formData);
    
    // Show success message and close modal after submission
    setTimeout(() => {
      setIsRequestModalOpen(false);
    }, 2000);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <XMarkIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-600">{error}</p>
            <button 
              onClick={fetchResources}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
        <h3 className="text-lg font-medium text-blue-800">State-Specific Health Resources</h3>
        <p className="text-blue-600 mt-1">
          Find health resources available in your state. We can detect your location or you can select your state manually.
        </p>
      </div>
      
      {/* Location Detection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Your State
            </label>
            <select
              id="state-select"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              value={selectedState}
              onChange={handleStateChange}
            >
              <option value="">All States</option>
              {US_STATES.map(state => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={detectUserLocation}
              disabled={isDetectingLocation}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isDetectingLocation ? 'bg-gray-400' : 'bg-[#1A2C5B] hover:bg-blue-700'
              }`}
            >
              {isDetectingLocation ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Detecting...
                </>
              ) : (
                <>
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Detect My Location
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Location detection status */}
        {detectedState && (
          <div className="mt-2 text-sm text-green-600 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            We detected you're in {US_STATES.find(state => state.value === detectedState)?.label || detectedState}
          </div>
        )}
        
        {locationError && (
          <div className="mt-2 text-sm text-red-600">
            {locationError}
          </div>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search state resources..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Resources Display */}
      {filteredResources.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedState
              ? `Health Resources in ${US_STATES.find(state => state.value === selectedState)?.label || selectedState}`
              : 'All State Health Resources'}
          </h3>
          
          <ResourceGrid 
            resources={filteredResources}
            onViewDetails={handleViewDetails}
            onRequestInfo={handleRequestInfo}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No state resources found.</p>
          <p className="text-gray-500 text-sm mb-6">
            {selectedState
              ? `We couldn't find any health resources for ${US_STATES.find(state => state.value === selectedState)?.label || selectedState}.`
              : 'Please select a state or try a different search term.'}
          </p>
          
          <button
            onClick={() => {
              setSelectedState('');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Resource Detail Modal */}
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
          />
        </StandaloneModal>
      )}
      
      {/* Request Info Modal */}
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

export default StateResourcesSection;
