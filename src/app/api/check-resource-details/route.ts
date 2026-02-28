import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title');
    const collection = searchParams.get('collection') || 'healthResources';
    
    if (!title) {
      return NextResponse.json({ 
        success: false, 
        message: 'Title parameter is required' 
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    const query = { 
      title: { $regex: new RegExp(title, 'i') } 
    };
    
    console.log(`Searching for "${title}" in ${collection} collection`);
    
    const resources = await db.collection(collection).find(query).toArray();
    
    // Format the result to be more human readable
    const formattedResources = resources.map(resource => {
      // Extract only the most important fields for analysis
      return {
        id: resource._id?.toString(),
        title: resource.title,
        description: resource.description,
        url: resource.url,
        category: resource.category,
        tags: resource.tags,
        location: resource.location,
        phone: resource.phone,
        email: resource.email
      };
    });
    
    return NextResponse.json({
      success: true,
      count: resources.length,
      resources: formattedResources
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error searching for resource', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
