"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/lib/firebase/useAuth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/config';

export interface SearchHistoryItem {
  id: string;
  categoryId: string;
  categoryName: string;
  symptoms: {
    id: string;
    name: string;
  }[];
  severityLevel: string;
  timestamp: Date;
  resourcesFound: number;
  resourcesClicked?: string[];
  resourcesSaved?: string[];
}

/**
 * Custom hook for managing user search history
 * Enables personalization and improved user experience
 */
export function useSearchHistory() {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load search history
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For authenticated users, load from Firestore
        if (user?.uid) {
          const historyRef = collection(db, 'users', user.uid, 'searchHistory');
          const q = query(
            historyRef,
            orderBy('timestamp', 'desc'),
            limit(20)
          );
          
          const querySnapshot = await getDocs(q);
          
          const history: SearchHistoryItem[] = [];
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            
            history.push({
              id: doc.id,
              categoryId: data.categoryId,
              categoryName: data.categoryName,
              symptoms: data.symptoms,
              severityLevel: data.severityLevel,
              timestamp: data.timestamp.toDate(),
              resourcesFound: data.resourcesFound,
              resourcesClicked: data.resourcesClicked,
              resourcesSaved: data.resourcesSaved
            });
          });
          
          setSearchHistory(history);
          setRecentSearches(history.slice(0, 5));
        } 
        // For anonymous users, load from localStorage
        else {
          const storedHistory = localStorage.getItem('searchHistory');
          
          if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory) as SearchHistoryItem[];
            
            // Convert string timestamps back to Date objects
            const history = parsedHistory.map(item => ({
              ...item,
              timestamp: new Date(item.timestamp)
            }));
            
            setSearchHistory(history);
            setRecentSearches(history.slice(0, 5));
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading search history:', error);
        setError('Failed to load search history');
        setIsLoading(false);
      }
    };
    
    loadSearchHistory();
  }, [user]);
  
  // Add search to history
  const addSearchToHistory = useCallback(async (searchData: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
    try {
      const newSearch: SearchHistoryItem = {
        ...searchData,
        id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date()
      };
      
      // For authenticated users, save to Firestore
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid, 'searchHistory', newSearch.id), {
          ...newSearch,
          timestamp: serverTimestamp()
        });
        
        // Update user's search preferences based on this search
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.recentCategories': arrayUnion(searchData.categoryId),
          'preferences.recentSymptoms': arrayUnion(...searchData.symptoms.map(s => s.id)),
          'preferences.lastSeverityLevel': searchData.severityLevel,
          'preferences.lastUpdated': serverTimestamp()
        });
      } 
      // For anonymous users, save to localStorage
      else {
        const storedHistory = localStorage.getItem('searchHistory');
        
        let history: SearchHistoryItem[] = [];
        
        if (storedHistory) {
          history = JSON.parse(storedHistory);
        }
        
        // Add new search to history
        history.unshift(newSearch);
        
        // Limit history to 20 items
        if (history.length > 20) {
          history = history.slice(0, 20);
        }
        
        // Save to localStorage
        localStorage.setItem('searchHistory', JSON.stringify(history));
      }
      
      // Update state
      setSearchHistory(prev => [newSearch, ...prev].slice(0, 20));
      setRecentSearches(prev => [newSearch, ...prev].slice(0, 5));
      
      return newSearch.id;
    } catch (error) {
      console.error('Error adding search to history:', error);
      return null;
    }
  }, [user]);
  
  // Update search with resource interaction
  const updateSearchWithResourceInteraction = useCallback(async (
    searchId: string, 
    resourceId: string, 
    interactionType: 'click' | 'save'
  ) => {
    try {
      // For authenticated users, update in Firestore
      if (user?.uid) {
        const searchRef = doc(db, 'users', user.uid, 'searchHistory', searchId);
        
        if (interactionType === 'click') {
          await updateDoc(searchRef, {
            resourcesClicked: arrayUnion(resourceId)
          });
        } else if (interactionType === 'save') {
          await updateDoc(searchRef, {
            resourcesSaved: arrayUnion(resourceId)
          });
        }
      } 
      // For anonymous users, update in localStorage
      else {
        const storedHistory = localStorage.getItem('searchHistory');
        
        if (storedHistory) {
          let history = JSON.parse(storedHistory) as SearchHistoryItem[];
          
          // Find and update the search
          history = history.map(item => {
            if (item.id === searchId) {
              if (interactionType === 'click') {
                return {
                  ...item,
                  resourcesClicked: [...(item.resourcesClicked || []), resourceId]
                };
              } else if (interactionType === 'save') {
                return {
                  ...item,
                  resourcesSaved: [...(item.resourcesSaved || []), resourceId]
                };
              }
            }
            return item;
          });
          
          // Save to localStorage
          localStorage.setItem('searchHistory', JSON.stringify(history));
          
          // Update state
          setSearchHistory(history);
          setRecentSearches(history.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error updating search with resource interaction:', error);
    }
  }, [user]);
  
  // Clear search history
  const clearSearchHistory = useCallback(async () => {
    try {
      // For authenticated users, delete from Firestore
      if (user?.uid) {
        const historyRef = collection(db, 'users', user.uid, 'searchHistory');
        const q = query(historyRef);
        
        const querySnapshot = await getDocs(q);
        
        const batch = db.batch();
        
        querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
      } 
      // For anonymous users, clear localStorage
      else {
        localStorage.removeItem('searchHistory');
      }
      
      // Update state
      setSearchHistory([]);
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [user]);
  
  // Get search by ID
  const getSearchById = useCallback((searchId: string) => {
    return searchHistory.find(item => item.id === searchId) || null;
  }, [searchHistory]);
  
  // Get similar searches
  const getSimilarSearches = useCallback((categoryId: string, symptomIds: string[]) => {
    return searchHistory.filter(item => {
      // Check if category matches
      if (item.categoryId === categoryId) {
        // Check if at least one symptom matches
        return item.symptoms.some(symptom => symptomIds.includes(symptom.id));
      }
      return false;
    });
  }, [searchHistory]);
  
  // Get recommended searches based on history
  const getRecommendedSearches = useCallback(() => {
    // Group searches by category
    const categoryCounts: Record<string, number> = {};
    
    searchHistory.forEach(item => {
      if (!categoryCounts[item.categoryId]) {
        categoryCounts[item.categoryId] = 0;
      }
      categoryCounts[item.categoryId]++;
    });
    
    // Sort categories by count
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([categoryId]) => categoryId);
    
    // Get most recent search for each top category
    const recommendedSearches: SearchHistoryItem[] = [];
    
    for (const categoryId of sortedCategories) {
      const categorySearches = searchHistory.filter(item => item.categoryId === categoryId);
      
      if (categorySearches.length > 0) {
        // Sort by timestamp (most recent first)
        categorySearches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Add most recent search to recommended searches
        recommendedSearches.push(categorySearches[0]);
        
        // Limit to 3 recommended searches
        if (recommendedSearches.length >= 3) {
          break;
        }
      }
    }
    
    return recommendedSearches;
  }, [searchHistory]);
  
  return {
    searchHistory,
    recentSearches,
    isLoading,
    error,
    addSearchToHistory,
    updateSearchWithResourceInteraction,
    clearSearchHistory,
    getSearchById,
    getSimilarSearches,
    getRecommendedSearches
  };
}
