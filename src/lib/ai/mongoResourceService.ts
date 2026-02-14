/**
 * MongoDB Resource Service for AI
 * 
 * This service enables the AI to directly query MongoDB for veteran resources
 * and incorporate them into responses. It ensures the AI only accesses
 * the vet1stop database collections.
 */

import { clientPromise } from '@/lib/mongodb';
import { Document, WithId } from 'mongodb';

/**
 * Resource type interface
 */
interface Resource {
  _id: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  resourceType?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  eligibility?: string;
  veteranType?: string[];
  serviceBranch?: string[];
  tags?: string[];
  isFeatured?: boolean;
  lastUpdated?: Date;
}

/**
 * Search parameters for resources
 */
interface ResourceSearchParams {
  keywords?: string;
  category?: string;
  resourceType?: string;
  state?: string;
  veteranType?: string;
  serviceBranch?: string;
  limit?: number;
}

/**
 * Search for resources based on query parameters
 */
export async function searchResources(params: ResourceSearchParams): Promise<Resource[]> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Build query filters
    const filter: any = {};
    
    // Text search if keywords provided
    if (params.keywords) {
      filter.$text = { $search: params.keywords };
    }
    
    // Category filter
    if (params.category) {
      filter.category = params.category;
    }
    
    // Resource type filter
    if (params.resourceType) {
      filter.resourceType = params.resourceType;
    }
    
    // State filter
    if (params.state) {
      filter['location.state'] = params.state;
    }
    
    // Veteran type filter
    if (params.veteranType) {
      filter.veteranType = { $in: [params.veteranType] };
    }
    
    // Service branch filter
    if (params.serviceBranch) {
      filter.serviceBranch = { $in: [params.serviceBranch] };
    }
    
    // Execute the query against all relevant collections
    const collections = [
      'healthResources',
      'educationResources', 
      'lifeAndLeisureResources', 
      'careerResources'
    ];
    
    let allResults: any[] = [];
    
    // Query each collection and combine results
    for (const collection of collections) {
      const results = await db.collection(collection)
        .find(filter)
        .limit(params.limit || 5)
        .toArray();
      
      allResults = [...allResults, ...results];
    }
    
    // Cast to any first to handle mixed document types
    const typedResults = allResults as any[];
    
    // Sort by featured status
    typedResults.sort((a, b) => ((b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)));
    
    // Limit results
    const limitedResults = typedResults.slice(0, params.limit || 10);
    
    // Map to ensure each result conforms to Resource interface
    const mappedResults: Resource[] = limitedResults.map(doc => ({
      _id: doc._id.toString(),
      title: doc.title || 'Untitled Resource',
      description: doc.description || 'No description available',
      category: doc.category,
      subcategory: doc.subcategory,
      resourceType: doc.resourceType,
      contact: doc.contact,
      location: doc.location,
      eligibility: doc.eligibility,
      veteranType: doc.veteranType,
      serviceBranch: doc.serviceBranch,
      tags: doc.tags,
      isFeatured: doc.isFeatured,
      lastUpdated: doc.lastUpdated
    }));
    
    return mappedResults;
    
  } catch (error) {
    console.error('Error searching resources:', error);
    return [];
  }
}

/**
 * Format resources for AI response
 */
export function formatResourcesForAI(resources: Resource[]): string {
  if (!resources || resources.length === 0) {
    return "No matching resources found in the Vet1Stop database.";
  }
  
  let formattedResources = "Here are relevant resources from Vet1Stop:\n\n";
  
  resources.forEach((resource, index) => {
    formattedResources += `${index + 1}. **${resource.title}**\n`;
    formattedResources += `   ${resource.description}\n`;
    
    if (resource.category) {
      formattedResources += `   Category: ${resource.category}\n`;
    }
    
    if (resource.resourceType) {
      formattedResources += `   Type: ${resource.resourceType}\n`;
    }
    
    if (resource.contact?.website) {
      formattedResources += `   Website: ${resource.contact.website}\n`;
    }
    
    if (resource.contact?.phone) {
      formattedResources += `   Phone: ${resource.contact.phone}\n`;
    }
    
    if (resource.location?.state) {
      const location = [
        resource.location.city,
        resource.location.state
      ].filter(Boolean).join(', ');
      
      if (location) {
        formattedResources += `   Location: ${location}\n`;
      }
    }
    
    if (resource.eligibility) {
      formattedResources += `   Eligibility: ${resource.eligibility}\n`;
    }
    
    formattedResources += '\n';
  });
  
  return formattedResources;
}

/**
 * Gets PTSD resources from MongoDB
 */
export async function getPTSDResources(): Promise<string> {
  const resources = await searchResources({
    keywords: 'ptsd trauma mental health',
    category: 'Health',
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}

/**
 * Gets Education resources from MongoDB
 */
export async function getEducationResources(): Promise<string> {
  const resources = await searchResources({
    keywords: 'education gi bill school college training',
    category: 'Education',
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}

/**
 * Gets Employment resources from MongoDB
 */
export async function getEmploymentResources(): Promise<string> {
  const resources = await searchResources({
    keywords: 'job career employment work resume',
    category: 'Careers',
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}

/**
 * Gets Benefits resources from MongoDB
 */
export async function getBenefitsResources(): Promise<string> {
  const resources = await searchResources({
    keywords: 'benefits va claims disability',
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}

/**
 * Gets Healthcare resources from MongoDB
 */
export async function getHealthcareResources(): Promise<string> {
  const resources = await searchResources({
    keywords: 'healthcare medical treatment health',
    category: 'Health',
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}

/**
 * Get resources based on user query
 */
export async function getResourcesForQuery(query: string): Promise<string> {
  // Normalize the query
  const normalizedQuery = query.toLowerCase();
  
  // Check which type of resources to fetch
  if (normalizedQuery.includes('ptsd') || 
      normalizedQuery.includes('trauma') || 
      normalizedQuery.includes('mental health')) {
    return await getPTSDResources();
  }
  
  if (normalizedQuery.includes('education') || 
      normalizedQuery.includes('gi bill') || 
      normalizedQuery.includes('school') || 
      normalizedQuery.includes('college')) {
    return await getEducationResources();
  }
  
  if (normalizedQuery.includes('job') || 
      normalizedQuery.includes('career') || 
      normalizedQuery.includes('employment') || 
      normalizedQuery.includes('work')) {
    return await getEmploymentResources();
  }
  
  if (normalizedQuery.includes('benefits') || 
      normalizedQuery.includes('va') || 
      normalizedQuery.includes('claims') || 
      normalizedQuery.includes('disability')) {
    return await getBenefitsResources();
  }
  
  if (normalizedQuery.includes('healthcare') || 
      normalizedQuery.includes('medical') || 
      normalizedQuery.includes('health') || 
      normalizedQuery.includes('treatment')) {
    return await getHealthcareResources();
  }
  
  // Generic search for other queries
  const resources = await searchResources({
    keywords: query,
    limit: 5
  });
  
  return formatResourcesForAI(resources);
}
