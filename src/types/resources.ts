// Define types for the health resources data
export interface Resource {
  _id: string;
  id: string; // Support for legacy id format
  title: string;
  description: string;
  link?: string;
  website?: string;
  imageUrl?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  location?: string;
  rating?: number;
  isPremiumContent?: boolean;
  source?: string;
  sourceName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Specific types for health resources
export interface HealthResource extends Resource {
  healthType?: string;
  eligibility?: string[];
  veteranType?: string[];
}

// Specific types for education resources
export interface EducationResource extends Resource {
  educationType?: string;
  degreeType?: string[];
  cost?: string;
  financialAid?: boolean;
}

// Specific types for life and leisure resources
export interface LifeAndLeisureResource extends Resource {
  activityType?: string;
  accessibility?: string[];
  eventDate?: string;
}

// Specific types for job resources
export interface JobResource extends Resource {
  jobType?: string;
  industry?: string[];
  salary?: string;
  remote?: boolean;
}

// Types for API responses
export interface ResourcePagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ResourceResponse {
  success: boolean;
  data: Resource[];
  pagination?: ResourcePagination;
  message?: string;
}
