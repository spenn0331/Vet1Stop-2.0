import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Db } from 'mongodb';

/**
 * GET /api/health/state-resources
 * Fetches health resources specific to a state
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract query parameters
    const state = url.searchParams.get('state');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    
    // Get database connection
    let db: Db;
    try {
      const connection = await connectToDatabase(dbName);
      db = connection.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Get collection
    const collection = db.collection(collectionName);
    
    // Build query for state resources
    const query: any = {
      // Filter for resources that are state-specific
      $or: [
        { resourceType: { $regex: /state|local/i } },
        { tags: { $elemMatch: { $regex: /state|local/i } } }
      ]
    };
    
    // If specific state is provided, filter by that state
    if (state) {
      query['location.state'] = state;
    }
    
    // Add search term if provided
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $elemMatch: { $regex: search, $options: 'i' } } }
        ]
      });
    }
    
    // Execute the query
    const resources = await collection.find(query)
      .sort({ isFeatured: -1, lastUpdated: -1 })
      .limit(limit)
      .toArray();
    
    // Transform to ensure uniform structure
    const standardizedResources = resources.map((resource: any) => ({
      // Ensure we have an ID field
      id: resource.id || resource._id?.toString(),
      
      // Include all other fields
      ...resource,
      
      // Remove _id to avoid duplication with id field
      _id: undefined
    }));
    
    // Return the resources
    return NextResponse.json(standardizedResources, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching state resources:', error);
    return NextResponse.json({ error: 'Failed to fetch state resources' }, { status: 500 });
  }
}
