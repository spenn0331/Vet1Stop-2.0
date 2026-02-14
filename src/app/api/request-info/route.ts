import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      ngoId, 
      veteranName, 
      email, 
      phone, 
      serviceStatus, 
      questions, 
      preferredContact 
    } = data;
    
    if (!ngoId || !veteranName || !preferredContact || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get the NGO to include its details in the request
    const ngo = await db
      .collection('ngos')
      .findOne({ _id: new ObjectId(ngoId) });
    
    if (!ngo) {
      return NextResponse.json(
        { error: 'NGO not found' },
        { status: 404 }
      );
    }
    
    // Create new info request
    const newInfoRequest = {
      ngoId,
      ngoName: ngo.name,
      veteranName,
      email,
      phone,
      serviceStatus,
      questions,
      preferredContact,
      createdAt: new Date(),
      status: 'pending', // pending, contacted, resolved
      notes: []
    };
    
    const result = await db.collection('infoRequests').insertOne(newInfoRequest);
    
    // In a real-world scenario, we would also send an email notification here
    // to the NGO about the new request
    
    return NextResponse.json({
      success: true,
      requestId: result.insertedId.toString(),
      request: newInfoRequest
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating info request:', error);
    return NextResponse.json(
      { error: 'Failed to submit information request' },
      { status: 500 }
    );
  }
}
