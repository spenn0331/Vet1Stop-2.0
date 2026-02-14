"use client";

import { useCallback, useEffect, useState } from 'react';
import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserProfile } from '../firebase/useAuth';

// Analytics event types
export type AnalyticsEventType = 
  | 'resource_view'
  | 'resource_click'
  | 'resource_save'
  | 'resource_unsave'
  | 'resource_feedback'
  | 'search_performed'
  | 'filter_applied'
  | 'category_selected'
  | 'symptom_selected'
  | 'severity_selected'
  | 'pathway_started'
  | 'pathway_completed'
  | 'pathway_abandoned';

// Analytics event interface
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  resourceId?: string;
  resourceTitle?: string;
  resourceType?: string;
  categoryId?: string;
  symptoms?: string[];
  severityLevel?: string;
  rating?: number;
  feedback?: string;
  searchQuery?: string;
  filterOptions?: Record<string, any>;
  pathwayId?: string;
  pathwayStep?: number;
  totalSteps?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  userProfile?: {
    veteranStatus?: string;
    branch?: string;
    serviceYears?: number;
    state?: string;
  };
}

// Resource recommendation interface
export interface ResourceRecommendation {
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  score: number;
  matchReason: string;
  categories: string[];
  tags: string[];
}

/**
 * Custom hook for resource analytics
 * Tracks user interactions with resources and provides recommendations
 */
