"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

/**
 * Pathway interface for healthcare pathways
 * @property id - Unique identifier for the pathway
 * @property title - Display title for the pathway
 * @property description - Description of what the pathway covers
 * @property image - Optional image URL for the pathway
 * @property steps - Number of steps in the pathway
 * @property estimatedTime - Estimated time to complete the pathway
 * @property category - Category the pathway belongs to
 * @property featured - Whether the pathway is featured
 * @property rating - Optional user rating for the pathway
 * @property completions - Optional number of users who completed the pathway
 * @property difficulty - Optional difficulty level of the pathway
 */
export interface Pathway {
  id: string;
  title: string;
  description: string;
  image?: string;
  steps: number;
  estimatedTime: string;
  category: string;
  featured?: boolean;
  rating?: number;
  completions?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Sample pathways data - in a real app, this would come from an API or database
const SAMPLE_PATHWAYS: Pathway[] = [
  {
    id: 'va-enrollment',
    title: 'VA Healthcare Enrollment',
    description: 'Step-by-step guide to enrolling in VA healthcare benefits',
    image: '/images/health/pathways/va-enrollment.jpg',
    steps: 5,
    estimatedTime: '15-20 min',
    category: 'Benefits',
    featured: true,
    rating: 4.8,
    completions: 2456
  },
  {
    id: 'mental-health-services',
    title: 'Accessing Mental Health Services',
    description: 'Navigate mental health resources available to veterans',
    image: '/images/health/pathways/mental-health.jpg',
    steps: 4,
    estimatedTime: '10-15 min',
    category: 'Mental Health',
    featured: true,
    rating: 4.9,
    completions: 3201
  },
  {
    id: 'community-care',
    title: 'Community Care Program',
    description: 'Understanding when and how to use VA community care options',
    image: '/images/health/pathways/community-care.jpg',
    steps: 6,
    estimatedTime: '20-25 min',
    category: 'Benefits',
    rating: 4.7,
    completions: 1872
  },
  {
    id: 'disability-claim',
    title: 'Filing a Health-Related Disability Claim',
    description: 'Guide to documenting and filing health-related disability claims',
    image: '/images/health/pathways/disability-claim.jpg',
    steps: 7,
    estimatedTime: '25-30 min',
    category: 'Benefits',
    rating: 4.6,
    completions: 5438
  },
  {
    id: 'caregiver-support',
    title: 'Caregiver Support Program',
    description: 'Resources and steps for family caregivers of veterans',
    image: '/images/health/pathways/caregiver.jpg',
    steps: 4,
    estimatedTime: '15 min',
    category: 'Family Support',
    featured: true,
    rating: 4.8,
    completions: 1256
  },
  {
    id: 'telehealth',
    title: 'Setting Up VA Telehealth',
    description: 'How to access VA healthcare services remotely',
    image: '/images/health/pathways/telehealth.jpg',
    steps: 3,
    estimatedTime: '10 min',
    category: 'Technology',
    rating: 4.5,
    completions: 3102
  }
];

/**
 * Props for the PathwaySelector component
 * @property onSelectPathway - Callback when a pathway is selected
 * @property featuredOnly - Whether to show only featured pathways
 * @property limit - Optional limit on the number of pathways to display
 * @property category - Optional category filter
 * @property pathways - Optional custom pathways to use instead of sample data
 */
export interface PathwaySelectorProps {
  onSelectPathway: (pathway: Pathway) => void;
  featuredOnly?: boolean;
  limit?: number;
  category?: string;
  pathways?: Pathway[];
}

/**
 * A component that displays a list of healthcare pathways for veterans to select from
 * Supports filtering by category, featuring only certain pathways, and limiting the number shown
 */
const PathwaySelector: React.FC<PathwaySelectorProps> = ({ 
  onSelectPathway, 
  featuredOnly = false, 
  limit,
  category,
  pathways: providedPathways = SAMPLE_PATHWAYS
}) => {
  // State for filtered pathways and UI state
  const [filteredPathways, setFilteredPathways] = useState<Pathway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate categories - moved before conditional return to follow React Hooks rules
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(providedPathways.map(p => p.category)));
    return uniqueCategories.sort();
  }, [providedPathways]);
  
  // Handle category selection
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);
  
  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Filter and process pathways based on props and state
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay for better UX
    const timer = setTimeout(() => {
      try {
        let result = [...providedPathways];
        
        // Apply featured filter if needed
        if (featuredOnly) {
          result = result.filter(p => p.featured);
        }
        
        // Apply category filter if selected
        if (selectedCategory) {
          result = result.filter(p => p.category === selectedCategory);
        }
        
        // Apply search filter if there's a search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          result = result.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.description.toLowerCase().includes(term)
          );
        }
        
        // Apply limit if provided
        if (limit && limit > 0) {
          result = result.slice(0, limit);
        }
        
        setFilteredPathways(result);
      } catch (error) {
        console.error('Error filtering pathways:', error);
        setFilteredPathways([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [featuredOnly, limit, providedPathways, selectedCategory, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2C5B]"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search and filter controls */}
      {!featuredOnly && categories.length > 1 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search pathways..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Pathways grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPathways.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No pathways found matching your criteria.
          </div>
        ) : (
          filteredPathways.map((pathway: Pathway) => (
            <div 
              key={pathway.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              onClick={() => onSelectPathway(pathway)}
            >
              <div className="relative h-48 w-full">
                {pathway.image ? (
                  <div className="relative h-full w-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                    <Image 
                      src={pathway.image} 
                      alt={pathway.title}
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-full w-full bg-gradient-to-r from-blue-800 to-blue-900 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{pathway.title.charAt(0)}</span>
                  </div>
                )}
                
                {pathway.featured && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-blue-900 px-2 py-1 rounded-md text-xs font-bold flex items-center z-20">
                    <StarIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                    Featured
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold text-[#1A2C5B] mb-2">{pathway.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{pathway.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {pathway.steps} steps
                    </span>
                    <span className="ml-2 text-xs">{pathway.estimatedTime}</span>
                  </div>
                  
                  {pathway.rating && (
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" aria-hidden="true" />
                      <span>{pathway.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {pathway.completions?.toLocaleString() || 0} veterans completed
                  </span>
                  <span className="text-blue-600 text-sm font-medium flex items-center">
                    Start Pathway
                    <ChevronRightIcon className="h-4 w-4 ml-1" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PathwaySelector;
