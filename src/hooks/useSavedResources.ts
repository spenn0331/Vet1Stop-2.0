import { useState, useEffect, useCallback, useMemo } from 'react';
import { HealthResource } from '../types/health';

interface UseSavedResourcesProps {
  userId?: string;
  isAuthenticated?: boolean;
}

interface UseSavedResourcesResult {
  savedResourceIds: string[];
  savedResources: HealthResource[];
  isSaved: (resourceId: string) => boolean;
  saveResource: (resource: HealthResource) => void;
  removeResource: (resourceId: string) => void;
  toggleSaveResource: (resource: HealthResource) => void;
  clearAllSaved: () => void;
  loadSavedResources: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

// Storage keys for consistency
const STORAGE_KEYS = {
  SAVED_IDS: 'vet1stop_savedResources',
  SAVED_DATA: 'vet1stop_savedResourcesData'
};

/**
 * Hook for managing saved/favorited resources
 * 
 * Handles both local storage (for anonymous users) and Firebase/API storage (for authenticated users)
 * Part of the Save/Favorite Functionality (Recommendation #5 from resource-ux-ui-recommendations.md)
 */
export function useSavedResources({ 
  userId, 
  isAuthenticated = false 
}: UseSavedResourcesProps = {}): UseSavedResourcesResult {
  const [savedResourceIds, setSavedResourceIds] = useState<string[]>([]);
  const [savedResources, setSavedResources] = useState<HealthResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Reset error whenever dependencies change
  useEffect(() => {
    setError(null);
  }, [userId, isAuthenticated]);
  
  // Load saved resources from local storage on mount
  useEffect(() => {
    loadSavedResources();
  }, [userId, isAuthenticated]);

  // Save to local storage whenever savedResourceIds or savedResources changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_IDS, JSON.stringify(savedResourceIds));
      localStorage.setItem(STORAGE_KEYS.SAVED_DATA, JSON.stringify(savedResources));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, [savedResourceIds, savedResources]);

