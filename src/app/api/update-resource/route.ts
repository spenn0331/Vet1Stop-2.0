import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, updatedFields, collection = 'healthResources' } = body;
    
    if (!title || !updatedFields) {
      return NextResponse.json({ 
        success: false, 
        message: 'Title and updatedFields are required' 
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    const db = await connectToDatabase();
    
    // Find the resource by title
    const query = { 
      title: { $regex: new RegExp(title, 'i') } 
    };
    
    console.log(`Updating resource "${title}" in ${collection} collection`);
    console.log('Updated fields:', updatedFields);
    
    // Update the resource
    const result = await db.collection(collection).updateOne(
      query,
      { $set: { ...updatedFields, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Resource not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: 'Resource updated successfully'
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error updating resource', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
