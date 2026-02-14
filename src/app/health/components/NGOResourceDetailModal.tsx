"use client";

import React from 'react';
import Image from 'next/image';
import { 
  XMarkIcon, 
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HealthResource } from '../types/HealthResourceTypes';

interface NGOResourceDetailModalProps {
  resource: HealthResource;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onSave: (resourceId: string) => void;
  onRequestInfo?: (resource: HealthResource) => void;
}

const NGOResourceDetailModal: React.FC<NGOResourceDetailModalProps> = ({
  resource,
  isOpen,
  onClose,
  isSaved,
  onSave,
  onRequestInfo
}) => {
  if (!isOpen) return null;

  // Generate stars for rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <StarIcon
        key={i}
        className={`h-5 w-5 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4 z-[10000]">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Header with image */}
          <div className="relative h-48 sm:h-64 w-full bg-gray-100">
            {resource.imageUrl ? (
              <Image
                src={resource.imageUrl}
                alt={resource.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-900 to-blue-800">
                <span className="text-white font-semibold text-xl">{resource.provider}</span>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {resource.isVerified && (
                <div className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  Verified
                </div>
              )}
              
              {resource.isVeteranLed && (
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center">
                  <UserGroupIcon className="h-4 w-4 mr-1" />
                  Veteran Founded
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-blue-900">{resource.title}</h2>
              <button 
                onClick={() => onSave(resource.id)}
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
            
            <div className="mt-2 flex items-center">
              <div className="flex">
                {renderStars(resource.rating)}
              </div>
              <span className="ml-2 text-gray-600">
                {resource.rating.toFixed(1)}
                {resource.reviewCount && ` (${resource.reviewCount} reviews)`}
              </span>
            </div>
            
            <p className="mt-4 text-gray-700">{resource.description}</p>
            
            {/* Categories and Tags */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-blue-900">Categories</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {resource.categories.map((category, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-md"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            
            {resource.tags && resource.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-blue-900">Tags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Contact Information */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-blue-900">Contact Information</h3>
              <div className="mt-2 space-y-2">
                {resource.contactInfo?.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <a href={`tel:${resource.contactInfo.phone}`} className="text-blue-600 hover:underline">
                      {resource.contactInfo.phone}
                    </a>
                  </div>
                )}
                
                {resource.contactInfo?.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <a href={`mailto:${resource.contactInfo.email}`} className="text-blue-600 hover:underline">
                      {resource.contactInfo.email}
                    </a>
                  </div>
                )}
                
                {resource.url && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <a 
                      href={resource.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                
                {resource.location?.address && (
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p>{resource.location.address}</p>
                      {resource.location.city && resource.location.state && (
                        <p>
                          {resource.location.city}, {resource.location.state}
                          {resource.location.zipCode && ` ${resource.location.zipCode}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Eligibility */}
            {resource.eligibility && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-900">Eligibility</h3>
                <p className="mt-2 text-gray-700">{resource.eligibility}</p>
              </div>
            )}
            
            {/* Cost Information */}
            {resource.costInfo && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-900">Cost Information</h3>
                <p className="mt-2 text-gray-700">{resource.costInfo}</p>
              </div>
            )}
            
            {/* Available Services */}
            {resource.availableServices && resource.availableServices.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-900">Available Services</h3>
                <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                  {resource.availableServices.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Service Branches */}
            {resource.serviceBranches && resource.serviceBranches.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-900">Service Branches</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resource.serviceBranches.map((branch, index) => (
                    <span 
                      key={index} 
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-md"
                    >
                      {branch}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Veteran Eras */}
            {resource.veteranEras && resource.veteranEras.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-blue-900">Veteran Eras</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {resource.veteranEras.map((era, index) => (
                    <span 
                      key={index} 
                      className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-md"
                    >
                      {era}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-md transition-colors"
            >
              Visit Website
            </a>
            
            {onRequestInfo && (
              <button
                onClick={() => onRequestInfo(resource)}
                className="py-2 px-4 bg-white border border-blue-900 text-blue-900 hover:bg-blue-50 font-medium rounded-md transition-colors"
              >
                Request More Information
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOResourceDetailModal;
