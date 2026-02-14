/**
 * Consolidated Health Types
 * 
 * This file contains all type definitions for the health page components,
 * consolidating the previous health-types.ts and HealthResourceTypes.ts files
 * to ensure consistency across components and provide better TypeScript support.
 */

/**
 * Contact information for health resources
 */
export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

/**
 * Location information for health resources
 */
export interface Location {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Health Resource Interface
 * Comprehensive definition for all health-related resources
 */
export interface HealthResource {
  // Core identification
  id: string;
  _id?: string | object; // MongoDB ID support
  
  // Basic information
  title: string;
  description: string;
  url: string;
  
  // Categorization
  categories: string[];
  resourceType?: string; // 'va', 'ngo', etc.
  category?: string; // Legacy support - needed for existing code
  subcategory?: string; // Legacy support - needed for existing code
  organization?: string;
  source?: string;
  tags: string[];
  
  // Ratings and metrics
  rating?: number;
  reviewCount?: number;
  cost?: string | number;
  
  // Provider information
  provider: string;
  
  // Geographic information
  geographicScope?: 'national' | 'regional' | 'state' | 'local';
  location?: string; // State code or location name
  
  // Eligibility and availability
  eligibility?: string;
  availability?: string;
  
  // Severity levels for symptom matching
  severityLevels?: string[];
  isCrisisResource?: boolean;
  
  // Usage metrics
  viewCount?: number;
  clickCount?: number;
  
  // Mental health specialization
  isMentalHealthResource?: boolean;
  therapyTypes?: string[];
  acceptedInsurance?: string[];
  
  // Related resources
  relatedResources?: string[];
  
  // Verification flags
  lastUpdated?: string;
  lastVerified?: Date | string;
  verified?: boolean;
  isVerified: boolean;
  isVeteranLed: boolean;
  veteranFounded?: boolean; // Legacy support
  
  // Contact information
  contactInfo?: ContactInfo;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  }; // Legacy support
  phone?: string; // Legacy support
  email?: string; // Legacy support
  website?: string; // Legacy support
  
  // Location information
  location?: Location;
  address?: string; // Legacy support
  city?: string; // Legacy support
  state?: string; // Legacy support
  zipCode?: string; // Legacy support
  
  // Eligibility information
  eligibility?: string;
  costInfo?: string;
  serviceTypes?: string[];
  availableServices?: string[]; // Legacy support
  serviceBranches?: string[];
  veteranEras?: string[];
  veteranType?: string[]; // Legacy support
  serviceBranch?: string[]; // Legacy support
  
  // Media
  imageUrl?: string;
  thumbnail?: string;
  logoUrl?: string;
  
  // Metadata
  lastUpdated?: string;
  isFeatured?: boolean;
  ofTheMonth?: boolean;
  
  // Additional properties
  operatingHours?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  link?: string; // Legacy support
}

/**
 * NGO Resource Interface
 * Extends HealthResource with NGO-specific properties
 */
export interface NGOResource extends HealthResource {
  name?: string; // Alternative to title for NGOs
  spotlight?: boolean | string;
  featuredUntil?: string;
  serviceAvailability?: 'accepting' | 'waitlist' | 'closed';
  fundingType?: 'government' | 'private' | 'hybrid';
  successStories?: Array<string | { quote: string; veteran: string; }>;
  focus?: string[];
  establishedYear?: number;
  metrics?: {
    impactScore?: number;
    engagementRate?: number;
    veteransSupportedCount?: number;
    successRate?: number;
  };
  achievements?: string[];
}

/**
 * Filter Options Interface
 * Options for filtering health resources
 */
export interface FilterOptions {
  // Search and categories
  searchTerm?: string;
  categories?: string[];
  category?: string; // Legacy support
  
  // Resource types
  resourceType?: string[];
  serviceTypes?: string[];
  
  // Veteran specific filters
  veteranType?: string[]; // Legacy support
  serviceBranch?: string[]; // Legacy support
  serviceBranches?: string[];
  veteranEras?: string[];
  
  // Location filters
  location?: string;
  
  // Rating filters
  rating?: number;
  minRating?: number;
  
  // Boolean filters
  verifiedOnly?: boolean;
  onlyVerified?: boolean; // Legacy support
  veteranLed?: boolean;
  savedOnly?: boolean;
  
  // Sorting
  sortBy?: 'relevance' | 'rating' | 'name' | 'date' | 'newest' | 'alphabetical';
}

/**
 * Pagination State Interface
 */
export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

/**
 * Pagination Props Interface
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Health Resources API Response Interface
 */
export interface HealthResourcesResponse {
  resources: HealthResource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Saved Resource Interface
 * Structure for saved resources in local storage
 */
export interface SavedResource {
  id: string;
  resourceId?: string;
  userId?: string;
  name?: string;
  category?: string;
  description?: string;
  savedAt: string;
  notes?: string;
}

/**
 * Resource Detail View Props Interface
 */
export interface ResourceDetailViewProps {
  resource: HealthResource | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (resource: HealthResource) => void;
  onShare?: (resource: HealthResource) => void;
  onRate?: (rating: number) => void;
  onViewRelated?: (resource: HealthResource) => void;
  isSaved?: boolean;
  relatedResources?: HealthResource[];
  isLoadingRelated?: boolean;
}

/**
 * Resource Card Props Interface
 */
export interface ResourceCardProps {
  resource: HealthResource;
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
  onViewDetails: (resource: HealthResource) => void;
  onRequestInfo?: (resource: HealthResource) => void;
  featured?: boolean;
  compact?: boolean;
}

/**
 * Tab Item Interface
 * Structure for tab navigation items
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

/**
 * Symptom Category Interface
 * For the symptom-based resource finder
 */
export interface SymptomCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  symptoms: {
    id: string;
    label: string;
  }[];
}

/**
 * Severity Level Interface
 * For the symptom-based resource finder
 */
export interface SeverityLevel {
  id: string;
  label: string;
  description: string;
}

/**
 * Request Info Form Data Interface
 * For requesting information about a resource
 */
export interface RequestInfoFormData {
  name: string;
  email: string;
  phone?: string;
  serviceDetails: string;
  preferredContact: 'email' | 'phone' | 'either';
  veteranStatus: boolean;
  agreeToTerms: boolean;
  resourceId?: string;
  specificQuestions?: string;
  serviceStatus?: string;
}

/**
 * Request Modal Props Interface
 * Props for the request information modal
 */
export interface RequestModalProps {
  resource: HealthResource | NGOResource;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (formData: RequestInfoFormData) => void;
}
