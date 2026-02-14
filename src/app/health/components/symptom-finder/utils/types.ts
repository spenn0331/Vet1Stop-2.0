/**
 * Types for the symptom-based resource finder
 */

// Wizard step types for the symptom-based resource finder
export type WizardStep = 'welcome' | 'category' | 'symptoms' | 'severity' | 'results';

// Symptom category for the symptom-based resource finder
export interface SymptomCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  symptoms: {
    id: string;
    label: string;
  }[];
}

// Severity level for the symptom-based resource finder
export interface SeverityLevel {
  id: string;
  label: string;
  description: string;
}

// Wizard state for the symptom-based resource finder
export interface WizardState {
  currentStep: WizardStep;
  selectedCategory: string | null;
  selectedSymptoms: string[];
  selectedSeverity: string | null;
  recommendedResources: any[];
  isLoading: boolean;
  showCrisisWarning: boolean;
}

// Recent search type for the symptom-based resource finder
export interface RecentSearch {
  categoryId: string;
  symptoms: string[];
  severityLevel: string;
  timestamp: number;
  resultCount?: number;
}

// User preferences for the symptom-based resource finder
export interface UserPreferences {
  savedResourceIds: string[];
  preferredCategories: string[];
  recentSearches: RecentSearch[];
  isLoaded: boolean;
}

// Search analytics data for the symptom-based resource finder
export interface SearchAnalyticsData {
  categoryId: string;
  symptoms: string[];
  severityLevel: string;
  resultCount: number;
  fromCache?: boolean;
}

// Resource click analytics data for the symptom-based resource finder
export interface ResourceClickAnalyticsData {
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  isVerified?: boolean;
}

// Analytics event types for the symptom-based resource finder
export interface AnalyticsEvent {
  eventType: 'view' | 'search' | 'resource_click' | 'save' | 'feedback';
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
  // Additional properties for specific event types
  categoryId?: string;
  symptoms?: string[];
  severityLevel?: string;
  resultCount?: number;
  fromCache?: boolean;
}

// Feedback data for the symptom-based resource finder
export interface FeedbackData {
  resourceId: string;
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: number;
  sessionId: string;
  userId?: string;
}
