"use client";

import React, { useState, useEffect } from 'react';
import { SymptomCategory } from '../utils/types';

interface SymptomSelectorProps {
  category: SymptomCategory;
  selectedSymptoms: string[];
  onSymptomToggle: (symptomId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Component for selecting specific symptoms within a category
 */
const SymptomSelector: React.FC<SymptomSelectorProps> = ({
  category,
  selectedSymptoms,
  onSymptomToggle,
  onContinue,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymptoms, setFilteredSymptoms] = useState(category.symptoms);

  // Filter symptoms based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSymptoms(category.symptoms);
      return;
    }

    const filtered = category.symptoms.filter(symptom => 
      symptom.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSymptoms(filtered);
  }, [searchTerm, category.symptoms]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Which {category.title.toLowerCase()} symptoms are you experiencing?
        </h2>
        <button 
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center"
          aria-label="Go back to category selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          Select all symptoms that apply to you. You can choose multiple options.
        </p>
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-600">
            {selectedSymptoms.length} of {category.symptoms.length} selected
          </div>
          {selectedSymptoms.length > 0 && (
            <button 
              onClick={() => {
                // Clear all selected symptoms
                category.symptoms.forEach(symptom => {
                  if (selectedSymptoms.includes(symptom.id)) {
                    onSymptomToggle(symptom.id);
                  }
                });
              }}
              className="text-sm text-red-600 hover:text-red-800"
              aria-label="Clear all selected symptoms"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      
      {/* Search input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Search symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search symptoms"
        />
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Symptom selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {filteredSymptoms.length > 0 ? (
          filteredSymptoms.map(symptom => (
            <div 
              key={symptom.id}
              onClick={() => onSymptomToggle(symptom.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedSymptoms.includes(symptom.id) 
                  ? `border-blue-500 bg-blue-50` 
                  : 'hover:border-gray-400'
              }`}
              role="checkbox"
              aria-checked={selectedSymptoms.includes(symptom.id)}
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSymptomToggle(symptom.id);
                }
              }}
            >
              <div className="flex items-center">
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                  selectedSymptoms.includes(symptom.id) 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-400'
                }`}>
                  {selectedSymptoms.includes(symptom.id) && (
                    <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="ml-3 text-gray-700">{symptom.label}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-4 text-center text-gray-500">
            No symptoms match your search. Try a different term.
          </div>
        )}
      </div>
      
      {/* Continue button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {selectedSymptoms.length === 0 ? (
            <span>Please select at least one symptom to continue</span>
          ) : (
            <span>You've selected {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <button
          onClick={onContinue}
          disabled={selectedSymptoms.length === 0}
          className={`px-6 py-2 rounded-md ${
            selectedSymptoms.length > 0
              ? 'bg-blue-900 text-white hover:bg-blue-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Continue to severity assessment"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default SymptomSelector;
