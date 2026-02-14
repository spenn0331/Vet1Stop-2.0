import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import type { NextRequest } from 'next/server';

/**
 * API route handler for fetching the NGO of the Month
 * This is determined based on engagement metrics and impact
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching NGO of the Month...');
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Directly query for NGO marked as NGO of the Month
    console.log('Looking for NGOs with isNGOOfTheMonth=true flag');
    let ngoOfTheMonth = await db
      .collection('ngos')
      .findOne({ 
        isNGOOfTheMonth: true,
        status: 'active'
      });
      
    console.log('NGO of the Month found:', ngoOfTheMonth ? 'Yes' : 'No');
    
    // If not found, select one based on metrics
    if (!ngoOfTheMonth) {
      console.log('No designated NGO of the Month, selecting based on metrics...');
      // Get NGO with highest impact score
      const topNGOs = await db
        .collection('ngos')
        .find({
          status: 'active'
        })
        .sort({ 'metrics.impactScore': -1 })
        .limit(1)
        .toArray();
        
      if (topNGOs && topNGOs.length > 0) {
        ngoOfTheMonth = topNGOs[0];
      }
    }
    
    return NextResponse.json({
      success: true,
      ngoOfTheMonth: ngoOfTheMonth
    });
  } catch (error: any) {
    console.error('Error fetching NGO of the Month:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch NGO of the Month',
      details: error.message
    }, { status: 500 });
  }
}
