"use client";

import React from 'react';
import { HealthResource } from '@/app/health/types/consolidated-health-types';

// Import components
import WelcomeScreen from '@/app/health/components/symptom-finder/components/WelcomeScreen';
import CategorySelector from '@/app/health/components/symptom-finder/components/CategorySelector';
import SymptomSelector from '@/app/health/components/symptom-finder/components/SymptomSelector';
import SeverityAssessor from '@/app/health/components/symptom-finder/components/SeverityAssessor';
import ResourceResults from '@/app/health/components/symptom-finder/components/ResourceResults';
import ProgressIndicator from '@/app/health/components/symptom-finder/components/ProgressIndicator';
import CrisisWarningModal from '@/app/health/components/symptom-finder/components/CrisisWarningModal';

// Import custom hooks
import { useWizardState } from '@/app/health/components/symptom-finder/hooks/useWizardState';
import { useResourceMatcher } from '@/app/health/components/symptom-finder/hooks/useResourceMatcher';
import { useUserPreferences } from '@/app/health/components/symptom-finder/hooks/useUserPreferences';
import { useAnalytics } from '@/app/health/components/symptom-finder/hooks/useAnalytics';
import { usePerformanceOptimizer } from '@/app/health/components/symptom-finder/hooks/usePerformanceOptimizer';

// Import data
import { SYMPTOM_CATEGORIES, SEVERITY_LEVELS } from '@/app/health/components/symptom-finder/utils/data';

// Import types
import { SymptomCategory, RecentSearch } from '@/app/health/components/symptom-finder/utils/types';

// Import animations
import { motion } from 'framer-motion';

/**
 * Props for the SymptomBasedResourceFinder component
 */
interface SymptomBasedResourceFinderProps {
  resources: HealthResource[];
  onSaveResource?: (resourceId: string) => void;
  savedResourceIds?: string[];
  onViewDetails?: (resource: HealthResource) => void;
}

// Define the analytics tracking interface to fix TypeScript errors
interface SearchAnalyticsData {
  categoryId: string;
  symptoms: string[];
  severityLevel: string;
  resultCount: number;
  fromCache?: boolean;
}

interface ResourceClickData {
  resourceId: string;
  resourceTitle: string;
  resourceType: string;
  isVerified: boolean;
}

/**
 * A component that helps veterans find health resources based on their symptoms
 * rather than medical diagnoses. Uses a step-by-step wizard approach with a
 * conversational interface.
 */
