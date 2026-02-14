/**
 * Pathway Service
 * 
 * Handles fetching pathway data from the API with fallback to mock data
 * when API calls fail (such as in development without Firebase admin setup)
 */

import { Pathway, UserPathwayProgress } from '@/types/pathway';
import { getMockPathways } from './mock-pathways-service';

// API endpoints
const API_ENDPOINTS = {
  pathways: '/api/pathways',
  pathwayById: (id: string) => `/api/pathways/${id}`,
  progress: '/api/pathways/progress',
};

// Fallback data URL
const MOCK_DATA_URL = '/mock-data/pathways.json';

/**
 * Fetch all pathways with query parameters
 */
export async function getPathways(options?: {
  tag?: string;
  featured?: boolean;
  limit?: number;
}): Promise<Pathway[]> {
  try {
    // Build query string
    let queryString = '';
    if (options) {
      const params = new URLSearchParams();
      if (options.tag) params.append('tag', options.tag);
      if (options.featured !== undefined) params.append('featured', options.featured.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      queryString = params.toString() ? `?${params.toString()}` : '';
    }

    // Try API first
    const response = await fetch(`${API_ENDPOINTS.pathways}${queryString}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using mock data as fallback', error);
    
    // Fallback to our enhanced mock data service
    console.log('Using enhanced mock data with 8 pathways');
    let pathways = getMockPathways();
    
    // Apply filters if needed
    if (options) {
      if (options.tag) {
        pathways = pathways.filter((p) => p.tags?.includes(options.tag as string));
      }
      if (options.featured !== undefined) {
        pathways = pathways.filter((p) => p.featured === options.featured);
      }
      if (options.limit) {
        pathways = pathways.slice(0, options.limit);
      }
    }
    
    return pathways;
  }
}

/**
 * Fetch a single pathway by ID
 */
export async function getPathwayById(id: string): Promise<Pathway | null> {
  try {
    // Try API first
    const response = await fetch(API_ENDPOINTS.pathwayById(id));
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`API call failed for pathway ${id}, using mock data as fallback`, error);
    
    // Fallback to mock data from our enhanced service
    console.warn(`Failed to fetch pathway ${id} from API, using enhanced mock data`);
    
    const mockPathways = getMockPathways();
    return mockPathways.find(p => p.id === id) || null;
  }
}

/**
 * Save user progress on a pathway
 * Will still attempt API call but provides a mock implementation when it fails
 */
export async function savePathwayProgress(progress: Partial<UserPathwayProgress>): Promise<UserPathwayProgress> {
  try {
    // Get auth token if user is logged in
    let headers: HeadersInit = { 'Content-Type': 'application/json' };
    const idToken = await getAuthToken();
    
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    
    // Try API first
    const response = await fetch(API_ENDPOINTS.progress, {
      method: 'POST',
      headers,
      body: JSON.stringify(progress),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('API call failed for saving progress, using local storage as fallback', error);
    
    // Store progress in localStorage as fallback
    // Make sure we have a valid pathwayId - this is required
    if (!progress.pathwayId) {
      throw new Error('PathwayId is required to save progress');
    }
    
    const savedProgress = getProgressFromLocalStorage(progress.pathwayId) || {
      userId: 'local-user',
      pathwayId: progress.pathwayId,
      currentStepId: progress.currentStepId || '',
      completedSteps: progress.completedSteps || [],
      completed: progress.completed || false,
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
    
    // Update with new values
    const updatedProgress: UserPathwayProgress = {
      userId: savedProgress.userId,
      pathwayId: progress.pathwayId,
      currentStepId: progress.currentStepId || savedProgress.currentStepId, 
      completedSteps: progress.completedSteps || savedProgress.completedSteps,
      completed: progress.completed ?? savedProgress.completed,
      startedAt: savedProgress.startedAt || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      // Optional fields
      completedAt: progress.completed ? new Date().toISOString() : undefined,
      notes: progress.notes || savedProgress.notes,
      decisions: progress.decisions || savedProgress.decisions
    };
    
    // Save to localStorage
    saveProgressToLocalStorage(progress.pathwayId as string, updatedProgress);
    
    return updatedProgress as UserPathwayProgress;
  }
}

/**
 * Get user progress on a pathway
 * Will still attempt API call but provides a mock implementation when it fails
 */
export async function getPathwayProgress(pathwayId: string): Promise<UserPathwayProgress | null> {
  try {
    // Get auth token if user is logged in
    let headers: HeadersInit = {};
    const idToken = await getAuthToken();
    
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }
    
    // Try API first
    const response = await fetch(`${API_ENDPOINTS.progress}?pathwayId=${pathwayId}`, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.warn(`API call failed for pathway progress ${pathwayId}, using localStorage as fallback`, error);
    
    // Try to get from localStorage as fallback
    return getProgressFromLocalStorage(pathwayId);
  }
}

// Helper functions

/**
 * Get auth token if available
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // Try to dynamically import firebase auth
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Get progress from localStorage
 */
function getProgressFromLocalStorage(pathwayId: string): UserPathwayProgress | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const key = `pathway_progress_${pathwayId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    return JSON.parse(stored) as UserPathwayProgress;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Save progress to localStorage
 */
function saveProgressToLocalStorage(pathwayId: string, progress: UserPathwayProgress): void {
  try {
    if (typeof window === 'undefined') return;
    
    const key = `pathway_progress_${pathwayId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}
