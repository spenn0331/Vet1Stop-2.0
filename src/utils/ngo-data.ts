/**
 * Shared NGO data utilities for Vet1Stop
 * Contains NGO types, focus areas, and sample data
 */

export interface NGOResource {
  // ID and basic information
  id?: string;
  _id?: string; // MongoDB ID format
  name?: string;
  title?: string; // From standardized schema
  description: string;
  
  // Contact information (standardized schema)
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  // Legacy contact fields
  link?: string;
  website?: string; // Alternative field name for link
  
  // Categorization (standardized schema)
  category?: string; // e.g., 'health', 'education'
  subcategory?: string; // e.g., 'ngo', 'federal'
  resourceType?: string; // e.g., 'Mental Health', 'Physical Health'
  // Additional standardized categorization
  resourceTypes?: string[]; // Array of resource types
  
  // Media
  image?: string;
  logo?: string;
  
  // Location information (standardized schema)
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  // Eligibility criteria (standardized schema)
  eligibility?: string;
  serviceBranches?: string[]; // Array of military branches: 'Army', 'Navy', etc.
  veteranTypes?: string[]; // Array of veteran eras: 'Post-9/11', 'Vietnam', etc.
  
  // Verification and status indicators
  isVerified?: boolean;
  verified?: boolean; // Legacy field
  verificationSource?: 'va' | 'dod' | 'community' | string;
  federalAgency?: boolean;
  nonProfit?: boolean;
  
  // Service and funding status
  serviceAvailability?: 'accepting' | 'waitlist' | 'closed';
  fundingType?: 'government' | 'private' | 'hybrid';
  
  // Success stories and testimonials
  successStories?: Array<string | { quote: string; veteran: string; }>;
  
  // Organization metadata
  focus?: string[];
  tags?: string[];
  spotlight?: boolean;
  featuredUntil?: string; // ISO date string for when featured status expires
  ofTheMonth?: boolean;
  establishedYear?: number;
  veteranFounded?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  isNGOOfTheMonth?: boolean;
  
  // Rating information
  rating?: number;
  reviewCount?: number;
  averageRating?: number; // Alternative field name for rating
  isPreLaunchRating?: boolean; // Indicates if the rating is a pre-launch estimate
  
  // Performance metrics
  metrics?: {
    impactScore?: number;
    engagementRate?: number;
    veteransSupportedCount?: number;
    fundingEfficiency?: number; // Percentage of funds going to programs vs overhead
  };
  
