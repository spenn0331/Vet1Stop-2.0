/**
 * Voice Command Button Component
 * 
 * This component provides a floating button for activating voice commands,
 * particularly important for veterans with disabilities or amputees who
 * may have difficulty using traditional input methods.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MicrophoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useVoiceCommand from '@/hooks/useVoiceCommand';

// Patriotic color scheme
const COLORS = {
  PRIMARY: '#1A2C5B', // Navy blue
  SECONDARY: '#EAB308', // Gold
  ACCENT: '#B22234', // Red
  LIGHT: '#F9FAFB',
  DARK: '#111827',
};

interface VoiceCommandButtonProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  userProfile?: any;
}

const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ 
  position = 'bottom-left',
  userProfile
}) => {
  // States
  const [isActive, setIsActive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Router for navigation
  const router = useRouter();
  
  // Position styles
  const positionStyles = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-24', // Right of chatbot
    'top-left': 'top-24 left-6',
    'top-right': 'top-24 right-6',
  };
  
  // Voice command hook
  const {
    isListening,
    transcript,
    isProcessing,
    lastResult,
    error,
    startListening,
    stopListening,
    reset
  } = useVoiceCommand({
    continuous: false,
    onCommand: (result) => {
      // Display feedback
      setFeedback(`Command recognized: ${result.action}`);
      setShowFeedback(true);
      
      // Handle navigation commands
      if (result.intent === 'navigation' && result.action === 'navigate') {
        const target = result.parameters?.target;
        if (target) {
          // Small delay to show feedback before navigating
          setTimeout(() => {
            router.push(`/${target}`);
            setIsActive(false);
          }, 1500);
        }
      }
      
      // Handle search commands
      if (result.intent === 'search' && result.action === 'find_resources') {
        const query = result.parameters?.keywords || '';
        const category = result.parameters?.category || '';
        
        if (category) {
          // Small delay to show feedback before navigating
          setTimeout(() => {
            router.push(`/${category}?search=${query}`);
            setIsActive(false);
          }, 1500);
        } else {
          // General search
          setTimeout(() => {
            router.push(`/search?q=${query}`);
            setIsActive(false);
          }, 1500);
        }
      }
      
      // Handle form commands (could be extended)
      if (result.intent === 'form') {
        setFeedback('Form assistance is not yet implemented');
        setShowFeedback(true);
      }
    },
    onError: (errorMessage) => {
      setFeedback(`Error: ${errorMessage}`);
      setShowFeedback(true);
    }
  });
  
  // Hide feedback after delay
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showFeedback]);
  
  // Toggle voice commands
  const toggleVoiceCommands = () => {
    if (isActive) {
      stopListening();
      reset();
      setIsActive(false);
    } else {
      setIsActive(true);
      startListening();
    }
  };
  
  // Keyboard shortcut (Alt+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') {
        toggleVoiceCommands();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  
  return (
    <>
      {/* Voice command button */}
      <button 
        onClick={toggleVoiceCommands}
        aria-label={isActive ? 'Stop voice commands' : 'Start voice commands'}
        className={`fixed ${positionStyles[position]} w-12 h-12 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all z-30`}
        style={{ 
          backgroundColor: isActive ? COLORS.ACCENT : COLORS.PRIMARY,
          color: COLORS.LIGHT
        }}
      >
        {isActive ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <MicrophoneIcon className="h-5 w-5" />
        )}
      </button>
      
      {/* Voice UI panel */}
      {isActive && (
        <div 
          className={`fixed ${position.includes('bottom') ? 'bottom-20' : 'top-24'} ${position.includes('left') ? 'left-6' : 'right-24'} w-80 bg-white rounded-lg shadow-xl p-4 z-30 border border-gray-200`}
          aria-live="polite"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-blue-900" style={{ color: COLORS.PRIMARY }}>
              Voice Commands
            </h3>
            <button
              onClick={toggleVoiceCommands}
              aria-label="Close voice commands"
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-16 h-16">
              <div 
                className={`absolute inset-0 rounded-full bg-blue-100 ${
                  isListening ? 'animate-ping opacity-75' : 'opacity-50'
                }`}
                style={{ backgroundColor: isListening ? COLORS.SECONDARY : '#E5E7EB' }}
              ></div>
              <div className="absolute inset-0 rounded-full bg-white bg-opacity-50 flex items-center justify-center">
                <MicrophoneIcon 
                  className={`h-8 w-8 ${isListening ? 'text-blue-600' : 'text-gray-500'}`}
                  style={{ color: isListening ? COLORS.PRIMARY : '#6B7280' }}
                />
              </div>
            </div>
          </div>
          
          <div className="text-center mb-3">
            {isListening ? (
              <p className="font-medium text-blue-700" style={{ color: COLORS.PRIMARY }}>
                Listening...
              </p>
            ) : isProcessing ? (
              <p className="font-medium text-gray-600">
                Processing...
              </p>
            ) : (
              <p className="font-medium text-gray-500">
                Press Alt+V or click to speak
              </p>
            )}
          </div>
          
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 w-full max-h-24 overflow-y-auto">
              <p className="text-gray-800">{transcript}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg p-2 text-sm mb-3">
              {error}
            </div>
          )}
          
          {showFeedback && feedback && (
            <div className="bg-blue-50 text-blue-700 rounded-lg p-2 text-sm mb-3">
              {feedback}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2">
            <p className="mb-1">Example commands:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>"Go to health page"</li>
              <li>"Find mental health resources"</li>
              <li>"Search for education benefits"</li>
              <li>"Show me job opportunities"</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceCommandButton;
