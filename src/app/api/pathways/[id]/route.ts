import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * GET /api/pathways/[id]
 * Gets a specific pathway by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Connect to the database
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    // Try to fetch pathway by either MongoDB ObjectId or by string ID
    let pathway;
    
    try {
      // First try with ObjectId (this will work if we have proper MongoDB IDs)
      pathway = await db.collection('pathways').findOne({
        _id: new ObjectId(id)
      });
    } catch (err) {
      console.log('Not a valid ObjectId, trying with string ID');
      // If ObjectId conversion fails, try with the string ID
      pathway = await db.collection('pathways').findOne({
        id: id
      });
    }
    
    if (!pathway) {
      return NextResponse.json(
        { error: 'Pathway not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(pathway);
  } catch (error) {
    console.error('Error fetching pathway:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pathway' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pathways/[id]
 * Updates a pathway (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updateData = await request.json();
    
    // Add timestamp
    updateData.updatedAt = new Date();
    
    // Connect to the database
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    // Update pathway
    const result = await db.collection('pathways').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Pathway not found' },
        { status: 404 }
      );
    }
    
    // Get updated pathway
    const updatedPathway = await db.collection('pathways').findOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(updatedPathway);
  } catch (error) {
    console.error('Error updating pathway:', error);
    return NextResponse.json(
      { error: 'Failed to update pathway' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pathways/[id]
 * Deletes a pathway (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Connect to the database
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    
    // Delete pathway
    const result = await db.collection('pathways').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Pathway not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pathway:', error);
    return NextResponse.json(
      { error: 'Failed to delete pathway' },
      { status: 500 }
    );
  }
}
