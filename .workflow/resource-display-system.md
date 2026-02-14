# Resource Display System Blueprint

## Overview
This document outlines the implementation strategy for displaying resources from our MongoDB database across the Education, Health, Life & Leisure, and Entrepreneur pages. The system is designed to present information in an accessible, filterable grid card format that works consistently across desktop and mobile devices.

## MongoDB Integration

### Current Database Structure
Vet1Stop's MongoDB Atlas database contains comprehensive collections of resources organized by category:

```javascript
// Sample Resource Document Structure
{
  _id: ObjectId("..."),
  title: "GI Bill Benefits Guide",
  category: "education",
  subcategory: "federal",
  description: "Comprehensive guide to understanding and using your GI Bill benefits for higher education.",
  content: "...", // Detailed content or HTML
  url: "https://www.va.gov/education/about-gi-bill-benefits/",
  eligibility: ["active-duty", "veterans", "reserves", "dependents"],
  tags: ["education", "benefits", "tuition", "housing", "books"],
  featured: true,
  dateAdded: ISODate("2024-01-15"),
  lastUpdated: ISODate("2024-03-22"),
  // Additional metadata
}
```

### Database Connection
The Next.js application will connect to MongoDB Atlas using the official MongoDB Node.js driver:

```javascript
// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
```

## Grid Card System

### Card Component Design
Each resource will be displayed in a consistent card format using Tailwind CSS:

