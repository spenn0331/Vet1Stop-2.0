"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePerformanceOptimizer } from '../hooks/usePerformanceOptimizer';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onOptimize?: () => void;
}

/**
 * Component for monitoring and visualizing performance metrics
 * Helps developers optimize the symptom-based resource finder
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible = false,
  onOptimize
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showMonitor, setShowMonitor] = useState<boolean>(isVisible);
  
  // Get performance optimizer hook
  const {
    metrics,
    getPerformanceReport
  } = usePerformanceOptimizer();
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };
  
  // Toggle monitor visibility
  const toggleMonitor = () => {
    setShowMonitor(prev => !prev);
  };
  
  // Handle optimize button click
  const handleOptimize = () => {
    if (onOptimize) {
      onOptimize();
    }
  };
  
  // Enable monitor with keyboard shortcut (Ctrl+Shift+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggleMonitor();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Only render if monitor is visible
  if (!showMonitor) {
    return null;
  }
  
  return (
    <motion.div
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: expanded ? '400px' : '180px' }}
    >
      <div className="bg-blue-600 text-white p-2 flex justify-between items-center cursor-pointer" onClick={toggleExpanded}>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 0v14h10V3H5z" clipRule="evenodd" />
            <path d="M7 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
          </svg>
          <span className="font-medium">Performance</span>
        </div>
        <button
          className="text-white hover:text-gray-200 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            toggleMonitor();
          }}
          aria-label="Close performance monitor"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {expanded ? (
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Load Time:</span>
                <span className="font-medium">{metrics.loadTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Render Time:</span>
                <span className="font-medium">{metrics.renderTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interaction Time:</span>
                <span className="font-medium">{metrics.interactionTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resource Match Time:</span>
                <span className="font-medium">{metrics.resourceMatchTime.toFixed(2)} ms</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-gray-600 font-medium">Total Time:</span>
                <span className="font-bold">{metrics.totalTime.toFixed(2)} ms</span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Performance Visualization</h3>
            <div className="space-y-2">
              {Object.entries(metrics).map(([key, value]) => {
                if (key === 'totalTime') return null;
                
                const percentage = (value / metrics.totalTime) * 100;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                      <span className="text-gray-800">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleOptimize}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Optimize
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 text-center">
          <div className="text-sm font-medium text-gray-800">{metrics.totalTime.toFixed(0)} ms</div>
          <div className="text-xs text-gray-500">Total Time</div>
        </div>
      )}
    </motion.div>
  );
};

export default PerformanceMonitor;
