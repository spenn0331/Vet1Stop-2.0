import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ngoId = searchParams.get('ngoId');
    
    if (!ngoId) {
      return NextResponse.json(
        { error: 'NGO ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Get the questions for the specified NGO
    const questions = await db
      .collection('communityQuestions')
      .find({ ngoId: ngoId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching community questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch community questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { ngoId, question, askedBy, contactInfo } = data;
    
    if (!ngoId || !question) {
      return NextResponse.json(
        { error: 'NGO ID and question are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Create new question
    const newQuestion = {
      ngoId,
      question,
      askedBy: askedBy || 'Anonymous Veteran',
      contactInfo: contactInfo || null,
      answers: [],
      createdAt: new Date(),
      status: 'pending' // pending, answered, verified
    };
    
    const result = await db.collection('communityQuestions').insertOne(newQuestion);
    
    return NextResponse.json({
      success: true,
      questionId: result.insertedId.toString(),
      question: newQuestion
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating community question:', error);
    return NextResponse.json(
      { error: 'Failed to create community question' },
      { status: 500 }
    );
  }
}
