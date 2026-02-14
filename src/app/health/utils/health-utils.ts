/**
 * Health Utilities
 * 
 * Shared utility functions for the health page components.
 * These functions handle common tasks like data normalization,
 * formatting, and filtering.
 */

import { HealthResource } from '../types/health-types';

/**
 * Normalizes a single resource
 * Ensures consistent structure for resources from different sources
 */
export function normalizeResource(resource: any): HealthResource {
  if (!resource) return {} as HealthResource;
  
  return {
    _id: resource._id || resource.id,
    id: resource._id?.toString() || resource.id,
    title: resource.title || resource.name || '',
    description: resource.description || '',
    resourceType: resource.resourceType || 'general',
    category: resource.category || '',
    subcategory: resource.subcategory || '',
    contact: {
      phone: resource.contact?.phone || resource.phone || '',
      email: resource.contact?.email || resource.email || '',
      website: resource.contact?.website || resource.website || ''
    },
    location: {
      address: resource.location?.address || resource.address || '',
      city: resource.location?.city || resource.city || '',
      state: resource.location?.state || resource.state || '',
      zipCode: resource.location?.zipCode || resource.zipCode || ''
    },
    eligibility: resource.eligibility || '',
    veteranType: Array.isArray(resource.veteranType) ? resource.veteranType : 
                (resource.veteranType ? [resource.veteranType] : ['all']),
    serviceBranch: Array.isArray(resource.serviceBranch) ? resource.serviceBranch : 
                  (resource.serviceBranch ? [resource.serviceBranch] : ['all']),
    tags: resource.tags || [],
    rating: resource.rating || 0,
    reviewCount: resource.reviewCount || 0,
    isFeatured: resource.isFeatured || false,
    verified: resource.verified || false,
    lastUpdated: resource.lastUpdated || new Date().toISOString(),
    // Additional properties
    additionalDescription: resource.additionalDescription || '',
    eligibilityNotes: resource.eligibilityNotes || '',
    ofTheMonth: !!resource.ofTheMonth || !!resource.isNGOOfTheMonth
  };
}

/**
 * Normalize an array of resources
 * Applies normalizeResource to each item in the array
 */
export function normalizeResources(resources: any[]): HealthResource[] {
  if (!resources || !Array.isArray(resources)) return [];
  
  return resources.map(resource => normalizeResource(resource));
}

/**
 * Normalizes a value to ensure it's an array
 */
export function normalizeArray(value: any): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Formats a date string or Date object to a human-readable format
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return 'Unknown';
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Unknown date';
  }
}

/**
 * Filters resources based on search criteria
 */
export function filterResources(
  resources: HealthResource[],
  filters: {
    searchTerm?: string;
    category?: string;
    resourceType?: string[];
    veteranType?: string[];
    serviceBranch?: string[];
    location?: string;
    rating?: number;
    verifiedOnly?: boolean;
  }
): HealthResource[] {
  return resources.filter(resource => {
    // Search term filter
    if (filters.searchTerm && !matchesSearchTerm(resource, filters.searchTerm)) {
      return false;
    }
    
    // Category filter
    if (filters.category && filters.category !== 'all' && resource.category !== filters.category) {
      return false;
    }
    
    // Resource type filter
    if (filters.resourceType?.length && !filters.resourceType.includes('all')) {
      const resourceTypes = normalizeArray(resource.resourceType);
      if (!filters.resourceType.some(type => resourceTypes.includes(type))) {
        return false;
      }
    }
    
    // Veteran type filter
    if (filters.veteranType?.length && !filters.veteranType.includes('all')) {
      const veteranTypes = normalizeArray(resource.veteranType);
      if (!filters.veteranType.some(type => veteranTypes.includes(type))) {
        return false;
      }
    }
    
    // Service branch filter
    if (filters.serviceBranch?.length && !filters.serviceBranch.includes('all')) {
      const serviceBranches = normalizeArray(resource.serviceBranch);
      if (!filters.serviceBranch.some(branch => serviceBranches.includes(branch))) {
        return false;
      }
    }
    
    // Location filter
    if (filters.location && filters.location !== 'all') {
      if (resource.location?.state !== filters.location) {
        return false;
      }
    }
    
    // Rating filter
    if (filters.rating && (resource.rating || 0) < filters.rating) {
      return false;
    }
    
    // Verified only filter
    if (filters.verifiedOnly && !resource.verified) {
      return false;
    }
    
    return true;
  });
}

/**
 * Checks if a resource matches a search term
 */
function matchesSearchTerm(resource: HealthResource, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    resource.title,
    resource.description,
    ...(resource.tags || []),
    resource.resourceType,
    resource.eligibility
  ];
  
  return searchableFields.some(field => 
    field && field.toString().toLowerCase().includes(term)
  );
}

/**
 * Sorts resources based on sort criteria
 */
export function sortResources(
  resources: HealthResource[],
  sortBy: 'relevance' | 'rating' | 'name' | 'date' = 'relevance'
): HealthResource[] {
  const sortedResources = [...resources];
  
  switch (sortBy) {
    case 'rating':
      return sortedResources.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'name':
      return sortedResources.sort((a, b) => a.title.localeCompare(b.title));
    case 'date':
      return sortedResources.sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return dateB - dateA;
      });
    case 'relevance':
    default:
      // For relevance, featured items come first, then by rating
      return sortedResources.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  }
}

/**
 * Gets related resources based on tags and resource type
 */
export function getRelatedResources(
  currentResource: HealthResource,
  allResources: HealthResource[],
  limit: number = 3
): HealthResource[] {
  if (!currentResource || !allResources.length) return [];
  
  const currentId = currentResource._id || currentResource.id;
  const currentTags = normalizeArray(currentResource.tags);
  const currentType = currentResource.resourceType;
  
  // Filter out the current resource
  const otherResources = allResources.filter(r => 
    (r._id || r.id) !== currentId
  );
  
  // Score each resource based on similarity
  const scoredResources = otherResources.map(resource => {
    let score = 0;
    
    // Score based on matching tags
    const resourceTags = normalizeArray(resource.tags);
    currentTags.forEach(tag => {
      if (resourceTags.includes(tag)) score += 2;
    });
    
    // Score based on matching resource type
    if (resource.resourceType === currentType) score += 3;
    
    // Score based on matching category
    if (resource.category === currentResource.category) score += 1;
    
    return { resource, score };
  });
  
  // Sort by score and take the top N
  return scoredResources
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.resource);
}
