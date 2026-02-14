"use client";

import React, { useState } from 'react';
import { Pathway } from '@/types/pathway';
import PathwaySelector from './pathway/PathwaySelector';
// Import the SectionHeader component we created
import { SectionHeader } from '@/components/SectionHeader';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PathwayProvider } from '@/context/PathwayContext';
import PathwayNavigator from './pathway/PathwayNavigator';
import PathwayStep from './pathway/PathwayStep';
import LazyLoadSection from './LazyLoadSection';

interface ResourcePathwaysSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ResourcePathwaysSection({
  title = "Guided Health Journeys",
  subtitle = "Step-by-step guidance for navigating common veteran healthcare scenarios",
  className = '',
}: ResourcePathwaysSectionProps) {
  const [selectedPathway, setSelectedPathway] = useState<Pathway | null>(null);

  const handleSelectPathway = (pathway: Pathway) => {
    setSelectedPathway(pathway);
  };

  const handleBackToList = () => {
    setSelectedPathway(null);
  };

  return (
    <LazyLoadSection className={`my-8 ${className}`}>
      <section id="health-journeys" className="mb-12">
        <SectionHeader 
          title={title}
          subtitle={subtitle}
          className="mb-6"
        />
        
        {!selectedPathway ? (
          <PathwaySelector 
            onSelectPathway={handleSelectPathway}
            featuredOnly={false} 
            limit={6}
          />
        ) : (
          <PathwayProvider>
            <div>
              <button
                onClick={handleBackToList}
                className="inline-flex items-center text-[#1A2C5B] font-medium mb-6 hover:text-blue-800"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Back to All Journeys
              </button>
              
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h2 className="text-2xl font-semibold text-[#1A2C5B] mb-2">
                  {selectedPathway.title}
                </h2>
                <p className="text-gray-700 mb-4">
                  {selectedPathway.description}
                </p>
                
                {selectedPathway.targetAudience && selectedPathway.targetAudience.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Best for: </span>
                    <span className="text-sm text-gray-600">
                      {selectedPathway.targetAudience.join(', ')}
                    </span>
                  </div>
                )}
                
                {selectedPathway.estimatedDuration && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Estimated time: </span>
                    <span className="text-sm text-gray-600">
                      {selectedPathway.estimatedDuration} minutes
                    </span>
                  </div>
                )}
              </div>
              
              <PathwayNavigator />
              <PathwayStep />
            </div>
          </PathwayProvider>
        )}
      </section>
    </LazyLoadSection>
  );
}
