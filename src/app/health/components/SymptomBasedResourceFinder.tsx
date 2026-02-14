"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ChevronRightIcon, 
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { HealthResource } from '../types/HealthResourceTypes';
import NGOResourceCard from './NGOResourceCard';
import { SYMPTOM_CATEGORIES, SEVERITY_LEVELS } from '../data/symptomCategories';

// Import utility functions
import { filterHealthResources } from '../utils/health-resource-utils';

/**
 * Mapping from symptom categories to resource categories
 * This helps match user symptoms to relevant resource categories
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
  'mental': ['Mental Health', 'Crisis Services', 'Family Support'],
  'physical': ['Physical Health', 'Specialized Care', 'Rehabilitation'],
  'life': ['Family Support', 'Wellness Programs', 'Specialized Care'],
  'crisis': ['Crisis Services', 'Mental Health', 'Emergency Services']
};

/**
 * Props for the SymptomBasedResourceFinder component
 */
interface SymptomBasedResourceFinderProps {
  resources: HealthResource[];
  onSaveResource: (resourceId: string) => void;
  savedResourceIds: string[];
  onViewDetails: (resource: HealthResource) => void;
}

/**
 * A component that helps veterans find health resources based on their symptoms
 * rather than medical diagnoses. Uses a step-by-step wizard approach.
 */
