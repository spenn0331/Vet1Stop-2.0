"use client";

import React from 'react';
import { WizardStep } from '../utils/types';

interface ProgressIndicatorProps {
  currentStep: WizardStep;
  showCrisisWarning: boolean;
}

/**
 * A component that displays the current progress in the symptom-based resource finder wizard
 */
const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  currentStep,
  showCrisisWarning
}) => {
  // Define steps in the wizard
  const steps = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'category', label: 'Category' },
    { id: 'symptoms', label: 'Symptoms' },
    { id: 'severity', label: 'Severity' },
    { id: 'results', label: 'Resources' }
  ];

  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200" aria-label="Progress indicator">
      <div className="hidden md:flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => {
          // Determine if this step is active, completed, or upcoming
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          // Skip the welcome step in the progress indicator
          if (step.id === 'welcome') return null;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-900 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index}</span>
                  )}
                </div>
                <span className={`mt-2 text-sm ${
                  isActive ? 'text-blue-900 font-semibold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector Line (not after the last step) */}
              {index < steps.length - 1 && index > 0 && (
                <div 
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  role="presentation"
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Mobile Progress Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            Step {currentStepIndex === 0 ? 1 : currentStepIndex} of {steps.length - 1}
          </span>
          <span className="text-sm font-medium text-blue-900">
            {steps[currentStepIndex]?.label}
          </span>
        </div>
        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-900 rounded-full" 
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            role="progressbar"
            aria-valuenow={(currentStepIndex / (steps.length - 1)) * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>
      
      {/* Crisis Warning Indicator */}
      {showCrisisWarning && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center">
          <span className="mr-2">⚠️</span>
          <span>Crisis resources are available. Please review the information.</span>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
