"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LinkIcon,
  PhoneIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

/**
 * Resource interface for pathway steps
 * @property id - Unique identifier for the resource
 * @property title - Display title for the resource
 * @property url - Optional URL for link resources
 * @property phone - Optional phone number for phone resources
 * @property description - Description of the resource
 * @property type - Type of resource (link, phone, document, video)
 * @property imageUrl - Optional image URL for the resource
 */
export interface Resource {
  id: string;
  title: string;
  url?: string;
  phone?: string;
  description: string;
  type: 'link' | 'phone' | 'document' | 'video';
  imageUrl?: string;
}

/**
 * Step content interface for pathway steps
 * @property title - Title of the step
 * @property description - Detailed description of the step
 * @property image - Optional image URL for the step
 * @property tips - Optional array of helpful tips
 * @property warnings - Optional array of important warnings
 * @property resources - Optional array of related resources
 * @property actionItems - Optional array of action items to complete
 */
export interface StepContent {
  title: string;
  description: string;
  image?: string;
  tips?: string[];
  warnings?: string[];
  resources?: Resource[];
  actionItems?: string[];
}

/**
 * Props for the PathwayStep component
 * @property stepContent - Content for the current step
 * @property onComplete - Callback when the step is completed
 * @property isCompleted - Whether the step has been completed
 * @property stepIndex - Optional index of the current step
 * @property totalSteps - Optional total number of steps
 */
export interface PathwayStepProps {
  stepContent: StepContent;
  onComplete: () => void;
  isCompleted: boolean;
  stepIndex?: number;
  totalSteps?: number;
}

/**
 * A component that displays a single step in a healthcare pathway
 * Shows step content, resources, action items, and tracks completion
 */
const PathwayStep: React.FC<PathwayStepProps> = ({
  stepContent,
  onComplete,
  isCompleted,
  stepIndex,
  totalSteps
}) => {
  // Track which action items have been checked off
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  
  // Calculate completion percentage based on checked items
  const completionPercentage = useMemo(() => {
    if (!stepContent.actionItems || stepContent.actionItems.length === 0) {
      return isCompleted ? 100 : 0;
    }
    
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((checkedCount / stepContent.actionItems.length) * 100);
  }, [checkedItems, isCompleted, stepContent.actionItems]);
  
  // Handle checking/unchecking an action item
  const handleCheckItem = useCallback((item: string) => {
    setCheckedItems(prev => {
      const updated = {
        ...prev,
        [item]: !prev[item]
      };
      
      // Check if all items are now checked
      const allChecked = stepContent.actionItems?.every(actionItem => updated[actionItem]) ?? false;
      
      // If all items are checked and the step isn't already completed, call onComplete
      if (allChecked && !isCompleted) {
        setTimeout(() => onComplete(), 500); // Small delay for better UX
      }
      
      return updated;
    });
  }, [isCompleted, onComplete, stepContent.actionItems]);
  
  // Check if all action items are completed
  const allActionsCompleted = stepContent.actionItems ? 
    stepContent.actionItems.every(item => checkedItems[item]) : 
    false;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Step Header */}
      <div className="bg-blue-900 text-white p-6">
        <h3 className="text-xl font-bold">{stepContent.title}</h3>
      </div>
      
      {/* Step Content */}
      <div className="p-6">
        {/* Description */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700">{stepContent.description}</p>
        </div>
        
        {/* Image if available */}
        {stepContent.image && (
          <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden">
            <Image 
              src={stepContent.image} 
              alt={stepContent.title}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        {/* Tips Section */}
        {stepContent.tips && stepContent.tips.length > 0 && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <h4 className="text-blue-900 font-bold flex items-center mb-3">
              <InformationCircleIcon className="h-5 w-5 mr-2" />
              Helpful Tips
            </h4>
            <ul className="space-y-2">
              {stepContent.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Warnings Section */}
        {stepContent.warnings && stepContent.warnings.length > 0 && (
          <div className="mb-6 bg-red-50 p-4 rounded-lg">
            <h4 className="text-red-700 font-bold flex items-center mb-3">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              Important Warnings
            </h4>
            <ul className="space-y-2">
              {stepContent.warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-gray-700">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Resources Section */}
        {stepContent.resources && stepContent.resources.length > 0 && (
          <div className="mb-6">
            <h4 className="text-gray-900 font-bold mb-3">Helpful Resources</h4>
            <div className="space-y-3">
              {stepContent.resources.map((resource) => (
                <div key={resource.id} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-1">{resource.title}</h5>
                  <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                  
                  {resource.url && (
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Visit Resource
                    </a>
                  )}
                  
                  {resource.phone && (
                    <a 
                      href={`tel:${resource.phone}`} 
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm ml-4"
                    >
                      <PhoneIcon className="h-4 w-4 mr-1" />
                      {resource.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Items Checklist */}
        {stepContent.actionItems && stepContent.actionItems.length > 0 && (
          <div className="mb-6 border border-gray-200 rounded-lg p-4">
            <h4 className="text-gray-900 font-bold mb-3 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
              Action Items
            </h4>
            <div className="space-y-2">
              {stepContent.actionItems.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => handleCheckItem(item)}
                >
                  <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    checkedItems[item] 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-400'
                  }`}>
                    {checkedItems[item] && (
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className={`ml-3 ${checkedItems[item] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Complete Step Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onComplete}
            disabled={isCompleted}
            className={`px-4 py-2 rounded-md text-white flex items-center ${
              isCompleted
                ? 'bg-green-500 cursor-not-allowed'
                : allActionsCompleted
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Completed
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Mark Step as Complete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathwayStep;
