import { useState, useEffect } from 'react';

export interface UserLocation {
  state?: string;
  stateCode?: string;
  city?: string;
  country?: string;
  isLoading: boolean;
  error?: string;
}

/**
 * Hook to detect and manage user location information
 * Uses browser geolocation API and reverse geocoding
 */
export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation>({
    isLoading: true
  });
  const [hasAttemptedGeoLocation, setHasAttemptedGeoLocation] = useState<boolean>(false);

  // Try to get location from localStorage first
  useEffect(() => {
    const savedLocation = localStorage.getItem('vet1stop_user_location');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        // Check if the saved location is still valid (less than 24 hours old)
        const savedTime = localStorage.getItem('vet1stop_location_timestamp');
        if (savedTime) {
          const timestamp = parseInt(savedTime, 10);
          const now = Date.now();
          const hoursSinceSaved = (now - timestamp) / (1000 * 60 * 60);
          
          if (hoursSinceSaved < 24) {
            setLocation({ ...parsedLocation, isLoading: false });
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }
    
    // If no valid saved location, proceed with detection
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    if (hasAttemptedGeoLocation) return;
    setHasAttemptedGeoLocation(true);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocation({
        isLoading: false,
        error: "Geolocation is not supported by your browser"
      });
      return;
    }

    try {
      // Get user's coordinates
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Use reverse geocoding to get location details
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            
            if (!response.ok) {
              throw new Error('Failed to fetch location data');
            }
            
            const data = await response.json();
            
            const userLocation: UserLocation = {
              state: data.principalSubdivision,
              stateCode: data.principalSubdivisionCode?.split('-')[1] || '',
              city: data.city,
              country: data.countryName,
              isLoading: false
            };
            
            // Save location to localStorage with timestamp
            localStorage.setItem('vet1stop_user_location', JSON.stringify(userLocation));
            localStorage.setItem('vet1stop_location_timestamp', Date.now().toString());
            
            setLocation(userLocation);
          } catch (error) {
            console.error("Error getting location details:", error);
            setLocation({
              isLoading: false,
              error: "Failed to determine your location details"
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Failed to determine your location";
          
          if (error.code === 1) {
            errorMessage = "Location access denied. Please enable location services to see local resources.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please try again later.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          
          setLocation({
            isLoading: false,
            error: errorMessage
          });
        },
        { 
          enableHighAccuracy: false, 
          timeout: 10000, 
          maximumAge: 24 * 60 * 60 * 1000 // 24 hours
        }
      );
    } catch (error) {
      console.error("Error in geolocation process:", error);
      setLocation({
        isLoading: false,
        error: "An unexpected error occurred while determining your location"
      });
    }
  };

  // Function to manually set location (for testing or user override)
  const setUserLocation = (stateCode: string) => {
    // Map of state codes to full state names
    const stateMap: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
    };

    const userLocation: UserLocation = {
      state: stateMap[stateCode] || stateCode,
      stateCode: stateCode,
      country: 'United States',
      isLoading: false
    };

    // Save to localStorage
    localStorage.setItem('vet1stop_user_location', JSON.stringify(userLocation));
    localStorage.setItem('vet1stop_location_timestamp', Date.now().toString());
    
    setLocation(userLocation);
  };

  return { 
    location, 
    detectUserLocation,
    setUserLocation
  };
};

export default useUserLocation;
