// src/utils/imagePlaceholders.ts
/**
 * Image placeholder utility for Vet1Stop
 * Provides fallback images that match the patriotic design theme
 * with navy blue (#1A2C5B), red (#B22234), and gold (#EAB308)
 */

// Generic resource placeholder with patriotic colors
export const DEFAULT_RESOURCE_PLACEHOLDER = '/images/resources/placeholder.png';

// Organization-specific placeholders
export const NGO_PLACEHOLDERS: Record<string, string> = {
  'wounded-warrior-project': '/images/resources/organizations/wounded-warrior-project.png',
  'team-rubicon': '/images/resources/organizations/team-rubicon.png',
  'disabled-american-veterans': '/images/resources/organizations/dav.png',
  'va': '/images/resources/organizations/va.png',
  'american-legion': '/images/resources/organizations/american-legion.png',
  'vfw': '/images/resources/organizations/vfw.png',
};

/**
 * Get an appropriate placeholder image URL based on resource metadata
 */
export function getResourcePlaceholder(resource: any): string {
  // If it's from a known organization, use its placeholder
  if (resource?.organization) {
    const orgKey = resource.organization.toLowerCase().replace(/\s+/g, '-');
    if (NGO_PLACEHOLDERS[orgKey]) {
      return NGO_PLACEHOLDERS[orgKey];
    }
  }
  
  // Use category-based placeholder if available
  if (resource?.category) {
    const category = resource.category.toLowerCase();
    if (category.includes('mental-health')) {
      return '/images/resources/categories/mental-health.png';
    }
    if (category.includes('primary-care') || category.includes('physical')) {
      return '/images/resources/categories/primary-care.png';
    }
    if (category.includes('emergency')) {
      return '/images/resources/categories/emergency.png';
    }
  }
  
  // Default placeholder
  return DEFAULT_RESOURCE_PLACEHOLDER;
}

/**
 * Validate if a URL is a proper image URL
 */
export function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  
  // Check if it's a data URL
  if (url.startsWith('data:image/')) return true;
  
  // Check if it's a relative URL to our own images
  if (url.startsWith('/images/')) return true;
  
  // Check if it's an absolute URL with proper image extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext)) && 
         (url.startsWith('http://') || url.startsWith('https://'));
}
