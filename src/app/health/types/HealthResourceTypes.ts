/**
 * Types for health resources in the Vet1Stop application
 */

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

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

export interface HealthResource {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  categories: string[];
  tags: string[];
  rating: number;
  reviewCount?: number;
  provider: string;
  isVerified: boolean;
  isVeteranLed: boolean;
  contactInfo?: ContactInfo;
  location?: Location;
  eligibility?: string;
  costInfo?: string;
  serviceTypes?: string[]; // Renamed from availableServices for consistency
  availableServices?: string[]; // Keep for backward compatibility
  serviceBranches?: string[];
  veteranEras?: string[];
  lastUpdated?: string;
  isFeatured?: boolean;
}

export interface SavedResource {
  id: string;
  resourceId: string;
  userId: string;
  savedAt: string;
  notes?: string;
}

export interface FilterOptions {
  categories: string[];
  serviceTypes?: string[];
  serviceBranches?: string[];
  veteranEras?: string[];
  minRating?: number; // Changed from rating for clarity
  rating?: number;    // Keep for backward compatibility
  veteranLed?: boolean;
  verifiedOnly?: boolean; // Changed from onlyVerified for clarity
  onlyVerified?: boolean; // Keep for backward compatibility
  searchTerm?: string;
  sortBy?: 'relevance' | 'rating' | 'newest' | 'alphabetical';
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

// Response from health resources API
export interface HealthResourcesResponse {
  resources: HealthResource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Symptom category for the symptom-based resource finder
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

// Severity level for the symptom-based resource finder
export interface SeverityLevel {
  id: string;
  label: string;
  description: string;
}

// Form data for requesting information about a resource
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
