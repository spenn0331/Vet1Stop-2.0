"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ResourceCard from '@/app/health/components/shared/ResourceCard';
import { adaptToModelResource } from '@/types/health-resource-adapter';
import { HealthResource } from '@/models/healthResource';

export default function HealthResourcesPage() {
  const searchParams = useSearchParams();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get search parameters
  const category = searchParams.get('category');
  const resourceType = searchParams.get('resourceType');
  const searchTerm = searchParams.get('search');
  
  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      setError(null);
      
      try {
        // Build the query URL with all possible filters
        // Use limit=200 to show all resources (we have 189 in the database)
        let queryUrl = '/api/health/resources?limit=200';
        
        if (category) {
          queryUrl += `&category=${encodeURIComponent(category)}`;
          // Also add as context to help with special handling
          queryUrl += `&context=${encodeURIComponent(category)}`;
        }
        
        if (resourceType) {
          queryUrl += `&resourceType=${encodeURIComponent(resourceType)}`;
        }
        
        if (searchTerm) {
          queryUrl += `&search=${encodeURIComponent(searchTerm)}`;
        }
        
        console.log('Fetching resources with URL:', queryUrl);
        const response = await fetch(queryUrl);
        
        if (!response.ok) {
          throw new Error(`Error fetching resources: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resources received:', data.length);
        
        // If no resources found with the specific category, try a broader search
        if (data.length === 0 && category) {
          console.log('No specific resources found, trying broader search...');
          // Try a broader search with related keywords
          const keywordMap: Record<string, string[]> = {
            'Transitioning from Military Healthcare': ['military', 'healthcare', 'veteran', 'va', 'tricare'],
            'PTSD': ['mental health', 'trauma', 'therapy', 'counseling'],
            'Managing PTSD': ['mental health', 'trauma', 'therapy', 'counseling']
          };
          
          const keywords = keywordMap[category as string] || [];
          if (keywords.length > 0) {
            // Try with keywords
            const broadQueryUrl = `/api/health/resources?limit=50&search=${encodeURIComponent(keywords.join(' OR '))}`;
            console.log('Fallback search URL:', broadQueryUrl);
            
            const broadResponse = await fetch(broadQueryUrl);
            if (broadResponse.ok) {
              const broadData = await broadResponse.json();
              console.log('Broader search found resources:', broadData.length);
              
              if (broadData.length > 0) {
                // Add a note that these are general results
                setResources(broadData.map((resource: any) => ({
                  ...resource,
                  isFallback: true
                })));
                return;
              }
            }
          }
          
          // If still no results, fall back to general health resources
          console.log('Still no resources, falling back to general health resources');
          const fallbackResponse = await fetch('/api/health/resources?limit=20');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            // Add a note that these are general results
            setResources(fallbackData.map((resource: any) => ({
              ...resource,
              isFallback: true
            })));
            return;
          }
        }
        
        setResources(data);
      } catch (err) {
        console.error('Error fetching health resources:', err);
        setError('Failed to load resources. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchResources();
  }, [category, resourceType, searchTerm]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#1A2C5B] mb-2">Health Resources</h1>
      
      {/* Show category if specified */}
      {category && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Category: <span className="text-blue-600">{category}</span>
          </h2>
          <p className="text-gray-600">
            Showing resources related to {category}
          </p>
        </div>
      )}
      
      {/* Resource type filter badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('resourceType');
            window.location.href = `?${params.toString()}`;
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${!resourceType ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          All Types
        </button>
        
        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('resourceType', 'federal');
            window.location.href = `?${params.toString()}`;
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${resourceType === 'federal' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Federal Resources
        </button>
        
        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('resourceType', 'nonprofit');
            window.location.href = `?${params.toString()}`;
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${resourceType === 'nonprofit' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Nonprofit Resources
        </button>
        
        <button 
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('resourceType', 'state');
            window.location.href = `?${params.toString()}`;
          }}
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${resourceType === 'state' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          State Resources
        </button>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg w-full mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {/* Results */}
      {!loading && !error && (
        <>
          <p className="text-gray-700 mb-6">
            Found {resources.length} resources
            {category ? ` for ${category}` : ''}
            {resourceType ? ` (${resourceType} resources)` : ''}
          </p>
          
          {resources.length > 0 ? (
            <>
              {resources.some((r: any) => r.isFallback) && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-700">
                    <strong>Note:</strong> We couldn't find specific resources for "{category}". 
                    Showing general health resources that might be helpful instead.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => {
                  const adaptedResource = adaptToModelResource(resource);
                  return (
                    <ResourceCard 
                      key={resource.id || adaptedResource.id} 
                      resource={adaptedResource}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-2">No resources found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find specific resources for this category.
              </p>
              <button
                onClick={() => window.location.href = "/health/resources"}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View All Health Resources
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
