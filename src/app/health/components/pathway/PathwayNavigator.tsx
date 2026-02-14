"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';

/**
 * Step interface for pathway navigation
 * @property id - Unique identifier for the step
 * @property title - Display title for the step
 * @property completed - Whether the step has been completed
 */
export interface Step {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
}

/**
 * Props for the PathwayNavigator component
 * @property steps - Array of steps in the pathway
 * @property currentStepIndex - Index of the current active step
 * @property onNavigate - Callback when navigating to a different step
 * @property onComplete - Callback when the pathway is completed
 * @property isCompleted - Whether the entire pathway has been completed
 */
export interface PathwayNavigatorProps {
  steps: Step[];
  currentStepIndex: number;
  onNavigate: (index: number) => void;
  onComplete: () => void;
  isCompleted?: boolean;
}

/**
 * A component for navigating through a series of steps in a healthcare pathway
 * Displays progress, allows navigation between steps, and tracks completion
 */
const PathwayNavigator: React.FC<PathwayNavigatorProps> = ({
  steps,
  currentStepIndex,
  onNavigate,
  onComplete,
  isCompleted = false
}) => {
  // Track overall progress through the pathway
  const [progress, setProgress] = useState(0);
  
  // Calculate progress percentage based on completed steps
  useEffect(() => {
    if (!steps || steps.length === 0) return;
    
    const completedSteps = steps.filter(step => step.completed).length;
    const progressPercentage = (completedSteps / steps.length) * 100;
    setProgress(progressPercentage);
  }, [steps]);

  // Memoized navigation state to avoid recalculations
  const navigationState = useMemo(() => {
    return {
      isFirstStep: currentStepIndex === 0,
      isLastStep: currentStepIndex === steps.length - 1,
      canNavigateBack: currentStepIndex > 0,
      canNavigateForward: currentStepIndex < steps.length - 1
    };
  }, [currentStepIndex, steps.length]);
  
  // Handle navigation to previous step
  const handlePreviousStep = useCallback(() => {
    if (navigationState.canNavigateBack) {
      onNavigate(currentStepIndex - 1);
    }
  }, [currentStepIndex, navigationState.canNavigateBack, onNavigate]);
  
  // Handle navigation to next step
  const handleNextStep = useCallback(() => {
    if (navigationState.canNavigateForward) {
      onNavigate(currentStepIndex + 1);
    }
  }, [currentStepIndex, navigationState.canNavigateForward, onNavigate]);
  
  // Handle direct navigation to a specific step
  const handleStepClick = useCallback((index: number) => {
    // Only allow navigation to completed steps or the current step + 1
    const canNavigateToStep = index <= currentStepIndex || 
      (index === currentStepIndex + 1) || 
      steps[index]?.completed;
      
    if (canNavigateToStep) {
      onNavigate(index);
    }
  }, [currentStepIndex, onNavigate, steps]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Progress bar */}
      <div className="mb-4" aria-label="Pathway progress">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Your progress</span>
          <span className="text-sm font-medium text-gray-700" aria-live="polite">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-900 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between mb-4" role="tablist">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = step.completed;
          const isDisabled = !isCompleted && !isActive && index !== currentStepIndex + 1;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(index)}
                disabled={isDisabled}
                aria-selected={isActive}
                aria-disabled={isDisabled}
                role="tab"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive
                  ? 'bg-blue-900 text-white'
                  : isCompleted
                    ? 'bg-green-100 text-green-800 border border-green-800 hover:bg-green-200'
                    : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              <span 
                className={`text-xs mt-1 ${isActive ? 'font-bold' : ''}`}
                aria-hidden="true"
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handlePreviousStep}
          disabled={navigationState.isFirstStep}
          aria-label="Go to previous step"
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${navigationState.isFirstStep
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-blue-900 border border-blue-900 hover:bg-blue-50'
          }`}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" aria-hidden="true" />
          Previous
        </button>
        
        {navigationState.isLastStep ? (
          <button
            onClick={onComplete}
            disabled={isCompleted}
            aria-label={isCompleted ? "Pathway already completed" : "Complete pathway"}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isCompleted
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                Completed
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                Complete Pathway
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNextStep}
            aria-label="Go to next step"
            className="flex items-center px-3 py-2 text-sm font-medium bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" aria-hidden="true" />
          </button>
        )}
      </div>
      
      {/* PDF Download button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="text-blue-600 text-sm flex items-center hover:text-blue-800">
          <DocumentTextIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          Download pathway as PDF
        </button>
      </div>
    </div>
  );
};

export default PathwayNavigator;
