import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Db, ObjectId } from 'mongodb';

// Define the response type for better TypeScript support
interface SymptomResourceResponse {
  resources: any[];
  total: number;
  page: number;
  totalPages: number;
  message?: string;
}

/**
 * GET /api/health/symptom-finder
 * Fetches health resources based on symptoms and user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract query parameters with better error handling
    const tags = url.searchParams.getAll('tags') || [];
    const symptoms = url.searchParams.get('symptoms')?.split(',').filter(Boolean) || [];
    let severity = 0;
    try {
      severity = parseInt(url.searchParams.get('minRating') || url.searchParams.get('severity') || '0');
    } catch (e) {
      console.warn('Invalid severity parameter, defaulting to 0');
    }
    
    const duration = url.searchParams.get('duration');
    const category = url.searchParams.get('category');
    const resourceType = url.searchParams.get('resourceType');
    const veteranType = url.searchParams.get('veteranType');
    const serviceBranch = url.searchParams.get('serviceBranch');
    const location = url.searchParams.get('location') || url.searchParams.get('state');
    const searchTerm = url.searchParams.get('searchTerm') || url.searchParams.get('q');
    const uniqueId = url.searchParams.get('uniqueId') || '';
    
    // Pagination parameters with safe defaults
    let page = 1;
    let limit = 30; // Increased from 20 to 30
    
    try {
      page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
      limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '30')));
    } catch (e) {
      console.warn('Invalid pagination parameters, using defaults');
    }
    
    const skip = (page - 1) * limit;
    
    // Sorting parameter
    const sortBy = url.searchParams.get('sortBy') || 'relevance';
    
    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    
    // Try multiple collections to ensure we get results
    const primaryCollection = 'symptomResources';
    const fallbackCollection = 'healthResources';
    
    // Get database connection
    let db: Db;
    try {
      const connection = await connectToDatabase(dbName);
      db = connection.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return NextResponse.json({ 
        resources: [], 
        total: 0, 
        page: 1, 
        totalPages: 0,
        message: 'Database connection failed, please try again'
      }, { status: 200 }); // Return 200 with empty results instead of 500
    }
    
    // Try primary collection first
    let collection = db.collection(primaryCollection);
    
    // Check if collection exists and has documents
    const collectionExists = await collection.countDocuments({}) > 0;
    
    // If primary collection doesn't exist or is empty, use fallback
    if (!collectionExists) {
      console.log(`Primary collection ${primaryCollection} is empty, using fallback ${fallbackCollection}`);
      collection = db.collection(fallbackCollection);
    }
    
    // Build query based on symptoms and preferences
    const query: any = {};
    
    // Combine tags and symptoms for better matching
    const allTags = Array.from(new Set([...tags, ...symptoms])); // Remove duplicates
    
    // Always use $or for more flexible matching
    query.$or = [];
    
    // Filter by category if specified (multiple ways)
    if (category) {
      query.$or.push(
        { category: { $regex: category, $options: 'i' } },
        { categories: { $elemMatch: { $regex: category, $options: 'i' } } },
        { tags: { $elemMatch: { $regex: category, $options: 'i' } } }
      );
    }
    
    // If tags or symptoms are provided, search for resources with matching tags
    if (allTags.length > 0) {
      // Match any tag
      query.$or.push({ tags: { $in: allTags.map(tag => new RegExp(tag, 'i')) } });
      
      // Match in description or title
      query.$or.push({ description: { $regex: allTags.join('|'), $options: 'i' } });
      query.$or.push({ title: { $regex: allTags.join('|'), $options: 'i' } });
      
      // Match in categories
      query.$or.push({ categories: { $in: allTags.map(tag => new RegExp(tag, 'i')) } });
    }
    
    // Add search term if provided
    if (searchTerm) {
      query.$or.push(
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
        { organization: { $regex: searchTerm, $options: 'i' } }
      );
    }
    
    // Filter by location if specified
    if (location && typeof location === 'string') {
      query.$or.push(
        { 'location.state': { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
        { tags: { $elemMatch: { $regex: location, $options: 'i' } } }
      );
    }
    
    // If query.$or is empty, use a simple {} query to match all documents
    if (query.$or.length === 0) {
      delete query.$or;
    }
    
    // Filter by minimum rating if specified
    if (severity > 0) {
      query.rating = { $gte: severity };
    }
    
    // Filter by resource type if specified
    if (resourceType && resourceType !== 'all') {
      if (!query.$and) query.$and = [];
      query.$and.push({ resourceType: { $regex: resourceType, $options: 'i' } });
    }
    
    // Filter by veteran type if specified
    if (veteranType && veteranType !== 'all') {
      if (!query.$and) query.$and = [];
      query.$and.push({ veteranType: { $elemMatch: { $regex: veteranType, $options: 'i' } } });
    }
    
    // Filter by service branch if specified
    if (serviceBranch && serviceBranch !== 'all') {
      if (!query.$and) query.$and = [];
      query.$and.push({ serviceBranch: { $elemMatch: { $regex: serviceBranch, $options: 'i' } } });
    }
    
    // Filter by duration if specified
    if (duration) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { tags: { $elemMatch: { $regex: duration, $options: 'i' } } },
          { duration: { $regex: duration, $options: 'i' } }
        ]
      });
    }
    
    // Determine sort order with randomization based on uniqueId
    let sortOptions: any = {};
    
    // Use uniqueId for deterministic randomization if provided
    if (uniqueId) {
      // Create a deterministic but different sort order for each uniqueId
      const seed = uniqueId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      
      // Use the seed to determine sort direction
      const direction = seed % 2 === 0 ? 1 : -1;
      
      // Choose a sort field based on the seed
      const sortFields = ['title', 'rating', 'organization', '_id'];
      const fieldIndex = seed % sortFields.length;
      
      // Apply the sort
      sortOptions[sortFields[fieldIndex]] = direction;
    } else if (sortBy === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sortBy === 'name') {
      sortOptions = { title: 1 };
    } else if (sortBy === 'date') {
      sortOptions = { lastUpdated: -1 };
    } else {
      // Default to relevance with some randomization
      sortOptions = { rating: -1, title: 1 };
    }
    
    // Add a secondary sort by _id to ensure consistent ordering
    sortOptions._id = 1;
    
    try {
      // Count total matching resources
      const totalResources = await collection.countDocuments(query);
      const totalPages = Math.ceil(totalResources / limit);
      
      // Fetch resources with pagination
      const resources = await collection
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      // Format the response
      const response: SymptomResourceResponse = {
        resources: resources.map(resource => ({
          ...resource,
          id: resource._id.toString(), // Ensure ID is a string
        })),
        total: totalResources,
        page,
        totalPages,
      };
      
      // Return the response
      return NextResponse.json(response);
    } catch (findError) {
      console.error('Error querying resources:', findError);
      
      // Return empty results with 200 status instead of error
      return NextResponse.json({
        resources: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Error querying resources, please try again'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching symptom resources:', error);
    
    // Return empty results with 200 status instead of error
    return NextResponse.json({
      resources: [],
      total: 0,
      page: 1,
      totalPages: 0,
      message: 'Error processing request, please try again'
    }, { status: 200 });
  }
}

/**
 * POST /api/health/symptom-finder
 * More complex symptom-based resource filtering with request body
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract parameters from body
    const {
      symptoms = [],
      tags = [],
      severity = 0,
      duration,
      category,
      resourceType,
      veteranType,
      serviceBranch,
      location,
      searchTerm,
      page = 1,
      limit = 20,
      sortBy = 'relevance'
    } = body;
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = 'symptomResources';
    
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
    
    // Build query based on symptoms and preferences
    const query: any = {};
    
    // Combine tags and symptoms for better matching
    const allTags = [...tags, ...symptoms];
    
    // Filter by category if specified
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    
    // Filter by resource type if specified
    if (resourceType && resourceType !== 'all') {
      query.resourceType = { $regex: resourceType, $options: 'i' };
    }
    
    // Filter by veteran type if specified
    if (veteranType && veteranType !== 'all') {
      query.veteranType = { $elemMatch: { $regex: veteranType, $options: 'i' } };
    }
    
    // Filter by service branch if specified
    if (serviceBranch && serviceBranch !== 'all') {
      query.serviceBranch = { $elemMatch: { $regex: serviceBranch, $options: 'i' } };
    }
    
    // If tags or symptoms are provided, search for resources with matching tags
    if (allTags.length > 0) {
      // Use $or to match any of the tags in tags array
      query.$or = query.$or || [];
      query.$or.push({ tags: { $in: allTags.map(tag => new RegExp(tag, 'i')) } });
      
      // Also try to match in description or title for better results
      query.$or.push({ 
        description: { 
          $regex: allTags.join('|'), 
          $options: 'i' 
        } 
      });
      query.$or.push({ 
        title: { 
          $regex: allTags.join('|'), 
          $options: 'i' 
        } 
      });
    }
    
    // Add search term if provided
    if (searchTerm) {
      if (!query.$or) {
        query.$or = [];
      }
      query.$or.push(
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $elemMatch: { $regex: searchTerm, $options: 'i' } } }
      );
    }
    
    // Filter by location if specified
    if (location && typeof location === 'string') {
      if (!query.$or) {
        query.$or = [];
      }
      query.$or.push(
        { 'location.state': { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
        { tags: { $elemMatch: { $regex: location, $options: 'i' } } }
      );
    }
    
    // Filter by minimum rating if specified
    if (severity > 0) {
      query.rating = { $gte: severity };
    }
    
    // Filter by duration if specified
    if (duration) {
      if (!query.$or) {
        query.$or = [];
      }
      query.$or.push(
        { tags: { $elemMatch: { $regex: duration, $options: 'i' } } },
        { duration: { $regex: duration, $options: 'i' } }
      );
    }
    
    // Determine sort order
    let sortOptions: any = {};
    if (sortBy === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sortBy === 'name') {
      sortOptions = { title: 1 };
    } else if (sortBy === 'date') {
      sortOptions = { lastUpdated: -1 };
    } else {
      // Default to relevance - use text score if search term is provided
      if (searchTerm) {
        sortOptions = { score: { $meta: 'textScore' } };
      } else {
        sortOptions = { rating: -1, title: 1 };
      }
    }
    
    // Count total matching resources
    const totalResources = await collection.countDocuments(query);
    const totalPages = Math.ceil(totalResources / limit);
    
    // Fetch resources with pagination
    const resources = await collection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Format the response
    const response: SymptomResourceResponse = {
      resources: resources.map(resource => ({
        ...resource,
        id: resource._id.toString(), // Ensure ID is a string
      })),
      total: totalResources,
      page,
      totalPages,
    };
    
    // Return the response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing symptom resource request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', message: (error as Error).message },
      { status: 500 }
    );
  }
}
