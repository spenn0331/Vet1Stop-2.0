import { NextResponse } from 'next/server';
import { getResourceCounts } from '@/services/resourceService';

/**
 * GET /api/resources/counts
 * Get resource counts by category
 */
export async function GET() {
  try {
    console.log('API Request received for /api/resources/counts');
    const counts = await getResourceCounts();
    console.log('Resource counts:', counts);
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error in resource counts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource counts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
