import { NextRequest, NextResponse } from 'next/server';
import { getResourceById, getRelatedResources } from '@/services/resourceService';

/**
 * GET /api/resources/[id]
 * Get a single resource by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }
    const resource = await getResourceById(id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }
    // Check if we should include related resources
    const includeRelated = request.nextUrl.searchParams.get('includeRelated') === 'true';
    
    if (includeRelated) {
      const related = await getRelatedResources(id);
      return NextResponse.json({ resource, related });
    }
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error in resource API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource' },
      { status: 500 }
    );
  }
}
