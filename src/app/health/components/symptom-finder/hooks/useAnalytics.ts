"use client";

import { useState, useCallback, useEffect } from 'react';

// Types for analytics events
export type AnalyticsEvent = {
  eventType: 'view' | 'search' | 'resource_click' | 'save' | 'feedback';
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
};

// Types for feedback
export type FeedbackData = {
  resourceId: string;
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: number;
  sessionId: string;
  userId?: string;
};

/**
 * Custom hook for tracking analytics and user feedback
 * Prepares for future integration with Firebase Analytics
 */
export function useAnalytics() {
  // State for tracking events
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize analytics
  useEffect(() => {
    // Generate a unique session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(newSessionId);

    // In the future, this would initialize Firebase Analytics
    // For now, we'll just log to console
    console.log('Analytics initialized with session ID:', newSessionId);

    setIsInitialized(true);

    // Track page view
    // Using direct object creation instead of trackEvent to avoid circular dependency
    const pageViewEvent: AnalyticsEvent = {
      eventType: 'view',
      category: 'health',
      action: 'page_view',
      label: 'symptom_finder',
      timestamp: Date.now(),
      sessionId: newSessionId
    };

    // Log the event and store it
    console.log('Analytics event:', pageViewEvent);
    setEvents(prev => [...prev, pageViewEvent]);

    // Cleanup function
    return () => {
      // In the future, this would send any unsent events to Firebase
      console.log('Analytics cleanup');
    };
  }, []);

  /**
   * Track an analytics event
   * @param event - The event to track
   */
  const trackEvent = useCallback((event: {
    eventType: 'view' | 'search' | 'resource_click' | 'save' | 'feedback';
    category?: string;
    action?: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
    userId?: string;
  }) => {
    if (!isInitialized) return;

    // Create a complete event with sessionId and timestamp
    const fullEvent: AnalyticsEvent = {
      ...event,
      sessionId,
      timestamp: Date.now()
    };

    // In the future, this would send the event to Firebase Analytics
    // For now, we'll just log to console and store in local state
    console.log('Analytics event:', fullEvent);

    setEvents(prev => [...prev, fullEvent]);

    // In a production environment, we would also send the event to the server
    // via an API call to store in the database
  }, [isInitialized, sessionId]);

  /**
   * Track a search event
   * @param searchData - The search data to track
   */
  const trackSearch = useCallback((searchData: {
    categoryId: string;
    symptoms: string[];
    severityLevel: string;
    resultCount: number;
  }) => {
    trackEvent({
      eventType: 'search',
      category: 'health',
      action: 'symptom_search',
      label: searchData.categoryId,
      value: searchData.resultCount,
      metadata: {
        symptoms: searchData.symptoms,
        severityLevel: searchData.severityLevel
      }
    });
  }, [trackEvent]);

  /**
   * Track a resource click event
   * @param resourceData - The resource data to track
   */
  const trackResourceClick = useCallback((resourceData: {
    resourceId: string;
    resourceTitle: string;
    resourceType: string;
    isVerified: boolean;
  }) => {
    trackEvent({
      eventType: 'resource_click',
      category: 'health',
      action: 'resource_click',
      label: resourceData.resourceTitle,
      metadata: {
        resourceId: resourceData.resourceId,
        resourceType: resourceData.resourceType,
        isVerified: resourceData.isVerified
      }
    });
  }, [trackEvent]);

  /**
   * Submit feedback for a resource
   * @param feedbackData - The feedback data to submit
   */
  const submitFeedback = useCallback((feedbackData: Omit<FeedbackData, 'sessionId' | 'timestamp'>) => {
    if (!isInitialized) return;

    const fullFeedback: FeedbackData = {
      ...feedbackData,
      sessionId,
      timestamp: Date.now()
    };

    // In the future, this would send the feedback to Firebase
    // For now, we'll just log to console and store in local state
    console.log('Feedback submitted:', fullFeedback);

    setFeedback(prev => [...prev, fullFeedback]);

    // Track feedback event
    trackEvent({
      eventType: 'feedback',
      category: 'health',
      action: 'resource_feedback',
      label: feedbackData.resourceId,
      value: feedbackData.rating,
      metadata: {
        helpful: feedbackData.helpful,
        comment: feedbackData.comment
      }
    });

    // In a production environment, we would also send the feedback to the server
    // via an API call to store in the database
  }, [isInitialized, sessionId, trackEvent]);

  return {
    trackEvent,
    trackSearch,
    trackResourceClick,
    submitFeedback,
    sessionId,
    isInitialized
  };
}
