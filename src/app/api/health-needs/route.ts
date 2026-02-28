import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { enrichResourcesWithTags } from '../health-resources/route';

/**
 * API route specifically designed for the needs-based navigation system
 * This route prioritizes finding relevant resources over strict filtering
 */
export async function GET(request: Request) {
  console.log('==== HEALTH NEEDS API REQUEST STARTED ====');
  try {
    // Get query parameters for needs-based navigation
    const url = new URL(request.url);
    const needCategory = url.searchParams.get('category') || 'all';
    const concerns = url.searchParams.get('concerns') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    console.log(`Health Needs API Request: category=${needCategory}, concerns=${concerns}, page=${page}, limit=${limit}`);
    
    // Get database and collection names from environment variables, same as health-resources API
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    console.log(`Using database: ${dbName}, collection: ${collectionName}`);
    
    const { db } = await connectToDatabase(dbName);
    const collection = db.collection(collectionName);
    
    // Count total resources in collection for reference
    const totalDocsInCollection = await collection.countDocuments();
    console.log(`Total health resources in collection: ${totalDocsInCollection}`);
    
    // Process concerns into individual tags
    const concernsList = concerns.split(',').filter(Boolean);
    
    // Build a very permissive query to find as many matching resources as possible
    let query: any = {};
    
    // If a specific need category is selected
    if (needCategory && needCategory !== 'all') {
      // Convert kebab-case to readable format (e.g., mental-health → Mental Health)
      const formattedCategory = needCategory
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Create a very flexible category match
      query.$or = [
        // Look for category in various fields
        { category: { $regex: formattedCategory, $options: 'i' } },
        { category: { $regex: needCategory, $options: 'i' } },
        { healthType: { $regex: formattedCategory, $options: 'i' } },
        { healthType: { $regex: needCategory, $options: 'i' } },
        { tags: { $regex: formattedCategory, $options: 'i' } },
        { tags: { $in: [new RegExp(formattedCategory, 'i')] } },
        { description: { $regex: formattedCategory, $options: 'i' } },
        { title: { $regex: formattedCategory, $options: 'i' } }
      ];
      
      console.log(`Searching for category: ${needCategory} / ${formattedCategory}`);
    }
    
    // If specific concerns are selected, add them to the query
    if (concernsList.length > 0) {
      console.log(`Processing ${concernsList.length} concerns:`, concernsList);
      
      // Create a list of condition objects for each concern
      const concernQueries: any[] = [];
      
      // Process each concern
      concernsList.forEach(concern => {
        // Common variations of concern terms (e.g., ptsd, PTSD, post-traumatic stress)
        const termVariations = [
          concern,
          concern.toLowerCase(),
          concern.toUpperCase()
        ];
        
        // Add special variations for common concerns
        if (concern === 'ptsd') {
          termVariations.push('post-traumatic stress', 'trauma', 'post traumatic');
        } else if (concern === 'anxiety') {
          termVariations.push('anxious', 'stress', 'worry');
        } else if (concern === 'depression') {
          termVariations.push('depressive', 'mood', 'sadness');
        }
        
        // For each variation, search across multiple fields
        termVariations.forEach(term => {
          concernQueries.push({ title: { $regex: term, $options: 'i' } });
          concernQueries.push({ description: { $regex: term, $options: 'i' } });
          concernQueries.push({ tags: { $regex: term, $options: 'i' } });
          concernQueries.push({ tags: { $in: [new RegExp(term, 'i')] } });
          concernQueries.push({ category: { $regex: term, $options: 'i' } });
          concernQueries.push({ healthType: { $regex: term, $options: 'i' } });
        });
      });
      
      // Combine concern queries with category query
      if (query.$or) {
        query = {
          $and: [
            { $or: query.$or },
            { $or: concernQueries }
          ]
        };
      } else {
        query.$or = concernQueries;
      }
    }
    
    console.log('Final query structure:', JSON.stringify(query, null, 2));
    
    try {
      // Get matching resources count
      const total = await collection.countDocuments(query);
      console.log(`Found ${total} matching resources out of ${totalDocsInCollection} total`);
      
      // If no resources found with specific query, fallback to more basic query
      let resources: any[] = [];
      if (total === 0 && needCategory && needCategory !== 'all') {
        // Fallback to just category without concerns for more results
        console.log('No resources found with specific query. Using fallback query...');
        
        const fallbackQuery = {
          $or: [
            { category: { $regex: needCategory, $options: 'i' } },
            { healthType: { $regex: needCategory, $options: 'i' } },
            { tags: { $in: [new RegExp(needCategory, 'i')] } }
          ]
        };
        
        resources = await collection
          .find(fallbackQuery)
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        
        console.log(`Fallback query found ${resources.length} resources`);
      } else {
        // Use the original query
        resources = await collection
          .find(query)
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
      }
      
      // If still no resources, return a sample of all health resources
      if (resources.length === 0) {
        console.log('Still no resources found. Returning sample of all resources.');
        resources = await collection
          .find({})
          .sort({ createdAt: -1, _id: -1 })
          .limit(limit)
          .toArray();
      }
      
      // Enrich resources with tags
      const enrichedResources = resources.length > 0 ? enrichResourcesWithTags(resources) : [];
      console.log(`Returning ${enrichedResources.length} enriched resources`);
      
      // Map resources to consistent format
      const mappedResources = enrichedResources.map(resource => ({
        id: resource.id || resource._id?.toString() || Math.random().toString(36).substring(2, 15),
        _id: resource._id?.toString() || resource.id,
        title: resource.title || resource.name || 'Untitled Resource',
        description: resource.description || 'No description available',
        category: resource.category || resource.healthType || 'uncategorized',
        subcategory: resource.subcategory || '',
        tags: resource.tags || [],
        location: resource.location || '',
        link: resource.link || resource.url || resource.website || '#',
        website: resource.website || resource.url || resource.link || '#',
        rating: resource.rating || 0,
        imageUrl: resource.imageUrl || '/placeholder.jpg',
        isPremiumContent: resource.isPremiumContent || false,
        healthType: resource.healthType || resource.category || '',
        eligibility: Array.isArray(resource.eligibility) ? resource.eligibility : [],
        veteranType: Array.isArray(resource.veteranType) ? resource.veteranType : 
                   (typeof resource.veteranType === 'string' ? [resource.veteranType] : []),
        source: resource.source || '',
        sourceName: resource.sourceName || ''
      }));
      
      // Return formatted response
      return NextResponse.json({
        success: true,
        data: mappedResources,
        pagination: {
          page: page,
          totalPages: Math.ceil(total / limit) || 1,
          totalItems: total || mappedResources.length,
          limit: limit
        }
      });
    } catch (error) {
      console.error('Error fetching resources:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Error fetching resources',
        error: (error as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Health Needs API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: (error as Error).message 
    }, { status: 500 });
  }
}
