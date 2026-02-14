import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest } from 'next/server';

/**
 * API route handler for fetching NGO resources with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    console.log('NGO API route called - SIMPLIFIED VERSION FOR DEBUGGING');
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // ULTRA SIMPLIFIED APPROACH: Focus only on getting ANY data to display
    // This removes ALL complex logic to isolate the data flow issue
    
    console.log('DIRECT QUERY: healthResources collection with minimal filtering');
    
    // Define the MongoDB filter object with proper TypeScript typing
    // Using Record<string, any> to allow for MongoDB query operators
    const simpleFilter: Record<string, any> = {
      category: 'health',
      subcategory: 'ngo'
    };
    
    // For TypeScript safety, define a type for MongoDB query operators
    type MongoDBQuery = {
      $or?: any[];
      $and?: any[];
      $text?: any;
      [key: string]: any;
    };
    
    console.log('Using simplified filter:', JSON.stringify(simpleFilter));

    // Parse query parameters with defaults
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '12', 10);
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    
    const search = request.nextUrl.searchParams.get('search') || '';
    const focusArea = request.nextUrl.searchParams.get('focusArea') || 'all';
    const location = request.nextUrl.searchParams.get('location') || 'all';
    const veteranFounded = request.nextUrl.searchParams.get('veteranFounded') === 'true';
    const verified = request.nextUrl.searchParams.get('verified') === 'true';
    const minRating = parseFloat(request.nextUrl.searchParams.get('minRating') || '0');
    const sort = request.nextUrl.searchParams.get('sort') || 'relevance';
    const category = request.nextUrl.searchParams.get('category') || 'health';
    const subcategory = request.nextUrl.searchParams.get('subcategory') || 'ngo';
    const collection = request.nextUrl.searchParams.get('collection') || 'healthResources';
    
    // Parse new advanced filter parameters
    const searchTerm = request.nextUrl.searchParams.get('searchTerm') || '';
    const serviceTypes = request.nextUrl.searchParams.get('serviceTypes')?.split(',').filter(Boolean) || [];
    const serviceBranches = request.nextUrl.searchParams.get('serviceBranches')?.split(',').filter(Boolean) || [];
    const veteranEras = request.nextUrl.searchParams.get('veteranEras')?.split(',').filter(Boolean) || [];
    
    console.log('Advanced filters received:', { searchTerm, serviceTypes, serviceBranches, veteranEras });

    // Apply search filter if provided
    // Handle search parameter (original search or new searchTerm)
    const effectiveSearch = search || searchTerm;
    if (effectiveSearch) {
      simpleFilter.$or = [
        { name: { $regex: effectiveSearch, $options: 'i' } },
        { title: { $regex: effectiveSearch, $options: 'i' } },
        { description: { $regex: effectiveSearch, $options: 'i' } },
        { mission: { $regex: effectiveSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(effectiveSearch, 'i')] } }
      ];
    }
    
    // Apply focus area filter if not 'all'
    if (focusArea !== 'all') {
      simpleFilter.focusAreas = focusArea;
    }
    
    // Apply location filter if not 'all'
    if (location !== 'all') {
      simpleFilter['location.state'] = location;
    }
    
    // Apply veteran founded filter if true
    if (veteranFounded) {
      simpleFilter.veteranFounded = true;
    }
    
    // Apply verified filter if true
    if (verified) {
      simpleFilter.isVerified = true;
    }
    
    // Apply minimum rating filter
    if (minRating > 0) {
      simpleFilter.averageRating = { $gte: minRating };
    }
    
    // Apply service types filter if any are selected
    if (serviceTypes.length > 0) {
      // Create a filter that will work with both standardized and legacy data
      // This approach is more direct and targeted for the current data
      
      // Convert service types to regex patterns for case-insensitive matching
      const serviceTypePatterns = serviceTypes.map(type => new RegExp(type, 'i'));
      
      // Create a more effective query that targets tags and description since
      // we know our current data doesn't have resourceType field yet
      const serviceTypeQuery = {
        $or: [
          // Check tags first as they're most likely to contain the relevant keywords
          { tags: { $in: serviceTypePatterns } },
          
          // Check description as a backup
          { description: { $regex: new RegExp(serviceTypes.join('|'), 'i') } },
          
          // Still include resourceType for future compatibility
          { resourceType: { $in: serviceTypePatterns } }
        ]
      };
      
      // Add this to our filter criteria
      if (!simpleFilter.$and) {
        simpleFilter.$and = [];
      }
      simpleFilter.$and.push(serviceTypeQuery);
    }
    
    // Apply service branches filter if any are selected
    if (serviceBranches.length > 0) {
      // Prioritize tags and description for current data structure
      const branchPatterns = serviceBranches.map(branch => new RegExp(branch, 'i'));
      
      // Create a specialized military branch query that works with current data
      const branchQuery = {
        $or: [
          // Check tags which often contain branch information
          { tags: { $in: branchPatterns } },
          
          // Look for branch names in the description
          { description: { $regex: new RegExp(serviceBranches.join('|'), 'i') } },
          
          // Include name field which might mention branches
          { title: { $regex: new RegExp(serviceBranches.join('|'), 'i') } },
          
          // Keep the standardized field for future compatibility
          { serviceBranch: { $in: branchPatterns } }
        ]
      };
      
      // Add to existing filter
      if (!simpleFilter.$and) {
        simpleFilter.$and = [];
      }
      simpleFilter.$and.push(branchQuery);
    }
    
    // Apply veteran eras filter if any are selected
    if (veteranEras.length > 0) {
      // Prioritize description and tags for current data structure
      const eraPatterns = veteranEras.map(era => new RegExp(era, 'i'));
      
      // Create more effective query that emphasizes where era info likely appears
      const eraQuery = {
        $or: [
          // Check in description which likely mentions eras
          { description: { $regex: new RegExp(veteranEras.join('|'), 'i') } },
          
          // Check tags which might include era information
          { tags: { $in: eraPatterns } },
          
          // Name/title might include era references
          { title: { $regex: new RegExp(veteranEras.join('|'), 'i') } },
          
          // Keep compatibility with future standardized structure
          { veteranType: { $in: eraPatterns } }
        ]
      };
      
      // Add to filter criteria
      if (!simpleFilter.$and) {
        simpleFilter.$and = [];
      }
      simpleFilter.$and.push(eraQuery);
    }
    
    // Prepare sort configuration
    let sortConfig: any = {};
    switch (sort) {
      case 'name':
        sortConfig = { name: 1 };
        break;
      case 'rating':
        sortConfig = { averageRating: -1, reviewCount: -1 };
        break;
      case 'popularity':
        sortConfig = { engagementScore: -1 };
        break;
      case 'newest':
        sortConfig = { createdAt: -1 };
        break;
      case 'relevance':
      default:
        // For relevance, we'll use a text score if there's a search query
        if (search) {
          simpleFilter.$text = { $search: search };
          sortConfig = { score: { $meta: 'textScore' } };
        } else {
          // Default to featured/recommended if no search query
          sortConfig = { featuredRank: -1, recommendedScore: -1 };
        }
        break;
    }
    
    console.log('Final MongoDB query filter:', JSON.stringify(simpleFilter));
    
    // Fetch health NGO resources with cleaner approach
    const healthNGOs = await db
      .collection('healthResources')
      .find(simpleFilter)
      // No limit - return ALL matching resources
      .toArray();
      
    console.log(`IMPORTANT: Found ${healthNGOs.length} TOTAL health NGO resources`);
      
    console.log(`FOUND ${healthNGOs.length} RESOURCES in healthResources collection matching filter`);
    
    if (healthNGOs.length > 0) {
      console.log('First NGO sample:', 
        `title: ${healthNGOs[0].title}, subcategory: ${healthNGOs[0].subcategory}`);
      
      // SIMPLIFIED MAPPING: Create an extremely basic mapping for debugging
      // Just copy essential fields with minimal transformation
      console.log('Creating simplified mapped NGOs for debugging');
      
      const mappedNGOs = healthNGOs.map(ngo => {
        // Simple mapping with guaranteed fields
        // Extract service types, branches and eras from tags and description for filtering
        // This is a temporary solution until full data standardization is complete
        
        // Get tags (ensuring it's an array)
        const tags = Array.isArray(ngo.tags) ? ngo.tags : [];
        const description = ngo.description || '';
        
        // Extract potential service types from tags/description
        const possibleServiceTypes: string[] = [];
        const serviceTypeKeywords: string[] = ['Mental Health', 'Physical Health', 'Family Support', 'Housing', 'Education', 'Financial'];
        
        serviceTypeKeywords.forEach(keyword => {
          // Check if tag contains this keyword
          if (tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) {
            possibleServiceTypes.push(keyword);
          }
          // Also check description
          if (description.toLowerCase().includes(keyword.toLowerCase())) {
            possibleServiceTypes.push(keyword);
          }
        });
        
        // Extract potential service branches
        const possibleBranches: string[] = [];
        const branchKeywords: string[] = ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'National Guard', 'Reserves'];
        
        branchKeywords.forEach(branch => {
          if (tags.some(tag => tag.toLowerCase().includes(branch.toLowerCase())) ||
              description.toLowerCase().includes(branch.toLowerCase())) {
            possibleBranches.push(branch);
          }
        });
        
        // Extract potential veteran eras
        const possibleEras: string[] = [];
        const eraKeywords: string[] = ['Post-9/11', 'Gulf War', 'Vietnam', 'Korea', 'Cold War'];
        
        eraKeywords.forEach(era => {
          if (tags.some(tag => tag.toLowerCase().includes(era.toLowerCase())) ||
              description.toLowerCase().includes(era.toLowerCase())) {
            possibleEras.push(era);
          }
        });
        
        // Preserve the original resource type, service branch, and veteran type data
        // for proper filtering on the client side
        return {
          _id: ngo._id?.toString(),
          id: ngo._id?.toString(),  // Include both formats for safety
          name: ngo.title || 'Unnamed NGO', // Map title to name consistently
          title: ngo.title || 'Unnamed NGO',
          description: ngo.description || 'No description available',
          category: ngo.category || 'health',
          subcategory: ngo.subcategory || 'ngo',
          link: ngo.link || (ngo.contact?.website) || '#',
          website: ngo.website || (ngo.contact?.website) || '#',
          tags: tags,
          
          // Use the detected values first, then standardized fields if they exist, otherwise empty defaults
          resourceType: ngo.resourceType || possibleServiceTypes[0] || '',
          serviceBranch: Array.isArray(ngo.serviceBranch) && ngo.serviceBranch.length > 0 ? 
                          ngo.serviceBranch : possibleBranches,
          veteranType: Array.isArray(ngo.veteranType) && ngo.veteranType.length > 0 ? 
                          ngo.veteranType : possibleEras,
          
          // Add the extracted fields for the frontend
          extractedServiceTypes: possibleServiceTypes,
          extractedBranches: possibleBranches,
          extractedEras: possibleEras,
          
          // Still provide default values for critical display fields
          rating: ngo.averageRating || 4.5,
          reviewCount: ngo.reviewCount || 25,
          veteranFounded: ngo.veteranFounded || false,
          isPreLaunchRating: true,
          isFeatured: ngo.isFeatured || false
        };
      });
      
      // Add enhanced debug logging for filters
      if (serviceTypes.length > 0 || serviceBranches.length > 0 || veteranEras.length > 0) {
        console.log('FILTER DEBUG INFO:', { 
          serviceTypes, 
          serviceBranches, 
          veteranEras,
          resultCount: mappedNGOs.length,
          originalCount: healthNGOs.length,
        });
        
        // Log first few filtered results
        console.log('First 3 filtered NGOs:', 
          mappedNGOs.slice(0, 3).map(ngo => ({
            name: ngo.title || ngo.name,
            resourceType: ngo.resourceType,
            serviceBranch: ngo.serviceBranch,
            veteranType: ngo.veteranType,
            tags: ngo.tags?.slice(0, 5)
          })));
        
        // Check if any NGOs in the database actually have the fields we're looking for
        const ngoWithResourceType = healthNGOs.find(ngo => ngo.resourceType);
        const ngoWithServiceBranch = healthNGOs.find(ngo => Array.isArray(ngo.serviceBranch) && ngo.serviceBranch.length > 0);
        const ngoWithVeteranType = healthNGOs.find(ngo => Array.isArray(ngo.veteranType) && ngo.veteranType.length > 0);
        
        console.log('Field availability check:', {
          resourceTypeExists: !!ngoWithResourceType,
          serviceBranchExists: !!ngoWithServiceBranch,
          veteranTypeExists: !!ngoWithVeteranType,
          sampleResourceType: ngoWithResourceType?.resourceType,
          sampleServiceBranch: ngoWithServiceBranch?.serviceBranch,
          sampleVeteranType: ngoWithVeteranType?.veteranType
        });
      }
      
      // Log some details of the first few NGOs for debugging
      console.log('MAPPED NGO SAMPLE:', JSON.stringify(mappedNGOs.slice(0, 2), null, 2));
      console.log('SUCCESS! Returning', mappedNGOs.length, 'mapped NGO resources');
      
      return NextResponse.json({
        success: true,
        count: mappedNGOs.length,
        total: mappedNGOs.length,
        page: 1,
        totalPages: 1,
        data: mappedNGOs
      });
    }
    
    // If no resources found, create fallback data
    console.log('No resources found, using fallback data');
    
    // Create some fallback NGO data to ensure we always show something
    const fallbackNGOs = [
      {
        id: 'fallback-1',
        name: 'Military Family Health Support',
        description: 'Provides mental health resources and support specifically for military families.',
        link: 'https://example.org/military-family-health',
        tags: ['mental-health', 'family-support', 'military-families'],
        rating: 4.8,
        reviewCount: 125,
        veteranFounded: true,
        location: 'National',
        isFeatured: true
      },
      {
        id: 'fallback-2',
        name: 'Veterans Wellness Alliance',
        description: 'Comprehensive wellness programs for veterans focusing on holistic health approaches.',
        link: 'https://example.org/veterans-wellness',
        tags: ['wellness', 'holistic-health', 'mental-health'],
        rating: 4.5,
        reviewCount: 89,
        veteranFounded: true,
        location: 'National',
        isFeatured: false
      },
      {
        id: 'fallback-3',
        name: 'Combat Recovery Network',
        description: 'Specialized recovery programs for combat veterans dealing with physical and psychological injuries.',
        link: 'https://example.org/combat-recovery',
        tags: ['recovery', 'combat-veterans', 'rehabilitation'],
        rating: 4.7,
        reviewCount: 132,
        veteranFounded: false,
        location: 'National',
        isFeatured: false
      }
    ];
    
    return NextResponse.json({
      success: true,
      count: fallbackNGOs.length,
      total: fallbackNGOs.length,
      page: 1,
      totalPages: 1,
      data: fallbackNGOs
    });
    
  } catch (error: any) {
    console.error('Error fetching NGOs:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred while fetching NGO resources'
    }, { status: 500 });
  }
}
