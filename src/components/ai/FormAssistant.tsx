/**
 * Form Assistant Component
 * 
 * This component helps veterans fill out forms by providing AI-powered
 * suggestions based on their profiles and previous inputs.
 * It's especially valuable for veterans with disabilities who may find
 * form completion challenging.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  SparklesIcon, 
  CheckIcon,
  XMarkIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { UserProfile } from '@/lib/ai/contextManager';
import { getFormSuggestions } from '@/lib/ai/grokService';

// Patriotic color scheme
const COLORS = {
  PRIMARY: '#1A2C5B', // Navy blue
  SECONDARY: '#EAB308', // Gold
  ACCENT: '#B22234', // Red
  LIGHT: '#F9FAFB',
  DARK: '#111827',
};

// Mock function to get form suggestions (would be replaced with actual API call)
const getSuggestions = async (
  fieldName: string,
  fieldType: string,
  userProfile: UserProfile
): Promise<string> => {
  // This is a mock implementation
  // In production, this would use the Grok AI API
  
  // Simple mapping of field types to suggestions based on user profile
  const mockSuggestions: Record<string, (profile: UserProfile) => string> = {
    'name': (profile) => profile.name || 'John Doe',
    'email': (profile) => 'veteran@example.com',
    'phone': (profile) => '555-123-4567',
    'address': (profile) => `123 Veterans Way, ${profile.location || 'Your City'}`,
    'zipcode': (profile) => '12345',
    'service_branch': (profile) => profile.serviceBranch || 'Army',
    'service_dates': (profile) => '2010-2018',
    'service_era': (profile) => profile.serviceEra || 'Post-9/11',
    'rank': (profile) => 'E-5 (Sergeant)',
    'disability_rating': (profile) => profile.disabilityRating || '30%',
    'va_number': (profile) => '12345678',
    'education_level': (profile) => 'Some college (2 years)',
    'employment_status': (profile) => 'Seeking employment',
    'income': (profile) => '$45,000-$60,000',
    'housing_status': (profile) => 'Renting',
    'emergency_contact': (profile) => 'Jane Doe, 555-987-6543',
    'medical_conditions': (profile) => 'Please consult your medical records for accurate information',
    'medications': (profile) => 'Please consult your medical records for accurate information'
  };
  
  // Detect field type from name if not explicitly provided
  let effectiveFieldType = fieldType.toLowerCase();
  
  if (!effectiveFieldType) {
    const fieldNameLower = fieldName.toLowerCase();
    if (fieldNameLower.includes('name')) effectiveFieldType = 'name';
    else if (fieldNameLower.includes('email')) effectiveFieldType = 'email';
    else if (fieldNameLower.includes('phone')) effectiveFieldType = 'phone';
    else if (fieldNameLower.includes('address')) effectiveFieldType = 'address';
    else if (fieldNameLower.includes('zip')) effectiveFieldType = 'zipcode';
    else if (fieldNameLower.includes('branch')) effectiveFieldType = 'service_branch';
    else if (fieldNameLower.includes('service') && fieldNameLower.includes('date')) effectiveFieldType = 'service_dates';
    else if (fieldNameLower.includes('era')) effectiveFieldType = 'service_era';
    else if (fieldNameLower.includes('rank')) effectiveFieldType = 'rank';
    else if (fieldNameLower.includes('disability')) effectiveFieldType = 'disability_rating';
    else if (fieldNameLower.includes('va') && fieldNameLower.includes('number')) effectiveFieldType = 'va_number';
    else if (fieldNameLower.includes('education')) effectiveFieldType = 'education_level';
    else if (fieldNameLower.includes('employ')) effectiveFieldType = 'employment_status';
    else if (fieldNameLower.includes('income')) effectiveFieldType = 'income';
    else if (fieldNameLower.includes('housing')) effectiveFieldType = 'housing_status';
    else if (fieldNameLower.includes('emergency')) effectiveFieldType = 'emergency_contact';
    else if (fieldNameLower.includes('medical') || fieldNameLower.includes('condition')) effectiveFieldType = 'medical_conditions';
    else if (fieldNameLower.includes('medication')) effectiveFieldType = 'medications';
  }
  
  // Generate suggestion
  if (mockSuggestions[effectiveFieldType]) {
    return mockSuggestions[effectiveFieldType](userProfile);
  }
  
  // Default suggestion
  return 'No suggestion available';
};

interface FormAssistantProps {
  userProfile: UserProfile;
  targetInputId?: string;
  targetInputName?: string;
  targetFormId?: string;
  position?: 'above' | 'below' | 'right' | 'left';
  theme?: 'light' | 'dark';
  onSuggestionAccepted?: (fieldName: string, value: string) => void;
}

const FormAssistant: React.FC<FormAssistantProps> = ({
  userProfile,
  targetInputId,
  targetInputName,
  targetFormId,
  position = 'above',
  theme = 'light',
  onSuggestionAccepted
}) => {
  // States
  const [visible, setVisible] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentField, setCurrentField] = useState<{
    id: string;
    name: string;
    type: string;
    element: HTMLInputElement | HTMLTextAreaElement | null;
  } | null>(null);
  
  // Refs
  const assistantRef = useRef<HTMLDivElement>(null);
  
  // Theme styles
  const themeStyles = {
    light: {
      bg: 'bg-white',
      text: 'text-gray-800',
      border: 'border-gray-200'
    },
    dark: {
      bg: 'bg-gray-800',
      text: 'text-white',
      border: 'border-gray-700'
    }
  };
  
  // Position styles
  const positionStyles = {
    above: 'bottom-full mb-2',
    below: 'top-full mt-2',
    right: 'left-full ml-2',
    left: 'right-full mr-2'
  };
  
  // Initialize form watching
  useEffect(() => {
    // Find the target form element
    const formElement = targetFormId 
      ? document.getElementById(targetFormId) as HTMLFormElement
      : null;
    
    // For a specific input
    if (targetInputId || targetInputName) {
      const inputElement = targetInputId 
        ? document.getElementById(targetInputId) as HTMLInputElement
        : targetInputName 
          ? document.querySelector(`[name="${targetInputName}"]`) as HTMLInputElement
          : null;
      
      if (inputElement) {
        // Watch just this input
        const handleFocus = () => {
          setCurrentField({
            id: inputElement.id,
            name: inputElement.name,
            type: inputElement.type,
            element: inputElement
          });
          
          generateSuggestion(inputElement.name, inputElement.type);
        };
        
        inputElement.addEventListener('focus', handleFocus);
        
        return () => {
          inputElement.removeEventListener('focus', handleFocus);
        };
      }
    } 
    // For all inputs in a form
    else if (formElement) {
      // Watch all inputs in the form
      const handleInputFocus = (e: Event) => {
        const input = e.target as HTMLInputElement | HTMLTextAreaElement;
        
        // Only process text-like inputs
        if (
          input.tagName === 'INPUT' && 
          ['text', 'email', 'tel', 'url', 'search'].includes(input.type) ||
          input.tagName === 'TEXTAREA'
        ) {
          setCurrentField({
            id: input.id,
            name: input.name,
            type: input.type,
            element: input
          });
          
          generateSuggestion(input.name, input.type);
        }
      };
      
      const inputs = formElement.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', handleInputFocus);
      });
      
      return () => {
        inputs.forEach(input => {
          input.removeEventListener('focus', handleInputFocus);
        });
      };
    }
  }, [targetInputId, targetInputName, targetFormId]);
  
  // Generate suggestion for the current field
  const generateSuggestion = async (fieldName: string, fieldType: string) => {
    if (!fieldName) return;
    
    setIsLoading(true);
    setSuggestion(null);
    setVisible(true);
    
    try {
      const suggestionText = await getSuggestions(fieldName, fieldType, userProfile);
      setSuggestion(suggestionText);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      setSuggestion(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Accept the suggestion
  const acceptSuggestion = () => {
    if (!currentField?.element || !suggestion) return;
    
    // Set the value
    currentField.element.value = suggestion;
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    currentField.element.dispatchEvent(event);
    
    // Hide assistant
    setVisible(false);
    
    // Callback
    if (onSuggestionAccepted) {
      onSuggestionAccepted(currentField.name, suggestion);
    }
  };
  
  // Dismiss the assistant
  const dismissAssistant = () => {
    setVisible(false);
  };
  
  // If not visible, don't render
  if (!visible) return null;

  return (
    <div 
      ref={assistantRef}
      className={`absolute ${positionStyles[position]} z-10 ${themeStyles[theme].bg} ${themeStyles[theme].text} rounded-lg shadow-lg border ${themeStyles[theme].border} w-64 overflow-hidden`}
      role="dialog"
      aria-labelledby="assistant-title"
    >
      {/* Header */}
      <div 
        className="px-3 py-2 flex justify-between items-center border-b border-gray-200"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.LIGHT }}
      >
        <div className="flex items-center">
          <SparklesIcon className="h-4 w-4 mr-1" style={{ color: COLORS.SECONDARY }} />
          <h3 id="assistant-title" className="text-sm font-medium">Form Assistant</h3>
        </div>
        <button
          onClick={dismissAssistant}
          aria-label="Close assistant"
          className="text-gray-300 hover:text-white"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <div className="animate-spin h-4 w-4 border-2 rounded-full border-blue-600 border-t-transparent"></div>
            <span className="ml-2 text-sm">Generating suggestion...</span>
          </div>
        ) : suggestion ? (
          <div>
            <div className="flex items-start mb-2">
              <LightBulbIcon className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" style={{ color: COLORS.SECONDARY }} />
              <div>
                <p className="text-xs font-medium mb-1">Suggested for {currentField?.name || 'this field'}:</p>
                <p className="text-sm p-2 bg-gray-100 rounded-md dark:bg-gray-700">{suggestion}</p>
              </div>
            </div>
            
            <div className="flex space-x-2 justify-end">
              <button
                onClick={dismissAssistant}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
              >
                Dismiss
              </button>
              <button
                onClick={acceptSuggestion}
                className="px-2 py-1 text-xs flex items-center rounded"
                style={{ backgroundColor: COLORS.SECONDARY, color: COLORS.DARK }}
              >
                <CheckIcon className="h-3 w-3 mr-1" />
                <span>Use Suggestion</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-2">
            No suggestions available for this field.
          </p>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
        Powered by Vet1Stop AI
      </div>
    </div>
  );
};

export default FormAssistant;
