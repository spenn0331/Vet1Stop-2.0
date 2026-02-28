import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: Request) {
  console.log('==== DETAILED DATABASE DEBUG API ====');
  
  try {
    // Get MongoDB connection details from .env.local
    const uri = process.env.MONGODB_URI;
    const configuredDbName = process.env.MONGODB_DB || 'vet1stop';
    const configuredCollectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    
    if (!uri) {
      return NextResponse.json({ 
        error: 'MONGODB_URI is not defined in environment variables'
      }, { status: 500 });
    }
    
    console.log(`Attempting direct connection to MongoDB with URI: ${uri.substring(0, 20)}...`);
    console.log(`Configured database name: ${configuredDbName}`);
    console.log(`Configured collection name: ${configuredCollectionName}`);
    
    // Create a new MongoDB client with specific options
    const client = new MongoClient(uri);
    
    // Connect directly to the MongoDB server
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    
    // List all available databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    const databases = dbs.databases.map((db: any) => ({
      name: db.name,
      sizeOnDisk: db.sizeOnDisk,
      empty: db.empty
    }));
    
    console.log('Available databases:', databases.map((db: any) => db.name).join(', '));
    
    // First check if the configured database and collection exist and have documents
    let configuredDbExists = false;
    let configuredCollectionExists = false;
    let configuredCollectionDocCount = 0;
    
    // Check if the configured database exists
    if (databases.some(db => db.name === configuredDbName)) {
      configuredDbExists = true;
      console.log(`Configured database '${configuredDbName}' exists`);
      
      // Check if the configured collection exists in the configured database
      const db = client.db(configuredDbName);
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (collectionNames.includes(configuredCollectionName)) {
        configuredCollectionExists = true;
        console.log(`Configured collection '${configuredCollectionName}' exists in database '${configuredDbName}'`);
        
        // Check document count in the configured collection
        configuredCollectionDocCount = await db.collection(configuredCollectionName).countDocuments();
        console.log(`Configured collection '${configuredCollectionName}' has ${configuredCollectionDocCount} documents`);
      } else {
        console.log(`Configured collection '${configuredCollectionName}' does NOT exist in database '${configuredDbName}'`);
      }
    } else {
      console.log(`Configured database '${configuredDbName}' does NOT exist`);
    }
    
    // Check each database for collections with documents - find all potential health-related collections
    const allCollectionsWithDocs: any[] = [];
    
    for (const database of databases) {
      if (database.name !== 'admin' && database.name !== 'local' && database.name !== 'config') {
        try {
          const db = client.db(database.name);
          const collections = await db.listCollections().toArray();
          
          for (const collection of collections) {
            try {
              // Check document count in each collection
              const count = await db.collection(collection.name).countDocuments();
              
              // For collections with documents, add to our list
              if (count > 0) {
                // Get sample document to verify content
                const sample = await db.collection(collection.name).findOne({});
                let hasHealthContent = false;
                
                // Try to detect if this might be a health resources collection
                if (sample && (
                  (sample.category && typeof sample.category === 'string' && 
                   (sample.category.toLowerCase().includes('health') || 
                    sample.category.toLowerCase().includes('medical'))) ||
                  (sample.tags && Array.isArray(sample.tags) && 
                   sample.tags.some((tag: string) => 
                     typeof tag === 'string' && 
                     (tag.toLowerCase().includes('health') || 
                      tag.toLowerCase().includes('medical')))) ||
                  (sample.healthType && typeof sample.healthType === 'string')
                )) {
                  hasHealthContent = true;
                }
                
                allCollectionsWithDocs.push({
                  database: database.name,
                  collection: collection.name,
                  documentCount: count,
                  sampleDocumentId: sample?._id?.toString(),
                  hasTitleField: !!sample?.title,
                  hasNameField: !!sample?.name,
                  hasHealthTypeField: !!sample?.healthType,
                  hasCategoryField: !!sample?.category,
                  hasTagsField: !!sample?.tags,
                  hasHealthContent,
                  isLikelyHealthResourceCollection: (
                    hasHealthContent || 
                    collection.name.toLowerCase().includes('health') ||
                    count === 192 // If it has exactly 192 documents, it's likely the one we want
                  )
                });
              }
            } catch (err) {
              console.error(`Error checking collection ${collection.name}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error checking database ${database.name}:`, err);
        }
      }
    }
    
    // Find the most likely collection for health resources
    // Priority: 1) Collection with exactly 192 docs, 2) Collection with health in name, 3) Collection with health content
    let mostLikelyHealthCollection = null;
    
    // First, try to find a collection with exactly 192 documents
    mostLikelyHealthCollection = allCollectionsWithDocs.find(coll => coll.documentCount === 192);
    
    // If not found, try collections with 'health' in the name
    if (!mostLikelyHealthCollection) {
      mostLikelyHealthCollection = allCollectionsWithDocs.find(coll => 
        coll.collection.toLowerCase().includes('health') && 
        (coll.hasCategoryField || coll.hasHealthTypeField || coll.hasTagsField)
      );
    }
    
    // If still not found, look for collections with health content
    if (!mostLikelyHealthCollection) {
      mostLikelyHealthCollection = allCollectionsWithDocs.find(coll => coll.hasHealthContent);
    }
    
    // Get sample documents from the most likely collection
    let sampleDocuments: any[] = [];
    if (mostLikelyHealthCollection) {
      console.log(`Found likely health collection: ${mostLikelyHealthCollection.database}.${mostLikelyHealthCollection.collection} with ${mostLikelyHealthCollection.documentCount} documents`);
      const db = client.db(mostLikelyHealthCollection.database);
      sampleDocuments = await db.collection(mostLikelyHealthCollection.collection).find({}).limit(3).toArray();
    }
    
    // Close the connection
    await client.close();
    
    // Return all diagnostic information
    return NextResponse.json({
      success: true,
      diagnosticTimestamp: new Date().toISOString(),
      connection: {
        uri: uri.substring(0, 20) + '...',
        configuredDbName,
        configuredCollectionName,
        configuredDbExists,
        configuredCollectionExists,
        configuredCollectionDocCount,
      },
      databases: {
        available: databases,
        count: databases.length
      },
      collections: {
        allWithDocuments: allCollectionsWithDocs,
        count: allCollectionsWithDocs.length,
        mostLikelyHealthCollection
      },
      // Provide a recommendation for fixing the connection
      recommendation: mostLikelyHealthCollection ? {
        useThisDatabaseName: mostLikelyHealthCollection.database,
        useThisCollectionName: mostLikelyHealthCollection.collection,
        currentSettings: {
          database: configuredDbName,
          collection: configuredCollectionName
        },
        needsConfigUpdate: (
          mostLikelyHealthCollection.database !== configuredDbName ||
          mostLikelyHealthCollection.collection !== configuredCollectionName
        )
      } : "No suitable health resources collection found",
      sampleDocuments: sampleDocuments.map(doc => ({
        _id: doc._id?.toString(),
        title: doc.title || doc.name || 'No title',
        category: doc.category || doc.healthType || 'No category',
        tags: doc.tags || []
      }))
    });
  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
