/**
 * Local Storage Utilities
 * 
 * Functions for managing saved resources in local storage.
 * Provides a consistent interface for saving, retrieving, and removing resources.
 */

import { SavedResource } from '../types/health-types';

// Local storage key for saved resources
const SAVED_RESOURCES_KEY = 'vet1stop_saved_resources';

/**
 * Get all saved resources from local storage
 */
export function getSavedResources(): SavedResource[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedResources = localStorage.getItem(SAVED_RESOURCES_KEY);
    return savedResources ? JSON.parse(savedResources) : [];
  } catch (error) {
    console.error('Error retrieving saved resources from local storage:', error);
    return [];
  }
}

/**
 * Save a resource to local storage
 */
export function saveResource(resource: SavedResource): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedResources = getSavedResources();
    
    // Check if resource already exists
    const existingIndex = savedResources.findIndex(saved => saved.id === resource.id);
    
    if (existingIndex !== -1) {
      // Update existing resource
      savedResources[existingIndex] = {
        ...savedResources[existingIndex],
        ...resource,
        savedAt: new Date().toISOString() // Update saved timestamp
      };
    } else {
      // Add new resource
      savedResources.push({
        ...resource,
        savedAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(SAVED_RESOURCES_KEY, JSON.stringify(savedResources));
  } catch (error) {
    console.error('Error saving resource to local storage:', error);
  }
}

/**
 * Remove a resource from local storage
 */
export function removeResource(resourceId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const savedResources = getSavedResources();
    const filteredResources = savedResources.filter(resource => resource.id !== resourceId);
    
    localStorage.setItem(SAVED_RESOURCES_KEY, JSON.stringify(filteredResources));
  } catch (error) {
    console.error('Error removing resource from local storage:', error);
  }
}

/**
 * Check if a resource is saved in local storage
 */
export function isResourceSaved(resourceId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const savedResources = getSavedResources();
    return savedResources.some(resource => resource.id === resourceId);
  } catch (error) {
    console.error('Error checking if resource is saved:', error);
    return false;
  }
}

/**
 * Clear all saved resources from local storage
 */
export function clearSavedResources(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SAVED_RESOURCES_KEY);
  } catch (error) {
    console.error('Error clearing saved resources from local storage:', error);
  }
}
