/**
 * AI Recommendation Panel Component
 * 
 * This component displays personalized resource recommendations based on
 * the veteran's profile, service history, and interests.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LightBulbIcon, 
  ArrowRightIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ThumbUpIcon,
  ThumbDownIcon
} from '@heroicons/react/24/outline';
import { UserProfile } from '@/lib/ai/contextManager';

// Patriotic color scheme
const COLORS = {
  PRIMARY: '#1A2C5B', // Navy blue
  SECONDARY: '#EAB308', // Gold
  ACCENT: '#B22234', // Red
  LIGHT: '#F9FAFB',
  DARK: '#111827',
};

// Mock API call to get recommendations (would be replaced with actual API call)
const getRecommendations = async (
  userProfile: UserProfile,
  category: string,
  count: number = 3
): Promise<Array<{id: string, title: string, description: string, url: string, reason: string}>> => {
  // Simulate API call with mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      // This would be replaced with an actual API call
      const mockRecommendations = {
        'health': [
          {
            id: 'health-1',
            title: 'VA Mental Health Connect',
            description: 'Online mental health services for veterans',
            url: '/health/mental-health',
            reason: `Recommended based on your ${userProfile.serviceBranch} service history and recent interest in mental health resources.`
          },
          {
            id: 'health-2',
            title: 'Veteran Wellness Alliance',
            description: 'Holistic wellness programs for veterans',
            url: '/health/wellness',
            reason: 'Many veterans from your era have found these wellness programs helpful for overall health maintenance.'
          },
          {
            id: 'health-3',
            title: 'Local VA Healthcare Facilities',
            description: `VA facilities near ${userProfile.location || 'you'}`,
            url: '/health/va-facilities',
            reason: `Based on your location in ${userProfile.location || 'your area'}, these facilities offer specialized care for veterans.`
          }
        ],
        'education': [
          {
            id: 'education-1',
            title: 'Post-9/11 GI Bill Benefits',
            description: 'Education funding for eligible veterans',
            url: '/education/gi-bill',
            reason: `As a ${userProfile.serviceEra || 'veteran'}, you may qualify for comprehensive education benefits.`
          },
          {
            id: 'education-2',
            title: 'Veterans Upward Bound',
            description: 'College preparation program for veterans',
            url: '/education/college-prep',
            reason: 'This program has helped many veterans successfully transition to higher education.'
          },
          {
            id: 'education-3',
            title: 'Military Skills Translator',
            description: 'Convert military experience to civilian credentials',
            url: '/education/skills-translator',
            reason: `Your ${userProfile.serviceBranch || 'military'} background includes skills that can translate to various educational paths.`
          }
        ],
        'careers': [
          {
            id: 'careers-1',
            title: 'Veteran Recruiting Events',
            description: 'Job fairs and recruiting events for veterans',
            url: '/careers/events',
            reason: `Upcoming events in ${userProfile.location || 'your area'} specifically seeking veterans with your background.`
          },
          {
            id: 'careers-2',
            title: 'Resume Builder for Veterans',
            description: 'Create a civilian resume highlighting military experience',
            url: '/careers/resume',
            reason: 'This tool helps translate your military achievements into terms civilian employers understand.'
          },
          {
            id: 'careers-3',
            title: 'Federal Employment Opportunities',
            description: 'Government jobs with veteran preference',
            url: '/careers/federal',
            reason: 'You may qualify for veteran preference in federal hiring based on your service history.'
          }
        ],
        'default': [
          {
            id: 'default-1',
            title: 'Getting Started with Vet1Stop',
            description: 'Guide to making the most of veteran resources',
            url: '/getting-started',
            reason: 'Recommended for all veterans to navigate available benefits and services.'
          },
          {
            id: 'default-2',
            title: 'Veterans Crisis Line',
            description: '24/7 confidential crisis support',
            url: '/health/crisis-support',
            reason: 'Important resource available to all veterans in need of immediate support.'
          },
          {
            id: 'default-3',
            title: 'VA Benefits Navigator',
            description: 'Personalized guide to your VA benefits',
            url: '/benefits-navigator',
            reason: `Based on your ${userProfile.serviceBranch || 'service'} background, you may be eligible for specific benefits.`
          }
        ]
      };
      
      const recommendations = mockRecommendations[category as keyof typeof mockRecommendations] || 
                              mockRecommendations.default;
      
      resolve(recommendations.slice(0, count));
    }, 1000);
  });
};

interface RecommendationPanelProps {
  userProfile: UserProfile;
  category?: string;
  title?: string;
  count?: number;
  className?: string;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  userProfile,
  category = 'default',
  title = 'Recommended for You',
  count = 3,
  className = '',
}) => {
  // States
  const [recommendations, setRecommendations] = useState<Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    reason: string;
    showReason?: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Router
  const router = useRouter();
  
  // Fetch recommendations on component mount or when category/userProfile changes
  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getRecommendations(userProfile, category, count);
        setRecommendations(data.map(item => ({ ...item, showReason: false })));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Unable to load personalized recommendations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [category, userProfile, count]);
  
  // Toggle reason visibility
  const toggleReason = (id: string) => {
    setRecommendations(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, showReason: !item.showReason } 
          : item
      )
    );
  };
  
  // Handle recommendation click
  const handleRecommendationClick = (url: string) => {
    router.push(url);
  };
  
  // Handle feedback
  const handleFeedback = (id: string, isHelpful: boolean) => {
    // In a real implementation, this would send feedback to an API
    console.log('Recommendation feedback:', { id, isHelpful });
    
    // For now, just show a visual confirmation
    setRecommendations(prev => 
      prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              description: isHelpful 
                ? item.description + ' (Feedback: Helpful)' 
                : item.description + ' (Feedback: Not Helpful)' 
            } 
          : item
      )
    );
  };
  
  // If no recommendations and not loading, don't render
  if (!isLoading && recommendations.length === 0 && !error) {
    return null;
  }

  return (
    <div 
      className={`rounded-lg border border-gray-200 overflow-hidden bg-white ${className}`}
      aria-labelledby="recommendations-title"
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-gray-200 flex items-center"
        style={{ backgroundColor: COLORS.PRIMARY, color: COLORS.LIGHT }}
      >
        <LightBulbIcon className="h-5 w-5 mr-2" style={{ color: COLORS.SECONDARY }} />
        <h3 id="recommendations-title" className="font-medium">{title}</h3>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" style={{ borderColor: COLORS.PRIMARY }}></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-4">
            {error}
          </div>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((recommendation) => (
              <li key={recommendation.id} className="border border-gray-100 rounded-md overflow-hidden shadow-sm">
                <div className="p-3">
                  <div className="flex justify-between">
                    <h4 
                      className="font-medium text-blue-800 mb-1 cursor-pointer hover:underline"
                      onClick={() => handleRecommendationClick(recommendation.url)}
                      style={{ color: COLORS.PRIMARY }}
                    >
                      {recommendation.title}
                    </h4>
                    <button
                      onClick={() => toggleReason(recommendation.id)}
                      aria-label={recommendation.showReason ? "Hide reason" : "Show reason"}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {recommendation.showReason ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {recommendation.description}
                  </p>
                  
                  {recommendation.showReason && (
                    <div className="mt-2 mb-2 pl-2 border-l-2 text-sm text-gray-500" style={{ borderColor: COLORS.SECONDARY }}>
                      {recommendation.reason}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFeedback(recommendation.id, true)}
                        aria-label="This recommendation is helpful"
                        className="text-green-600 hover:text-green-700 flex items-center text-xs"
                      >
                        <ThumbUpIcon className="h-3 w-3 mr-1" />
                        <span>Helpful</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(recommendation.id, false)}
                        aria-label="This recommendation is not helpful"
                        className="text-red-600 hover:text-red-700 flex items-center text-xs"
                      >
                        <ThumbDownIcon className="h-3 w-3 mr-1" />
                        <span>Not Helpful</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleRecommendationClick(recommendation.url)}
                      aria-label={`View ${recommendation.title}`}
                      className="flex items-center text-blue-600 hover:text-blue-700 text-xs font-medium"
                      style={{ color: COLORS.PRIMARY }}
                    >
                      <span>View</span>
                      <ArrowRightIcon className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecommendationPanel;
