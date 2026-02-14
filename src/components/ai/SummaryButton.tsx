/**
 * Content Summary Button Component
 * 
 * This component provides a button that, when clicked, summarizes lengthy content
 * using AI to make it more digestible for veterans who may have cognitive
 * processing challenges or limited time.
 */

'use client';

import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Patriotic color scheme
const COLORS = {
  PRIMARY: '#1A2C5B', // Navy blue
  SECONDARY: '#EAB308', // Gold
  ACCENT: '#B22234', // Red
  LIGHT: '#F9FAFB',
  DARK: '#111827',
};

// Mock function to get content summary (would be replaced with actual API call)
const getSummary = async (
  content: string,
  length: 'brief' | 'standard' | 'detailed' = 'standard'
): Promise<string> => {
  // For demonstration, return mock summaries based on content length and type
  // In production, this would call the Grok API
  
  // Add a delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple word count-based mock
  const wordCount = content.split(/\s+/).length;
  
  // Different summary types based on length parameter
  if (wordCount < 50) {
    return content; // Content is already brief
  }
  
  // These are mock summaries - in production they would be AI-generated
  const mockSummaries = {
    'va_benefits': {
      brief: 'VA benefits include healthcare, education (GI Bill), home loans, disability compensation, pension, life insurance, and burial benefits. Eligibility varies based on service history and needs.',
      standard: 'The VA provides comprehensive benefits for veterans including healthcare services, education funding through the GI Bill, home loans with no down payment, disability compensation for service-connected conditions, pension programs for limited-income wartime veterans, life insurance options, burial benefits, and transition assistance. Eligibility requirements vary by benefit type and depend on service history, discharge status, and sometimes financial need.',
      detailed: 'The Department of Veterans Affairs offers a wide range of benefits designed to support veterans throughout their lives. These include comprehensive healthcare services through VA medical centers and clinics; education benefits via the Post-9/11 GI Bill and Montgomery GI Bill covering tuition, housing, and books; VA home loans offering no down payment and favorable terms; disability compensation for injuries or illnesses connected to service; pension programs for wartime veterans with limited income; various life insurance policies with competitive rates; burial benefits including burial in national cemeteries; and transition assistance for newly separated veterans. Each benefit program has specific eligibility criteria based on factors like length of service, era of service, type of discharge, and sometimes financial need or disability status. Veterans should apply early for benefits as some have time limitations.'
    },
    'mental_health': {
      brief: 'Mental health resources for veterans include VA programs, Vet Centers, crisis support, telehealth options, peer support, and specialized trauma programs.',
      standard: 'The Mental Health Resources section offers services for veterans experiencing PTSD, depression, anxiety, substance abuse, and other mental health challenges. Available support includes VA mental health programs, community-based Vet Center counseling, 24/7 crisis support through the Veterans Crisis Line, telehealth options, peer support groups, and specialized programs for combat trauma. Both VA and non-VA options are available, many offering free or reduced-cost care specifically for veterans.',
      detailed: 'The Mental Health Resources section provides comprehensive support services addressing the spectrum of mental health needs in the veteran community. Services include structured VA mental health programs available at all VA medical centers with specialized treatments for conditions like PTSD, depression, anxiety, and substance use disorders; community-based counseling through Vet Centers offering a non-clinical environment for combat veterans and sexual trauma survivors; immediate crisis intervention via the Veterans Crisis Line (988, press 1); convenient telehealth options allowing remote care from home; peer support groups connecting veterans with others who share similar experiences; specialized trauma programs including evidence-based therapies for combat-related PTSD; substance use treatment ranging from outpatient counseling to residential rehabilitation; and targeted programs for specific populations like women veterans and those experiencing homelessness. Resources include both VA services, which require enrollment in VA healthcare, and non-VA community partners that often provide free or subsidized care specifically for veterans. Family support services are also available, recognizing the impact of a veteran\'s mental health on their loved ones.'
    },
    'educational_options': {
      brief: 'Veteran education benefits include Post-9/11 GI Bill, Montgomery GI Bill, Yellow Ribbon Program, Vocational Rehabilitation, Tuition Assistance, and specific scholarships for veterans.',
      standard: 'Educational benefits for veterans include the Post-9/11 GI Bill covering tuition, housing and books; Montgomery GI Bill for active duty and reservists; Yellow Ribbon Program for additional tuition costs at private institutions; Vocational Rehabilitation for veterans with service-connected disabilities; Tuition Assistance for active duty personnel; and various scholarships specifically for veterans. Benefits can typically be used at colleges, universities, trade schools, apprenticeships, or for licensure programs, with specific eligibility requirements for each program.',
      detailed: 'Veterans have access to numerous education and training benefits designed to help them advance their careers and transition to civilian life. The Post-9/11 GI Bill provides the most comprehensive education benefit, covering full tuition and fees at public in-state institutions (or up to a national maximum for private schools), a monthly housing allowance based on the school\'s location, and an annual books stipend. The Montgomery GI Bill offers a monthly education benefit for veterans who contributed to the program during service, with separate programs for Active Duty and Selected Reserve. The Yellow Ribbon Program supplements the Post-9/11 GI Bill for higher-cost private institutions or out-of-state tuition. Veterans with service-connected disabilities may qualify for Vocational Rehabilitation and Employment (VR&E), providing personalized support for education and career training. Active duty service members can use Tuition Assistance to cover up to 100% of tuition costs while still serving. Various scholarship opportunities specifically for veterans exist through organizations like the Pat Tillman Foundation, Student Veterans of America, and military-affiliated associations. These benefits can be used for degree programs at colleges and universities, vocational training, apprenticeships, on-the-job training, flight training, correspondence courses, licensing and certification tests, entrepreneurship training, and work-study programs. Eligibility requirements and benefit amounts vary based on factors such as length of service, era of service, discharge status, and specific program requirements.'
    },
    // Default for any other content type
    'default': {
      brief: 'This content provides important information for veterans about resources, benefits, and services available through Vet1Stop. Key points include eligibility requirements, application processes, and contact information.',
      standard: 'This content outlines resources and benefits available to veterans through Vet1Stop, covering eligibility criteria, application procedures, required documentation, and various support options. It provides guidance on navigating veteran services across healthcare, education, employment, and community support, with information on both government programs and non-profit resources that can assist veterans and their families.',
      detailed: 'This comprehensive resource provides detailed information about services and benefits available to veterans through the Vet1Stop platform. It covers the full spectrum of veteran needs including healthcare options, educational benefits, career transition support, housing assistance, financial resources, and community connections. For each resource category, the content outlines specific eligibility requirements, documentation needed, application deadlines, and step-by-step procedures for accessing benefits. It highlights both federal programs through the VA and Department of Defense, as well as state-specific benefits and non-governmental organization support. The information is organized to help veterans at different stages of their post-service journey, from recent separation to retirement, with special sections addressing the needs of disabled veterans, combat veterans, and military families. Contact information for service providers, relevant forms, and links to additional resources are included throughout to ensure veterans can easily connect with the support they need.'
    }
  };
  
  // Determine content type from the text
  let contentType = 'default';
  if (content.toLowerCase().includes('va benefit') || content.toLowerCase().includes('veterans affairs benefit')) {
    contentType = 'va_benefits';
  } else if (content.toLowerCase().includes('mental health') || content.toLowerCase().includes('ptsd') || content.toLowerCase().includes('depression')) {
    contentType = 'mental_health';
  } else if (content.toLowerCase().includes('education') || content.toLowerCase().includes('gi bill') || content.toLowerCase().includes('school')) {
    contentType = 'educational_options';
  }
  
  // Return appropriate summary
  return mockSummaries[contentType as keyof typeof mockSummaries][length];
};

