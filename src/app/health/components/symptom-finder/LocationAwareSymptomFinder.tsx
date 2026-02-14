/**
 * LocationAwareSymptomFinder.tsx
 * 
 * A wrapper component for the SymptomFinder that adds location awareness
 * to filter state-specific resources based on the user's detected location.
 */

'use client';

import React, { useState, useEffect } from 'react';
import SymptomBasedResourceFinder from './index';
import { useUserLocation } from './hooks/useUserLocation';
import { HealthResource } from '../../types/consolidated-health-types';

interface LocationAwareSymptomFinderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  resources: HealthResource[];
  onSaveResource?: (resourceId: string) => void;
  savedResourceIds?: string[];
  onViewDetails?: (resource: HealthResource) => void;
}

export const LocationAwareSymptomFinder: React.FC<LocationAwareSymptomFinderProps> = ({
  title = "Find Resources Based on Your Symptoms",
  subtitle = "Select your symptoms and severity to find relevant resources",
  className = "",
  resources,
  onSaveResource,
  savedResourceIds,
  onViewDetails
}) => {
  const { location, detectUserLocation } = useUserLocation();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'detected' | 'error' | 'none'>('none');
  
  // Check location status on mount
  useEffect(() => {
    if (location.isLoading) {
      setLocationStatus('detecting');
    } else if (location.error) {
      setLocationStatus('error');
      setShowLocationPrompt(true);
    } else if (location.state || location.stateCode) {
      setLocationStatus('detected');
      setShowLocationPrompt(false);
    }
  }, [location]);
  
  // Custom filter function to pass to SymptomFinder
  const locationFilter = (resources: HealthResource[]): HealthResource[] => {
    // If location isn't available or has error, return all resources
    if (location.isLoading || location.error || !location.stateCode) {
      return resources;
    }
    
    // Filter resources based on location
    return resources.filter(resource => {
      // Always include national resources
      if (!resource.geographicScope || resource.geographicScope === 'national') {
        return true;
      }
      
      // For state resources, only include if they match the user's state
      if (resource.geographicScope === 'state') {
        const resourceLocation = typeof resource.location === 'string' ? resource.location : '';
        
        // Match by state code (e.g., 'CA', 'NY')
        if (location.stateCode && 
            resourceLocation.toUpperCase() === location.stateCode.toUpperCase()) {
          return true;
        }
        
        // Match by state name (e.g., 'California', 'New York')
        if (location.state && 
            (resourceLocation.toLowerCase() === location.state.toLowerCase() ||
             resourceLocation.toLowerCase().includes(location.state.toLowerCase()))) {
          return true;
        }
        
        // If no match, exclude this state resource
        return false;
      }
      
      // Include all other resources (regional, local, etc.)
      return true;
    });
  };
  
  return (
    <div className={`location-aware-symptom-finder ${className}`}>
      {showLocationPrompt && (
        <div className="location-prompt p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {locationStatus === 'error' ? (
              <>
                <strong>Location access denied.</strong> We use your location to show you relevant resources in your state. 
                <button 
                  onClick={() => detectUserLocation()} 
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  Try again
                </button>
              </>
            ) : (
              <>
                <strong>Enable location access</strong> to see resources specific to your state.
                <button 
                  onClick={() => detectUserLocation()} 
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  Enable location
                </button>
              </>
            )}
          </p>
        </div>
      )}
      
      {locationStatus === 'detected' && (
        <div className="location-status p-2 mb-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>Location detected:</strong> Showing resources relevant to {location.state || location.stateCode}
          </p>
        </div>
      )}
      
      <SymptomBasedResourceFinder 
        title={title}
        subtitle={subtitle}
        resourceFilter={locationFilter}
        resources={resources}
        onSaveResource={onSaveResource}
        savedResourceIds={savedResourceIds}
        onViewDetails={onViewDetails}
      />
    </div>
  );
};

export default LocationAwareSymptomFinder;
