/**
 * Types for health resources and related functionality
 */

export interface HealthResource {
  id?: string;
  _id?: string;
  title?: string;
  name?: string; // Some resources might use name instead of title
  description?: string;
  category?: string;
  healthType?: string; // Alternative to category in some database entries
  tags?: string[];
  location?: string;
  state?: string;
  link?: string;
  url?: string; // Alternative to link in some database entries
  website?: string; // Alternative to link in some database entries
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  isPremiumContent?: boolean;
  eligibility?: string[] | string;
  veteranType?: string[] | string;
  serviceBranch?: string | string[];
  branch?: string | string[];
  source?: string;
  sourceName?: string;
  createdAt?: string;
  dateAdded?: string;
  updatedAt?: string;
  keywords?: string[] | string;
  subcategory?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType?: string;
  costType?: string;
  organizationType?: 'VA' | 'NGO' | 'State' | 'Other';
  resourceType?: string; // Type of resource (VA, Federal, State, NGO/Non-Profit, etc.)
}

export interface HealthNeed {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconUrl?: string;
}

export interface ResourceFeedback {
  resourceId: string;
  userId?: string;
  isHelpful: boolean;
  comment?: string;
  createdAt: string;
}

export interface ResourceInteraction {
  resourceId: string;
  userId?: string;
  interactionType: 'view' | 'click' | 'contact' | 'save';
  timestamp: string;
}

export interface FilterState {
  searchTerm: string;
  category: string;
  tags: string[];
  location: string;
  selectedState: string;
  veteranType: string;
  serviceBranch: string;
  eligibility: string;
}

export interface HealthResourceApiResponse {
  resources: HealthResource[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
