import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { auth } from '@/lib/firebase-admin';

/**
 * GET /api/pathways
 * Fetches all pathways or filtered by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Build query
    const query: any = {};
    if (tag) query.tags = tag;
    if (featured === 'true') query.featured = true;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Fetch pathways with pagination
    const pathways = await db
      .collection('pathways')
      .find(query)
      .limit(limit)
      .sort({ featured: -1, createdAt: -1 })
      .toArray();
    
    return NextResponse.json(pathways);
  } catch (error) {
    console.error('Error fetching pathways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pathways' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pathways
 * Creates a new pathway (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify admin role
    const decodedToken = await auth.verifyIdToken(token);
    const { admin } = decodedToken;
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    const pathwayData = await request.json();
    
    // Validate pathway data
    if (!pathwayData.title || !pathwayData.steps || !Array.isArray(pathwayData.steps)) {
      return NextResponse.json(
        { error: 'Invalid pathway data' },
        { status: 400 }
      );
    }
    
    // Add timestamps
    const now = new Date();
    pathwayData.createdAt = now;
    pathwayData.updatedAt = now;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Insert pathway
    const result = await db.collection('pathways').insertOne(pathwayData);
    
    return NextResponse.json({
      id: result.insertedId,
      ...pathwayData
    });
  } catch (error) {
    console.error('Error creating pathway:', error);
    return NextResponse.json(
      { error: 'Failed to create pathway' },
      { status: 500 }
    );
  }
}
