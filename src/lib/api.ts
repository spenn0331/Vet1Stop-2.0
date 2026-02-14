/**
 * Client-side API utilities for fetching data from the backend
 */

import { Resource, ResourceFilter } from '@/models/resource';

const API_BASE_URL = '/api';

/**
 * Constructs a query string from a filter object
 */
function buildQueryString(filter: Partial<ResourceFilter>): string {
  const params = new URLSearchParams();
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, value.join(','));
        }
      } else if (typeof value === 'boolean') {
        params.append(key, value.toString());
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  return params.toString();
}

/**
 * Fetch resources with optional filtering
 */
export async function fetchResources(filter: Partial<ResourceFilter> = {}): Promise<{ data: Resource[], pagination: any }> {
  try {
    console.log('Fetching resources with filter:', filter);
    const queryString = buildQueryString(filter);
    console.log(`Making API request to: ${API_BASE_URL}/health-resources?${queryString}`);
    
    const response = await fetch(`${API_BASE_URL}/health-resources?${queryString}`);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          console.error('Error details:', errorData.details);
        }
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('Successfully fetched', result.data ? result.data.length : 0, 'resources');
    console.log('Pagination info:', result.pagination);
    
    return {
      data: result.data || [],
      pagination: result.pagination || { total: 0, page: 1, limit: 50, pages: 0 }
    };
  } catch (error) {
    console.error('Error fetching resources:', error);
    // Return empty data on error
    return { 
      data: [], 
      pagination: { total: 0, page: 1, limit: 50, pages: 0 } 
    };
  }
}

/**
 * Fetch a single resource by ID
 */
export async function fetchResourceById(id: string, includeRelated = false): Promise<Resource> {
  try {
    console.log(`Fetching resource with ID: ${id}`);
    const queryString = includeRelated ? '?includeRelated=true' : '';
    const response = await fetch(`${API_BASE_URL}/resources/${id}${queryString}`);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          console.error('Error details:', errorData.details);
          errorMessage += ` - ${errorData.details}`;
        }
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
      }
      
      throw new Error(errorMessage);
    }
    
    try {
      const resource = await response.json();
      console.log('Successfully fetched resource details');
      return resource;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error('Failed to parse API response. The server returned invalid JSON.');
    }
  } catch (error) {
    console.error('Error in fetchResourceById:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching resource');
  }
}

/**
 * Fetch resource counts by category
 */
export async function fetchResourceCounts(): Promise<Record<string, number>> {
  try {
    console.log('Fetching resource counts');
    const response = await fetch(`${API_BASE_URL}/resources/counts`);
    
    if (!response.ok) {
      console.error('API response not OK:', response.status, response.statusText);
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          console.error('Error details:', errorData.details);
          errorMessage += ` - ${errorData.details}`;
        }
      } catch (jsonError) {
        console.error('Could not parse error response as JSON:', jsonError);
      }
      
      throw new Error(errorMessage);
    }
    
    try {
      const counts = await response.json();
      console.log('Successfully fetched resource counts:', counts);
      return counts;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error('Failed to parse API response. The server returned invalid JSON.');
    }
  } catch (error) {
    console.error('Error in fetchResourceCounts:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred while fetching resource counts');
  }
}
