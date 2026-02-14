"use client";

import React, { useState } from 'react';
import { 
  ChevronRightIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

// Types
interface Resource {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  category: string;
  website?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  location?: {
    city?: string;
    state?: string;
    address?: string;
  };
  veteranLed?: boolean;
  tags?: string[];
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'slider' | 'checkbox';
  category?: string;
  options?: {
    id: string;
    label: string;
    value: string;
  }[];
  nextQuestionId?: string;
}

interface UnifiedResourceFinderProps {
  category?: 'mental-health' | 'physical-health' | 'preventive-care' | 'specialized-care' | 'benefits' | 'all';
  initialQuestion?: string;
}

const UnifiedResourceFinder: React.FC<UnifiedResourceFinderProps> = ({ 
  category = 'all',
  initialQuestion = 'main'
}) => {
  // State variables
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>(initialQuestion);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Questions based on category
  const getQuestions = (): Question[] => {
    // Define category-specific questions
    const mentalHealthQuestions: Question[] = [
      {
        id: 'symptoms',
        text: 'What mental health concerns are you experiencing?',
        type: 'checkbox',
        category: 'mental-health',
        options: [
          { id: 'anxiety', label: 'Anxiety or nervousness', value: 'anxiety' },
          { id: 'depression', label: 'Feeling down or depressed', value: 'depression' },
          { id: 'ptsd', label: 'PTSD symptoms (flashbacks, nightmares)', value: 'ptsd' },
          { id: 'sleep', label: 'Sleep problems', value: 'sleep-issues' },
          { id: 'stress', label: 'Stress or feeling overwhelmed', value: 'stress' },
          { id: 'substance', label: 'Substance use concerns', value: 'substance-use' },
          { id: 'anger', label: 'Anger management issues', value: 'anger' },
          { id: 'grief', label: 'Grief or loss', value: 'grief' }
        ],
        nextQuestionId: 'mental-health-duration'
      },
      {
        id: 'mental-health-duration',
        text: 'How long have you been experiencing these concerns?',
        type: 'multiple-choice',
        category: 'mental-health',
        options: [
          { id: 'recent', label: 'Recently (within the last month)', value: 'recent' },
          { id: 'months', label: 'For several months', value: 'months' },
          { id: 'years', label: 'For a year or longer', value: 'years' },
          { id: 'since-service', label: 'Since my military service', value: 'since-service' }
        ],
        nextQuestionId: 'support-preference'
      }
    ];
    
    const physicalHealthQuestions: Question[] = [
      {
        id: 'symptoms',
        text: 'What physical health concerns are you experiencing?',
        type: 'checkbox',
        category: 'physical-health',
        options: [
          { id: 'pain', label: 'Chronic pain', value: 'chronic-pain' },
          { id: 'fatigue', label: 'Fatigue or low energy', value: 'fatigue' },
          { id: 'headaches', label: 'Headaches or migraines', value: 'headaches' },
          { id: 'mobility', label: 'Mobility or movement issues', value: 'mobility' },
          { id: 'respiratory', label: 'Breathing difficulties', value: 'respiratory' },
          { id: 'cardiovascular', label: 'Heart or circulation issues', value: 'cardiovascular' },
          { id: 'musculoskeletal', label: 'Joint, muscle, or bone problems', value: 'musculoskeletal' }
        ],
        nextQuestionId: 'physical-health-service-connected'
      },
      {
        id: 'physical-health-service-connected',
        text: 'Are these issues related to your military service?',
        type: 'multiple-choice',
        category: 'physical-health',
        options: [
          { id: 'yes-documented', label: 'Yes, and I have a service-connected rating', value: 'yes-documented' },
          { id: 'yes-undocumented', label: 'Yes, but not yet documented', value: 'yes-undocumented' },
          { id: 'unsure', label: 'I\'m not sure', value: 'unsure' },
          { id: 'no', label: 'No, not related to my service', value: 'no' }
        ],
        nextQuestionId: 'support-preference'
      }
    ];
    
    const benefitsQuestions: Question[] = [
      {
        id: 'benefits',
        text: 'What benefits information are you looking for?',
        type: 'checkbox',
        category: 'benefits',
        options: [
          { id: 'eligibility', label: 'Eligibility requirements', value: 'eligibility' },
          { id: 'enrollment', label: 'How to enroll in VA healthcare', value: 'enrollment' },
          { id: 'claims', label: 'Filing or checking claims', value: 'claims' },
          { id: 'coverage', label: 'Understanding coverage', value: 'coverage' },
          { id: 'community-care', label: 'Community Care options', value: 'community-care' },
          { id: 'appeals', label: 'Appeals process', value: 'appeals' },
          { id: 'disability', label: 'Disability compensation', value: 'disability' }
        ],
        nextQuestionId: 'benefits-status'
      },
      {
        id: 'benefits-status',
        text: 'What is your current status with VA benefits?',
        type: 'multiple-choice',
        category: 'benefits',
        options: [
          { id: 'new', label: 'I\'m new to VA benefits', value: 'new' },
          { id: 'enrolled', label: 'I\'m enrolled but have questions', value: 'enrolled' },
          { id: 'issues', label: 'I\'m having issues with my benefits', value: 'issues' },
          { id: 'changes', label: 'I need to make changes to my benefits', value: 'changes' }
        ],
        nextQuestionId: 'support-preference'
      }
    ];
    
    // Common questions for all categories
    const commonQuestions: Question[] = [
      {
        id: 'main',
        text: 'What are you looking for help with today?',
        type: 'multiple-choice',
        options: [
          { id: 'symptoms', label: 'I have specific symptoms or concerns', value: 'symptoms' },
          { id: 'resources', label: 'I want to explore available resources', value: 'resources' },
          { id: 'benefits', label: 'I need help understanding my benefits', value: 'benefits' },
          { id: 'crisis', label: 'I need immediate help (crisis)', value: 'crisis' }
        ]
      },
      {
        id: 'symptoms',
        text: 'What symptoms or concerns are you experiencing?',
        type: 'checkbox',
        options: [
          // Mental health symptoms
          { id: 'anxiety', label: 'Anxiety or nervousness', value: 'anxiety' },
          { id: 'depression', label: 'Feeling down or depressed', value: 'depression' },
          { id: 'ptsd', label: 'PTSD symptoms (flashbacks, nightmares)', value: 'ptsd' },
          { id: 'sleep', label: 'Sleep problems', value: 'sleep-issues' },
          { id: 'stress', label: 'Stress or feeling overwhelmed', value: 'stress' },
          
          // Physical health symptoms
          { id: 'pain', label: 'Chronic pain', value: 'chronic-pain' },
          { id: 'fatigue', label: 'Fatigue or low energy', value: 'fatigue' },
          { id: 'headaches', label: 'Headaches', value: 'headaches' },
          { id: 'mobility', label: 'Mobility issues', value: 'mobility' },
          
          // Behavioral concerns
          { id: 'substance', label: 'Substance use concerns', value: 'substance-use' },
          { id: 'relationships', label: 'Relationship difficulties', value: 'relationship' },
          { id: 'transition', label: 'Transition to civilian life', value: 'transition' }
        ],
        nextQuestionId: 'severity'
      },
      {
        id: 'severity',
        text: 'How much do these issues affect your daily life?',
        type: 'slider',
        nextQuestionId: 'support-preference'
      },
      {
        id: 'support-preference',
        text: 'What type of support would you prefer?',
        type: 'multiple-choice',
        options: [
          { id: 'va', label: 'VA healthcare', value: 'va' },
          { id: 'ngo', label: 'Veteran non-profit organizations', value: 'ngo' },
          { id: 'peer', label: 'Peer support from other veterans', value: 'peer' },
          { id: 'community', label: 'Community providers', value: 'community' },
          { id: 'any', label: 'Any of the above', value: 'any' }
        ]
      },
      {
        id: 'resources',
        text: 'What type of resources are you interested in?',
        type: 'multiple-choice',
        options: [
          { id: 'mental-health', label: 'Mental Health Resources', value: 'mental-health' },
          { id: 'physical-health', label: 'Physical Health Resources', value: 'physical-health' },
          { id: 'preventive', label: 'Preventive Care', value: 'preventive-care' },
          { id: 'specialized', label: 'Specialized Care', value: 'specialized-care' },
          { id: 'benefits', label: 'Benefits Navigation', value: 'benefits' }
        ]
      },
      {
        id: 'benefits',
        text: 'What benefits information are you looking for?',
        type: 'multiple-choice',
        options: [
          { id: 'eligibility', label: 'Eligibility requirements', value: 'eligibility' },
          { id: 'enrollment', label: 'How to enroll in VA healthcare', value: 'enrollment' },
          { id: 'claims', label: 'Filing or checking claims', value: 'claims' },
          { id: 'coverage', label: 'Understanding coverage', value: 'coverage' },
          { id: 'community-care', label: 'Community Care options', value: 'community-care' }
        ]
      },
      {
        id: 'crisis',
        text: 'For immediate crisis support:',
        type: 'multiple-choice',
        options: [
          { id: 'veterans-crisis-line', label: 'Veterans Crisis Line: 988, Press 1', value: 'veterans-crisis-line' },
          { id: 'emergency', label: 'Call 911 or go to nearest emergency room', value: 'emergency' },
          { id: 'chat', label: 'Chat with a counselor online', value: 'chat' }
        ]
      }
    ];
    
    // Define specialized care questions
    const specializedCareQuestions: Question[] = [
      {
        id: 'symptoms',
        text: 'What specialized care are you seeking?',
        type: 'checkbox',
        category: 'specialized-care',
        options: [
          { id: 'tbi', label: 'Traumatic Brain Injury (TBI)', value: 'traumatic-brain-injury' },
          { id: 'spinal', label: 'Spinal Cord Injury/Disorder', value: 'spinal-cord' },
          { id: 'prosthetics', label: 'Prosthetics or Adaptive Equipment', value: 'prosthetics' },
          { id: 'audiology', label: 'Hearing Loss or Tinnitus', value: 'audiology' },
          { id: 'vision', label: 'Vision or Eye Care', value: 'vision' },
          { id: 'polytrauma', label: 'Polytrauma Care', value: 'polytrauma' },
          { id: 'mst', label: 'Military Sexual Trauma (MST)', value: 'mst' }
        ],
        nextQuestionId: 'specialized-care-location'
      },
      {
        id: 'specialized-care-location',
        text: 'What is your preferred location for care?',
        type: 'multiple-choice',
        category: 'specialized-care',
        options: [
          { id: 'va-facility', label: 'VA Medical Center', value: 'va-facility' },
          { id: 'community', label: 'Community Provider (through VA)', value: 'community' },
          { id: 'telehealth', label: 'Telehealth/Virtual Care', value: 'telehealth' },
          { id: 'any', label: 'No preference', value: 'any' }
        ],
        nextQuestionId: 'support-preference'
      }
    ];
    
    // Define preventive care questions
    const preventiveCareQuestions: Question[] = [
      {
        id: 'symptoms',
        text: 'What preventive care services are you interested in?',
        type: 'checkbox',
        category: 'preventive-care',
        options: [
          { id: 'wellness', label: 'Wellness Check-ups', value: 'wellness' },
          { id: 'screenings', label: 'Health Screenings', value: 'screenings' },
          { id: 'immunizations', label: 'Immunizations/Vaccines', value: 'immunizations' },
          { id: 'nutrition', label: 'Nutrition Counseling', value: 'nutrition' },
          { id: 'fitness', label: 'Fitness Programs', value: 'fitness' },
          { id: 'smoking', label: 'Smoking Cessation', value: 'smoking' },
          { id: 'weight', label: 'Weight Management', value: 'weight' }
        ],
        nextQuestionId: 'preventive-care-frequency'
      },
      {
        id: 'preventive-care-frequency',
        text: 'When did you last receive preventive care services?',
        type: 'multiple-choice',
        category: 'preventive-care',
        options: [
          { id: 'recent', label: 'Within the last year', value: 'recent' },
          { id: 'one-three', label: '1-3 years ago', value: 'one-three' },
          { id: 'more-than-three', label: 'More than 3 years ago', value: 'more-than-three' },
          { id: 'never', label: 'Never received VA preventive care', value: 'never' }
        ],
        nextQuestionId: 'support-preference'
      }
    ];
    
    // Return questions based on category
    if (category === 'mental-health') {
      return [...commonQuestions, ...mentalHealthQuestions];
    } else if (category === 'physical-health') {
      return [...commonQuestions, ...physicalHealthQuestions];
    } else if (category === 'specialized-care') {
      return [...commonQuestions, ...specializedCareQuestions];
    } else if (category === 'preventive-care') {
      return [...commonQuestions, ...preventiveCareQuestions];
    } else if (category === 'benefits') {
      return [...commonQuestions, ...benefitsQuestions];
    } else {
      // For 'all' category, return common questions
      return commonQuestions;
    }
  };
  
  const questions = getQuestions();
  
  // Get current question
  const currentQuestion = questions.find(q => q.id === currentQuestionId);
  
  // Function to fetch resources from the API
  interface FetchResourcesParams {
    symptoms: string[];
    severity: number;
    supportType: string;
    category?: string;
    duration?: string;
    serviceConnected?: string;
    location?: string;
    benefitsStatus?: string;
  }

  const fetchResources = async (params: FetchResourcesParams): Promise<Resource[]> => {
    try {
      console.log('Fetching resources with params:', params);
      
      // Add category filter if specified
      if (category !== 'all' && !params.category) {
        params.category = category;
      }
      
      // Add additional context based on category-specific answers
      if (category === 'mental-health' && answers['mental-health-duration']) {
        params.duration = answers['mental-health-duration'];
      }
      
      if (category === 'physical-health' && answers['physical-health-service-connected']) {
        params.serviceConnected = answers['physical-health-service-connected'];
      }
      
      if (category === 'specialized-care' && answers['specialized-care-location']) {
        params.location = answers['specialized-care-location'];
      }
      
      if (category === 'benefits' && answers['benefits-status']) {
        params.benefitsStatus = answers['benefits-status'];
      }
      
      // Determine whether to use GET or POST based on complexity of request
      if (params.symptoms.length <= 3 && !params.duration) {
        // Use GET for simpler requests
        const queryParams = new URLSearchParams();
        if (params.symptoms.length > 0) {
          queryParams.append('symptoms', params.symptoms.join(','));
        }
        queryParams.append('severity', params.severity.toString());
        queryParams.append('supportType', params.supportType);
        if (params.category) queryParams.append('category', params.category);
        if (params.duration) queryParams.append('duration', params.duration);
        
        const response = await fetch(`/api/health/symptom-finder?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response (GET):', data);
        return data;
      } else {
        // Use POST for more complex requests
        const response = await fetch('/api/health/symptom-finder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        if (!response.ok) {
          console.error(`API error: ${response.status}`);
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response (POST):', data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  };
  
  // Handle option selection for checkbox questions
  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };
  
  // Handle multiple choice selection
  const handleMultipleChoiceSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: value
    }));
    
    // Special handling for crisis option
    if (currentQuestionId === 'main' && value === 'crisis') {
      setCurrentQuestionId('crisis');
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Special handling for resources option
    if (currentQuestionId === 'main' && value === 'resources') {
      setCurrentQuestionId('resources');
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Special handling for benefits option
    if (currentQuestionId === 'main' && value === 'benefits') {
      setCurrentQuestionId('benefits');
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Special handling for symptoms option
    if (currentQuestionId === 'main' && value === 'symptoms') {
      setCurrentQuestionId('symptoms');
      setCurrentStep(prev => prev + 1);
      return;
    }
    
    // Move to next question if available
    if (currentQuestion?.nextQuestionId) {
      setCurrentQuestionId(currentQuestion.nextQuestionId);
      setCurrentStep(prev => prev + 1);
    } else {
      // If no next question, process results
      processResults();
    }
  };
  
  // Handle slider change
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: value
    }));
  };
  
  // Handle slider submission
  const handleSliderSubmit = () => {
    if (currentQuestion?.nextQuestionId) {
      setCurrentQuestionId(currentQuestion.nextQuestionId);
      setCurrentStep(prev => prev + 1);
    } else {
      processResults();
    }
  };
  
  // Handle checkbox submission
  const handleCheckboxSubmit = () => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionId]: selectedOptions
    }));
    
    if (currentQuestion?.nextQuestionId) {
      setCurrentQuestionId(currentQuestion.nextQuestionId);
      setCurrentStep(prev => prev + 1);
    } else {
      processResults();
    }
  };
  


  // Process results based on answers
  const processResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Handle different paths based on main selection
      const mainSelection = answers['main'];
      
      if (mainSelection === 'resources') {
        const resourceType = answers['resources'];
        
        // Redirect to the appropriate resource page
        if (resourceType) {
          window.location.href = `/health/${resourceType}`;
          return;
        }
      }
      
      if (mainSelection === 'benefits') {
        const benefitType = answers['benefits'];
        
        // Redirect to the appropriate benefits page
        if (benefitType) {
          window.location.href = `/health/benefits#${benefitType}`;
          return;
        }
      }
      
      if (mainSelection === 'crisis') {
        const crisisOption = answers['crisis'];
        
        // Handle crisis options
        if (crisisOption === 'veterans-crisis-line') {
          window.location.href = 'tel:988';
          return;
        }
        
        if (crisisOption === 'emergency') {
          window.location.href = 'tel:911';
          return;
        }
        
        if (crisisOption === 'chat') {
          window.open('https://www.veteranscrisisline.net/get-help/chat', '_blank');
          return;
        }
      }
      
      // For symptoms path, fetch resources based on selected symptoms
      if (mainSelection === 'symptoms') {
        // Get selected symptoms
        const symptomIds = answers['symptoms'] as string[] || [];
        
        // Get preferred support type
        const supportType = answers['support-preference'] as string || 'any';
        
        // Get symptom severity
        const severity = answers['severity'] as number || 3;
        
        // Convert symptom IDs to values for API
        const symptomValues = symptomIds.map(id => {
          const option = questions
            .find(q => q.id === 'symptoms')
            ?.options?.find(o => o.id === id);
          return option ? option.value : '';
        }).filter(Boolean);
        
        // Call the API
        const data = await fetchResources({
          symptoms: symptomValues,
          severity,
          supportType,
          category
        });
        
        setResults(data);
        setShowResults(true);
      } else {
        // Default to showing no results if path is unclear
        setResults([]);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Error processing results:', err);
      setError('There was an error finding resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset the questionnaire
  const resetQuestionnaire = () => {
    setCurrentStep(0);
    setCurrentQuestionId(initialQuestion);
    setSelectedOptions([]);
    setAnswers({});
    setResults([]);
    setShowResults(false);
    setError(null);
  };
  
  // Resource card component
  const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{resource.title}</h3>
            {resource.veteranLed && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                Veteran-Led
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {resource.resourceType}
            </span>
            {resource.location?.state && (
              <span className="ml-2">
                {resource.location.city}, {resource.location.state}
              </span>
            )}
          </div>
          
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {resource.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="mt-4">
            <a
              href={resource.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center"
            >
              Visit Website
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the current question
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case 'checkbox':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{currentQuestion.text}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentQuestion.options?.map(option => (
                <div 
                  key={option.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-colors
                    ${selectedOptions.includes(option.id) 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'}
                  `}
                  onClick={() => handleOptionToggle(option.id)}
                >
                  <div className="flex items-center">
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center mr-3
                      ${selectedOptions.includes(option.id) ? 'bg-blue-500' : 'bg-gray-200'}
                    `}>
                      {selectedOptions.includes(option.id) && (
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={handleCheckboxSubmit}
                disabled={selectedOptions.length === 0}
                className={`
                  px-4 py-2 rounded-md flex items-center
                  ${selectedOptions.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'}
                `}
              >
                Continue
                <ChevronRightIcon className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        );
        
      case 'multiple-choice':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{currentQuestion.text}</h3>
            
            <div className="space-y-3">
              {currentQuestion.options?.map(option => (
                <div 
                  key={option.id}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleMultipleChoiceSelect(option.value)}
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 rounded-full bg-gray-200 mr-3"></div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">{currentQuestion.text}</h3>
            
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={answers[currentQuestionId] || 3}
                onChange={handleSliderChange}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Not at all</span>
                <span>Somewhat</span>
                <span>Significantly</span>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSliderSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Continue
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render the results
  const renderResults = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Finding resources that match your needs...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={resetQuestionnaire}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (results.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No resources found that match your criteria.</p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6 text-left">
            <h4 className="text-blue-800 font-medium">Need more help?</h4>
            <p className="text-blue-700 mt-1">
              Try using Vet1Stop's AI assistant (lower right corner) or explore our Resource Categories below.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <a href="/health/mental-health" className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
              Mental Health
            </a>
            <a href="/health/physical-health" className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
              Physical Health
            </a>
            <a href="/health/preventive-care" className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
              Preventive Care
            </a>
            <a href="/health/specialized-care" className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
              Specialized Care
            </a>
          </div>
          <button
            onClick={resetQuestionnaire}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Start Over
          </button>
        </div>
      );
    }
    
    // Group resources by type
    const vaResources = results.filter(r => r.resourceType.toLowerCase().includes('va'));
    const ngoResources = results.filter(r => {
      const type = r.resourceType.toLowerCase();
      return type.includes('ngo') || type.includes('non-profit');
    });
    const otherResources = results.filter(r => {
      const type = r.resourceType.toLowerCase();
      return !type.includes('va') && !type.includes('ngo') && !type.includes('non-profit');
    });
    
    return (
      <div className="space-y-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <h3 className="text-lg font-medium text-blue-800">Based on your responses</h3>
          <p className="text-blue-600 mt-1">
            We've found {results.length} resources that may help with your needs.
          </p>
        </div>
        
        {/* NGO Resources (prioritized) */}
        {ngoResources.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Veteran Organizations & Non-Profits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngoResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}
        
        {/* VA Resources */}
        {vaResources.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              VA Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vaResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}
        
        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Other Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-8">
          <button
            onClick={resetQuestionnaire}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Start Over
          </button>
        </div>
      </div>
    );
  };
  
  // Progress indicator
  const renderProgressIndicator = () => {
    const totalSteps = 4; // Approximate number of steps in most flows
    const progress = (currentStep / totalSteps) * 100;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Step {currentStep + 1}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex items-center mb-6">
        <QuestionMarkCircleIcon className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">
          Find Resources Based on Your Needs
        </h2>
      </div>
      
      {!showResults ? (
        <div>
          {renderProgressIndicator()}
          {renderQuestion()}
        </div>
      ) : (
        renderResults()
      )}
    </div>
  );
};

export default UnifiedResourceFinder;
