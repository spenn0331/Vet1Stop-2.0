import { HealthResource } from '@/types/health';
import CacheManager from '@/utils/cache-manager';

/**
 * ResourceFetcher utility to centralize health resource fetching logic
 * Uses consistent MongoDB standardized schema for all resources
 */
export default class ResourceFetcher {
  /**
   * Fetch health resources by IDs
   * @param ids - Array of resource IDs to fetch
   * @param context - Optional context for API query
   * @param cacheKey - Optional cache key for storing results
   * @returns Promise resolving to array of health resources
   */
  static async fetchResourcesByIds(
    ids: string[],
    context?: string,
    cacheKey?: string
  ): Promise<HealthResource[]> {
    // Safety check for undefined or empty resourceIds
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      console.warn('No resource IDs provided to fetchResourcesByIds');
      return [];
    }

    try {
      // Check cache first if a cache key is provided
      if (cacheKey) {
        const cachedResources = await CacheManager.get<HealthResource[]>(cacheKey);
        if (cachedResources && cachedResources.length > 0) {
          console.log(`Using cached resources for key: ${cacheKey}`);
          return cachedResources;
        }
      }

      // Fetch resources by IDs
      const idsParam = ids.join(',');
      const contextParam = context ? `&context=${encodeURIComponent(context)}` : '';
      console.log(`Fetching resources with IDs: ${idsParam}`);

      // Try fetching from our health resources endpoint
      const response = await fetch(`/api/health/resources?ids=${idsParam}${contextParam}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log('Successfully fetched resources:', data.length);
        
        // Cache resources if a cache key is provided
        if (cacheKey) {
          await CacheManager.set<HealthResource[]>(
            cacheKey,
            data,
            { expiresIn: 1000 * 60 * 15 } // 15 minutes
          );
        }
        
        return data;
      } else {
        console.warn('No resources returned from API');
        return [];
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  /**
   * Fetch health resources by category
   * @param category - Category to filter resources by
   * @param limit - Optional limit for number of resources to fetch
   * @param cacheKey - Optional cache key for storing results
   * @returns Promise resolving to array of health resources
   */
  static async fetchResourcesByCategory(
    category: string,
    limit?: number,
    cacheKey?: string
  ): Promise<HealthResource[]> {
    if (!category) {
      console.warn('No category provided to fetchResourcesByCategory');
      return [];
    }

    try {
      // Check cache first if a cache key is provided
      if (cacheKey) {
        const cachedResources = await CacheManager.get<HealthResource[]>(cacheKey);
        if (cachedResources && cachedResources.length > 0) {
          console.log(`Using cached resources for category: ${category}`);
          return cachedResources;
        }
      }

      // Build query parameters
      const categoryParam = `category=${encodeURIComponent(category)}`;
      const limitParam = limit ? `&limit=${limit}` : '';
      
      // Fetch resources by category
      const response = await fetch(`/api/health/resources?${categoryParam}${limitParam}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`Successfully fetched ${data.length} resources for category: ${category}`);
        
        // Cache resources if a cache key is provided
        if (cacheKey) {
          await CacheManager.set<HealthResource[]>(
            cacheKey,
            data,
            { expiresIn: 1000 * 60 * 15 } // 15 minutes
          );
        }
        
        return data;
      } else {
        console.warn(`No resources returned for category: ${category}`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching resources for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Fetch featured health resources
   * @param limit - Optional limit for number of resources to fetch
   * @param cacheKey - Optional cache key for storing results
   * @returns Promise resolving to array of health resources
   */
  static async fetchFeaturedResources(
    limit = 4,
    cacheKey = 'featured_health_resources'
  ): Promise<HealthResource[]> {
    try {
      // Check cache first
      const cachedResources = await CacheManager.get<HealthResource[]>(cacheKey);
      if (cachedResources && cachedResources.length > 0) {
        console.log('Using cached featured resources');
        return cachedResources;
      }

      // Fetch featured resources
      const response = await fetch(`/api/health/resources?featured=true&limit=${limit}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        console.log(`Successfully fetched ${data.length} featured resources`);
        
        // Cache resources
        await CacheManager.set<HealthResource[]>(
          cacheKey,
          data,
          { expiresIn: 1000 * 60 * 60 } // 1 hour
        );
        
        return data;
      } else {
        console.warn('No featured resources returned');
        return [];
      }
    } catch (error) {
      console.error('Error fetching featured resources:', error);
      return [];
    }
  }
}
