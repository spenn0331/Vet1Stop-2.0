"use client";

import React from 'react';
import { SeverityLevel } from '../utils/types';

interface SeverityAssessorProps {
  severityLevels: SeverityLevel[];
  selectedSeverity: string | null;
  onSeveritySelect: (severityId: string) => void;
  onBack: () => void;
}

/**
 * Component for assessing the severity of symptoms
 */
const SeverityAssessor: React.FC<SeverityAssessorProps> = ({
  severityLevels,
  selectedSeverity,
  onSeveritySelect,
  onBack
}) => {
  // Define colors for different severity levels
  const getSeverityColor = (severityId: string): string => {
    switch (severityId) {
      case 'mild':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'moderate':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'severe':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'crisis':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          How would you rate the severity of your symptoms?
        </h2>
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center"
          aria-label="Go back to symptom selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">
        This helps us recommend the most appropriate resources for your situation. Select the option that best describes your experience.
      </p>
      
      {/* Severity selection */}
      <div className="space-y-4 mb-8">
        {severityLevels.map(level => (
          <div 
            key={level.id}
            onClick={() => onSeveritySelect(level.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedSeverity === level.id 
                ? `border-blue-500 ${getSeverityColor(level.id)}` 
                : 'hover:border-gray-400'
            }`}
            role="radio"
            aria-checked={selectedSeverity === level.id}
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSeveritySelect(level.id);
              }
            }}
          >
            <div className="flex items-center">
              <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                selectedSeverity === level.id 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'border-gray-400'
              }`}>
                {selectedSeverity === level.id && (
                  <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <span className="font-medium text-gray-900">{level.label}</span>
                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
              </div>
            </div>
            
            {/* Visual indicator of severity */}
            <div className="mt-3 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  level.id === 'mild' ? 'bg-green-500 w-1/4' :
                  level.id === 'moderate' ? 'bg-yellow-500 w-2/4' :
                  level.id === 'severe' ? 'bg-orange-500 w-3/4' :
                  'bg-red-500 w-full'
                }`}
                role="presentation"
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Note about crisis resources */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-bold text-blue-700">Important Note</h4>
            <p className="mt-1 text-gray-700">
              If you select "Severe" or "Crisis," we'll show you immediate resources that can help, including crisis support options.
            </p>
          </div>
        </div>
      </div>
      
      {/* No continue button needed here as clicking a severity option automatically advances */}
    </div>
  );
};

export default SeverityAssessor;
