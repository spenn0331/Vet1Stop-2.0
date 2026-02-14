"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { WizardStep } from '../utils/types';
import { progressIndicatorVariants } from '../utils/animations';

interface EnhancedProgressIndicatorProps {
  currentStep: WizardStep;
  showCrisisWarning: boolean;
}

/**
 * An enhanced progress indicator component with animations and visual feedback
 * for the symptom-based resource finder
 */
const EnhancedProgressIndicator: React.FC<EnhancedProgressIndicatorProps> = ({
  currentStep,
  showCrisisWarning
}) => {
  // Define steps in the wizard
  const steps = [
    { id: 'welcome', label: 'Welcome', icon: '👋' },
    { id: 'category', label: 'Category', icon: '🔍' },
    { id: 'symptoms', label: 'Symptoms', icon: '📋' },
    { id: 'severity', label: 'Severity', icon: '📊' },
    { id: 'results', label: 'Resources', icon: '🎯' }
  ];

  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Calculate progress percentage
  const progressPercentage = currentStepIndex > 0 
    ? Math.round((currentStepIndex / (steps.length - 1)) * 100) 
    : 0;

  // Determine if we should show the crisis warning indicator
  const shouldShowCrisisWarning = showCrisisWarning && currentStep === 'severity';

  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200" aria-label="Progress indicator">
      {/* Mobile Progress Bar */}
      <div className="md:hidden mb-2">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{currentStepIndex > 0 ? steps[currentStepIndex].label : 'Start'}</span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600 rounded-full"
            variants={progressIndicatorVariants}
            initial="hidden"
            animate="visible"
            custom={progressPercentage}
          />
        </div>
      </div>

      {/* Desktop Step Indicators */}
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
                <motion.div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-900 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  } ${shouldShowCrisisWarning && step.id === 'severity' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                  whileHover={{ scale: 1.1 }}
                  animate={
                    isActive 
                      ? { scale: [1, 1.1, 1], transition: { duration: 0.5 } } 
                      : {}
                  }
                >
                  <span role="img" aria-hidden="true">{step.icon}</span>
                </motion.div>
                <span className={`mt-2 text-sm ${
                  isActive 
                    ? 'font-bold text-blue-900' 
                    : isCompleted 
                      ? 'font-medium text-green-600' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                
                {/* Crisis Warning Indicator */}
                {shouldShowCrisisWarning && step.id === 'severity' && (
                  <motion.div 
                    className="mt-1 text-xs text-red-600 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    Crisis Alert
                  </motion.div>
                )}
              </div>
              
              {/* Connector Line (except after the last step) */}
              {index < steps.length - 1 && index > 0 && (
                <div className="flex-1 h-px mx-2">
                  <div className="h-full bg-gray-300 relative">
                    {isCompleted && (
                      <motion.div 
                        className="absolute inset-0 bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5 }}
                      />
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Crisis Warning Banner */}
      {shouldShowCrisisWarning && (
        <motion.div 
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Veterans Crisis Line Available</p>
              <p className="mt-1">If you're experiencing a crisis, help is available 24/7 at <strong>988</strong> (press 1) or text <strong>838255</strong>.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedProgressIndicator;
