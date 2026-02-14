import { NextRequest, NextResponse } from 'next/server';
import { getResources, getResourceCounts } from '@/services/resourceService';
import { ResourceFilter } from '@/models/resource';

/**
 * GET /api/resources
 * Get resources with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('API Request received for /api/resources');
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const subcategory = searchParams.get('subcategory') || undefined;
    const source = searchParams.get('source') || undefined;
    const featured = searchParams.get('featured') === 'true' ? true : undefined;
    const isPremiumContent = searchParams.get('isPremiumContent') === 'true' ? true : undefined;
    const query = searchParams.get('q') || undefined;
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    
    // Get tags as an array if provided
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    
    // Build the filter object
    const filter: ResourceFilter = {
      category,
      subcategory,
      source,
      featured,
      isPremiumContent,
      tags,
      query,
      limit
    };
    
    console.log('Fetching resources with filter:', JSON.stringify(filter));
    
    // Get resources based on filter
    const resources = await getResources(filter);
    
    console.log(`Found ${resources.length} resources`);
    
    // Return the resources
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error in resources API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 };
    );
  };
};
/**
 * POST /api/resources/counts
 * Get resource counts by category
 */
export async function POST(request: NextRequest) {
  try {
    console.log('API Request received for resource counts');
    const counts = await getResourceCounts();
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error in resource counts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource counts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 };
    );
  };
};
