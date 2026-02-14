"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthResource } from '../../../types/consolidated-health-types';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useAnalytics } from '../hooks/useAnalytics';
import ResourceFeedback from './ResourceFeedback';

interface ResourceResultsProps {
  resources: HealthResource[];
  isLoading: boolean;
  savedResourceIds: string[];
  onSaveResource: (resourceId: string) => void;
  onViewDetails: (resource: HealthResource) => void;
  onStartOver: () => void;
  categoryId?: string | null;
  symptoms?: string[];
  severityLevel?: string | null;
}

/**
 * Component for displaying personalized resource recommendations
 * Enhanced with animations, improved UI, and personalization features
 */
const ResourceResults: React.FC<ResourceResultsProps> = ({
  resources,
  isLoading,
  savedResourceIds,
  onSaveResource,
  onViewDetails,
  onStartOver,
  categoryId,
  symptoms = [],
  severityLevel
}) => {
  // Local state for UI enhancements
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedResourceForFeedback, setSelectedResourceForFeedback] = useState<HealthResource | null>(null);
  
  // Get user preferences from hook
  const { preferences, actions } = useUserPreferences();
  
  // Get analytics hook
  const { trackResourceClick, trackSearch } = useAnalytics();
  
  // Track search when resources are loaded
  useEffect(() => {
    if (!isLoading && resources.length > 0 && categoryId) {
      trackSearch({
        categoryId: categoryId,
        symptoms: symptoms || [],
        severityLevel: severityLevel || 'none',
        resultCount: resources.length
      });
    }
  }, [isLoading, resources, categoryId, symptoms, severityLevel, trackSearch]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };
  
  // Format category name for display
  const formatCategoryName = (id: string | null | undefined) => {
    if (!id) return '';
    return id.charAt(0).toUpperCase() + id.slice(1);
  };
  
  // Open feedback dialog for a resource
  const handleOpenFeedback = (resource: HealthResource) => {
    setSelectedResourceForFeedback(resource);
  };
  
  // Close feedback dialog
  const handleCloseFeedback = () => {
    setSelectedResourceForFeedback(null);
  };
  
  // Handle resource click tracking
  const handleResourceClick = (resource: HealthResource) => {
    trackResourceClick({
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceType: resource.categories?.[0] || 'unknown',
      isVerified: resource.isVerified || false
    });
    
    // Call the provided onViewDetails function
    onViewDetails(resource);
  };
  
  // Get resources to display based on active tab
  const displayResources = activeTab === 'all' 
    ? resources 
    : resources.filter(resource => savedResourceIds.includes(resource.id));
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-900">
          Recommended Resources
        </h2>
        <motion.button 
          onClick={onStartOver}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Start over with a new search"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Over
        </motion.button>
      </motion.div>
      
      {/* Search summary */}
      {categoryId && (
        <motion.div 
          className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100"
          variants={itemVariants}
        >
          <h3 className="font-medium text-blue-900 mb-1">Your search:</h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {formatCategoryName(categoryId)} Health
            </span>
            {symptoms.length > 0 && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {symptoms.length} symptom{symptoms.length !== 1 ? 's' : ''}
              </span>
            )}
            {severityLevel && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {severityLevel.charAt(0).toUpperCase() + severityLevel.slice(1)} severity
              </span>
            )}
          </div>
        </motion.div>
      )}
      
      {isLoading ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-12"
          variants={itemVariants}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-gray-700">Finding resources that match your needs...</p>
        </motion.div>
      ) : resources.length > 0 ? (
        <motion.div variants={itemVariants}>
          <p className="text-gray-600 mb-4">
            Based on your responses, we've identified these resources that may help with your situation.
          </p>
          
          {/* Tabs for All/Saved resources */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('all')}
            >
              All Resources ({resources.length})
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved ({savedResourceIds.filter(id => resources.some(r => r.id === id)).length})
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <AnimatePresence>
              {displayResources.map(resource => (
              <motion.div 
                key={resource.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                layout
              >
                {/* Resource Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-lg">{resource.title}</h3>
                    <button
                      onClick={() => onSaveResource(resource.id)}
                      className="text-gray-400 hover:text-blue-500"
                      aria-label={savedResourceIds.includes(resource.id) ? "Remove from saved resources" : "Save this resource"}
                    >
                      {savedResourceIds.includes(resource.id) ? (
                        <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-500">{resource.provider}</span>
                    {resource.isVerified && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {resource.isVeteranLed && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Veteran-Led
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Resource Content */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{resource.description}</p>
                  
                  {/* Resource Categories */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {resource.categories.slice(0, 3).map((category, index) => (
                        <span 
                          key={index}
                          className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          {category}
                        </span>
                      ))}
                      {resource.categories.length > 3 && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +{resource.categories.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Rating */}
                  {resource.rating > 0 && (
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i}
                            className={`h-4 w-4 ${i < Math.round(resource.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {resource.rating.toFixed(1)} {resource.reviewCount && `(${resource.reviewCount})`}
                      </span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-900 text-white text-center rounded hover:bg-blue-800 transition-colors"
                      aria-label={`Visit ${resource.title} website`}
                    >
                      Visit Website
                    </a>
                    <button
                      onClick={() => handleResourceClick(resource)}
                      className="px-4 py-2 border border-blue-900 text-blue-900 rounded hover:bg-blue-50 transition-colors"
                      aria-label={`View details for ${resource.title}`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleOpenFeedback(resource)}
                      className="ml-2 p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                      aria-label={`Provide feedback for ${resource.title}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
          
          {/* Additional Help Section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex">
              <svg className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-bold text-blue-900">Need more help?</h3>
                <p className="mt-1 text-gray-700">
                  If these resources don't address your needs, please consider speaking with a healthcare provider
                  or calling the Veterans Crisis Line at <a href="tel:988" className="text-blue-600 font-bold">988</a> (then press 1).
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-8"
          variants={itemVariants}
        >
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-700 mb-4">No matching resources found. Please try different symptoms or categories.</p>
          <motion.button
            onClick={onStartOver}
            className="px-6 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
            aria-label="Try again with different selections"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      )}
      {/* Feedback dialog */}
      {selectedResourceForFeedback && (
        <ResourceFeedback 
          resource={selectedResourceForFeedback}
          onClose={handleCloseFeedback}
        />
      )}
    </motion.div>
  );
};

export default ResourceResults;
