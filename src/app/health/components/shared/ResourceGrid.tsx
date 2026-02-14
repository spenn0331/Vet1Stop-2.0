"use client";

import React from 'react';
import { HealthResource } from '../../types/HealthResourceTypes';
import ResourceCard from './ResourceCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ResourceGridProps {
  resources: HealthResource[];
  savedResources?: string[];
  onToggleSave?: (resourceId: string) => void;
  onViewDetails: (resource: HealthResource) => void;
  onRequestInfo?: (resource: HealthResource) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  searchTerm?: string;
}

/**
 * ResourceGrid Component
 * 
 * A reusable grid layout for displaying health resources.
 * Supports loading states, empty states, and responsive grid layout.
 */
const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  savedResources,
  onToggleSave,
  onViewDetails,
  isLoading = false,
  emptyMessage = 'No resources found',
  searchTerm = ''
}) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-2 bg-gray-200"></div>
            <div className="p-5">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchTerm 
            ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
            : 'Try adjusting your filters or check back later for new resources.'}
        </p>
      </div>
    );
  }

  // Resource grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id || ''}
          resource={resource}
          isSaved={savedResources?.includes(resource.id || '') || false}
          onToggleSave={onToggleSave}
          onViewDetails={onViewDetails}
          featured={resource.isFeatured}
        />
      ))}
    </div>
  );
};

export default ResourceGrid;