  // Location information
  location?: {
    national?: boolean;
    states?: string[];
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | string; // Can be an object or a string (e.g., "National")
  
  // Contact information
  contact?: {
    phone?: string;
    email?: string;
    website?: string; // Additional field for contact website
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  
  // Additional fields
  programs?: string[];
  category?: string; // e.g., "health"
  subcategory?: string; // e.g., "ngo"
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  achievements?: string[];
  
  // Fields for eligibility and service compatibility
  veteranTypes?: string[];
  serviceBranches?: string[];
}

// NGO focus areas for filtering
export const NGO_FOCUS_AREAS = [
  { value: 'all', label: 'All Focus Areas' },
  { value: 'mental-health', label: 'Mental Health' },
  { value: 'physical-health', label: 'Physical Health' },
  { value: 'emergency-relief', label: 'Emergency Relief' },
  { value: 'housing', label: 'Housing' },
  { value: 'education', label: 'Education' },
  { value: 'employment', label: 'Employment' },
  { value: 'financial', label: 'Financial Support' },
  { value: 'family-support', label: 'Family Support' },
  { value: 'research', label: 'Research & Advocacy' },
  { value: 'adaptive-sports', label: 'Adaptive Sports' },
  { value: 'healthcare', label: 'Healthcare Access' },
  { value: 'ptsd', label: 'PTSD Treatment' },
  { value: 'substance-abuse', label: 'Substance Abuse' },
  { value: 'women-veterans', label: 'Women Veterans' }
];

// NGO status types for badges
export const NGO_STATUS_TYPES = {
  FEATURED: 'featured',
  OF_THE_MONTH: 'ofTheMonth',
  VERIFIED: 'verified',
  VETERAN_FOUNDED: 'veteranFounded'
};

// Badge colors for NGO status
export const NGO_BADGE_COLORS = {
  [NGO_STATUS_TYPES.FEATURED]: 'bg-[#EAB308] text-black',
  [NGO_STATUS_TYPES.OF_THE_MONTH]: 'bg-[#1A2C5B] text-white',
  [NGO_STATUS_TYPES.VERIFIED]: 'bg-green-100 text-green-800',
  [NGO_STATUS_TYPES.VETERAN_FOUNDED]: 'bg-[#B22234] text-white'
};

// Mock NGO data for fallback when database isn't available
export const NGO_DATA: NGOResource[] = [
  {
    id: 'wounded-warrior-project',
    name: 'Wounded Warrior Project',
    description: 'Empowering veterans with physical and mental health programs, career counseling, and long-term rehabilitative care to help warriors thrive after service.',
    link: 'https://www.woundedwarriorproject.org',
    image: '/images/wounded-warrior-project.jpg',
    logo: '/logos/wwp-logo.png',
    focus: ['mental-health', 'physical-health', 'employment'],
    location: {
      national: true
    },
    veteranFounded: true,
    rating: 4.7,
    reviewCount: 1248,
    metrics: {
      impactScore: 92,
      engagementRate: 0.87,
      veteransSupportedCount: 125000,
      fundingEfficiency: 0.78
    },
    tags: ['mental-health', 'physical-health', 'employment', 'nationwide'],
    spotlight: true,
    featuredUntil: '2025-12-31T23:59:59Z',
    establishedYear: 2003,
    contact: {
      phone: '1-888-997-2586',
      email: 'resourcecenter@woundedwarriorproject.org'
    },
    programs: [
      'Combat Stress Recovery Program',
      'Physical Health & Wellness',
      'Career & VA Benefits Counseling',
      'Independence Program',
      'Warrior Care Network'
    ],
    achievements: [
      'Provided support to over 125,000 veterans and service members',
      'Invested more than $1.2 billion in programs for wounded veterans',
      'Successfully advocated for improved VA policies'
    ]
  },
  {
    id: 'team-rubicon',
    name: 'Team Rubicon',
    description: 'Deploying military veterans for emergency response and rebuilding after natural disasters, both domestic and international.',
    link: 'https://teamrubiconusa.org',
    image: '/images/team-rubicon.jpg',
    logo: '/logos/team-rubicon-logo.png',
    focus: ['emergency-relief', 'mental-health'],
    location: {
      national: true
    },
    veteranFounded: true,
    rating: 4.8,
    reviewCount: 923,
    metrics: {
      impactScore: 95,
      engagementRate: 0.91,
      veteransSupportedCount: 150000,
      fundingEfficiency: 0.83
    },
    tags: ['disaster-relief', 'mental-health', 'community-service', 'nationwide'],
    spotlight: false,
    ofTheMonth: true,
    establishedYear: 2010,
    contact: {
      email: 'support@teamrubiconusa.org'
    },
    programs: [
      'Disaster Relief Operations',
      'Rebuild Operations',
      'Training & Leadership Development',
      'Community Service Projects'
    ],
    achievements: [
      'Deployed to over 500 disaster operations worldwide',
      'Built a volunteer force of over 150,000 members',
      'Provided disaster relief to millions of people globally'
    ]
  },
  {
    id: 'cohen-veterans-network',
    name: 'Cohen Veterans Network',
    description: 'Providing high-quality, accessible mental health care to veterans and military families at no or low cost.',
    link: 'https://www.cohenveteransnetwork.org',
    image: '/images/cohen-veterans-network.jpg',
    logo: '/logos/cvn-logo.png',
    focus: ['mental-health', 'family-support'],
    location: {
      national: true,
      states: ['CA', 'TX', 'NY', 'FL', 'PA', 'CO', 'MD', 'VA', 'WA', 'NC']
    },
    veteranFounded: false,
    rating: 4.9,
    reviewCount: 1042,
    metrics: {
      impactScore: 90,
      engagementRate: 0.85,
      veteransSupportedCount: 50000,
      fundingEfficiency: 0.88
    },
    tags: ['mental-health', 'therapy', 'ptsd', 'family-support'],
    spotlight: true,
    featuredUntil: '2025-10-31T23:59:59Z',
    establishedYear: 2016
  },
  {
    id: 'higher-ground',
    name: 'Higher Ground',
    description: 'Recreation therapy and specialized health programs for veterans with physical and psychological injuries.',
    link: 'https://www.highergroundusa.org',
    image: '/images/higher-ground.jpg',
    logo: '/logos/higher-ground-logo.png',
    focus: ['physical-health', 'mental-health', 'adaptive-sports'],
    location: {
      national: false,
      states: ['ID', 'NY', 'CA']
    },
    veteranFounded: false,
    rating: 4.6,
    reviewCount: 568,
    metrics: {
      impactScore: 87,
      engagementRate: 0.82,
      fundingEfficiency: 0.79
    },
    tags: ['recreation-therapy', 'adaptive-sports', 'mental-health', 'physical-health'],
    spotlight: true,
    establishedYear: 2012
  }
];

// Create mock NGO of the month for fallback
export const mockNGOOfTheMonth: NGOResource = NGO_DATA.find(ngo => ngo.id === 'team-rubicon') || NGO_DATA[0];

// Create mock featured NGOs for fallback
export const mockFeaturedNGOs: NGOResource[] = NGO_DATA.filter(ngo => ngo.spotlight);

/**
 * Fetches the NGO of the Month from the database
 * The NGO of the Month is either explicitly designated or determined
 * by highest engagement metrics in the current month
 * 
 * @returns Promise<NGOResource | null> A promise that resolves to the NGO of the Month or null if none found
 */
export async function getNGOOfTheMonth(): Promise<NGOResource | null> {
  try {
    console.log('Fetching NGO of the Month from client-side...');
    const response = await fetch('/api/ngos/month', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Ensure we always get the latest data
    });

    console.log('NGO of the Month API response status:', response.status);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Error response text:', responseText);
      throw new Error(`Error fetching NGO of the Month: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('NGO of the Month data received:', data ? 'Yes' : 'No');
    return data.ngoOfTheMonth || null;
  } catch (error) {
    console.error('Error fetching NGO of the month:', error);
    // Fallback to the first NGO with highest impact score in our mock data
    return NGO_DATA.find(ngo => ngo.id === 'wounded-warrior-project') || null;
  }
}

/**
 * Fetches featured NGOs from the database
 * Featured NGOs are those specifically marked for premium placement
 * based on partnership agreements
 * 
 * @returns Promise<NGOResource[]> A promise that resolves to an array of featured NGOs
 */
export async function getFeaturedNGOs(): Promise<NGOResource[]> {
  try {
    console.log('Fetching featured NGOs from client-side...');
    const response = await fetch('/api/ngos/featured', { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store' // Ensure we always get the latest data
    });

    console.log('Featured NGOs API response status:', response.status);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('Error response text:', responseText);
      throw new Error(`Error fetching featured NGOs: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Featured NGOs data received:', data ? 'Yes' : 'No', 'Count:', data.featuredNGOs?.length || 0);
    return data.featuredNGOs || [];
  } catch (error) {
    console.error('Error fetching featured NGOs:', error);
    // Fallback to filtered mock data if there's an error - NGOs with featured property
    return NGO_DATA.filter(ngo => ngo.spotlight || ngo.featuredUntil) || [];
  }
};

// Filter NGOs based on search query, focus area, location, and other filters
export const filterNGOs = (
  ngoData: NGOResource[], 
  filters: {
    searchQuery?: string;
    focusFilter?: string;
    locationFilter?: string;
    veteranFoundedOnly?: boolean;
    showSpotlightOnly?: boolean;
    minRating?: number;
    showVerifiedOnly?: boolean;
  }
): NGOResource[] => {
  const {
    searchQuery = '',
    focusFilter = 'all',
    locationFilter = 'all',
    veteranFoundedOnly = false,
    showSpotlightOnly = false,
    minRating = 0,
    showVerifiedOnly = false
  } = filters;
  
  return ngoData.filter(ngo => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = ngo.name.toLowerCase().includes(searchLower);
      const matchesDesc = ngo.description.toLowerCase().includes(searchLower);
      const matchesTags = ngo.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!(matchesName || matchesDesc || matchesTags)) {
        return false;
      }
    }
    
    // Focus area filter
    if (focusFilter !== 'all') {
      if (!ngo.focus.includes(focusFilter)) {
        return false;
      }
    }
    
    // Location filter
    if (locationFilter !== 'all') {
      const isNational = ngo.location?.national;
      const hasState = ngo.location?.states?.includes(locationFilter);
      
      if (!(isNational || hasState)) {
        return false;
      }
    }
    
    // Veteran founded filter
    if (veteranFoundedOnly && !ngo.veteranFounded) {
      return false;
    }
    
    // Spotlight only filter
    if (showSpotlightOnly && !ngo.spotlight) {
      return false;
    }
    
    // Minimum rating filter
    if (ngo.rating && ngo.rating < minRating) {
      return false;
    }
    
    // Verified only filter (assuming we track this)
    if (showVerifiedOnly && !ngo.rating) {
      return false;
    }
    
    return true;
  });
};

