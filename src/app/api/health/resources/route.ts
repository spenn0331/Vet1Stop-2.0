import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId, Db, Document, WithId } from 'mongodb';

interface HealthResource extends Document {
  id?: string;
  title: string;
  description: string;
  url?: string;
  categories: string[];
  resourceType?: string;
  serviceTypes?: string[];
  serviceBranches?: string[];
  veteranEras?: string[];
  rating?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  location?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    coordinates?: [number, number];
  };
  eligibility?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ScoredResource {
  resource: HealthResource;
  relevanceScore: number;
}

/**
 * GET /api/health/resources
 * Fetches health resources by ID or with filters
 * Supports batch fetching with ?ids=id1,id2,id3
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const category = url.searchParams.get('category');
    const searchTerm = url.searchParams.get('search');
    const featuredOnly = url.searchParams.get('featured') === 'true';
    const resourceType = url.searchParams.get('resourceType');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const sortBy = url.searchParams.get('sortBy') || 'relevance';
    
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
    
    // If specific IDs are requested
    if (ids) {
      const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
      
      if (idArray.length === 0) {
        return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
      }
      
      // Try to convert valid strings to ObjectIds
      const possibleObjectIds = idArray
        .map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            return null; // Skip invalid ObjectIds
          }
        })
        .filter(Boolean) as ObjectId[];
      
      // Create a query that will match either field
      const query: any = {
        $or: [
          { id: { $in: idArray } },
          { _id: { $in: possibleObjectIds } }
        ]
      };
      
      // Execute query
      const resources = await collection.find(query).toArray();
      
      return NextResponse.json({ resources });
    }
    
    // Build query for filtered resources
    const query: any = {};
    
    if (category) {
      query.categories = { $regex: category, $options: 'i' };
    }
    
    if (featuredOnly) {
      query.isFeatured = true;
    }
    
    if (resourceType) {
      query.resourceType = { $regex: resourceType, $options: 'i' };
    }
    
    // Handle search term
    if (searchTerm) {
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'contactInfo.email': searchRegex },
        { 'contactInfo.phone': searchRegex },
        { 'location.city': searchRegex },
        { 'location.state': searchRegex }
      ];
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Sorting options
    let sortOptions: any = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { rating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'title':
        sortOptions = { title: 1 };
        break;
      default: // relevance or any other value
        sortOptions = { isVerified: -1, rating: -1 };
    }
    
    // Execute query with pagination and sorting
    const resources = await collection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Get total count for pagination
    const totalCount = await collection.countDocuments(query);
    
    return NextResponse.json({
      resources,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching health resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health resources' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/resources
 * Creates a new health resource
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.categories) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, categories' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    
    let db: Db;
    try {
      const connection = await connectToDatabase(dbName);
      db = connection.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Add timestamps
    const now = new Date();
    const resource = {
      ...body,
      createdAt: now,
      updatedAt: now
    };
    
    // Insert the resource
    const result = await db.collection(collectionName).insertOne(resource);
    
    return NextResponse.json({
      success: true,
      resourceId: result.insertedId,
      resource: {
        ...resource,
        _id: result.insertedId
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating health resource:', error);
    return NextResponse.json(
      { error: 'Failed to create health resource' },
      { status: 500 }
    );
  }
}
