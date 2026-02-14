/**
 * Shared location data utilities for Vet1Stop
 * Contains state data, region mappings, and location utility functions
 */

export interface StateOption {
  value: string;
  label: string;
  region?: string;
}

// US states with two-letter codes, full names, and regions
export const US_STATES: StateOption[] = [
  { value: 'all', label: 'All States' },
  { value: 'AL', label: 'Alabama', region: 'Southeast' },
  { value: 'AK', label: 'Alaska', region: 'West' },
  { value: 'AZ', label: 'Arizona', region: 'Southwest' },
  { value: 'AR', label: 'Arkansas', region: 'Southeast' },
  { value: 'CA', label: 'California', region: 'West' },
  { value: 'CO', label: 'Colorado', region: 'West' },
  { value: 'CT', label: 'Connecticut', region: 'Northeast' },
  { value: 'DE', label: 'Delaware', region: 'Northeast' },
  { value: 'FL', label: 'Florida', region: 'Southeast' },
  { value: 'GA', label: 'Georgia', region: 'Southeast' },
  { value: 'HI', label: 'Hawaii', region: 'West' },
  { value: 'ID', label: 'Idaho', region: 'West' },
  { value: 'IL', label: 'Illinois', region: 'Midwest' },
  { value: 'IN', label: 'Indiana', region: 'Midwest' },
  { value: 'IA', label: 'Iowa', region: 'Midwest' },
  { value: 'KS', label: 'Kansas', region: 'Midwest' },
  { value: 'KY', label: 'Kentucky', region: 'Southeast' },
  { value: 'LA', label: 'Louisiana', region: 'Southeast' },
  { value: 'ME', label: 'Maine', region: 'Northeast' },
  { value: 'MD', label: 'Maryland', region: 'Northeast' },
  { value: 'MA', label: 'Massachusetts', region: 'Northeast' },
  { value: 'MI', label: 'Michigan', region: 'Midwest' },
  { value: 'MN', label: 'Minnesota', region: 'Midwest' },
  { value: 'MS', label: 'Mississippi', region: 'Southeast' },
  { value: 'MO', label: 'Missouri', region: 'Midwest' },
  { value: 'MT', label: 'Montana', region: 'West' },
  { value: 'NE', label: 'Nebraska', region: 'Midwest' },
  { value: 'NV', label: 'Nevada', region: 'West' },
  { value: 'NH', label: 'New Hampshire', region: 'Northeast' },
  { value: 'NJ', label: 'New Jersey', region: 'Northeast' },
  { value: 'NM', label: 'New Mexico', region: 'Southwest' },
  { value: 'NY', label: 'New York', region: 'Northeast' },
  { value: 'NC', label: 'North Carolina', region: 'Southeast' },
  { value: 'ND', label: 'North Dakota', region: 'Midwest' },
  { value: 'OH', label: 'Ohio', region: 'Midwest' },
  { value: 'OK', label: 'Oklahoma', region: 'Southwest' },
  { value: 'OR', label: 'Oregon', region: 'West' },
  { value: 'PA', label: 'Pennsylvania', region: 'Northeast' },
  { value: 'RI', label: 'Rhode Island', region: 'Northeast' },
  { value: 'SC', label: 'South Carolina', region: 'Southeast' },
  { value: 'SD', label: 'South Dakota', region: 'Midwest' },
  { value: 'TN', label: 'Tennessee', region: 'Southeast' },
  { value: 'TX', label: 'Texas', region: 'Southwest' },
  { value: 'UT', label: 'Utah', region: 'West' },
  { value: 'VT', label: 'Vermont', region: 'Northeast' },
  { value: 'VA', label: 'Virginia', region: 'Southeast' },
  { value: 'WA', label: 'Washington', region: 'West' },
  { value: 'WV', label: 'West Virginia', region: 'Southeast' },
  { value: 'WI', label: 'Wisconsin', region: 'Midwest' },
  { value: 'WY', label: 'Wyoming', region: 'West' },
  { value: 'DC', label: 'District of Columbia', region: 'Northeast' },
  { value: 'PR', label: 'Puerto Rico', region: 'Other' },
  { value: 'VI', label: 'U.S. Virgin Islands', region: 'Other' },
  { value: 'GU', label: 'Guam', region: 'Other' },
  { value: 'MP', label: 'Northern Mariana Islands', region: 'Other' },
  { value: 'AS', label: 'American Samoa', region: 'Other' },
];

