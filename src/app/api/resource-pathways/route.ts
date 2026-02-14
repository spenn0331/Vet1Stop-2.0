import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    
    const { db } = await connectToDatabase();
    
    // Build query based on provided parameters
    const query: any = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;

    // Get pathways based on query filters
    const pathways = await db
      .collection('resourcePathways')
      .find(query)
      .sort({ order: 1 })
      .toArray();
    
    // For each pathway, get the full NGO data for each step that references an NGO
    const populatedPathways = await Promise.all(
      pathways.map(async (pathway) => {
        const stepsWithNgos = await Promise.all(
          pathway.steps.map(async (step: any) => {
            if (step.ngoId) {
              const ngo = await db
                .collection('ngos')
                .findOne({ _id: new ObjectId(step.ngoId) });
              return { ...step, ngo };
            }
            return step;
          })
        );

        return { ...pathway, steps: stepsWithNgos };
      })
    );
    
    return NextResponse.json({ pathways: populatedPathways });
  } catch (error) {
    console.error('Error fetching resource pathways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource pathways' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint would be admin-protected in production
    const data = await request.json();
    const { title, description, category, tags, steps } = data;
    
    if (!title || !steps || !steps.length) {
      return NextResponse.json(
        { error: 'Title and steps are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Create new pathway
    const newPathway = {
      title,
      description,
      category: category || 'health',
      tags: tags || [],
      steps: steps.map((step: any, index: number) => ({
        ...step,
        order: index + 1
      })),
      createdAt: new Date(),
      active: true
    };
    
    const result = await db.collection('resourcePathways').insertOne(newPathway);
    
    return NextResponse.json({
      success: true,
      pathwayId: result.insertedId.toString(),
      pathway: newPathway
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating resource pathway:', error);
    return NextResponse.json(
      { error: 'Failed to create resource pathway' },
      { status: 500 }
    );
  }
}