interface SummaryButtonProps {
  contentSelector: string; // CSS selector for the content to summarize
  contentText?: string; // Alternative: directly provide the content text
  buttonText?: string;
  summaryTitle?: string;
  buttonPosition?: 'top' | 'bottom';
  buttonAlign?: 'left' | 'center' | 'right';
  initialSummaryLength?: 'brief' | 'standard' | 'detailed';
  className?: string;
}

const SummaryButton: React.FC<SummaryButtonProps> = ({
  contentSelector,
  contentText,
  buttonText = 'Quick Summary',
  summaryTitle = 'Content Summary',
  buttonPosition = 'top',
  buttonAlign = 'right',
  initialSummaryLength = 'standard',
  className = '',
}) => {
  // States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryLength, setSummaryLength] = useState<'brief' | 'standard' | 'detailed'>(initialSummaryLength);
  
  // Generate summary
  const generateSummary = async () => {
    setIsSummarizing(true);
    setError(null);
    
    try {
      // Get content
      let content = contentText;
      if (!content && contentSelector) {
        const element = document.querySelector(contentSelector);
        if (element) {
          content = element.textContent || '';
        }
      }
      
      if (!content) {
        throw new Error('No content found to summarize');
      }
      
      // Get summary
      const summaryText = await getSummary(content, summaryLength);
      setSummary(summaryText);
      setIsExpanded(true);
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Unable to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };
  
  // Toggle summary expansion
  const toggleSummary = () => {
    if (summary) {
      setIsExpanded(!isExpanded);
    } else {
      generateSummary();
    }
  };
  
  // Change summary length
  const changeSummaryLength = (length: 'brief' | 'standard' | 'detailed') => {
    setSummaryLength(length);
    if (summary) {
      generateSummary();
    }
  };
  
  // Alignment styles
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Button */}
      {(buttonPosition === 'top' || !isExpanded) && (
        <div className={`flex ${alignStyles[buttonAlign]} mb-3`}>
          <button
            onClick={toggleSummary}
            disabled={isSummarizing}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ 
              backgroundColor: COLORS.PRIMARY, 
              color: COLORS.LIGHT 
            }}
            aria-expanded={isExpanded}
            aria-controls="summary-content"
          >
            {isSummarizing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                <span>Generating...</span>
              </>
            ) : summary && isExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4 mr-2" />
                <span>Hide Summary</span>
              </>
            ) : (
              <>
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Summary content */}
      {summary && isExpanded && (
        <div
          id="summary-content"
          className="bg-gray-50 border border-gray-200 rounded-lg mb-4 overflow-hidden"
        >
          {/* Header */}
          <div 
            className="px-4 py-2 flex justify-between items-center border-b border-gray-200"
            style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.LIGHT }}
          >
            <h3 className="text-sm font-medium">{summaryTitle}</h3>
            <div className="flex space-x-1">
              {/* Length selector */}
              <div className="flex text-xs mr-3">
                <button
                  onClick={() => changeSummaryLength('brief')}
                  className={`px-2 py-1 rounded-l-md ${
                    summaryLength === 'brief' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  aria-pressed={summaryLength === 'brief'}
                >
                  Brief
                </button>
                <button
                  onClick={() => changeSummaryLength('standard')}
                  className={`px-2 py-1 ${
                    summaryLength === 'standard' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  aria-pressed={summaryLength === 'standard'}
                >
                  Standard
                </button>
                <button
                  onClick={() => changeSummaryLength('detailed')}
                  className={`px-2 py-1 rounded-r-md ${
                    summaryLength === 'detailed' 
                      ? 'bg-blue-700 text-white' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  aria-pressed={summaryLength === 'detailed'}
                >
                  Detailed
                </button>
              </div>
              
              {/* Close button */}
              <button
                onClick={() => setIsExpanded(false)}
                aria-label="Close summary"
                className="text-gray-300 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {error ? (
              <div className="text-red-600 text-sm">{error}</div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p>{summary}</p>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
              <span>Powered by Vet1Stop AI</span>
              <button
                onClick={generateSummary}
                className="flex items-center text-blue-600 hover:text-blue-800"
                style={{ color: COLORS.PRIMARY }}
              >
                <ArrowPathIcon className="h-3 w-3 mr-1" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bottom button */}
      {buttonPosition === 'bottom' && isExpanded && (
        <div className={`flex ${alignStyles[buttonAlign]} mt-2`}>
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ 
              backgroundColor: COLORS.PRIMARY, 
              color: COLORS.LIGHT 
            }}
          >
            <ChevronUpIcon className="h-4 w-4 mr-2" />
            <span>Hide Summary</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SummaryButton;
