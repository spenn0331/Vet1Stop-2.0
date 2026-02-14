/**
 * Health Types
 * 
 * Shared type definitions for the health page components.
 * These types ensure consistency across components and provide
 * better TypeScript support.
 */

/**
 * Health Resource Interface
 */
export interface HealthResource {
  _id?: string | object;
  id?: string;
  title: string;
  description: string;
  resourceType?: string;
  category?: string;
  subcategory?: string;
  
  // Contact information
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  
  // Location information
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Eligibility information
  eligibility?: string;
  veteranType?: string[];
  serviceBranch?: string[];
  
  // Metadata
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  lastUpdated?: string | Date;
  isFeatured?: boolean;
  
  // Media
  thumbnail?: string;
  imageUrl?: string;
  logoUrl?: string;
  
  // Additional properties
  operatingHours?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  link?: string;
  organization?: string;
  
  // NGO-specific properties
  veteranFounded?: boolean;
  verified?: boolean;
  ofTheMonth?: boolean;
}

/**
 * ResourceFilterOptions interface
 * Options for filtering health resources
 */
export interface ResourceFilterOptions {
  searchTerm?: string;
  category?: string;
  resourceType?: string[];
  veteranType?: string[];
  serviceBranch?: string[];
  location?: string;
  rating?: number;
  verifiedOnly?: boolean;
  savedOnly?: boolean;
  sortBy?: 'relevance' | 'rating' | 'name' | 'date';
}

/**
 * NGOResource interface
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
 * ResourceDetailViewProps interface
 * Props for the ResourceDetailView component
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
 * SavedResource interface
 * Structure for saved resources in local storage
 */
export interface SavedResource {
  id: string;
  name: string;
  category: string;
  description: string;
  savedAt: string;
}

/**
 * RequestModalProps interface
 * Props for the request information modal
 */
export interface RequestModalProps {
  resource: HealthResource | NGOResource;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ResourceCardProps interface
 * Props for resource card components
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
 * PaginationProps interface
 * Props for pagination components
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * TabItem interface
 * Structure for tab navigation items
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}
