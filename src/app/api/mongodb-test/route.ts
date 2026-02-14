import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
    try {
        console.log('Testing MongoDB connection...');
        const { db } = await connectToDatabase();

        // Check if connection succeeded
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        console.log('Connected to MongoDB successfully');
        console.log('Available collections:', collectionNames);

        // Check specifically for symptomResources collection
        const hasSymptomResources = collectionNames.includes('symptomResources');

        if (hasSymptomResources) {
            // Get count of documents in the collection
            const count = await db.collection('symptomResources').countDocuments();
            console.log(`Found ${count} documents in symptomResources collection`);

            // Get a sample document
            const sampleDoc = await db.collection('symptomResources').findOne({});

            return NextResponse.json({
                success: true,
                message: 'MongoDB connection successful',
                collections: collectionNames,
                symptomResourcesExists: true,
                documentCount: count,
                sampleDocument: sampleDoc
            });
        } else {
            return NextResponse.json({
                success: true,
                message: 'MongoDB connection successful, but symptomResources collection not found',
                collections: collectionNames,
                symptomResourcesExists: false
            });
        }
    } catch (error) {
        console.error('MongoDB connection test failed:', error);
        return NextResponse.json({
            success: false,
            message: 'MongoDB connection failed',
            error: (error as Error).message
        }, { status: 500 });
    }
} 