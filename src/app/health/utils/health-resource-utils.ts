/**
 * Utility functions for health resources in Vet1Stop
 * These functions handle filtering, sorting, and formatting of health resources
 */

import { HealthResource, FilterOptions } from '../types/HealthResourceTypes';

/**
 * Filter health resources based on filter options
 * @param resources - Array of health resources to filter
 * @param filters - Filter criteria to apply
 * @returns Filtered array of health resources
 */
export const filterHealthResources = (
  resources: HealthResource[],
  filters: FilterOptions
): HealthResource[] => {
  if (!resources || resources.length === 0) {
    return [];
  }
  
  return resources.filter(resource => {
    // Filter by search term
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const titleMatch = resource.title.toLowerCase().includes(searchTermLower);
      const descriptionMatch = resource.description.toLowerCase().includes(searchTermLower);
      
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }
    
    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      if (!resource.categories || !resource.categories.some(cat => filters.categories.includes(cat))) {
        return false;
      }
    }
    
    // Filter by service types
    if (filters.serviceTypes && filters.serviceTypes.length > 0) {
      if (!resource.serviceTypes || !resource.serviceTypes.some(service => filters.serviceTypes?.includes(service))) {
        return false;
      }
    }
    
    // Filter by service branches
    if (filters.serviceBranches && filters.serviceBranches.length > 0) {
      if (!resource.serviceBranches || !resource.serviceBranches.some(branch => filters.serviceBranches?.includes(branch))) {
        return false;
      }
    }
    
    // Filter by veteran eras
    if (filters.veteranEras && filters.veteranEras.length > 0) {
      if (!resource.veteranEras || !resource.veteranEras.some(era => filters.veteranEras?.includes(era))) {
        return false;
      }
    }
    
    // Filter by minimum rating (using either minRating or rating property)
    const ratingThreshold = filters.minRating ?? filters.rating ?? 0;
    if (ratingThreshold > 0 && resource.rating < ratingThreshold) {
      return false;
    }
    
    // Filter by verified status (using either verifiedOnly or onlyVerified property)
    if ((filters.verifiedOnly || filters.onlyVerified) && !resource.isVerified) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort health resources based on sort option
 * @param resources - Array of health resources to sort
 * @param sortBy - Sorting criteria
 * @returns Sorted array of health resources
 */
export const sortHealthResources = (
  resources: HealthResource[],
  sortBy: FilterOptions['sortBy'] = 'relevance'
): HealthResource[] => {
  if (!resources || resources.length === 0) {
    return [];
  }
  
  return [...resources].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b.lastUpdated || '').getTime() - new Date(a.lastUpdated || '').getTime();
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      case 'relevance':
      default:
        // For relevance, prioritize featured, then verified, then veteran-led
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        if (a.isVeteranLed && !b.isVeteranLed) return -1;
        if (!a.isVeteranLed && b.isVeteranLed) return 1;
        return b.rating - a.rating;
    }
  });
};

/**
 * Get featured health resources
 * @param resources - Array of health resources
 * @returns Array of featured health resources
 */
export const getFeaturedHealthResources = (resources: HealthResource[]): HealthResource[] => {
  if (!resources || resources.length === 0) {
    return [];
  }
  
  return resources.filter(resource => resource.isFeatured);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `1-${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not formattable
  return phone;
};

/**
 * Get resource categories for filtering
 */
export const getResourceCategories = (resources: HealthResource[]): string[] => {
  const categories = new Set<string>();
  
  resources.forEach(resource => {
    resource.categories.forEach(category => {
      categories.add(category);
    });
  });
  
  return Array.from(categories).sort();
};

/**
 * Get service types for filtering
 */
export const getServiceTypes = (resources: HealthResource[]): string[] => {
  const serviceTypes = new Set<string>();
  
  resources.forEach(resource => {
    if (resource.availableServices) {
      resource.availableServices.forEach(service => {
        serviceTypes.add(service);
      });
    }
  });
  
  return Array.from(serviceTypes).sort();
};

/**
 * Get service branches for filtering
 */
export const getServiceBranches = (resources: HealthResource[]): string[] => {
  const branches = new Set<string>();
  
  resources.forEach(resource => {
    if (resource.serviceBranches) {
      resource.serviceBranches.forEach(branch => {
        branches.add(branch);
      });
    }
  });
  
  return Array.from(branches).sort();
};

/**
 * Get veteran eras for filtering
 */
export const getVeteranEras = (resources: HealthResource[]): string[] => {
  const eras = new Set<string>();
  
  resources.forEach(resource => {
    if (resource.veteranEras) {
      resource.veteranEras.forEach(era => {
        eras.add(era);
      });
    }
  });
  
  return Array.from(eras).sort();
};
