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
 * Resource type interface — exported for card rendering in the chat widget
 */
export interface Resource {
  _id: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  resourceType?: string;
  // URL — may be stored as url, link, or website depending on seed script
  url?: string;
  link?: string;
  // Phone — may be top-level string or nested in contact object
  phone?: string;
  contact?: string | { phone?: string; email?: string; website?: string };
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
  rating?: number;
  isFree?: boolean;
  lastUpdated?: Date;
  updatedAt?: Date;
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
    
    // Keyword search — $or means ANY word matching title/description/tags returns the doc.
    // For string-array fields like tags[], use plain $regex (NOT $elemMatch).
    if (params.keywords) {
      const words = params.keywords.trim().split(/\s+/).filter(Boolean);
      const wordConditions = words.flatMap(w => [
        { title:       { $regex: w, $options: 'i' } },
        { description: { $regex: w, $options: 'i' } },
        { tags:        { $regex: w, $options: 'i' } },  // plain regex works on string arrays
      ]);
      filter.$or = wordConditions;
    }
    // NOTE: No category filter — seed docs use subcategory:'federal'/'ngo' not a category field.
    // Filtering by category would return 0 results.
    
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
    
    // Query collections in priority order; break as soon as we have enough results.
    const collections = [
      'healthResources',
      'educationResources',
      'lifeAndLeisureResources',
      'careerResources',
      'resources',
      'ngos',
      'ngoResources',
    ];

    let allResults: any[] = [];

    for (const collection of collections) {
      try {
        const results = await db.collection(collection)
          .find(filter)
          .limit(params.limit || 3)
          .toArray();
        if (results.length > 0) {
          console.log(`[AI Resources] ${collection}: found ${results.length} docs for filter keys: ${Object.keys(filter).join(', ')}`);
        }
        allResults = [...allResults, ...results];
        if (allResults.length >= (params.limit || 3)) break;
      } catch (err) {
        console.error(`[AI Resources] Error querying ${collection}:`, err);
      }
    }

    if (allResults.length === 0) {
      console.warn('[AI Resources] Zero results. Filter:', JSON.stringify(filter).slice(0, 200));
    }
    
    // Cast to any first to handle mixed document types
    const typedResults = allResults as any[];
    
    // Sort by featured status
    typedResults.sort((a, b) => ((b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)));
    
    // Limit results
    const limitedResults = typedResults.slice(0, params.limit || 10);
    
    // Map to ensure each result conforms to Resource interface
    const mappedResults: Resource[] = limitedResults.map(doc => {
      // URL: try url, then link, then nested contact.website
      const resolvedUrl =
        doc.url ||
        doc.link ||
        doc.website ||
        (doc.contact && typeof doc.contact === 'object' ? doc.contact.website : undefined);

      // Phone: try phone, then contact if it's a plain string, then nested contact.phone
      const resolvedPhone =
        doc.phone ||
        (doc.contact && typeof doc.contact === 'string' ? doc.contact : undefined) ||
        (doc.contact && typeof doc.contact === 'object' ? doc.contact.phone : undefined);

      // Title: some NGO docs use 'name' instead of 'title'
      const resolvedTitle = doc.title || doc.name || 'Untitled Resource';

      return {
        _id: doc._id.toString(),
        title: resolvedTitle,
        description: doc.description || 'No description available',
        category: doc.category,
        subcategory: doc.subcategory,
        resourceType: doc.resourceType,
        url: resolvedUrl,
        phone: resolvedPhone,
        location: doc.location,
        eligibility: doc.eligibility,
        veteranType: doc.veteranType,
        serviceBranch: doc.serviceBranch,
        tags: doc.tags || doc.focus,  // NGO docs use 'focus' array
        isFeatured: doc.isFeatured || doc.featured,
        rating: doc.rating,
        isFree: doc.isFree || doc.costLevel === 'free',
        lastUpdated: doc.lastUpdated,
        updatedAt: doc.updatedAt,
      };
    });
    
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
    
    if (resource.url) {
      formattedResources += `   Website: ${resource.url}\n`;
    }
    
    if (resource.phone) {
      formattedResources += `   Phone: ${resource.phone}\n`;
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
 * Get resources based on user query — returns formatted text for system prompt injection
 */
export async function getResourcesForQuery(query: string): Promise<string> {
  const resources = await getTopResourcesRaw(query);
  return formatResourcesForAI(resources);
}

/**
 * Get top resources for a query — returns raw Resource[] for card rendering.
 * Route returns these as structured data alongside the AI text response.
 */
export async function getTopResourcesRaw(query: string): Promise<Resource[]> {
  const q = query.toLowerCase();

  console.log(`[AI Resources] getTopResourcesRaw called with: "${q.slice(0, 80)}"`);

  if (q.includes('ptsd') || q.includes('trauma') || q.includes('mental health') ||
      q.includes('anxiety') || q.includes('depression') || q.includes('stress') ||
      q.includes('sleep') || q.includes('insomnia') || q.includes('nightmare')) {
    return searchResources({ keywords: 'ptsd trauma mental health sleep anxiety', limit: 3 });
  }

  if (q.includes('education') || q.includes('gi bill') || q.includes('school') || q.includes('college') || q.includes('degree')) {
    return searchResources({ keywords: 'education gi bill school college training', limit: 3 });
  }

  if (q.includes('job') || q.includes('career') || q.includes('employment') || q.includes('work') || q.includes('resume') || q.includes('hire')) {
    return searchResources({ keywords: 'job career employment work resume veteran', limit: 3 });
  }

  if (q.includes('disability') || q.includes('rating') || q.includes('claim') || q.includes('c&p') || q.includes('nexus')) {
    return searchResources({ keywords: 'disability rating claim benefits compensation', limit: 3 });
  }

  if (q.includes('benefits') || q.includes('va') || q.includes('eligib')) {
    return searchResources({ keywords: 'benefits va claims disability compensation', limit: 3 });
  }

  if (q.includes('health') || q.includes('medical') || q.includes('doctor') || q.includes('treatment') || q.includes('care') || q.includes('pain')) {
    return searchResources({ keywords: 'healthcare medical treatment health', limit: 3 });
  }

  if (q.includes('housing') || q.includes('home') || q.includes('homeless') || q.includes('hud')) {
    return searchResources({ keywords: 'housing home loan homeless veteran', limit: 3 });
  }

  // Generic fallback
  return searchResources({ keywords: query, limit: 3 });
}
