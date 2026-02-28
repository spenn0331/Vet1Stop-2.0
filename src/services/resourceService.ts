import { Collection, ObjectId } from 'mongodb';
import { clientPromise } from '@/lib/mongodb';
import { Resource, ResourceFilter, ResourceSortOptions } from '@/models/resource';

// Get the MongoDB resource collection
async function getResourceCollection(): Promise<Collection<Resource>> {
  try {
    console.log('Connecting to MongoDB client...');
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    const db = client.db('vet1stop');
    console.log('Accessing vet1stop database');
    
    return db.collection<Resource>('resources');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Get resources with optional filtering
export async function getResources(filter: ResourceFilter = {}): Promise<Resource[]> {
  try {
    console.log('getResources called with filter:', JSON.stringify(filter, null, 2));
    const collection = await getResourceCollection();
    console.log('Resource collection accessed successfully');
    
    // Build MongoDB query from filter
    const query: any = {};
    
    // Apply category filter
    if (filter.category) {
      query.category = filter.category;
    }
    
    // Apply subcategory filter
    if (filter.subcategory) {
      query.subcategory = filter.subcategory;
    }
    
    // Apply source filter
    if (filter.source) {
      query.source = filter.source;
    }
    
    // Apply featured filter
    if (filter.featured !== undefined) {
      query.featured = filter.featured;
    }
    
    // Apply premium content filter
    if (filter.isPremiumContent !== undefined) {
      query.isPremiumContent = filter.isPremiumContent;
    }
    
    // Apply tag filter (resources must have ALL the specified tags)
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $all: filter.tags };
    }
    
    // Apply text search if query is provided
    if (filter.query) {
      // This requires a text index on relevant fields
      query.$text = { $search: filter.query };
    }
    
    console.log('Executing MongoDB query:', JSON.stringify(query, null, 2));
    
    // Set default sort order (newest first)
    const sortOptions: ResourceSortOptions = {
      field: 'dateAdded',
      direction: 'desc'
    };
    
    // Execute the query with optional limit
    const cursor = collection
      .find(query)
      .sort({ [sortOptions.field]: sortOptions.direction === 'desc' ? -1 : 1 });
    
    // Apply limit if specified
    if (filter.limit) {
      cursor.limit(filter.limit);
    }
    
    // Convert cursor to array
    const resources = await cursor.toArray();
    console.log(`Query returned ${resources.length} resources`);
    return resources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw new Error(`Failed to fetch resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get a single resource by ID
export async function getResourceById(id: string): Promise<Resource | null> {
  try {
    console.log(`getResourceById called for id: ${id}`);
    const collection = await getResourceCollection();
    return await collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error('Error fetching resource by ID:', error);
    throw new Error(`Failed to fetch resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get featured resources for a category
export async function getFeaturedResources(category?: string, limit = 3): Promise<Resource[]> {
  try {
    console.log(`getFeaturedResources called for category: ${category}, limit: ${limit}`);
    return await getResources({
      category,
      featured: true,
      limit
    });
  } catch (error) {
    console.error('Error fetching featured resources:', error);
    throw new Error(`Failed to fetch featured resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get related resources based on tags
export async function getRelatedResources(resourceId: string, limit = 3): Promise<Resource[]> {
  try {
    console.log(`getRelatedResources called for resourceId: ${resourceId}, limit: ${limit}`);
    const collection = await getResourceCollection();
    const resource = await collection.findOne({ _id: new ObjectId(resourceId) });
    
    if (!resource) {
      throw new Error('Resource not found');
    }
    
    // Find resources with similar tags, excluding the current resource
    const query = {
      _id: { $ne: new ObjectId(resourceId) },
      category: resource.category,
      tags: { $in: resource.tags }
    };
    
    return await collection.find(query).limit(limit).toArray();
  } catch (error) {
    console.error('Error fetching related resources:', error);
    throw new Error(`Failed to fetch related resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get resource counts by category
export async function getResourceCounts(): Promise<Record<string, number>> {
  try {
    console.log('getResourceCounts called');
    const collection = await getResourceCollection();
    
    const result = await collection.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();
    
    // Convert the array of { _id: category, count: number } to an object
    return result.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);
  } catch (error) {
    console.error('Error fetching resource counts:', error);
    throw new Error(`Failed to fetch resource counts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
