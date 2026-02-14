import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: Request) {
  console.log('==== DB TEST API REQUEST STARTED ====');
  
  try {
    // Get database info from environment variables
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    console.log(`Environment configured with DB: ${dbName}, Collection: ${collectionName}`);
    
    // Connect to MongoDB
    console.log(`Connecting to database: ${dbName}`);
    const db = await connectToDatabase(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name).join(', '));
    
    // Get a reference to the collection
    const collection = db.collection(collectionName);
    
    // Check if the collection exists
    const collectionExists = collections.some(c => c.name === collectionName);
    console.log(`Collection ${collectionName} exists: ${collectionExists}`);
    
    // Count documents in the collection
    const count = await collection.countDocuments({});
    console.log(`Collection ${collectionName} has ${count} documents`);
    
    // Get sample documents
    const sampleDocs = await collection.find({}).limit(3).toArray();
    
    // List all databases to see if we're connecting to the right cluster
    const adminDb = db.admin();
    const dbs = await adminDb.listDatabases();
    const dbNames = dbs.databases.map((db: any) => db.name);
    
    // Also try to look for 'health' collections in each database
    const healthCollections: any[] = [];
    for (const dbName of dbNames) {
      if (dbName !== 'admin' && dbName !== 'local') {
        try {
          const testDb = db.client.db(dbName);
          const testCollections = await testDb.listCollections().toArray();
          const healthRelated = testCollections.filter(c => 
            c.name.toLowerCase().includes('health') || 
            c.name.toLowerCase().includes('resource')
          );
          
          if (healthRelated.length > 0) {
            for (const hc of healthRelated) {
              const count = await testDb.collection(hc.name).countDocuments({});
              healthCollections.push({
                database: dbName,
                collection: hc.name,
                documentCount: count
              });
            }
          }
        } catch (err) {
          console.error(`Error checking database ${dbName}:`, err);
        }
      }
    }
    
    // Return diagnostic information
    return NextResponse.json({
      success: true,
      diagnostics: {
        environment: {
          dbName,
          collectionName,
          nodeEnv: process.env.NODE_ENV
        },
        connection: {
          connected: true,
          availableDatabases: dbNames,
          currentDatabase: dbName,
          availableCollections: collections.map(c => c.name),
          collectionExists
        },
        collection: {
          name: collectionName,
          documentCount: count,
          sampleDocumentIds: sampleDocs.map(doc => doc._id?.toString())
        },
        healthCollectionsAcrossDatabases: healthCollections
      },
      sampleDocuments: sampleDocs.map(doc => ({
        _id: doc._id?.toString(),
        title: doc.title || doc.name,
        category: doc.category || doc.healthType,
        tags: doc.tags
      }))
    });
  } catch (error) {
    console.error('DB Test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
