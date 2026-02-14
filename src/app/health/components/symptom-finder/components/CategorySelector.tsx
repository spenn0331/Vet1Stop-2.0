"use client";

import React from 'react';
import { SymptomCategory } from '../utils/types';

interface CategorySelectorProps {
  categories: SymptomCategory[];
  onCategorySelect: (categoryId: string) => void;
  onBack: () => void;
}

/**
 * Component for selecting a symptom category
 */
const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  categories, 
  onCategorySelect,
  onBack
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          What area are you experiencing challenges with?
        </h2>
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center"
          aria-label="Go back to welcome screen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">
        Select the category that best describes what you're experiencing. This helps us find the most relevant resources for you.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Select ${category.title} category`}
          >
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3" role="img" aria-hidden="true">{category.icon}</span>
              <h3 className="text-xl font-bold text-gray-900">{category.title}</h3>
            </div>
            <p className="text-gray-600">{category.description}</p>
            
            {/* Examples of symptoms in this category */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Examples:</p>
              <div className="flex flex-wrap gap-2">
                {category.symptoms.slice(0, 3).map(symptom => (
                  <span 
                    key={symptom.id}
                    className={`inline-block px-3 py-1 rounded-full text-sm ${category.color}`}
                  >
                    {symptom.label.split(' ')[0]}...
                  </span>
                ))}
                {category.symptoms.length > 3 && (
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                    +{category.symptoms.length - 3} more
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-4 text-blue-600 flex items-center">
              <span>Select this category</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}
      </div>
      
      {/* Crisis Notice */}
      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-red-600 text-xl mr-3">⚠️</span>
          <div>
            <h4 className="font-bold text-red-700">Need immediate help?</h4>
            <p className="mt-1 text-gray-700">
              If you're experiencing a crisis or emergency, please call the Veterans Crisis Line at 
              <a href="tel:988" className="text-blue-600 font-bold mx-1">988</a>
              (then press 1) or text 838255.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;
