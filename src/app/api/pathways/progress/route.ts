import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { auth } from '@/lib/firebase-admin';

/**
 * GET /api/pathways/progress
 * Get user's progress on all pathways
 */
export async function GET(request: NextRequest) {
  try {
    // Get and verify Firebase token
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get pathway ID from query params
    const pathwayId = request.nextUrl.searchParams.get('pathwayId');
    
    // Connect to the database
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    // Build query
    const query: any = { userId };
    if (pathwayId) query.pathwayId = pathwayId;
    
    // Get user's progress
    const progress = await db
      .collection('pathwayProgress')
      .find(query)
      .toArray();
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching pathway progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pathway progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pathways/progress
 * Create or update user's progress on a pathway
 */
export async function POST(request: NextRequest) {
  try {
    // Get and verify Firebase token
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get progress data
    const progressData = await request.json();
    if (!progressData.pathwayId) {
      return NextResponse.json(
        { error: 'Invalid progress data: pathwayId is required' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    // Check if progress already exists
    const existingProgress = await db.collection('pathwayProgress').findOne({
      userId,
      pathwayId: progressData.pathwayId
    });
    
    const now = new Date();
    
    if (existingProgress) {
      // Update existing progress
      const updateData = {
        ...progressData,
        userId,
        lastUpdatedAt: now
      };
      
      // Handle completion status
      if (progressData.completed && !existingProgress.completed) {
        updateData.completedAt = now;
      }
      
      const result = await db.collection('pathwayProgress').updateOne(
        { userId, pathwayId: progressData.pathwayId },
        { $set: updateData }
      );
      
      // Get updated progress
      const updatedProgress = await db.collection('pathwayProgress').findOne({
        userId,
        pathwayId: progressData.pathwayId
      });
      
      return NextResponse.json(updatedProgress);
    } else {
      // Create new progress
      const newProgress = {
        ...progressData,
        userId,
        startedAt: now,
        lastUpdatedAt: now,
        completedSteps: progressData.completedSteps || [],
        completed: progressData.completed || false
      };
      
      if (newProgress.completed) {
        newProgress.completedAt = now;
      }
      
      const result = await db.collection('pathwayProgress').insertOne(newProgress);
      
      return NextResponse.json({
        _id: result.insertedId,
        ...newProgress
      });
    }
  } catch (error) {
    console.error('Error updating pathway progress:', error);
    return NextResponse.json(
      { error: 'Failed to update pathway progress' },
      { status: 500 }
    );
  }
}
