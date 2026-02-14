"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePathway, PathwayProvider } from '@/context/PathwayContext';
import PathwayNavigator from '../../components/pathway/PathwayNavigator';
import PathwayStep from '../../components/pathway/PathwayStep';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { SectionHeader } from '@/components/SectionHeader';

export default function PathwayPage() {
  return (
    <PathwayProvider>
      <PathwayContent />
    </PathwayProvider>
  );
}

function PathwayContent() {
  const params = useParams();
  const pathwayId = params.id as string;
  const { startPathway, activePath, isLoading, error } = usePathway();

  useEffect(() => {
    if (pathwayId) {
      startPathway(pathwayId);
    }
  }, [pathwayId, startPathway]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Link
        href="/health"
        className="inline-flex items-center text-[#1A2C5B] font-medium mb-6 hover:text-blue-800"
      >
        <ArrowLeftIcon className="mr-2 h-5 w-5" />
        Back to Health Resources
      </Link>

      <SectionHeader
        title="Health Journey"
        subtitle="Follow this step-by-step guide to navigate your healthcare needs"
        className="mb-6"
      />

      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-full bg-gray-200 rounded mb-6"></div>
          <div className="h-64 w-full bg-gray-200 rounded mb-4"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-lg">
          <p className="text-red-600">Error: {error.message}</p>
          <p className="text-red-600 mt-2">Please try again later or select a different health journey.</p>
        </div>
      ) : activePath ? (
        <div>
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-[#1A2C5B] mb-2">
              {activePath.title}
            </h2>
            <p className="text-gray-700 mb-4">
              {activePath.description}
            </p>
            
            {activePath.targetAudience && activePath.targetAudience.length > 0 && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700">Best for: </span>
                <span className="text-sm text-gray-600">
                  {activePath.targetAudience.join(', ')}
                </span>
              </div>
            )}
            
            {activePath.estimatedDuration && (
              <div>
                <span className="text-sm font-medium text-gray-700">Estimated time: </span>
                <span className="text-sm text-gray-600">
                  {activePath.estimatedDuration} minutes
                </span>
              </div>
            )}
          </div>
          
          <PathwayNavigator />
          <PathwayStep />
        </div>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg">
          <p className="text-yellow-700">Pathway not found. Please select a valid health journey.</p>
          <Link 
            href="/health" 
            className="text-[#1A2C5B] font-medium mt-2 inline-block hover:underline"
          >
            Return to Health Resources
          </Link>
        </div>
      )}
    </div>
  );
}