export function useResourceAnalytics(userProfile?: UserProfile | null) {
  const [sessionId] = useState<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [popularResources, setPopularResources] = useState<ResourceRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize analytics
  useEffect(() => {
    try {
      // Initialize Firebase Analytics if available
      if (typeof window !== 'undefined') {
        const analytics = getAnalytics();
        
        // Set user ID if authenticated
        if (userProfile?.uid) {
          setUserId(analytics, userProfile.uid);
          
          // Set user properties
          setUserProperties(analytics, {
            veteran_status: userProfile.veteranStatus || 'unknown',
            branch: userProfile.branch || 'unknown',
            service_years: userProfile.serviceYears || 0,
            state: userProfile.state || 'unknown'
          });
        }
        
        // Log session start
        logEvent(analytics, 'session_start', {
          session_id: sessionId
        });
        
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }, [sessionId, userProfile]);

  // Track event
  const trackEvent = useCallback(async (event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'userId' | 'userProfile'>) => {
    try {
      if (!isInitialized) return;
      
      // Create complete event object
      const completeEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
        sessionId,
        userId: userProfile?.uid,
        userProfile: userProfile ? {
          veteranStatus: userProfile.veteranStatus,
          branch: userProfile.branch,
          serviceYears: userProfile.serviceYears,
          state: userProfile.state
        } : undefined
      };
      
      // Log to Firebase Analytics
      if (typeof window !== 'undefined') {
        const analytics = getAnalytics();
        logEvent(analytics, event.eventType, {
          ...event,
          session_id: sessionId,
          user_id: userProfile?.uid || 'anonymous'
        });
      }
      
      // Store in Firestore for detailed analysis
      await addDoc(collection(db, 'analytics'), {
        ...completeEvent,
        timestamp: serverTimestamp()
      });
      
      console.log('Analytics event tracked:', completeEvent);
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }, [isInitialized, sessionId, userProfile]);

  // Track resource view
  const trackResourceView = useCallback((resourceData: {
    resourceId: string;
    resourceTitle: string;
    resourceType: string;
    categories?: string[];
    tags?: string[];
  }) => {
    trackEvent({
      eventType: 'resource_view',
      resourceId: resourceData.resourceId,
      resourceTitle: resourceData.resourceTitle,
      resourceType: resourceData.resourceType,
      metadata: {
        categories: resourceData.categories,
        tags: resourceData.tags
      }
    });
  }, [trackEvent]);

  // Track resource click
  const trackResourceClick = useCallback((resourceData: {
    resourceId: string;
    resourceTitle: string;
    resourceType: string;
    categories?: string[];
    tags?: string[];
  }) => {
    trackEvent({
      eventType: 'resource_click',
      resourceId: resourceData.resourceId,
      resourceTitle: resourceData.resourceTitle,
      resourceType: resourceData.resourceType,
      metadata: {
        categories: resourceData.categories,
        tags: resourceData.tags
      }
    });
  }, [trackEvent]);

  // Track search
  const trackSearch = useCallback((searchData: {
    categoryId?: string;
    symptoms?: string[];
    severityLevel?: string;
    searchQuery?: string;
    filterOptions?: Record<string, any>;
    resultCount: number;
  }) => {
    trackEvent({
      eventType: 'search_performed',
      categoryId: searchData.categoryId,
      symptoms: searchData.symptoms,
      severityLevel: searchData.severityLevel,
      searchQuery: searchData.searchQuery,
      filterOptions: searchData.filterOptions,
      metadata: {
        result_count: searchData.resultCount
      }
    });
  }, [trackEvent]);

  // Track resource feedback
  const trackFeedback = useCallback((feedbackData: {
    resourceId: string;
    resourceTitle?: string;
    rating: number;
    feedback?: string;
    categoryId?: string;
    symptoms?: string[];
    severityLevel?: string;
  }) => {
    trackEvent({
      eventType: 'resource_feedback',
      resourceId: feedbackData.resourceId,
      resourceTitle: feedbackData.resourceTitle,
      rating: feedbackData.rating,
      feedback: feedbackData.feedback,
      categoryId: feedbackData.categoryId,
      symptoms: feedbackData.symptoms,
      severityLevel: feedbackData.severityLevel
    });
  }, [trackEvent]);

  // Get personalized recommendations
  const getRecommendations = useCallback(async (
    categoryId?: string,
    symptoms?: string[],
    limit: number = 5
  ) => {
    setLoading(true);
    
    try {
      // In a real implementation, this would use a recommendation algorithm
      // For now, we'll simulate by fetching the most popular resources
      // that match the category and symptoms
      
      // Query analytics events to find popular resources
      const eventsRef = collection(db, 'analytics');
      let q = query(
        eventsRef,
        where('eventType', 'in', ['resource_click', 'resource_save', 'resource_feedback']),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      if (categoryId) {
        q = query(
          eventsRef,
          where('eventType', 'in', ['resource_click', 'resource_save', 'resource_feedback']),
          where('categoryId', '==', categoryId),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      // Count resource interactions
      const resourceCounts: Record<string, {
        count: number;
        resourceId: string;
        resourceTitle: string;
        resourceType: string;
        categories: string[];
        tags: string[];
        lastInteraction: Date;
      }> = {};
      
      querySnapshot.forEach(doc => {
        const data = doc.data() as AnalyticsEvent;
        
        if (data.resourceId && data.resourceTitle) {
          if (!resourceCounts[data.resourceId]) {
            resourceCounts[data.resourceId] = {
              count: 0,
              resourceId: data.resourceId,
              resourceTitle: data.resourceTitle,
              resourceType: data.resourceType || 'unknown',
              categories: data.metadata?.categories || [],
              tags: data.metadata?.tags || [],
              lastInteraction: data.timestamp
            };
          }
          
          // Increment count based on event type
          switch (data.eventType) {
            case 'resource_click':
              resourceCounts[data.resourceId].count += 1;
              break;
            case 'resource_save':
              resourceCounts[data.resourceId].count += 2;
              break;
            case 'resource_feedback':
              resourceCounts[data.resourceId].count += data.rating ? data.rating : 1;
              break;
            default:
              resourceCounts[data.resourceId].count += 1;
          }
        }
      });
      
      // Convert to array and sort by count
      const sortedResources = Object.values(resourceCounts)
        .sort((a, b) => b.count - a.count || b.lastInteraction.getTime() - a.lastInteraction.getTime())
        .slice(0, limit);
      
      // Convert to recommendations
      const recommendations: ResourceRecommendation[] = sortedResources.map(resource => ({
        resourceId: resource.resourceId,
        resourceTitle: resource.resourceTitle,
        resourceType: resource.resourceType,
        score: resource.count,
        matchReason: categoryId 
          ? `Popular in ${categoryId}` 
          : 'Popular with veterans',
        categories: resource.categories,
        tags: resource.tags
      }));
      
      setRecommendations(recommendations);
      setLoading(false);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      setLoading(false);
      return [];
    }
  }, []);

  // Get popular resources
  const getPopularResources = useCallback(async (limit: number = 5) => {
    setLoading(true);
    
    try {
      // Query analytics events to find popular resources
      const eventsRef = collection(db, 'analytics');
      const q = query(
        eventsRef,
        where('eventType', 'in', ['resource_click', 'resource_save', 'resource_feedback']),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Count resource interactions
      const resourceCounts: Record<string, {
        count: number;
        resourceId: string;
        resourceTitle: string;
        resourceType: string;
        categories: string[];
        tags: string[];
      }> = {};
      
      querySnapshot.forEach(doc => {
        const data = doc.data() as AnalyticsEvent;
        
        if (data.resourceId && data.resourceTitle) {
          if (!resourceCounts[data.resourceId]) {
            resourceCounts[data.resourceId] = {
              count: 0,
              resourceId: data.resourceId,
              resourceTitle: data.resourceTitle,
              resourceType: data.resourceType || 'unknown',
              categories: data.metadata?.categories || [],
              tags: data.metadata?.tags || []
            };
          }
          
          // Increment count based on event type
          switch (data.eventType) {
            case 'resource_click':
              resourceCounts[data.resourceId].count += 1;
              break;
            case 'resource_save':
              resourceCounts[data.resourceId].count += 2;
              break;
            case 'resource_feedback':
              resourceCounts[data.resourceId].count += data.rating ? data.rating : 1;
              break;
            default:
              resourceCounts[data.resourceId].count += 1;
          }
        }
      });
      
      // Convert to array and sort by count
      const sortedResources = Object.values(resourceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
      
      // Convert to recommendations
      const popular: ResourceRecommendation[] = sortedResources.map(resource => ({
        resourceId: resource.resourceId,
        resourceTitle: resource.resourceTitle,
        resourceType: resource.resourceType,
        score: resource.count,
        matchReason: 'Popular with veterans',
        categories: resource.categories,
        tags: resource.tags
      }));
      
      setPopularResources(popular);
      setLoading(false);
      
      return popular;
    } catch (error) {
      console.error('Error getting popular resources:', error);
      setLoading(false);
      return [];
    }
  }, []);

  return {
    trackEvent,
    trackResourceView,
    trackResourceClick,
    trackSearch,
    trackFeedback,
    getRecommendations,
    getPopularResources,
    recommendations,
    popularResources,
    loading,
    sessionId,
    isInitialized
  };
}
