/**
 * Geo-location utilities for detecting user location and mapping to state data
 */

import { US_STATES } from './location-data';

// Interface for location coordinates
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// Interface for reverse geocoding result
export interface ReverseGeocodingResult {
  state?: string;
  stateCode?: string;
  city?: string;
  country?: string;
  error?: string;
}

/**
 * Get current geo-location coordinates using browser geolocation API
 * @returns Promise with coordinates or error
 */
export const getCurrentLocation = (): Promise<GeoCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Request precise location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Unknown location error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

/**
 * Reverse geocode coordinates to get state information
 * @param coordinates Latitude and longitude
 * @returns Promise with state information
 */
export const reverseGeocode = async (
  coordinates: GeoCoordinates
): Promise<ReverseGeocodingResult> => {
  try {
    // Use Nominatim OpenStreetMap API for reverse geocoding (free and open-source)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vet1Stop-ResourceFinder/1.0' // Required by Nominatim ToS
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract state information from response
    // For US addresses, we're interested in the state code
    if (data.address) {
      const country = data.address.country;
      let state = data.address.state;
      let stateCode = '';
      let city = data.address.city || data.address.town || data.address.village || '';
      
      // If it's a US address, convert state name to state code
      if (country === 'United States' && state) {
        // Try to find the state code from our location data
        const stateOption = US_STATES.find(
          s => s.label.toLowerCase() === state.toLowerCase()
        );
        
        if (stateOption) {
          stateCode = stateOption.value;
        }
      }
      
      return {
        state,
        stateCode,
        city,
        country
      };
    }
    
    return { error: 'Location not found' };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown geocoding error' };
  }
};

/**
 * Get the user's state based on geolocation
 * @returns Promise with state code or error
 */
export const getUserState = async (): Promise<string | null> => {
  try {
    // Get current coordinates
    const coordinates = await getCurrentLocation();
    
    // Reverse geocode to get state
    const locationInfo = await reverseGeocode(coordinates);
    
    if (locationInfo.stateCode && locationInfo.country === 'United States') {
      return locationInfo.stateCode;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user state:', error);
    return null;
  }
};

/**
 * Save recent user state to localStorage
 * @param stateCode Two-letter state code
 */
export const saveRecentState = (stateCode: string): void => {
  try {
    // Get current recent states
    const recentStatesString = localStorage.getItem('recentStates');
    let recentStates: string[] = recentStatesString ? JSON.parse(recentStatesString) : [];
    
    // Remove the state if it already exists
    recentStates = recentStates.filter(state => state !== stateCode);
    
    // Add state to the beginning of the array
    recentStates.unshift(stateCode);
    
    // Limit to 5 recent states
    recentStates = recentStates.slice(0, 5);
    
    // Save back to localStorage
    localStorage.setItem('recentStates', JSON.stringify(recentStates));
  } catch (error) {
    console.error('Error saving recent state:', error);
  }
};

/**
 * Get recent states from localStorage
 * @returns Array of recent state codes
 */
export const getRecentStates = (): string[] => {
  try {
    const recentStatesString = localStorage.getItem('recentStates');
    return recentStatesString ? JSON.parse(recentStatesString) : [];
  } catch (error) {
    console.error('Error getting recent states:', error);
    return [];
  }
};

/**
 * Get state name from state code
 * @param stateCode Two-letter state code
 * @returns Full state name or null if not found
 */
export const getStateName = (stateCode: string): string | null => {
  const state = US_STATES.find((s: { value: string; label: string }) => s.value === stateCode);
  return state ? state.label : null;
};
