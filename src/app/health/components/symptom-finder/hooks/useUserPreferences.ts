"use client";

import { useState, useCallback, useEffect } from 'react';
import { HealthResource } from '../../../types/consolidated-health-types';

// Define types for user preferences
interface UserPreferences {
  savedResourceIds: string[];
  recentSearches: {
    categoryId: string;
    symptoms: string[];
    severityLevel: string;
    timestamp: number;
  }[];
  preferredCategories: string[];
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  savedResourceIds: [],
  recentSearches: [],
  preferredCategories: []
};

// Storage keys
const STORAGE_KEY = 'vet1stop_health_preferences';
const MAX_RECENT_SEARCHES = 5;

/**
 * Custom hook for managing user preferences and saved resources
 * Handles localStorage persistence and future Firebase integration
 */
export function useUserPreferences() {
  // State for user preferences
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const storedPreferences = localStorage.getItem(STORAGE_KEY);
        if (storedPreferences) {
          setPreferences(JSON.parse(storedPreferences));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, [preferences, isLoaded]);

  /**
   * Toggle a resource as saved/unsaved
   * @param resourceId - ID of the resource to toggle
   */
  const toggleSavedResource = useCallback((resourceId: string) => {
    setPreferences(prev => {
      const isSaved = prev.savedResourceIds.includes(resourceId);
      
      if (isSaved) {
        // Remove from saved resources
        return {
          ...prev,
          savedResourceIds: prev.savedResourceIds.filter(id => id !== resourceId)
        };
      } else {
        // Add to saved resources
        return {
          ...prev,
          savedResourceIds: [...prev.savedResourceIds, resourceId]
        };
      }
    });
  }, []);

  /**
   * Save a search to recent searches
   * @param categoryId - Selected category
   * @param symptoms - Selected symptoms
   * @param severityLevel - Selected severity level
   */
  const saveRecentSearch = useCallback((
    categoryId: string,
    symptoms: string[],
    severityLevel: string
  ) => {
    setPreferences(prev => {
      // Create new search entry
      const newSearch = {
        categoryId,
        symptoms,
        severityLevel,
        timestamp: Date.now()
      };
      
      // Add to recent searches, keeping only the most recent ones
      const updatedSearches = [
        newSearch,
        ...prev.recentSearches.filter(search => 
          // Avoid duplicates
          !(search.categoryId === categoryId && 
            search.severityLevel === severityLevel &&
            JSON.stringify(search.symptoms.sort()) === JSON.stringify(symptoms.sort()))
        )
      ].slice(0, MAX_RECENT_SEARCHES);
      
      return {
        ...prev,
        recentSearches: updatedSearches
      };
    });
  }, []);

  /**
   * Update preferred categories based on user selections
   * @param categoryId - Selected category
   */
  const updatePreferredCategories = useCallback((categoryId: string) => {
    setPreferences(prev => {
      // If category is already in preferred categories, move it to the top
      // Otherwise, add it to the top
      const updatedCategories = [
        categoryId,
        ...prev.preferredCategories.filter(id => id !== categoryId)
      ].slice(0, 3); // Keep only top 3 preferred categories
      
      return {
        ...prev,
        preferredCategories: updatedCategories
      };
    });
  }, []);

  /**
   * Clear all user preferences
   */
  const clearPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  /**
   * Clear only recent searches
   */
  const clearRecentSearches = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      recentSearches: []
    }));
  }, []);

  /**
   * Check if a resource is saved
   * @param resourceId - ID of the resource to check
   * @returns boolean indicating if the resource is saved
   */
  const isResourceSaved = useCallback((resourceId: string) => {
    return preferences.savedResourceIds.includes(resourceId);
  }, [preferences.savedResourceIds]);

  /**
   * Get saved resources from a list of all resources
   * @param allResources - All available resources
   * @returns Array of saved resources
   */
  const getSavedResources = useCallback((allResources: HealthResource[]) => {
    return allResources.filter(resource => 
      preferences.savedResourceIds.includes(resource.id)
    );
  }, [preferences.savedResourceIds]);

  return {
    preferences,
    isLoaded,
    actions: {
      toggleSavedResource,
      saveRecentSearch,
      updatePreferredCategories,
      clearPreferences,
      clearRecentSearches,
      isResourceSaved,
      getSavedResources
    }
  };
}
