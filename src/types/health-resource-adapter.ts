/**
 * Health Resource Adapter Utility
 * 
 * This utility helps bridge the type differences between various HealthResource interfaces
 * used in different parts of the application, ensuring compatibility when passing data
 * between components.
 */

import { HealthResource as TypesHealthResource } from '@/types/health';
import { HealthResource as ModelsHealthResource } from '@/models/healthResource';

/**
 * Converts a HealthResource from types/health.ts to models/healthResource.ts format
 */
export function adaptToModelResource(resource: TypesHealthResource): ModelsHealthResource {
  // Create a new object that satisfies the ModelsHealthResource interface
  const adaptedResource: ModelsHealthResource = {
    ...resource,
    // Ensure eligibility is an array if it's a string
    eligibility: typeof resource.eligibility === 'string' 
      ? [resource.eligibility] 
      : resource.eligibility,
    
    // Ensure veteranType is in the correct format
    veteranType: resource.veteranType,
    
    // Handle other potential type mismatches
    date: resource.createdAt || resource.dateAdded || resource.updatedAt
  };
  
  return adaptedResource;
}

/**
 * Converts a HealthResource from models/healthResource.ts to types/health.ts format
 */
export function adaptToTypeResource(resource: ModelsHealthResource): TypesHealthResource {
  // Create a new object that satisfies the TypesHealthResource interface
  const adaptedResource: TypesHealthResource = {
    ...resource,
    // Set standard fields explicitly to ensure they match the TypesHealthResource interface
    id: resource.id || resource._id?.toString(),
    title: resource.title || resource.name,
    description: resource.description,
    category: resource.category || resource.healthType,
    tags: resource.tags || [],
    link: resource.link || resource.url || resource.website
  };
  
  return adaptedResource;
}

/**
 * Adapts an array of health resources
 */
export function adaptResourceArray<T extends TypesHealthResource | ModelsHealthResource, R>(
  resources: T[],
  adapter: (resource: T) => R
): R[] {
  return resources.map(resource => adapter(resource as T));
}
