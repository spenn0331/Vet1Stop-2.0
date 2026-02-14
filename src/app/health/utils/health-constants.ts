/**
 * Health Constants
 * 
 * Shared constants for the health page components.
 * Centralizing these values helps maintain consistency across components.
 */

// Z-index values for consistent layering
export const Z_INDICES = {
  CRISIS_BANNER: 50,
  MODAL_BACKDROP: 9000,
  MODAL: 9100,
  MODAL_HEADER: 9200,
  TOOLTIP: 9300,
  STANDALONE_MODAL: 9999
};

/**
 * Color values
 */
export const COLORS = {
  PRIMARY: '#1A2C5B',    // Navy blue (primary brand color)
  PRIMARY_LIGHT: '#E6EBF4', // Light navy blue (for backgrounds)
  SECONDARY: '#B22234',  // Red (secondary brand color)
  SECONDARY_LIGHT: '#F9E6E8', // Light red (for backgrounds)
  ACCENT: '#EAB308',     // Gold/yellow (accent color)
  ACCENT_LIGHT: '#FEF9E7', // Light gold (for backgrounds)
  WHITE: '#FFFFFF',      // White
  LIGHT_GRAY: '#F3F4F6', // Light gray (background)
  MEDIUM_GRAY: '#9CA3AF', // Medium gray (borders, dividers)
  DARK_GRAY: '#4B5563',  // Dark gray (text)
  TEXT: '#1F2937',       // Text color
  BORDER: '#E5E7EB',     // Border color
  SUCCESS: '#10B981',    // Green (success)
  WARNING: '#F59E0B',    // Amber (warning)
  ERROR: '#EF4444',      // Red (error)
  INFO: '#3B82F6',       // Blue (info)
};

// Resource types for filtering
export const RESOURCE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'primary-care', label: 'Primary Care' },
  { value: 'specialty-care', label: 'Specialty Care' },
  { value: 'emergency', label: 'Emergency Services' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'preventive', label: 'Preventive Care' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'dental', label: 'Dental Care' },
  { value: 'vision', label: 'Vision Care' },
  { value: 'womens-health', label: 'Women\'s Health' }
];

// Veteran types for filtering
export const VETERAN_TYPES = [
  { value: 'all', label: 'All Veterans' },
  { value: 'post-911', label: 'Post-9/11 Veterans' },
  { value: 'vietnam', label: 'Vietnam Era Veterans' },
  { value: 'gulf-war', label: 'Gulf War Veterans' },
  { value: 'korean-war', label: 'Korean War Veterans' },
  { value: 'wwii', label: 'WWII Veterans' },
  { value: 'peacetime', label: 'Peacetime Veterans' },
  { value: 'combat', label: 'Combat Veterans' },
  { value: 'disabled', label: 'Disabled Veterans' },
  { value: 'active-duty', label: 'Active Duty' },
  { value: 'reservists', label: 'Reservists' },
  { value: 'national-guard', label: 'National Guard' },
  { value: 'family', label: 'Family Members' },
  { value: 'caregivers', label: 'Caregivers' }
];

// Service branches for filtering
export const SERVICE_BRANCHES = [
  { value: 'army', label: 'Army' },
  { value: 'navy', label: 'Navy' },
  { value: 'air-force', label: 'Air Force' },
  { value: 'marines', label: 'Marines' },
  { value: 'coast-guard', label: 'Coast Guard' },
  { value: 'space-force', label: 'Space Force' },
  { value: 'national-guard', label: 'National Guard' }
];

// NGO status types and badge colors
export const NGO_STATUS_TYPES = {
  FEATURED: 'featured',
  OF_THE_MONTH: 'ofTheMonth',
  VETERAN_FOUNDED: 'veteranFounded'
};

/**
 * NGO badge colors
 */
export const NGO_BADGE_COLORS = {
  [NGO_STATUS_TYPES.FEATURED]: 'bg-yellow-100 text-yellow-800',
  [NGO_STATUS_TYPES.OF_THE_MONTH]: 'bg-blue-100 text-blue-800',
  [NGO_STATUS_TYPES.VETERAN_FOUNDED]: 'bg-green-100 text-green-800'
};

/**
 * Pagination constants
 */
export const PAGINATION = {
  ITEMS_PER_PAGE: 9,
  MAX_VISIBLE_PAGES: 5,
  DEFAULT_PAGE: 1
};

// Pagination constants
export const ITEMS_PER_PAGE = 12;