```jsx
// components/ResourceCard.jsx
import { useState } from 'react';
import { HiStar, HiExternalLink, HiBookmark } from 'react-icons/hi';
import Link from 'next/link';

export default function ResourceCard({ resource, isPremium = false }) {
  const [saved, setSaved] = useState(false);
  
  // Premium-exclusive features
  const handleSave = () => {
    if (!isPremium) {
      // Show premium upgrade prompt
      return;
    }
    setSaved(!saved);
    // Save to user's bookmarks in database
  };
  
  return (
    <div className="relative flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
      {resource.featured && (
        <div className="absolute top-0 right-0 bg-primary-700 text-white px-2 py-1 text-xs font-bold rounded-bl-md">
          Featured
        </div>
      )}
      
      {/* Category Badge */}
      <div className="px-4 py-2 bg-gray-50">
        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
          {resource.subcategory}
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
          className={`flex items-center text-sm font-medium ${
            saved ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
          } ${!isPremium ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <HiBookmark className={`mr-1 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </button>
        
        <Link 
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          View Resource
          <HiExternalLink className="ml-1" />
        </Link>
      </div>
      
      {/* Premium Upgrade Overlay - shown only on certain premium features */}
      {!isPremium && resource.isPremiumContent && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center flex-col p-6 text-center">
          <HiStar className="text-4xl text-yellow-400 mb-2" />
          <h3 className="text-white font-bold text-lg mb-2">Premium Resource</h3>
          <p className="text-white text-sm mb-4">Unlock this and other premium resources with a subscription.</p>
          <Link 
            href="/pricing" 
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}
    </div>
  );
}
```

### Responsive Grid Layout
The grid system will adapt seamlessly across device sizes:

```jsx
// components/ResourceGrid.jsx
export default function ResourceGrid({ resources, isPremium }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resources.map((resource) => (
        <ResourceCard 
          key={resource._id} 
          resource={resource} 
          isPremium={isPremium} 
        />
      ))}
    </div>
  );
}
```

## Advanced Filtering System

### Filter Categories
Each resource page will include comprehensive filtering options:

1. **Primary Category Filters**:
   - Federal
   - State
   - Non-Governmental Organizations (NGO)

2. **NGO Sub-filters**:
   - Veteran Service Organizations (VSO)
   - Non-profits
   - Educational Institutions
   - Healthcare Providers
   - Community Organizations
   - Private Foundations
   - Religious Organizations
   - Corporate Initiatives

3. **Additional Filters**:
   - Eligibility (Active Duty, Veterans, Reserves, Dependents)
   - Service Branch Association
   - Resource Type (Guide, Tool, Service, Benefit, etc.)
   - Rating/Popularity
   - Recently Added

### Filter Component Implementation

```jsx
// components/ResourceFilters.jsx
import { useState } from 'react';
import { HiChevronDown, HiX, HiAdjustments } from 'react-icons/hi';

export default function ResourceFilters({ 
  filters, 
  setFilters,
  availableFilters,
  isPremium = false
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Free tier gets basic filters only
  const basicFilterCategories = ['primary', 'resource-type'];
  // Premium users get all filters
  const premiumFilterCategories = ['eligibility', 'service-branch', 'rating', 'date-added'];
  
  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      // If the value is already selected, remove it
      if (prev[category]?.includes(value)) {
        return {
          ...prev,
          [category]: prev[category].filter(v => v !== value)
        };
      }
      
      // Otherwise add it
      return {
        ...prev,
        [category]: [...(prev[category] || []), value]
      };
    });
  };
  
  const clearFilters = () => {
    setFilters({});
  };
  
  const filterCount = Object.values(filters)
    .flat()
    .length;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center">
          <HiAdjustments className="mr-2" />
          Filter Resources
          {filterCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
              {filterCount}
            </span>
          )}
        </h2>
        
        <div className="flex items-center space-x-2">
          {filterCount > 0 && (
            <button 
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <HiX className="mr-1" />
              Clear
            </button>
          )}
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-primary-600 font-medium flex items-center"
          >
            {expanded ? 'Collapse' : 'Expand All'}
            <HiChevronDown className={`ml-1 transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Primary Filters - Always visible */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">Category</h3>
        <div className="flex flex-wrap gap-2">
          {availableFilters.primary.map(filter => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange('primary', filter.value)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                filters.primary?.includes(filter.value)
                  ? 'bg-primary-100 text-primary-800 border-primary-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } border`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* NGO Sub-filters - Visible when NGO is selected */}
      {filters.primary?.includes('ngo') && (
        <div className="mb-4 pl-4 border-l-2 border-gray-200">
          <h3 className="font-medium text-gray-700 mb-2">NGO Type</h3>
          <div className="flex flex-wrap gap-2">
            {availableFilters.ngoType.map(filter => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange('ngoType', filter.value)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  filters.ngoType?.includes(filter.value)
                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                } border`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Advanced Filters - Some locked for premium users */}
      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Basic tier filters */}
          {basicFilterCategories.map(category => (
            <div key={category} className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">
                {availableFilters[category].label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableFilters[category].options.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => handleFilterChange(category, filter.value)}
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      filters[category]?.includes(filter.value)
                        ? 'bg-primary-100 text-primary-800 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    } border`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Premium tier filters */}
          {premiumFilterCategories.map(category => (
            <div key={category} className="mb-4 relative">
              <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                {availableFilters[category].label}
                {!isPremium && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                    Premium
                  </span>
                )}
              </h3>
              
              <div className={`flex flex-wrap gap-2 ${!isPremium ? 'opacity-50' : ''}`}>
                {availableFilters[category].options.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => isPremium && handleFilterChange(category, filter.value)}
                    disabled={!isPremium}
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      filters[category]?.includes(filter.value)
                        ? 'bg-primary-100 text-primary-800 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    } border ${!isPremium ? 'cursor-not-allowed' : ''}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {!isPremium && (
                <div className="absolute inset-0 bg-white bg-opacity-10 flex items-center justify-end">
                  <Link 
                    href="/pricing" 
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 underline"
                  >
                    Unlock Advanced Filters
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Server-Side Implementation

### Data Fetching with Filters
The resource pages will fetch data with server-side filtering to optimize performance:

```jsx
// app/education/page.jsx (Next.js 14 App Router)
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ResourceGrid from '@/components/ResourceGrid';
import ResourceFilters from '@/components/ResourceFilters';
import ResourcesPageSkeleton from '@/components/skeletons/ResourcesPageSkeleton';
import { getResources } from '@/lib/resources';
import { getUserSubscription } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function EducationPage({ searchParams }) {
  // Get filters from URL search params
  const filters = {
    primary: searchParams.primary?.split(',') || [],
    ngoType: searchParams.ngoType?.split(',') || [],
    eligibility: searchParams.eligibility?.split(',') || [],
    'service-branch': searchParams['service-branch']?.split(',') || [],
    // other filters
  };
  
  // Get user subscription status for premium features
  const { isPremium } = await getUserSubscription();
  
  // Define available filters for this resource category
  const availableFilters = {
    primary: [
      { label: 'Federal', value: 'federal' },
      { label: 'State', value: 'state' },
      { label: 'NGO', value: 'ngo' },
    ],
    ngoType: [
      { label: 'Veteran Service Orgs', value: 'vso' },
      { label: 'Non-profits', value: 'nonprofit' },
      { label: 'Educational Institutions', value: 'education' },
      { label: 'Private Foundations', value: 'foundation' },
      { label: 'Religious Organizations', value: 'religious' },
      { label: 'Corporate Initiatives', value: 'corporate' },
    ],
    // Other filter categories
  };
  
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Education Resources
      </h1>
      
      <div className="mb-8">
        <p className="text-lg text-gray-700">
          Find comprehensive education resources for veterans, including 
          GI Bill benefits, scholarships, tuition assistance, and more.
        </p>
      </div>
      
      <ResourceFilters 
        filters={filters}
        setFilters={/* Client Component with URL param updates */}
        availableFilters={availableFilters}
        isPremium={isPremium}
      />
      
      <Suspense fallback={<ResourcesPageSkeleton />}>
        <Resources filters={filters} isPremium={isPremium} />
      </Suspense>
    </main>
  );
}

// Separate component for Suspense boundary
async function Resources({ filters, isPremium }) {
  // Get resources with filters applied
  const resources = await getResources('education', filters);
  
  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          No resources found
        </h2>
        <p className="text-gray-600">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }
  
  return <ResourceGrid resources={resources} isPremium={isPremium} />;
}
```

### Database Query Function

```javascript
// lib/resources.js
import clientPromise from './mongodb';

export async function getResources(category, filters = {}) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  
  // Build query based on filters
  const query = { category };
  
  // Add primary category filter
  if (filters.primary?.length > 0) {
    query.subcategory = { $in: filters.primary };
  }
  
  // Add NGO sub-filters if applicable
  if (filters.primary?.includes('ngo') && filters.ngoType?.length > 0) {
    query['ngo.type'] = { $in: filters.ngoType };
  }
  
  // Add eligibility filters
  if (filters.eligibility?.length > 0) {
    query.eligibility = { $in: filters.eligibility };
  }
  
  // Add service branch filters
  if (filters['service-branch']?.length > 0) {
    query.serviceBranches = { $in: filters['service-branch'] };
  }
  
  // Additional filters as needed
  
  // Get resources and limit fields for performance
  const resources = await db
    .collection('resources')
    .find(query)
    .project({
      title: 1,
      description: 1,
      subcategory: 1,
      url: 1,
      tags: 1,
      featured: 1,
      isPremiumContent: 1,
      dateAdded: 1
    })
    .sort({ featured: -1, dateAdded: -1 })
    .limit(50) // Pagination would be implemented here
    .toArray();
  
  return resources;
}
```

## Search Integration

### Resource Search Implementation
The search functionality will allow users to find resources across categories:

```jsx
// components/ResourceSearch.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiSearch, HiX } from 'react-icons/hi';

export default function ResourceSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isSearching, setIsSearching] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Create new search params
    const params = new URLSearchParams(searchParams);
    params.set('q', query);
    
    router.push(`/search?${params.toString()}`);
  };
  
  const clearSearch = () => {
    setQuery('');
    
    // Remove search param and navigate
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    
    router.push(`/search?${params.toString()}`);
  };
  
  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for resources..."
          className="w-full px-4 py-3 pl-10 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        
        <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <HiX />
          </button>
        )}
        
        <button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:opacity-50"
          disabled={!query.trim() || isSearching}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
```

## Premium Content Indicators

### Premium Resource Tagging
Resources will be clearly marked if they require a premium subscription:

```jsx
// MongoDB document field for premium content
{
  isPremiumContent: true,
  premiumFeatures: ["downloadable-guides", "video-tutorials", "interactive-tools"]
}
```

### Premium Upgrade Banner
Users viewing grid layouts will see contextual upgrade prompts:

```jsx
// components/PremiumBanner.jsx
export default function PremiumBanner({ category, isPremium }) {
  if (isPremium) return null;
  
  const categoryBenefits = {
    education: "Get personalized education recommendations and unlock advanced filtering",
    health: "Access exclusive health resources and save your favorite providers",
    careers: "Unlock premium job listings and resume-building tools",
    entrepreneur: "Access business plan templates and funding resources"
  };
  
  const benefit = categoryBenefits[category] || "Unlock premium features and content";
  
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-4 sm:p-6 rounded-lg shadow-md mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between">
        <div className="mb-4 sm:mb-0">
          <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
          <p className="text-primary-100">{benefit}</p>
        </div>
        <Link
          href="/pricing"
          className="px-6 py-2 bg-white text-primary-700 font-medium rounded-md hover:bg-primary-50 transition-colors"
        >
          See Plans
        </Link>
      </div>
    </div>
  );
}
```

## Performance Optimizations

### Image Loading
All images in resource cards will be optimized using Next.js Image component:

```jsx
import Image from 'next/image';

// In ResourceCard component
{resource.image && (
  <div className="relative h-40 w-full">
    <Image
      src={resource.image}
      alt={resource.title}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAJJXF6NSgAAAABJRU5ErkJggg=="
    />
  </div>
)}
```

### Next.js Data Caching
Implement appropriate caching strategies for resource data:

```javascript
// For static data that changes infrequently
export async function getTopResources(category) {
  const cacheKey = `top-resources-${category}`;
  
  // Check cache first
  const cachedData = await fetchCache(cacheKey);
  if (cachedData) return cachedData;
  
  // Fetch from database
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  
  const resources = await db
    .collection('resources')
    .find({ category, featured: true })
    .sort({ dateAdded: -1 })
    .limit(6)
    .toArray();
  
  // Cache for 4 hours
  await setCache(cacheKey, resources, 60 * 60 * 4);
  
  return resources;
}
```

## Success Metrics

### Key Performance Indicators
- Resource engagement rate (clicks, saves, shares)
- Filter usage statistics
- Search completion rate
- Premium conversion rate from resource page interactions
- Page load and interaction performance metrics
- Mobile vs. desktop engagement comparison

This blueprint provides a comprehensive framework for implementing grid card-based resource displays across the Education, Health, Life & Leisure, and Entrepreneur pages, with full MongoDB integration and an advanced filtering system that differentiates between free and premium tier capabilities.
