"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthResource } from '../../../types/consolidated-health-types';
import { useAnalytics, FeedbackData } from '../hooks/useAnalytics';

interface ResourceFeedbackProps {
  resource: HealthResource;
  onClose: () => void;
}

/**
 * Component for collecting user feedback on health resources
 * Helps improve resource recommendations over time
 */
const ResourceFeedback: React.FC<ResourceFeedbackProps> = ({ 
  resource, 
  onClose 
}) => {
  // State for feedback form
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  
  // Get analytics hook
  const { submitFeedback } = useAnalytics();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    }
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create feedback data
    const feedbackData: Omit<FeedbackData, 'sessionId' | 'timestamp'> = {
      resourceId: resource.id,
      rating,
      comment: comment.trim() || undefined,
      helpful: helpful === true
    };
    
    // Submit feedback
    submitFeedback(feedbackData);
    
    // Show success message
    setSubmitted(true);
    
    // Close after delay
    setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <AnimatePresence>
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {submitted ? (
            <div className="p-6 text-center">
              <div className="text-green-500 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600">
                Your feedback helps us improve our resource recommendations for veterans.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-900 text-white p-4">
                <h3 className="text-lg font-bold">Resource Feedback</h3>
                <p className="text-sm opacity-90">Help us improve our recommendations</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-1">Was this resource helpful?</h4>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md border ${helpful === true ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setHelpful(true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-md border ${helpful === false ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-300 hover:bg-gray-50'}`}
                      onClick={() => setHelpful(false)}
                    >
                      No
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-1">Rate this resource</h4>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <svg 
                          className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="comment" className="block font-medium text-gray-900 mb-1">
                    Additional comments (optional)
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What did you like or dislike about this resource?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={helpful === null || rating === 0}
                    className={`px-4 py-2 rounded-md text-white ${helpful !== null && rating > 0 ? 'bg-blue-900 hover:bg-blue-800' : 'bg-gray-400 cursor-not-allowed'}`}
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ResourceFeedback;