// Sort NGOs by different criteria
export const sortNGOs = (
  ngoData: NGOResource[],
  sortBy: 'rating' | 'name' | 'impact' | 'established' | 'relevance' = 'relevance'
): NGOResource[] => {
  const sortedData = [...ngoData];
  
  switch (sortBy) {
    case 'rating':
      // Sort by rating (highest first), then by number of reviews
      sortedData.sort((a, b) => {
        if (a.rating !== b.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      });
      break;
      
    case 'name':
      // Sort alphabetically by name
      sortedData.sort((a, b) => a.name.localeCompare(b.name));
      break;
      
    case 'impact':
      // Sort by impact score (if available)
      sortedData.sort((a, b) => {
        return (b.metrics?.impactScore || 0) - (a.metrics?.impactScore || 0);
      });
      break;
      
    case 'established':
      // Sort by established year (oldest first)
      sortedData.sort((a, b) => {
        return (a.establishedYear || 9999) - (b.establishedYear || 9999);
      });
      break;
      
    case 'relevance':
    default:
      // Sort by featured status first, then by rating
      sortedData.sort((a, b) => {
        if (a.spotlight !== b.spotlight) {
          return a.spotlight ? -1 : 1;
        }
        
        if (a.ofTheMonth !== b.ofTheMonth) {
          return a.ofTheMonth ? -1 : 1;
        }
        
        return (b.rating || 0) - (a.rating || 0);
      });
      break;
  }
  
  return sortedData;
};
