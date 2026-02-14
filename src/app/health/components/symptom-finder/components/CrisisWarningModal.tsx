"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface CrisisWarningModalProps {
  onAcknowledge: () => void;
}

/**
 * Modal component that displays crisis resources when a user reports severe symptoms
 * Provides immediate access to crisis support options
 */
const CrisisWarningModal: React.FC<CrisisWarningModalProps> = ({
  onAcknowledge
}) => {
  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg p-6 max-w-md mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
      >
        <div className="flex items-start mb-4">
          <div className="h-6 w-6 text-red-600 mr-3 flex-shrink-0">⚠️</div>
          <div>
            <h3 className="text-lg font-bold text-red-600">Crisis Resources Available</h3>
            <p className="mt-2 text-gray-700">
              Based on your responses, you may be experiencing a serious situation that requires immediate attention.
            </p>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="font-bold">Veterans Crisis Line</p>
              <p className="mt-1">Call: <a href="tel:988" className="text-blue-600 font-bold">988</a> (then press 1)</p>
              <p className="mt-1">Text: <span className="font-bold">838255</span></p>
              <p className="mt-1">Chat: <a href="https://www.veteranscrisisline.net/chat" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">VeteransCrisisLine.net</a></p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <motion.button
            onClick={onAcknowledge}
            className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 transition-colors"
            aria-label="Continue to resources after acknowledging crisis warning"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Continue to Resources
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CrisisWarningModal;