// US regions for grouping states
export const US_REGIONS = [
  { value: 'all', label: 'All Regions' },
  { value: 'Northeast', label: 'Northeast' },
  { value: 'Southeast', label: 'Southeast' },
  { value: 'Midwest', label: 'Midwest' },
  { value: 'Southwest', label: 'Southwest' },
  { value: 'West', label: 'West' },
  { value: 'Other', label: 'Territories' },
];

// Map of regions to state codes
export const REGIONS: Record<string, string[]> = {
  'Northeast': ['CT', 'DE', 'ME', 'MD', 'MA', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT', 'DC'],
  'Southeast': ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  'Midwest': ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
  'Southwest': ['AZ', 'NM', 'OK', 'TX'],
  'West': ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
  'Other': ['PR', 'VI', 'GU', 'MP', 'AS']
};

/**
 * Gets a state option by its state code
 * @param stateCode Two-letter state code
 * @returns StateOption or undefined if not found
 */
export const getStateByCode = (stateCode: string): StateOption | undefined => {
  return US_STATES.find(state => state.value === stateCode);
};

/**
 * Gets all states in a specific region
 * @param region Region name
 * @returns Array of StateOptions
 */
export const getStatesByRegion = (region: string): StateOption[] => {
  if (region === 'all') {
    return US_STATES;
  }
  return US_STATES.filter(state => state.region === region);
};

/**
 * Save user's recent state selections to local storage
 * @param stateCode The state code to save
 */
export const saveRecentState = (stateCode: string): void => {
  try {
    if (stateCode === 'all') return;
    
    // Get existing recent states from localStorage
    const storedStates = localStorage.getItem('recentStates');
    let recentStates: string[] = storedStates ? JSON.parse(storedStates) : [];
    
    // Remove the current state if it already exists in the array
    recentStates = recentStates.filter(state => state !== stateCode);
    
    // Add the current state to the beginning of the array
    recentStates.unshift(stateCode);
    
    // Keep only the 5 most recent states
    if (recentStates.length > 5) {
      recentStates = recentStates.slice(0, 5);
    }
    
    // Save back to localStorage
    localStorage.setItem('recentStates', JSON.stringify(recentStates));
  } catch (error) {
    console.error('Error saving recent state to localStorage:', error);
  }
};

/**
 * Get user's recent state selections from local storage
 * @returns Array of recent state codes
 */
export const getRecentStates = (): string[] => {
  try {
    const storedStates = localStorage.getItem('recentStates');
    return storedStates ? JSON.parse(storedStates) : [];
  } catch (error) {
    console.error('Error retrieving recent states from localStorage:', error);
    return [];
  }
};

/**
 * Get user's location based on browser geolocation
 * In a real app, this would use the browser's geolocation API or IP geolocation
 * @returns Promise that resolves to the two-letter state code
 */
export const getUserState = async (): Promise<string> => {
  try {
    // This is a mock implementation
    // In a real app, you would use the browser's geolocation API
    // or a geolocation service like ipapi.co
    
    // For demonstration, we'll check if there's a stored value
    const savedState = localStorage.getItem('userState');
    if (savedState) {
      return savedState;
    }
    
    // Simulate geolocation API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demonstration purposes, return a random state
    const randomState = US_STATES[Math.floor(Math.random() * US_STATES.length)];
    localStorage.setItem('userState', randomState.value);
    
    return randomState.value;
  } catch (error) {
    console.error('Error getting user state:', error);
    return 'all';
  }
};
