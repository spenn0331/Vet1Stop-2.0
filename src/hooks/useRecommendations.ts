/**
 * useRecommendations Hook
 * 
 * Custom React hook for fetching AI-powered resource recommendations
 * based on user profile, context, and preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/lib/ai/contextManager';

export interface Recommendation {
  id?: string;
  title: string;
  description: string;
  reason: string;
  url: string;
  category?: string;
  tags?: string[];
  rating?: number;
}

interface UseRecommendationsOptions {
  category?: string;
  count?: number;
  specificNeeds?: string[];
  autoFetch?: boolean;
}

/**
 * Custom hook for AI recommendation functionality
 */
export default function useRecommendations(
  userProfile: UserProfile,
  options: UseRecommendationsOptions = {}
) {
  // Default options
  const {
    category = 'default',
    count = 3,
    specificNeeds = [],
    autoFetch = true
  } = options;
  
  // States
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Fetch recommendations from the API
   */
  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the API
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile,
          category,
          specificNeeds,
          count
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add unique IDs if not provided
      const recommendationsWithIds = data.recommendations.map((rec: Recommendation, index: number) => ({
        ...rec,
        id: rec.id || `rec_${Date.now()}_${index}`
      }));
      
      setRecommendations(recommendationsWithIds);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to get recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, category, specificNeeds, count]);
  
  // Fetch recommendations on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);
  
  /**
   * Refresh recommendations
   */
  const refreshRecommendations = () => {
    fetchRecommendations();
  };
  
  /**
   * Submit feedback on a recommendation
   */
  const submitFeedback = useCallback(async (
    recommendationId: string,
    isHelpful: boolean,
    additionalFeedback?: string
  ) => {
    try {
      // This would call an API endpoint in production
      // For now, just log the feedback
      console.log('Recommendation feedback:', {
        recommendationId,
        isHelpful,
        additionalFeedback
      });
      
      // Update the state to reflect the feedback
      // In a real implementation, this might update a database
      return true;
    } catch (err) {
      console.error('Error submitting feedback:', err);
      return false;
    }
  }, []);
  
  return {
    recommendations,
    isLoading,
    error,
    fetchRecommendations,
    refreshRecommendations,
    submitFeedback
  };
}
