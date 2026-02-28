import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { HealthResource } from '@/models/healthResource';

// Static health resources fallback with standardized schema
import { STATIC_HEALTH_RESOURCES } from '@/data/static-health-resources';

/**
 * Helper function to enrich resources with inferred tags based on content
 */
export const enrichResourcesWithTags = (resources: any[]): any[] => {
  // Common health-related keywords for tag inference
  const mentalHealthKeywords = [
    'mental health', 'ptsd', 'trauma', 'stress', 'anxiety', 'depression', 'counseling', 
    'therapy', 'therapist', 'psychological', 'psychiatry', 'psychiatric', 'mental illness',
    'suicide', 'crisis', 'addiction', 'substance abuse', 'alcohol', 'drugs', 'recovery'
  ];
  
  const primaryCareKeywords = [
    'primary care', 'doctor', 'physician', 'clinic', 'medical', 'healthcare', 'health care',
    'checkup', 'check-up', 'physical', 'exam', 'screening', 'prevention', 'wellness'
  ];
  
  // Category keyword mapping
  const categoryKeywordMap: {[key: string]: string[]} = {
    'Mental Health': mentalHealthKeywords,
    'Primary Care': primaryCareKeywords,
    // Add more categories as needed
  };
  
  // Process each resource to add inferred tags
  return resources.map(resource => {
    const enrichedResource = { ...resource };
    
    // Initialize tags array if it doesn't exist
    if (!enrichedResource.tags || !Array.isArray(enrichedResource.tags)) {
      enrichedResource.tags = [];
    }
    
    // Create a set to avoid duplicate tags
    const existingTagsSet = new Set(enrichedResource.tags.map((tag: string) => 
      typeof tag === 'string' ? tag.toLowerCase() : ''));
    
    // Get text to analyze for keyword matching
    const title = (enrichedResource.title || enrichedResource.name || '').toLowerCase();
    const description = (enrichedResource.description || '').toLowerCase();
    const contentToAnalyze = `${title} ${description}`;
    
    // Add category as a tag if it exists and not already tagged
    if (enrichedResource.category && !existingTagsSet.has(enrichedResource.category.toLowerCase())) {
      enrichedResource.tags.push(enrichedResource.category);
      existingTagsSet.add(enrichedResource.category.toLowerCase());
    }
    
    // Add resourceType as a tag if it exists
    if (enrichedResource.resourceType && !existingTagsSet.has(enrichedResource.resourceType.toLowerCase())) {
      enrichedResource.tags.push(enrichedResource.resourceType);
      existingTagsSet.add(enrichedResource.resourceType.toLowerCase());
    }
    
    // Check content against all category keywords
    Object.entries(categoryKeywordMap).forEach(([category, keywords]) => {
      // Check if content contains any keywords from this category
      const matchingKeywords = keywords.filter(keyword => 
        contentToAnalyze.includes(keyword.toLowerCase()));
      
      // If there are matching keywords, add the category and keywords as tags
      if (matchingKeywords.length > 0) {
        // Add category as a tag if not already present
        if (!existingTagsSet.has(category.toLowerCase())) {
          enrichedResource.tags.push(category);
          existingTagsSet.add(category.toLowerCase());
        }
      }
    });
    
    return enrichedResource;
  });
};

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    
    // Main filtering parameters
    const category = url.searchParams.get('category') || 'all';
    const query = url.searchParams.get('query') || '';
    const state = url.searchParams.get('state') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sort = url.searchParams.get('sort') || 'relevance';
    
    // Advanced filtering parameters
    const resourceType = url.searchParams.get('resourceType') || 'all';
    const veteranTypeParam = url.searchParams.get('veteranType');
    const serviceBranchParam = url.searchParams.get('serviceBranch');
    const featuredOnly = url.searchParams.get('featuredOnly') === 'true';
    const recentlyUpdated = url.searchParams.get('recentlyUpdated') === 'true';
    const minRating = url.searchParams.get('minRating') 
      ? parseFloat(url.searchParams.get('minRating') || '0') 
      : undefined;
    
    // Convert comma-separated strings to arrays
    const veteranTypes = veteranTypeParam?.split(',').filter(Boolean) || [];
    const serviceBranches = serviceBranchParam?.split(',').filter(Boolean) || [];
    
    // Connect to MongoDB
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    
    // Get database connection
    let db;
    try {
      const connection = await connectToDatabase(dbName);
      db = connection.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      
      // Return static data if DB connection fails
      return NextResponse.json({
        success: true,
        message: 'Using static data due to database connection issue',
        data: STATIC_HEALTH_RESOURCES,
        pagination: {
          total: STATIC_HEALTH_RESOURCES.length,
          page: 1,
          pageSize: STATIC_HEALTH_RESOURCES.length,
          totalPages: 1
        }
      });
    }
    
    // Get collection and check if it exists
    const collection = db.collection(collectionName);
    const totalDocsInCollection = await collection.countDocuments();
    
    // Fallback to static data if collection is empty
    if (!collection || totalDocsInCollection === 0) {
      return NextResponse.json({
        success: true,
        message: 'Using static data because collection is empty',
        data: STATIC_HEALTH_RESOURCES,
        pagination: {
          total: STATIC_HEALTH_RESOURCES.length,
          page: 1,
          pageSize: STATIC_HEALTH_RESOURCES.length,
          totalPages: 1
        }
      });
    }
    
    // Build MongoDB query object
    let mongoQuery: Record<string, any> = {};
    
    // Add search query if provided
    if (query) {
      const searchTerms = query.split(/\s+/).map(term => term.trim().toLowerCase()).filter(Boolean);
      
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => ({
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { 'tags': { $regex: term, $options: 'i' } },
            { organization: { $regex: term, $options: 'i' } }
          ]
        }));
        
        mongoQuery.$and = searchConditions;
      }
    }
    
    // Add category filter
    if (category && category !== 'all') {
      if (mongoQuery.$and) {
        mongoQuery.$and.push({ category: { $regex: category, $options: 'i' } });
      } else {
        mongoQuery.category = { $regex: category, $options: 'i' };
      }
    }
    
    // Add state/location filter
    if (state && state !== 'all' && state !== 'national') {
      // For specific state filter
      const stateCondition = { 'location.state': state };
      if (mongoQuery.$and) {
        mongoQuery.$and.push(stateCondition);
      } else {
        mongoQuery.$and = [stateCondition];
      }
    } else if (state === 'national') {
      // For national resources only
      const nationalCondition = { 
        $or: [
          { 'location.state': 'national' },
          { national: true },
          { 'location.state': null },
          { 'location.state': '' }
        ]
      };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(nationalCondition);
      } else {
        mongoQuery.$and = [nationalCondition];
      }
    }
    
    // Add resourceType filter (VA, Federal, State, NGO, etc.)
    if (resourceType && resourceType !== 'all') {
      const resourceTypeCondition = { resourceType: { $regex: resourceType, $options: 'i' } };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(resourceTypeCondition);
      } else {
        mongoQuery.$and = [resourceTypeCondition];
      }
    }
    
    // Add veteran type filter
    if (veteranTypes.length > 0) {
      const veteranTypeCondition = { veteranType: { $in: veteranTypes } };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(veteranTypeCondition);
      } else {
        mongoQuery.$and = [veteranTypeCondition];
      }
    }
    
    // Add service branch filter
    if (serviceBranches.length > 0) {
      const branchCondition = { serviceBranch: { $in: serviceBranches } };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(branchCondition);
      } else {
        mongoQuery.$and = [branchCondition];
      }
    }
    
    // Add featured filter
    if (featuredOnly) {
      if (mongoQuery.$and) {
        mongoQuery.$and.push({ isFeatured: true });
      } else {
        mongoQuery.isFeatured = true;
      }
    }
    
    // Add recently updated filter (last 90 days)
    if (recentlyUpdated) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const recentCondition = { lastUpdated: { $gte: ninetyDaysAgo } };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(recentCondition);
      } else {
        mongoQuery.$and = [recentCondition];
      }
    }
    
    // Add minimum rating filter
    if (minRating) {
      const ratingCondition = { rating: { $gte: minRating } };
      
      if (mongoQuery.$and) {
        mongoQuery.$and.push(ratingCondition);
      } else {
        mongoQuery.$and = [ratingCondition];
      }
    }
    
    // Calculate pagination values
    const skip = (page - 1) * limit;
    
    // Determine sort option for MongoDB
    let sortOption: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'date':
        sortOption = { lastUpdated: -1 };
        break;
      case 'az':
        sortOption = { title: 1 };
        break;
      case 'za':
        sortOption = { title: -1 };
        break;
      default: // 'relevance' - featured first, then rating
        sortOption = { isFeatured: -1, rating: -1 };
    }
    
    try {
      // Get total count of matching resources for pagination
      const totalCount = await collection.countDocuments(mongoQuery);
      
      // Execute query with pagination and sorting
      let resources = await collection
        .find(mongoQuery)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .toArray();
      
      // Enrich resources with inferred tags
      const enrichedResources = enrichResourcesWithTags(resources);
      
      // Return formatted response
      return NextResponse.json({
        success: true,
        data: enrichedResources,
        pagination: {
          total: totalCount,
          page,
          pageSize: limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
      
    } catch (error) {
      console.error('MongoDB query error:', error);
      
      // Return error response
      return NextResponse.json({
        success: false,
        message: 'Error querying health resources',
        error: error instanceof Error ? error.message : 'Unknown database error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Health resources API error:', error);
    
    // Return general error response
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