  /**
   * Load saved resources from local storage or API
   * Returns a Promise for better error handling and async operations
   */
  const loadSavedResources = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isAuthenticated && userId) {
        // If authenticated, fetch from API or Firebase
        try {
          const response = await fetch(`/api/users/${userId}/saved-resources`);
          if (!response.ok) {
            throw new Error(`Failed to fetch saved resources: ${response.status}`);
          }
          
          const data = await response.json();
          setSavedResourceIds(data.resourceIds || []);
          setSavedResources(data.resources || []);
        } catch (error) {
          console.error('Error fetching saved resources:', error);
          // Fall back to local storage if API fails
          await loadFromLocalStorage();
        }
      } else {
        // If not authenticated, use local storage
        await loadFromLocalStorage();
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error loading saved resources');
      console.error('Error loading saved resources:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  // Helper to load from local storage
  const loadFromLocalStorage = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    try {
      // Load saved IDs
      const savedIds = localStorage.getItem(STORAGE_KEYS.SAVED_IDS);
      if (savedIds) {
        const parsedIds = JSON.parse(savedIds);
        setSavedResourceIds(Array.isArray(parsedIds) ? parsedIds : []);
      } else {
        setSavedResourceIds([]);
      }

      // Load full resource objects if available
      const savedResourcesData = localStorage.getItem(STORAGE_KEYS.SAVED_DATA);
      if (savedResourcesData) {
        const parsedResources = JSON.parse(savedResourcesData);
        setSavedResources(Array.isArray(parsedResources) ? parsedResources : []);
      } else {
        setSavedResources([]);
      }
    } catch (e) {
      console.error('Error parsing data from localStorage:', e);
      // Reset saved resources to empty arrays if there's an error
      setSavedResourceIds([]);
      setSavedResources([]);
      throw e;
    }
  }, []);

  // Check if a resource is saved - memoized for performance
  const isSaved = useCallback((resourceId: string): boolean => {
    if (!resourceId) return false;
    return savedResourceIds.includes(resourceId);
  }, [savedResourceIds]);

  // Helper to track save/unsave actions
  const trackSaveAction = useCallback((action: 'save' | 'unsave', resourceId: string, resourceTitle?: string) => {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', action === 'save' ? 'save_resource' : 'unsave_resource', {
      resource_id: resourceId,
      resource_title: resourceTitle || 'Unnamed Resource',
      user_id: userId || 'anonymous',
    });
  }, [userId]);

  // Save a resource
  const saveResource = useCallback(async (resource: HealthResource): Promise<void> => {
    const resourceId = resource.id || resource._id || '';
    if (!resourceId || isSaved(resourceId)) return;

    // Prepare new arrays with the added resource
    const newSavedIds = [...savedResourceIds, resourceId];
    const newSavedResources = [...savedResources, resource];
    
    // Update state
    setSavedResourceIds(newSavedIds);
    setSavedResources(newSavedResources);

    // Track save action
    trackSaveAction('save', resourceId, resource.title || resource.name);

    // If authenticated, sync with server
    if (isAuthenticated && userId) {
      try {
        const response = await fetch(`/api/users/${userId}/saved-resources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resourceId, resource }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save resource to server: ${response.status}`);
        }
      } catch (error) {
        console.error('Error saving resource to server:', error);
        // Note: We don't revert the state change here to avoid confusion if the API call fails
      }
    }
  }, [savedResourceIds, savedResources, isSaved, isAuthenticated, userId, trackSaveAction]);

  // Remove a resource
  const removeResource = useCallback(async (resourceId: string): Promise<void> => {
    if (!resourceId || !isSaved(resourceId)) return;

    // Find the resource before removing for analytics tracking
    const resourceToRemove = savedResources.find(
      resource => (resource.id || resource._id) === resourceId
    );
    
    // Prepare new arrays without the removed resource
    const newSavedIds = savedResourceIds.filter(id => id !== resourceId);
    const newSavedResources = savedResources.filter(
      resource => (resource.id || resource._id) !== resourceId
    );
    
    // Update state
    setSavedResourceIds(newSavedIds);
    setSavedResources(newSavedResources);

    // Track unsave action
    trackSaveAction('unsave', resourceId, resourceToRemove?.title || resourceToRemove?.name);

    // If authenticated, sync with server
    if (isAuthenticated && userId) {
      try {
        const response = await fetch(`/api/users/${userId}/saved-resources/${resourceId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to remove resource from server: ${response.status}`);
        }
      } catch (error) {
        console.error('Error removing resource on server:', error);
      }
    }
  }, [savedResourceIds, savedResources, isSaved, isAuthenticated, userId, trackSaveAction]);

  // Toggle save status (save if not saved, remove if saved)
  const toggleSaveResource = useCallback((resource: HealthResource): void => {
    const resourceId = resource.id || resource._id || '';
    if (!resourceId) return;

    if (isSaved(resourceId)) {
      removeResource(resourceId);
    } else {
      saveResource(resource);
    }
  }, [isSaved, removeResource, saveResource]);

  // Clear all saved resources
  const clearAllSaved = useCallback(async (): Promise<void> => {
    setSavedResourceIds([]);
    setSavedResources([]);

    // If authenticated, sync with server
    if (isAuthenticated && userId) {
      try {
        const response = await fetch(`/api/users/${userId}/saved-resources`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to clear saved resources on server: ${response.status}`);
        }
      } catch (error) {
        console.error('Error clearing saved resources on server:', error);
      }
    }
  }, [isAuthenticated, userId]);

  // Return memoized result to prevent unnecessary re-renders
  return useMemo(() => ({
    savedResourceIds,
    savedResources,
    isSaved,
    saveResource,
    removeResource,
    toggleSaveResource,
    clearAllSaved,
    loadSavedResources,
    isLoading,
    error
  }), [
    savedResourceIds,
    savedResources,
    isSaved,
    saveResource,
    removeResource,
    toggleSaveResource,
    clearAllSaved,
    loadSavedResources,
    isLoading,
    error
  ]);
}

export default useSavedResources;
