"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInVariants, scaleVariants } from '../utils/animations';
import { useAnalytics } from '../hooks/useAnalytics';

interface FeedbackCollectorProps {
  categoryId?: string;
  symptoms?: string[];
  severityLevel?: string;
  resourceCount: number;
  onClose: () => void;
}

/**
 * Component for collecting user feedback on the symptom-based resource finder
 * Helps improve the finder through user input
 */
const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  categoryId,
  symptoms = [],
  severityLevel,
  resourceCount,
  onClose
}) => {
  // State for feedback form
  const [rating, setRating] = useState<number | null>(null);
  const [foundWhatNeeded, setFoundWhatNeeded] = useState<boolean | null>(null);
  const [easyToUse, setEasyToUse] = useState<boolean | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  
  // Get analytics hook
  const { trackEvent } = useAnalytics();
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track feedback event
    trackEvent({
      eventType: 'feedback',
      category: 'health',
      action: 'resource_finder_feedback',
      label: categoryId,
      value: rating || 0,
      metadata: {
        categoryId,
        symptoms,
        severityLevel,
        rating,
        foundWhatNeeded,
        easyToUse,
        comment: comment.trim() || undefined,
        resourceCount
      }
    });
    
    // Show success message
    setSubmitted(true);
    
    // Close after delay
    setTimeout(() => {
      onClose();
    }, 3000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
          variants={fadeInVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {submitted ? (
            <motion.div 
              className="p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">
                Your feedback helps us improve the resource finder for all veterans.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Help Us Improve</h3>
                <button 
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                  aria-label="Close feedback form"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  How would you rate your experience with the symptom-based resource finder?
                </label>
                <div className="flex items-center justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                      key={value}
                      type="button"
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${
                        rating === value 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setRating(value)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label={`Rate ${value} out of 5 stars`}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Not helpful</span>
                  <span>Very helpful</span>
                </div>
              </div>
              
              {/* Found what needed */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Did you find the resources you were looking for?
                </label>
                <div className="flex space-x-4">
                  <motion.button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      foundWhatNeeded === true 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFoundWhatNeeded(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Yes
                  </motion.button>
                  <motion.button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      foundWhatNeeded === false 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFoundWhatNeeded(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    No
                  </motion.button>
                </div>
              </div>
              
              {/* Easy to use */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Was the symptom-based resource finder easy to use?
                </label>
                <div className="flex space-x-4">
                  <motion.button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      easyToUse === true 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setEasyToUse(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Yes
                  </motion.button>
                  <motion.button
                    type="button"
                    className={`px-4 py-2 rounded-md ${
                      easyToUse === false 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setEasyToUse(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    No
                  </motion.button>
                </div>
              </div>
              
              {/* Comments */}
              <div className="mb-6">
                <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
                  Any additional feedback or suggestions?
                </label>
                <textarea
                  id="comment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts on how we can improve..."
                />
              </div>
              
              {/* Submit button */}
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={rating === null}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Submit Feedback
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FeedbackCollector;
