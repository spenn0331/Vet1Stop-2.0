/**
 * Local Resource Service
 * 
 * This service provides location-based resources for veterans,
 * particularly focused on crisis centers and local support options.
 */

import { clientPromise } from '@/lib/mongodb';
import { Document, WithId } from 'mongodb';

/**
 * Local resource interface
 */
interface LocalResource {
  _id: string;
  name: string;
  resourceType: string;
  description: string;
  services: string[];
  location: {
    address?: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
    hours?: string;
  };
  eligibility?: string;
  isCrisisCenter: boolean;
  acceptsWalkIns: boolean;
  distance?: number; // Added during search
}

/**
 * Get local crisis resources based on location
 */
export async function getLocalCrisisResources(
  state: string,
  city?: string,
  zipCode?: string,
  limit: number = 3
): Promise<LocalResource[]> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Build query based on available location info
    const query: any = { 
      isCrisisCenter: true,
      'location.state': state 
    };
    
    if (city) {
      query['location.city'] = city;
    }
    
    if (zipCode) {
      query['location.zipCode'] = zipCode;
    }
    
    // First try to find exact matches
    let resources = await db.collection('localResources')
      .find(query)
      .limit(limit)
      .toArray();
    
    // If no exact matches, broaden to state level
    if (resources.length === 0 && (city || zipCode)) {
      const stateQuery = { 
        isCrisisCenter: true,
        'location.state': state 
      };
      
      resources = await db.collection('localResources')
        .find(stateQuery)
        .limit(limit)
        .toArray();
    }
    
    // If still no results, get national crisis centers
    if (resources.length === 0) {
      resources = await db.collection('localResources')
        .find({ 
          isCrisisCenter: true,
          isNational: true 
        })
        .limit(limit)
        .toArray();
    }
    
    return resources as unknown as LocalResource[];
  } catch (error) {
    console.error('Error finding local crisis resources:', error);
    return [];
  }
}

/**
 * Get local VA facilities based on location
 */
export async function getLocalVAFacilities(
  state: string,
  city?: string,
  zipCode?: string,
  limit: number = 3
): Promise<LocalResource[]> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Build query based on available location info
    const query: any = { 
      resourceType: 'VA Facility',
      'location.state': state 
    };
    
    if (city) {
      query['location.city'] = city;
    }
    
    if (zipCode) {
      query['location.zipCode'] = zipCode;
    }
    
    // Find matching VA facilities
    const resources = await db.collection('localResources')
      .find(query)
      .limit(limit)
      .toArray();
    
    return resources as unknown as LocalResource[];
  } catch (error) {
    console.error('Error finding local VA facilities:', error);
    return [];
  }
}

/**
 * Get local veteran support groups based on location
 */
export async function getLocalSupportGroups(
  state: string,
  city?: string,
  zipCode?: string,
  groupType?: string,
  limit: number = 3
): Promise<LocalResource[]> {
  try {
    const client = await clientPromise;
    const db = client.db('vet1stop');
    
    // Build query based on available location info
    const query: any = { 
      resourceType: 'Support Group',
      'location.state': state 
    };
    
    if (city) {
      query['location.city'] = city;
    }
    
    if (zipCode) {
      query['location.zipCode'] = zipCode;
    }
    
    if (groupType) {
      query.services = { $in: [groupType] };
    }
    
    // Find matching support groups
    const resources = await db.collection('localResources')
      .find(query)
      .limit(limit)
      .toArray();
    
    return resources as unknown as LocalResource[];
  } catch (error) {
    console.error('Error finding local support groups:', error);
    return [];
  }
}

/**
 * Format local resources for AI responses
 */
export function formatLocalResourcesForAI(resources: LocalResource[], resourceType: string): string {
  if (!resources || resources.length === 0) {
    return `No local ${resourceType} found in your area.`;
  }
  
  let formattedResources = `Here are local ${resourceType} in your area:\n\n`;
  
  resources.forEach((resource, index) => {
    formattedResources += `${index + 1}. **${resource.name}**\n`;
    formattedResources += `   ${resource.description}\n`;
    
    // Location information
    const location = [
      resource.location.address,
      resource.location.city,
      resource.location.state,
      resource.location.zipCode
    ].filter(Boolean).join(', ');
    
    formattedResources += `   Location: ${location}\n`;
    
    // Contact information
    formattedResources += `   Phone: ${resource.contact.phone}\n`;
    
    if (resource.contact.website) {
      formattedResources += `   Website: ${resource.contact.website}\n`;
    }
    
    if (resource.contact.hours) {
      formattedResources += `   Hours: ${resource.contact.hours}\n`;
    }
    
    // Additional information for crisis centers
    if (resource.isCrisisCenter) {
      formattedResources += `   **This is a crisis center that can provide immediate assistance.**\n`;
      
      if (resource.acceptsWalkIns) {
        formattedResources += `   Accepts walk-ins without appointment.\n`;
      }
    }
    
    formattedResources += '\n';
  });
  
  return formattedResources;
}

/**
 * Get local crisis resources based on user profile
 */
export async function getLocalResourcesFromProfile(userId: string): Promise<string> {
  try {
    // Import user profile service dynamically to avoid circular dependencies
    const { getVeteranProfile } = await import('./userProfileService');
    
    const profile = getVeteranProfile(userId);
    
    if (!profile || !profile.location) {
      return '';
    }
    
    // Parse location (expected format: "City, State" or "State")
    const locationParts = profile.location.split(',').map(part => part.trim());
    const state = locationParts.length > 1 ? locationParts[1] : locationParts[0];
    const city = locationParts.length > 1 ? locationParts[0] : undefined;
    
    // Get local crisis resources
    const crisisResources = await getLocalCrisisResources(state, city);
    
    if (crisisResources.length === 0) {
      return '';
    }
    
    return formatLocalResourcesForAI(crisisResources, 'crisis centers');
  } catch (error) {
    console.error('Error getting local resources from profile:', error);
    return '';
  }
}
