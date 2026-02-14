"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchHistory, SearchHistoryItem } from '../hooks/useSearchHistory';
import { fadeInVariants, scaleVariants } from '../utils/animations';

interface SearchHistoryPanelProps {
  onSelectSearch: (search: SearchHistoryItem) => void;
  onClose: () => void;
}

/**
 * Component for displaying user's search history and recommended searches
 * Enhances personalization by allowing users to quickly access previous searches
 */
const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  onSelectSearch,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'recommended'>('recent');
  
  // Get search history hook
  const {
    recentSearches,
    isLoading,
    error,
    getRecommendedSearches,
    clearSearchHistory
  } = useSearchHistory();
  
  // Get recommended searches
  const recommendedSearches = getRecommendedSearches();
  
  // Format date for display
  const formatDate = (date: Date) => {
    // If today, show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Handle clear history button click
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your search history?')) {
      clearSearchHistory();
    }
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
        variants={scaleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Your Searches</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close search history panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'recent' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Searches
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'recommended' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('recommended')}
          >
            Recommended
          </button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              {error}
            </div>
          ) : activeTab === 'recent' ? (
            <>
              {recentSearches.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  <p>You haven't made any searches yet.</p>
                  <p className="mt-2">Start by selecting a symptom category.</p>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {recentSearches.map((search) => (
                      <motion.div
                        key={search.id}
                        className="mb-3 p-3 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                        variants={fadeInVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => onSelectSearch(search)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{search.categoryName}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {search.symptoms.map(s => s.name).join(', ')}
                            </p>
                            <div className="flex items-center mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                search.severityLevel === 'Severe' 
                                  ? 'bg-red-100 text-red-800' 
                                  : search.severityLevel === 'Moderate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {search.severityLevel}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {search.resourcesFound} resources found
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(search.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <div className="mt-4 flex justify-center">
                    <button
                      className="text-sm text-gray-500 hover:text-gray-700"
                      onClick={handleClearHistory}
                    >
                      Clear Search History
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {recommendedSearches.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  <p>No recommended searches yet.</p>
                  <p className="mt-2">Make more searches to get personalized recommendations.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {recommendedSearches.map((search) => (
                    <motion.div
                      key={search.id}
                      className="mb-3 p-3 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                      variants={fadeInVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => onSelectSearch(search)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h4 className="font-medium text-gray-900">{search.categoryName}</h4>
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              Recommended
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {search.symptoms.map(s => s.name).join(', ')}
                          </p>
                          <div className="flex items-center mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              search.severityLevel === 'Severe' 
                                ? 'bg-red-100 text-red-800' 
                                : search.severityLevel === 'Moderate'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }`}>
                              {search.severityLevel}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              {search.resourcesFound} resources found
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SearchHistoryPanel;
