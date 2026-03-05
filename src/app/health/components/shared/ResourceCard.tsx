// Phase 1 + 1.5 feedback framework skeleton — data-ready Day 1 per Living Master MD Section 2 ★ — Strike 2 March 2026
"use client";

import React, { useState, useCallback } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { StarIcon, CheckBadgeIcon, MapPinIcon, CalendarIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid } from '@heroicons/react/24/solid';
import { HealthResource } from '../../types/HealthResourceTypes';
import { formatDate } from '../../utils/health-utils';

interface ResourceCardProps {
  resource: HealthResource;
  isSaved?: boolean;
  onToggleSave?: (resourceId: string) => void;
  onViewDetails: (resource: HealthResource) => void;
  onRequestInfo?: (resource: HealthResource) => void;
  featured?: boolean;
  compact?: boolean;
}

/**
 * ResourceCard Component
 * 
 * A reusable card component for displaying health resources.
 * Supports saving, rating display, and resource type indicators.
 */
const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isSaved,
  onToggleSave,
  onViewDetails,
  featured = false
}) => {
  // ─── Feedback state (Strike 2 skeleton) ──────────────────────────────────
  const [thumbsState, setThumbsState] = useState<'up' | 'down' | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState(false);

  const submitFeedback = useCallback(async (
    thumbs: 'up' | 'down' | null,
    rating: number | null
  ) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id || resource.title,
          thumbs,
          rating,
          track: resource.categories?.[0] ?? 'unknown',
          source: 'health',
        }),
      });
    } catch {
      // Feedback should never block UX
    }
    setFeedbackToast(true);
    setTimeout(() => setFeedbackToast(false), 2500);
  }, [resource.id, resource.title, resource.categories]);

  const handleThumb = (direction: 'up' | 'down') => {
    const next = thumbsState === direction ? null : direction;
    setThumbsState(next);
    if (next) submitFeedback(next, userRating);
  };

  const handleStarClick = (star: number) => {
    const next = userRating === star ? null : star;
    setUserRating(next);
    if (next) submitFeedback(thumbsState, next);
  };
  // Get resource type badge color
  const getResourceTypeColor = (type: string) => {
    const types: Record<string, string> = {
      'va': 'bg-blue-100 text-blue-800',
      'federal': 'bg-indigo-100 text-indigo-800',
      'state': 'bg-purple-100 text-purple-800',
      'nonprofit': 'bg-green-100 text-green-800',
      'private': 'bg-orange-100 text-orange-800',
      'community': 'bg-teal-100 text-teal-800',
      'mental-health': 'bg-red-100 text-red-800',
      'primary-care': 'bg-blue-100 text-blue-800',
      'specialty-care': 'bg-purple-100 text-purple-800'
    };
    
    return types[type.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Format resource type label
  const getResourceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'va': 'VA',
      'federal': 'Federal',
      'state': 'State',
      'nonprofit': 'Non-Profit',
      'private': 'Private',
      'community': 'Community',
      'mental-health': 'Mental Health',
      'primary-care': 'Primary Care',
      'specialty-care': 'Specialty Care'
    };
    
    return types[type.toLowerCase()] || type.replace(/-/g, ' ');
  };

  // Get resource type display
  const resourceTypeDisplay = () => {
    // Use categories from the new HealthResource type
    if (!resource.categories || resource.categories.length === 0) return null;
    
    const types = resource.categories.slice(0, 1);
    
    return types.map((type: string, index: number) => (
      <span 
        key={index}
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getResourceTypeColor(type)}`}
      >
        {getResourceTypeLabel(type)}
      </span>
    ));
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border ${
        featured ? 'border-[#EAB308]' : 'border-gray-200'
      }`}
    >
      {/* Colored header bar */}
      <div className={`h-2 ${featured ? 'bg-[#EAB308]' : 'bg-[#1A2C5B]'}`}></div>
      
      {/* Card content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-grow mr-2">
            <h3 
              className="text-lg font-semibold text-[#1A2C5B] mb-1 line-clamp-2 hover:underline cursor-pointer"
              onClick={() => onViewDetails(resource)}
            >
              {resource.title}
            </h3>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {resourceTypeDisplay()}
              {resource.isVerified && (
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                  <CheckBadgeIcon className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSave) {
                onToggleSave(resource.id || '');
              }
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
            aria-label={isSaved ? "Remove from saved resources" : "Save resource"}
          >
            {isSaved ? (
              <HeartIconSolid className="h-6 w-6 text-red-500" />
            ) : (
              <HeartIcon className="h-6 w-6" />
            )}
          </button>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {resource.description}
        </p>
        
        <div className="flex flex-col space-y-2">
          {/* Rating */}
          {resource.rating !== undefined && (
            <div className="flex items-center">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(resource.rating || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-xs text-gray-600">
                {resource.rating?.toFixed(1)} {resource.reviewCount ? `(${resource.reviewCount})` : ''}
              </span>
            </div>
          )}
          
          {/* Location */}
          {(resource.location?.city || resource.location?.state) && (
            <div className="flex items-center text-xs text-gray-500">
              <MapPinIcon className="h-3 w-3 mr-1" />
              <span>
                {[
                  resource.location.city,
                  resource.location.state
                ].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          {/* Last updated */}
          {resource.lastUpdated && (
            <div className="flex items-center text-xs text-gray-500">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>Updated {formatDate(resource.lastUpdated)}</span>
            </div>
          )}
        </div>
        
        {/* ─── Feedback: Thumbs + User Star Rating (Strike 2 skeleton) ─── */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleThumb('up'); }}
              className={`p-1 rounded transition-colors ${
                thumbsState === 'up'
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              aria-label="Thumbs up — this resource was helpful"
              title="Helpful"
            >
              {thumbsState === 'up'
                ? <HandThumbUpSolid className="h-4 w-4" />
                : <HandThumbUpIcon className="h-4 w-4" />
              }
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleThumb('down'); }}
              className={`p-1 rounded transition-colors ${
                thumbsState === 'down'
                  ? 'text-red-500 bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              aria-label="Thumbs down — this resource was not helpful"
              title="Not helpful"
            >
              {thumbsState === 'down'
                ? <HandThumbDownSolid className="h-4 w-4" />
                : <HandThumbDownIcon className="h-4 w-4" />
              }
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={`user-rate-${star}`}
                onClick={(e) => { e.stopPropagation(); handleStarClick(star); }}
                className="p-0 transition-colors"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                title={`${star} star${star > 1 ? 's' : ''}`}
              >
                <StarIcon
                  className={`h-4 w-4 ${
                    userRating && star <= userRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Toast */}
        {feedbackToast && (
          <div className="mt-2 text-xs text-center text-green-700 bg-green-50 rounded py-1 animate-pulse">
            Thank you — this helps us improve
          </div>
        )}

        <button
          onClick={() => onViewDetails(resource)}
          className="mt-4 w-full py-2 bg-[#1A2C5B] hover:bg-[#1A2C5B]/90 text-white rounded-md text-sm font-medium transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
