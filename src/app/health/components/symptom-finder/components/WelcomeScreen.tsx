"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onStart: () => void;
  recentSearches?: {
    categoryId: string;
    symptoms: string[];
    severityLevel: string;
    timestamp: number;
  }[];
  onLoadRecentSearch?: (search: {
    categoryId: string;
    symptoms: string[];
    severityLevel: string;
  }) => void;
  onClearRecentSearches?: () => void;
}

/**
 * Welcome screen for the symptom-based resource finder
 * Provides an introduction and explanation of the tool
 * Enhanced with animations and recent searches functionality
 */
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onStart, 
  recentSearches = [],
  onLoadRecentSearch = () => {},
  onClearRecentSearches = () => {}
}) => {
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  
  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Show recent searches if available
  useEffect(() => {
    if (recentSearches && recentSearches.length > 0) {
      setShowRecentSearches(true);
    }
  }, [recentSearches]);
  
  return (
    <motion.div 
      className="max-w-3xl mx-auto text-center"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="mb-8" variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to the Symptom-Based Resource Finder
        </h2>
        <p className="text-gray-600 mb-4">
          Finding the right health resources shouldn't require you to know medical terminology.
          This tool helps you discover resources based on how you're feeling, not diagnoses.
        </p>
        <p className="text-gray-600 mb-6">
          In just a few steps, we'll help you find health resources tailored specifically to your needs.
        </p>
      </motion.div>

      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="font-bold text-blue-900 mb-3">How it works:</h3>
        <ul className="text-left space-y-3">
          <li className="flex items-start">
            <span className="flex-shrink-0 h-6 w-6 text-blue-500 mr-2">1️⃣</span>
            <span className="text-gray-700">
              <strong>Select a category</strong> that best describes what you're experiencing
            </span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-6 w-6 text-blue-500 mr-2">2️⃣</span>
            <span className="text-gray-700">
              <strong>Choose specific symptoms</strong> you're experiencing
            </span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-6 w-6 text-blue-500 mr-2">3️⃣</span>
            <span className="text-gray-700">
              <strong>Rate the severity</strong> of your symptoms
            </span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 h-6 w-6 text-blue-500 mr-2">4️⃣</span>
            <span className="text-gray-700">
              <strong>Get personalized resources</strong> based on your responses
            </span>
          </li>
        </ul>
      </div>

      <motion.div className="mb-8" variants={itemVariants}>
        <p className="text-gray-600 italic mb-2">
          Your privacy is important. Your responses are not stored unless you create an account.
        </p>
        <p className="text-sm text-gray-500">
          If you're experiencing a crisis or emergency, please call the Veterans Crisis Line at 
          <a href="tel:988" className="text-blue-600 font-bold mx-1">988</a>
          (then press 1) or text 838255.
        </p>
      </motion.div>
      
      {/* Recent searches section */}
      {showRecentSearches && recentSearches.length > 0 && (
        <motion.div 
          className="mb-8 bg-gray-50 rounded-lg p-4"
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-700">Recent Searches:</h3>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onClearRecentSearches();
                setShowRecentSearches(false);
              }}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
              aria-label="Clear all recent searches"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Clear All
            </button>
          </div>
          <div className="grid gap-2">
            {recentSearches.slice(0, 3).map((search, index) => (
              <motion.div 
                key={index}
                className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center text-left hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => onLoadRecentSearch(search)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <div>
                  <div className="font-medium text-gray-800">
                    {search.categoryId && typeof search.categoryId === 'string' 
                      ? `${search.categoryId.charAt(0).toUpperCase() + search.categoryId.slice(1)} Health`
                      : 'Health'}
                    {search.symptoms && search.symptoms.length > 0 && ` • ${search.symptoms.length} symptom${search.symptoms.length !== 1 ? 's' : ''}`}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(search.timestamp)}</div>
                </div>
                <div className="text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <motion.button
          onClick={onStart}
          className="px-8 py-3 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Start finding resources"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;