const SymptomBasedResourceFinder: React.FC<SymptomBasedResourceFinderProps> = ({
  resources,
  onSaveResource = () => {},
  savedResourceIds = [],
  onViewDetails = () => {}
}) => {
  // Use performance optimizer for monitoring and optimization
  const { 
    startResourceMatchMeasurement,
    endResourceMatchMeasurement,
    cacheResult,
    getCachedResult,
    measurePerformance
  } = usePerformanceOptimizer();
  
  // Use custom hooks for state management and resource matching
  const { wizardState, actions } = useWizardState();
  const { findMatchingResources } = useResourceMatcher(resources);
  const { preferences, actions: preferenceActions } = useUserPreferences();
  const { trackSearch, trackResourceClick } = useAnalytics();
  
  // Destructure state for easier access
  const {
    currentStep,
    selectedCategory,
    selectedSymptoms,
    selectedSeverity,
    recommendedResources,
    isLoading,
    showCrisisWarning
  } = wizardState;
  
  // Destructure actions for easier access
  const {
    goToNextStep,
    goToPreviousStep,
    handleCategorySelect,
    handleSymptomToggle,
    handleSeveritySelect: wizardHandleSeveritySelect,
    handleCrisisAcknowledged: handleCrisisWarningClosed,
    handleContinueToSeverity,
    setRecommendedResourcesAndGoToResults,
    setLoading,
    resetWizard
  } = actions;
  
  /**
   * Get the current category object based on selected category ID
   */
  const currentCategoryObj = React.useMemo(() => {
    return SYMPTOM_CATEGORIES.find((cat: SymptomCategory) => cat.id === selectedCategory);
  }, [selectedCategory]);
  
  /**
   * Find resources based on user selections with performance optimization
   */
  const findResources = React.useCallback(async (severityLevel: string) => {
    if (!selectedCategory) return;
    
    setLoading(true);
    
    try {
      // Generate cache key based on selections
      const cacheKey = `${selectedCategory}_${selectedSymptoms.sort().join(',')}_${severityLevel}`;
      
      // Check cache first
      const cachedResults = getCachedResult(cacheKey);
      if (cachedResults && Array.isArray(cachedResults) && cachedResults.length > 0) {
        console.log('Using cached results');
        setRecommendedResourcesAndGoToResults(cachedResults);
        
        // Still track the search for analytics
        trackSearch({
          categoryId: selectedCategory,
          symptoms: selectedSymptoms,
          severityLevel: severityLevel,
          resultCount: cachedResults.length,
          fromCache: true
        } as SearchAnalyticsData);
        
        return;
      }
      
      // Start performance measurement
      startResourceMatchMeasurement();
      
      // Find matching resources
      const matchedResources = await findMatchingResources(
        selectedCategory,
        selectedSymptoms,
        severityLevel
      );
      
      // End performance measurement
      endResourceMatchMeasurement();
      
      // Cache the results
      cacheResult(cacheKey, matchedResources);
      
      // Update state with matched resources
      setRecommendedResourcesAndGoToResults(matchedResources);
      
      // Save search to recent searches
      if (selectedCategory && severityLevel) {
        preferenceActions.saveRecentSearch(
          selectedCategory,
          selectedSymptoms,
          severityLevel
        );
        
        // Update preferred categories
        preferenceActions.updatePreferredCategories(selectedCategory);
        
        // Track search for analytics
        trackSearch({
          categoryId: selectedCategory,
          symptoms: selectedSymptoms,
          severityLevel: severityLevel,
          resultCount: matchedResources.length,
          fromCache: false
        } as SearchAnalyticsData);
      }
    } catch (error) {
      console.error('Error finding resources:', error);
      setRecommendedResourcesAndGoToResults([]);
    }
  }, [
    selectedCategory, 
    selectedSymptoms, 
    findMatchingResources, 
    setLoading, 
    setRecommendedResourcesAndGoToResults, 
    preferenceActions,
    trackSearch,
    startResourceMatchMeasurement,
    endResourceMatchMeasurement,
    cacheResult,
    getCachedResult
  ]);
  
  /**
   * Handle crisis warning acknowledgment and proceed with resource finding
   * Modified to ensure resources are fetched and displayed
   */
  const handleCrisisAcknowledged = React.useCallback(() => {
    // Close the crisis warning modal
    handleCrisisWarningClosed();
    
    // Always fetch resources when crisis warning is acknowledged
    if (selectedCategory && selectedSeverity) {
      // Find resources for the selected severity level
      findResources(selectedSeverity);
      
      // Explicitly move to results step after fetching resources
      goToNextStep('results');
    }
  }, [handleCrisisWarningClosed, selectedCategory, selectedSeverity, findResources, goToNextStep]);
  
  /**
   * Handle saving a resource
   */
  const handleSaveResource = React.useCallback((resourceId: string) => {
    // Toggle in local preferences
    preferenceActions.toggleSavedResource(resourceId);
    
    // Call external onSaveResource if provided
    onSaveResource(resourceId);
  }, [preferenceActions, onSaveResource]);
  
  /**
   * Handle severity selection
   */
  const handleSeveritySelect = React.useCallback((severityId: string) => {
    // Set severity level in state
    wizardHandleSeveritySelect(severityId);
    
    // For non-crisis/severe severity levels, find resources immediately
    if (severityId !== 'severe' && severityId !== 'crisis') {
      findResources(severityId);
    }
    // For severe/crisis, the crisis warning modal will be shown first
    // Resources will be fetched after the user acknowledges the warning
  }, [wizardHandleSeveritySelect, findResources]);
  
  /**
   * Handle resource details view
   */
  const handleViewDetails = React.useCallback((resource: HealthResource) => {
    // Track resource click for analytics
    trackResourceClick({
      resourceId: resource.id || '',
      resourceTitle: resource.title || '',
      resourceType: resource.categories?.[0] || 'unknown',
      isVerified: resource.isVerified || false
    } as ResourceClickData);
    
    // Call external onViewDetails if provided
    onViewDetails(resource);
  }, [trackResourceClick, onViewDetails]);
  
  /**
   * Handle recent search selection
   */
  const handleRecentSearchSelect = React.useCallback((search: RecentSearch) => {
    // Reset wizard to initial state
    resetWizard();
    
    // Set selected category and move to symptoms step
    handleCategorySelect(search.categoryId);
    
    // Set selected symptoms
    search.symptoms.forEach(symptom => {
      handleSymptomToggle(symptom);
    });
    
    // Continue to severity step
    handleContinueToSeverity();
    
    // Set severity level
    handleSeveritySelect(search.severityLevel);
  }, [
    resetWizard,
    handleCategorySelect,
    handleSymptomToggle,
    handleContinueToSeverity,
    handleSeveritySelect
  ]);
  
  /**
   * Render the current step of the wizard
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeScreen
            onStart={() => goToNextStep('category')}
            recentSearches={preferences.recentSearches}
            onLoadRecentSearch={handleRecentSearchSelect}
            onClearRecentSearches={preferenceActions.clearRecentSearches}
          />
        );
      case 'category':
        return (
          <CategorySelector
            categories={SYMPTOM_CATEGORIES}
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
            onBack={() => goToNextStep('welcome')}
          />
        );
      case 'symptoms':
        return (
          <SymptomSelector
            category={currentCategoryObj || SYMPTOM_CATEGORIES[0]}
            selectedSymptoms={selectedSymptoms}
            onSymptomToggle={handleSymptomToggle}
            onContinue={handleContinueToSeverity}
            onBack={goToPreviousStep}
          />
        );
      case 'severity':
        return (
          <SeverityAssessor
            severityLevels={SEVERITY_LEVELS}
            selectedSeverity={selectedSeverity}
            onSeveritySelect={handleSeveritySelect}
            onBack={goToPreviousStep}
          />
        );
      case 'results':
        return (
          <ResourceResults
            resources={recommendedResources}
            isLoading={isLoading}
            onSaveResource={handleSaveResource}
            savedResourceIds={savedResourceIds}
            onViewDetails={handleViewDetails}
            onStartOver={resetWizard}
          />
        );
      default:
        return (
          <WelcomeScreen
            onStart={() => goToNextStep('category')}
            recentSearches={preferences.recentSearches}
            onLoadRecentSearch={handleRecentSearchSelect}
            onClearRecentSearches={preferenceActions.clearRecentSearches}
          />
        );
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      {/* Progress indicator */}
      {currentStep !== 'welcome' && (
        <ProgressIndicator
          currentStep={currentStep}
        />
      )}
      
      {/* Main content */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {renderCurrentStep()}
      </motion.div>
      
      {/* Crisis warning modal */}
      {showCrisisWarning && (
        <CrisisWarningModal
          onAcknowledge={handleCrisisAcknowledged}
        />
      )}
    </div>
  );
};

export default SymptomBasedResourceFinder;
