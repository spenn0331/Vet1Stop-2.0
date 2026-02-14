'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Resource } from '@/models/resource';
import { useAuth } from '@/contexts/AuthContext';
import { BookmarkIcon, StarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

interface ResourceCardProps {
  resource: Resource;
  isPremium?: boolean;
}

const ResourceCard = ({ resource, isPremium = false }: ResourceCardProps) => {
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  
  // Premium feature handling
  const handleSave = () => {
    if (!user) {
      // Redirect to sign in if not logged in
      window.location.href = `/signin?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    if (!isPremium && resource.isPremiumContent) {
      // Show premium upgrade prompt
      // In a real implementation, this would open a modal or redirect to pricing
      alert('This is a premium feature. Please upgrade to save premium resources.');
      return;
    }
    
    setSaved(!saved);
    // In a real implementation, this would save to the user's bookmarks in database
  };
  
  return (
    <div className="relative flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      {resource.featured && (
        <div className="absolute top-0 right-0 bg-blue-700 text-white px-2 py-1 text-xs font-bold rounded-bl-md">
          Featured
        </div>
      )}
      
      {/* Category Badge */}
      <div className="px-4 py-2 bg-gray-50">
        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
          {resource.subcategory.charAt(0).toUpperCase() + resource.subcategory.slice(1)}
        </span>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{resource.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{resource.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag} 
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              +{resource.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <button 
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save resource"}
          className={`flex items-center text-sm font-medium ${
            saved ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
          } ${!isPremium && resource.isPremiumContent ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {saved ? (
            <BookmarkSolidIcon className="h-5 w-5 mr-1" aria-hidden="true" />
          ) : (
            <BookmarkIcon className="h-5 w-5 mr-1" aria-hidden="true" />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
        
        <Link 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          aria-label={`View ${resource.title} resource`}
        >
          View Resource
          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" aria-hidden="true" />
        </Link>
      </div>
      
      {/* Premium Upgrade Overlay - shown only on premium resources for non-premium users */}
      {!isPremium && resource.isPremiumContent && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center flex-col p-6 text-center">
          <StarIcon className="h-10 w-10 text-yellow-400 mb-2" aria-hidden="true" />
          <h3 className="text-white font-bold text-lg mb-2">Premium Resource</h3>
          <p className="text-white text-sm mb-4">Unlock this and other premium resources with a subscription.</p>
          <Link 
            href="/pricing" 
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
