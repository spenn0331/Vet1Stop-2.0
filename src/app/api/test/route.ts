import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

/**
 * GET /api/test
 * Simple endpoint to test MongoDB connection and verify
 * the resources we've seeded
 */
export async function GET() {
  try {
    console.log('API Test endpoint accessed');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB client...');
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    // Get reference to the database and collection
    const db = client.db('vet1stop');
    console.log('Accessing vet1stop database');
    
    const collection = db.collection('resources');
    console.log('Accessing resources collection');
    
    // Count resources
    const count = await collection.countDocuments();
    console.log(`Resource count: ${count}`);
    
    // Get sample resources
    const resources = await collection.find({}).limit(5).toArray();
    console.log(`Retrieved ${resources.length} resources`);
    
    // Return the results
    return NextResponse.json({
      success: true,
      count,
      resources: resources.map(resource => ({
        ...resource,
        _id: resource._id.toString() // Convert ObjectId to string for JSON serialization
      }))
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to MongoDB or retrieve resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
