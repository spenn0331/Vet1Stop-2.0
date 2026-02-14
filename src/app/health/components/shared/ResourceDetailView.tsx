"use client";

import React, { useState } from 'react';
import { 
  HeartIcon,
  ShareIcon,
  StarIcon,
  CheckBadgeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  ClipboardIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import StandaloneModal from './StandaloneModal';
import { ResourceDetailViewProps, HealthResource } from '../../types/health-types';
import { formatDate, normalizeArray } from '../../utils/health-utils';

/**
 * ResourceDetailView Component
 * 
 * A comprehensive view of a health resource with all details,
 * interactive elements, and related resources.
 */
const ResourceDetailView: React.FC<ResourceDetailViewProps> = ({
  resource,
  isOpen,
  onClose,
  onSave,
  onShare,
  onRate,
  onViewRelated,
  isSaved = false,
  relatedResources = [],
  isLoadingRelated = false
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [localIsSaved, setLocalIsSaved] = useState<boolean>(isSaved);
  const [showShareSuccess, setShowShareSuccess] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(resource?.rating || 0);
  const [showRatingSuccess, setShowRatingSuccess] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Function to handle save action
  const handleSave = () => {
    if (onSave && resource) {
      onSave(resource);
      setLocalIsSaved(!localIsSaved);
    }
  };

  // Function to handle share action
  const handleShare = () => {
    if (onShare && resource) {
      onShare(resource);
      setShowShareSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowShareSuccess(false);
      }, 3000);
    }
  };

  // Function to handle rating
  const handleRate = (value: number) => {
    setRating(value);
    
    if (onRate) {
      onRate(value);
      
      // Show success message
      setShowRatingSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowRatingSuccess(false);
      }, 3000);
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      
      // Reset copy success message after 2 seconds
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    });
  };

  // Check if resource exists
  if (!resource) {
    return (
      <StandaloneModal isOpen={isOpen} onClose={onClose}>
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Resource Not Found</h3>
          <p className="text-gray-600 mb-4">The requested resource could not be found or has been removed.</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#1A2C5B] border border-transparent rounded-md hover:bg-[#1A2C5B]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          >
            Close
          </button>
        </div>
      </StandaloneModal>
    );
  }

  // Normalize contact information
  const contact = resource.contact || {};
  const phone = contact.phone || resource.phone || '';
  const email = contact.email || resource.email || '';
  const website = contact.website || resource.website || resource.link || '';

  // Normalize location information
  const location = resource.location || {};
  const address = location.address || resource.address || '';
  const city = location.city || resource.city || '';
  const state = location.state || resource.state || '';
  const zipCode = location.zipCode || resource.zipCode || '';

  // Format full address
  const fullAddress = [
    address,
    city && state ? `${city}, ${state}` : (city || state),
    zipCode
  ].filter(Boolean).join(' ');

  // Get eligibility information
  const veteranTypes = normalizeArray(resource.veteranType);
  const serviceBranches = normalizeArray(resource.serviceBranch);

  return (
    <StandaloneModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-[#1A2C5B] mb-2">
              {resource.title}
            </h2>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {resource.resourceType && (
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {Array.isArray(resource.resourceType) 
                    ? resource.resourceType[0] 
                    : resource.resourceType}
                </span>
              )}
              
              {resource.verified && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                  <CheckBadgeIcon className="h-3 w-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
            
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-5 w-5 ${
                    star <= (rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating ? `${rating.toFixed(1)} · ` : ''}
                {resource.reviewCount ? `${resource.reviewCount} reviews` : 'No reviews yet'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full ${localIsSaved ? 'bg-red-50' : 'hover:bg-gray-100'}`}
              aria-label={localIsSaved ? 'Remove from saved' : 'Save resource'}
            >
              {localIsSaved ? (
                <HeartIconSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Share resource"
            >
              <ShareIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            {showShareSuccess && (
              <span className="text-sm text-green-600 self-center">Copied to clipboard!</span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <p className={`text-gray-700 ${!expanded && 'line-clamp-3'}`}>
            {resource.description}
          </p>
          
          {resource.description && resource.description.length > 240 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-[#1A2C5B] hover:text-[#1A2C5B]/80 text-sm font-medium"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
        
        {/* Two column layout for details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contact Information */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1A2C5B] mb-4">
              Contact Information
            </h3>
            
            <div className="space-y-4">
              {/* Phone */}
              {phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <PhoneIcon className="h-5 w-5 text-blue-700" />
                    </div>
                    <span className="text-gray-700">{phone}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => copyToClipboard(phone, 'phone')}
                      className="p-1.5 text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Copy phone number"
                    >
                      {copiedField === 'phone' ? (
                        <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClipboardIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <a 
                      href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                      className="p-1.5 text-white bg-[#1A2C5B] hover:bg-[#1A2C5B]/90 rounded-full transition-colors"
                      aria-label="Call this number"
                    >
                      <PhoneIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Email */}
              {email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <EnvelopeIcon className="h-5 w-5 text-green-700" />
                    </div>
                    <span className="text-gray-700">{email}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => copyToClipboard(email, 'email')}
                      className="p-1.5 text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Copy email address"
                    >
                      {copiedField === 'email' ? (
                        <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClipboardIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <a 
                      href={`mailto:${email}`}
                      className="p-1.5 text-white bg-[#1A2C5B] hover:bg-[#1A2C5B]/90 rounded-full transition-colors"
                      aria-label="Send email"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Website */}
              {website && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <GlobeAltIcon className="h-5 w-5 text-purple-700" />
                    </div>
                    <span className="text-gray-700 truncate max-w-[180px]">
                      {website.replace(/^https?:\/\//, '')}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => copyToClipboard(website, 'website')}
                      className="p-1.5 text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Copy website URL"
                    >
                      {copiedField === 'website' ? (
                        <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClipboardIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <a 
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-white bg-[#1A2C5B] hover:bg-[#1A2C5B]/90 rounded-full transition-colors"
                      aria-label="Visit website"
                    >
                      <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
              
              {/* Address */}
              {fullAddress && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-2 rounded-full mr-3">
                      <MapPinIcon className="h-5 w-5 text-orange-700" />
                    </div>
                    <span className="text-gray-700">{fullAddress}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => copyToClipboard(fullAddress, 'address')}
                      className="p-1.5 text-gray-500 hover:text-[#1A2C5B] hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Copy address"
                    >
                      {copiedField === 'address' ? (
                        <CheckBadgeIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ClipboardIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-white bg-[#1A2C5B] hover:bg-[#1A2C5B]/90 rounded-full transition-colors"
                      aria-label="View on map"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Eligibility Information */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1A2C5B] mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-[#1A2C5B]" />
              Eligibility Information
            </h3>
            
            {!resource.eligibility && veteranTypes.length === 0 && serviceBranches.length === 0 ? (
              <div className="p-3 bg-blue-50 rounded-lg text-blue-700 flex items-center">
                <CheckBadgeIcon className="h-5 w-5 mr-2 text-blue-600" />
                <p>Available to all veterans</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Eligibility description if available */}
                {resource.eligibility && (
                  <div className="mb-3">
                    <p className="text-gray-700">{resource.eligibility}</p>
                  </div>
                )}
                
                {/* Veteran Type section */}
                {veteranTypes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1 text-gray-500" />
                      Veteran Types:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {veteranTypes.map((type, index) => (
                        <span 
                          key={index} 
                          className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Service Branch section */}
                {serviceBranches.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Service Branches:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {serviceBranches.map((branch, index) => (
                        <span 
                          key={index} 
                          className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs"
                        >
                          {branch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Last updated */}
            {resource.lastUpdated && (
              <div className="mt-4 text-xs text-gray-500">
                Last updated: {formatDate(resource.lastUpdated)}
              </div>
            )}
          </div>
        </div>
        
        {/* Rate this resource */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-[#1A2C5B] mb-3">
            Rate this resource
          </h3>
          
          <div className="flex items-center space-x-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="h-8 w-8 focus:outline-none"
                  aria-label={`Rate ${star} stars`}
                >
                  <StarIcon
                    className={`h-7 w-7 ${
                      star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {showRatingSuccess && (
              <div className="flex items-center text-green-600">
                <CheckBadgeIcon className="h-5 w-5 mr-2" />
                <span>Thank you for your feedback!</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Related Resources */}
        {relatedResources.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-[#1A2C5B] mb-3 flex items-center">
              <LinkIcon className="h-5 w-5 mr-2 text-[#1A2C5B]" />
              Related Resources
            </h3>
            
            <div className="space-y-3">
              {relatedResources.map((relatedResource) => (
                <div 
                  key={relatedResource._id || relatedResource.id} 
                  className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onViewRelated && onViewRelated(relatedResource)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-[#1A2C5B]">{relatedResource.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1">{relatedResource.description}</p>
                    </div>
                    <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StandaloneModal>
  );
};

export default ResourceDetailView;
