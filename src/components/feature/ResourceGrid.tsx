'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ResourceCard from './ResourceCard';
import { Resource } from '@/models/resource';
import { fetchResources } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ResourceGridProps {
  category: string;
  limit?: number;
  featured?: boolean;
}

const ResourceGrid = ({ category, limit, featured = false }: ResourceGridProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Determine if user has premium access
  const hasPremiumAccess = !!user; // For MVP, any logged-in user has premium access
  
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        
        // Get filter parameters from URL
        const subcategory = searchParams.get('subcategory') || undefined;
        const source = searchParams.get('source') || undefined;
        const query = searchParams.get('q') || undefined;
        const tags = searchParams.get('tags')?.split(',') || undefined;
        
        // Build filter object
        const filter = {
          category,
          subcategory,
          source,
          query,
          tags,
          featured: featured || undefined,
          limit,
        };
        
        const data = await fetchResources(filter);
        setResources(data);
      } catch (err: any) {
        console.error('Error loading resources:', err);
        setError(err.message || 'Failed to load resources. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadResources();
  }, [category, featured, limit, searchParams]);
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-64 bg-gray-200 rounded-lg">
            <div className="h-40 bg-gray-300 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (resources.length === 0) {
    return (
      <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-xl font-bold text-blue-800 mb-2">No resources found</h3>
        <p className="text-blue-700">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard 
            key={resource._id.toString()} 
            resource={resource} 
            isPremium={hasPremiumAccess}
          />
        ))}
      </div>
      
      {/* Load More button - in a real implementation, this would load the next page of results */}
      {resources.length > 0 && resources.length % 9 === 0 && !limit && (
        <div className="mt-8 text-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Load More Resources
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourceGrid;
