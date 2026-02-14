"use client";

import { useState, useCallback } from 'react';
import { WizardState, WizardStep } from '../utils/types';

/**
 * Custom hook for managing wizard state in the symptom-based resource finder
 * Handles state transitions, selections, and navigation between steps
 */
export function useWizardState() {
  // Initialize wizard state
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 'welcome',
    selectedCategory: null,
    selectedSymptoms: [],
    selectedSeverity: null,
    recommendedResources: [],
    isLoading: false,
    showCrisisWarning: false
  });

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

  /**
   * Move to the next step in the wizard
   */
  const goToNextStep = useCallback((nextStep: WizardStep) => {
    setWizardState(prev => ({
      ...prev,
      currentStep: nextStep
    }));
  }, []);

  /**
   * Move to the previous step in the wizard
   */
  const goToPreviousStep = useCallback(() => {
    setWizardState(prev => {
      let previousStep: WizardStep = 'welcome';
      
      switch (prev.currentStep) {
        case 'category':
          previousStep = 'welcome';
          break;
        case 'symptoms':
          previousStep = 'category';
          break;
        case 'severity':
          previousStep = 'symptoms';
          break;
        case 'results':
          previousStep = 'severity';
          break;
        default:
          previousStep = 'welcome';
      }
      
      return {
        ...prev,
        currentStep: previousStep
      };
    });
  }, []);

  /**
   * Handle category selection and move to symptoms step
   */
  const handleCategorySelect = useCallback((categoryId: string) => {
    setWizardState(prev => ({
      ...prev,
      selectedCategory: categoryId,
      currentStep: 'symptoms'
    }));
  }, []);

  /**
   * Toggle symptom selection/deselection
   */
  const handleSymptomToggle = useCallback((symptomId: string) => {
    setWizardState(prev => {
      const updatedSymptoms = prev.selectedSymptoms.includes(symptomId)
        ? prev.selectedSymptoms.filter(id => id !== symptomId)
        : [...prev.selectedSymptoms, symptomId];
      
      return {
        ...prev,
        selectedSymptoms: updatedSymptoms
      };
    });
  }, []);

  /**
   * Handle severity selection and determine next steps
   * Modified to always proceed to results for any severity level
   */
  const handleSeveritySelect = useCallback((severityId: string) => {
    setWizardState(prev => {
      // Check if this is a crisis or severe case
      const isCrisisOrSevere = severityId === 'severe' || severityId === 'crisis';
      
      return {
        ...prev,
        selectedSeverity: severityId,
        // Only show crisis warning for severe/crisis levels
        showCrisisWarning: isCrisisOrSevere,
        // If not crisis/severe, immediately proceed to results step
        currentStep: isCrisisOrSevere ? prev.currentStep : 'results',
        // Set loading to true when proceeding directly to results
        isLoading: !isCrisisOrSevere
      };
    });
  }, []);

  /**
   * Handle crisis warning acknowledgment
   */
  const handleCrisisAcknowledged = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      showCrisisWarning: false
    }));
  }, []);

  /**
   * Continue to severity step after selecting symptoms
   */
  const handleContinueToSeverity = useCallback(() => {
    setWizardState(prev => ({
      ...prev,
      currentStep: 'severity'
    }));
  }, []);

  /**
   * Set recommended resources and move to results step
   */
  const setRecommendedResourcesAndGoToResults = useCallback((resources: any[]) => {
    setWizardState(prev => ({
      ...prev,
      recommendedResources: resources,
      currentStep: 'results',
      isLoading: false
    }));
  }, []);

  /**
   * Set loading state
   */
  const setLoading = useCallback((loading: boolean) => {
    setWizardState(prev => ({
      ...prev,
      isLoading: loading
    }));
  }, []);

  /**
   * Reset the wizard to initial state
   */
  const resetWizard = useCallback(() => {
    setWizardState({
      currentStep: 'welcome',
      selectedCategory: null,
      selectedSymptoms: [],
      selectedSeverity: null,
      recommendedResources: [],
      isLoading: false,
      showCrisisWarning: false
    });
  }, []);

  return {
    wizardState: {
      currentStep,
      selectedCategory,
      selectedSymptoms,
      selectedSeverity,
      recommendedResources,
      isLoading,
      showCrisisWarning
    },
    actions: {
      goToNextStep,
      goToPreviousStep,
      handleCategorySelect,
      handleSymptomToggle,
      handleSeveritySelect,
      handleCrisisAcknowledged,
      handleContinueToSeverity,
      setRecommendedResourcesAndGoToResults,
      setLoading,
      resetWizard
    }
  };
}