const SymptomBasedResourceFinder: React.FC<SymptomBasedResourceFinderProps> = ({
  resources,
  onSaveResource,
  savedResourceIds,
  onViewDetails
}) => {
  /**
   * Wizard step types for the symptom-based resource finder
   */
  type WizardStep = 'category' | 'symptoms' | 'severity' | 'results';
  
  /**
   * State management for the wizard
   */
  const [currentStep, setCurrentStep] = useState<WizardStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [recommendedResources, setRecommendedResources] = useState<HealthResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisWarning, setShowCrisisWarning] = useState(false);

  /**
   * Get the current category object based on selected category ID
   */
  const currentCategoryObj = useMemo(() => {
    return SYMPTOM_CATEGORIES.find(cat => cat.id === selectedCategory);
  }, [selectedCategory]);

  /**
   * Handle category selection and move to symptoms step
   */
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentStep('symptoms');
  }, []);

  /**
   * Toggle symptom selection/deselection
   */
  const handleSymptomToggle = useCallback((symptomId: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomId)) {
        return prev.filter(id => id !== symptomId);
      } else {
        return [...prev, symptomId];
      }
    });
  }, []);

  /**
   * Handle severity selection and determine next steps
   */
  const handleSeveritySelect = useCallback((severityId: string) => {
    setSelectedSeverity(severityId);
    
    // Show crisis warning for severe or crisis levels
    if (severityId === 'severe' || severityId === 'crisis') {
      setShowCrisisWarning(true);
    } else {
      findResources(severityId);
    }
  }, []);

  /**
   * Handle crisis warning acknowledgment and proceed with resource finding
   */
  const handleCrisisAcknowledged = useCallback(() => {
    setShowCrisisWarning(false);
    if (selectedSeverity) {
      findResources(selectedSeverity);
    }
  }, [selectedSeverity]);

  /**
   * Find resources based on user selections
   */
  const findResources = useCallback((severityLevel: string) => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      try {
        // Get the selected category mapping
        const categoryTags = CATEGORY_MAPPING[selectedCategory] || [];
        
        // Filter resources based on selections
        const filtered = resources.filter(resource => {
          // Check if resource has any of the categories we're looking for
          const hasMatchingCategory = resource.categories?.some(cat => 
            categoryTags.includes(cat)
          ) || false;
          
          // For severe/crisis, prioritize verified resources
          if (severityLevel === 'severe' || severityLevel === 'crisis') {
            return hasMatchingCategory && resource.isVerified;
          }
          
          return hasMatchingCategory;
        });
        
        // Sort by relevance (verified first, then rating)
        const sorted = [...filtered].sort((a, b) => {
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;
          return b.rating - a.rating;
        });
        
        // Limit to top 6 resources
        setRecommendedResources(sorted.slice(0, 6));
        setCurrentStep('results');
      } catch (error) {
        console.error('Error finding resources:', error);
        setRecommendedResources([]);
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  }, [selectedCategory, resources]);

  /**
   * Reset the wizard to initial state
   */
  const resetWizard = useCallback(() => {
    setSelectedCategory(null);
    setSelectedSymptoms([]);
    setSelectedSeverity(null);
    setRecommendedResources([]);
    setCurrentStep('category');
    setShowCrisisWarning(false);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white p-6">
        <h3 className="text-2xl font-bold">Symptom-Based Resource Finder</h3>
        <p className="mt-2">
          Find resources based on how you're feeling, not medical terminology.
          We'll help connect you with appropriate support.
        </p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Crisis Warning Modal */}
        {showCrisisWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-start mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-600">Crisis Resources Available</h3>
                  <p className="mt-2 text-gray-700">
                    Based on your responses, you may be experiencing a serious situation that requires immediate attention.
                  </p>
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="font-bold">Veterans Crisis Line</p>
                    <p className="mt-1">Call: <a href="tel:988" className="text-blue-600 font-bold">988</a> (then press 1)</p>
                    <p className="mt-1">Text: <span className="font-bold">838255</span></p>
                    <p className="mt-1">Chat: <a href="https://www.veteranscrisisline.net/chat" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">VeteransCrisisLine.net</a></p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCrisisAcknowledged}
                  className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                >
                  Continue to Resources
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${currentStep === 'category' ? 'text-blue-900 font-bold' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === 'category' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
              1
            </div>
            <span className="ml-2">Select Category</span>
          </div>
          <ChevronRightIcon className="h-5 w-5 mx-2 text-gray-400" />
          
          <div className={`flex items-center ${currentStep === 'symptoms' ? 'text-blue-900 font-bold' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === 'symptoms' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
              2
            </div>
            <span className="ml-2">Select Symptoms</span>
          </div>
          <ChevronRightIcon className="h-5 w-5 mx-2 text-gray-400" />
          
          <div className={`flex items-center ${currentStep === 'severity' ? 'text-blue-900 font-bold' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === 'severity' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
              3
            </div>
            <span className="ml-2">Severity</span>
          </div>
          <ChevronRightIcon className="h-5 w-5 mx-2 text-gray-400" />
          
          <div className={`flex items-center ${currentStep === 'results' ? 'text-blue-900 font-bold' : 'text-gray-500'}`}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${currentStep === 'results' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700'}`}>
              4
            </div>
            <span className="ml-2">Resources</span>
          </div>
        </div>
        
        {/* Step Content */}
        <div className="mt-6">
          {/* Step 1: Category Selection */}
          {currentStep === 'category' && (
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">What area are you experiencing challenges with?</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SYMPTOM_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{category.icon}</span>
                      <h5 className="text-lg font-bold">{category.title}</h5>
                    </div>
                    <p className="text-gray-600">{category.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 2: Symptom Selection */}
          {currentStep === 'symptoms' && currentCategoryObj && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  Which {currentCategoryObj.title} symptoms are you experiencing?
                </h4>
                <button 
                  onClick={() => setCurrentStep('category')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">Select all that apply. You can choose multiple options.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {currentCategoryObj.symptoms.map(symptom => (
                  <div 
                    key={symptom.id}
                    onClick={() => handleSymptomToggle(symptom.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSymptoms.includes(symptom.id) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        selectedSymptoms.includes(symptom.id) 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-400'
                      }`}>
                        {selectedSymptoms.includes(symptom.id) && (
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <span className="ml-3">{symptom.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCurrentStep('severity')}
                  disabled={selectedSymptoms.length === 0}
                  className={`px-6 py-2 rounded-md ${
                    selectedSymptoms.length > 0
                      ? 'bg-blue-900 text-white hover:bg-blue-800'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          
          {/* Step 3: Severity Selection */}
          {currentStep === 'severity' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  How would you rate the severity of your symptoms?
                </h4>
                <button 
                  onClick={() => setCurrentStep('symptoms')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Back
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">This helps us recommend the most appropriate resources for your situation.</p>
              
              <div className="space-y-4">
                {SEVERITY_LEVELS.map(level => (
                  <div 
                    key={level.id}
                    onClick={() => handleSeveritySelect(level.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedSeverity === level.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                        selectedSeverity === level.id 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-400'
                      }`}>
                        {selectedSeverity === level.id && (
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">{level.label}</span>
                        <p className="text-sm text-gray-600">{level.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* No continue button needed here as clicking a severity option automatically advances */}
            </div>
          )}
          
          {/* Step 4: Results */}
          {currentStep === 'results' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">
                  Recommended Resources
                </h4>
                <button 
                  onClick={resetWizard}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Start Over
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ArrowPathIcon className="h-12 w-12 text-blue-900 animate-spin" />
                  <p className="mt-4 text-gray-700">Finding resources that match your needs...</p>
                </div>
              ) : recommendedResources.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Based on your responses, we've identified these resources that may help with your situation.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedResources.map(resource => (
                      <NGOResourceCard
                        key={resource.id}
                        resource={resource}
                        isSaved={savedResourceIds.includes(resource.id)}
                        onSave={onSaveResource}
                        onViewDetails={onViewDetails}
                      />
                    ))}
                  </div>
                  
                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex">
                      <QuestionMarkCircleIcon className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" />
                      <div>
                        <h5 className="font-bold text-blue-900">Need more help?</h5>
                        <p className="mt-1 text-gray-700">
                          If these resources don't address your needs, please consider speaking with a healthcare provider
                          or calling the Veterans Crisis Line at <a href="tel:988" className="text-blue-600 font-bold">988</a> (then press 1).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-700">No matching resources found. Please try different symptoms or categories.</p>
                  <button
                    onClick={resetWizard}
                    className="mt-4 px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomBasedResourceFinder;
