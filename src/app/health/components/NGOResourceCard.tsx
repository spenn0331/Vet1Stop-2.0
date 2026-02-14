"use client";

import React from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HealthResource } from '../types/HealthResourceTypes';

interface NGOResourceCardProps {
  resource: HealthResource;
  isSaved: boolean;
  onSave: (resourceId: string) => void;
  onViewDetails: (resource: HealthResource) => void;
}

const NGOResourceCard: React.FC<NGOResourceCardProps> = ({
  resource,
  isSaved,
  onSave,
  onViewDetails
}) => {
  // Generate stars for rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 flex flex-col h-full">
      {/* Resource Image */}
      <div className="relative h-40 w-full bg-gray-100">
        {resource.imageUrl ? (
          <Image
            src={resource.imageUrl}
            alt={resource.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-900 to-blue-800">
            <span className="text-white font-semibold text-lg">{resource.provider}</span>
          </div>
        )}
        
        {/* Veteran-Led Badge */}
        {resource.isVeteranLed && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
            Veteran Founded
          </div>
        )}
        
        {/* Verified Badge */}
        {resource.isVerified && (
          <div className="absolute top-2 left-2 bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
            Verified
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-blue-900 line-clamp-2">{resource.title}</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSave(resource.id);
            }}
            className="text-red-600 hover:text-red-700 transition-colors"
            aria-label={isSaved ? "Remove from saved resources" : "Save resource"}
          >
            {isSaved ? (
              <HeartIconSolid className="h-6 w-6" />
            ) : (
              <HeartIcon className="h-6 w-6" />
            )}
          </button>
        </div>
        
        <p className="text-gray-600 mt-2 text-sm line-clamp-3">{resource.description}</p>
        
        {/* Categories */}
        <div className="mt-3 flex flex-wrap gap-1">
          {resource.categories.slice(0, 3).map((category, index) => (
            <span 
              key={index} 
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md"
            >
              {category}
            </span>
          ))}
          {resource.categories.length > 3 && (
            <span className="text-xs text-gray-500">+{resource.categories.length - 3} more</span>
          )}
        </div>
        
        {/* Rating */}
        <div className="mt-4 flex items-center">
          <div className="flex">
            {renderStars(resource.rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {resource.rating.toFixed(1)}
            {resource.reviewCount && ` (${resource.reviewCount})`}
          </span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => onViewDetails(resource)}
          className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default NGOResourceCard;
