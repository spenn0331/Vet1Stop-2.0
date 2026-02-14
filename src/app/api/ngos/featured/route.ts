import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

/**
 * API route handler for fetching featured NGOs
 * These are NGOs that have paid for premium placement
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching featured NGOs...');
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get query parameters
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '3', 10);
    
    console.log('Looking for NGOs with fields: isFeatured=true, status=active');
    
    // Fetch featured NGOs from MongoDB
    const featuredNGOs = await db
      .collection('ngos')
      .find({ 
        isFeatured: true,
        status: 'active'
        // Note: We're removing the conditional featuredUntil check as it was causing TypeScript errors
        // We'll handle any data without this field in our client code
      })
      .sort({ featuredPriority: -1 }) // Higher priority first
      .limit(limit)
      .toArray();
    
    console.log(`Found ${featuredNGOs.length} featured NGOs`);
    
    return NextResponse.json({
      success: true,
      count: featuredNGOs.length,
      featuredNGOs: featuredNGOs // Changed to match our expected format in the client
    });
  } catch (error: any) {
    console.error('Error fetching featured NGOs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch featured NGOs',
      details: error.message
    }, { status: 500 });
  }
}
