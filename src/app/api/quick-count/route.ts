import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request: Request) {
  try {
    // Direct database access to avoid any caching issues
    const uri = process.env.MONGODB_URI || '';
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const collectionName = process.env.MONGODB_COLLECTION || 'healthResources';
    
    console.log(`Checking resources with DB: ${dbName}, Collection: ${collectionName}`);
    
    const client = new MongoClient(uri);
    await client.connect();
    
    // Test all possible databases
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    const allDatabases = dbList.databases.map((db: any) => db.name);
    
    // Collection counts from all databases (to find our 192)
    const collectionCounts: any[] = [];
    
    // Check all databases for collections with documents
    for (const db of allDatabases) {
      if (db !== 'admin' && db !== 'local' && db !== 'config') {
        try {
          const database = client.db(db);
          const collections = await database.listCollections().toArray();
          
          for (const coll of collections) {
            try {
              const count = await database.collection(coll.name).countDocuments();
              if (count > 0) {
                collectionCounts.push({
                  database: db,
                  collection: coll.name,
                  count
                });
              }
            } catch (e) {}
          }
        } catch (e) {}
      }
    }
    
    // Find any collection with 192 documents (our health resources)
    const target192 = collectionCounts.find(c => c.count === 192);
    
    // Try our configured database
    const configuredDb = client.db(dbName);
    const count = await configuredDb.collection(collectionName).countDocuments();
    
    // Get all sample health resources
    const sampleResources = count > 0 
      ? await configuredDb.collection(collectionName).find({}).limit(3).toArray()
      : [];
    
    // Try the health-resources API directly
    let apiResponse = null;
    try {
      const apiRes = await fetch('http://localhost:3000/api/health-resources');
      if (apiRes.ok) {
        apiResponse = await apiRes.json();
      }
    } catch (e) {
      console.error('Error fetching API:', e);
    }
    
    await client.close();
    
    // Return all diagnostic information
    return NextResponse.json({
      configured: {
        database: dbName,
        collection: collectionName,
        documentCount: count
      },
      api: {
        success: apiResponse?.success,
        resourceCount: apiResponse?.data?.length || 'Not available',
        totalItems: apiResponse?.pagination?.totalItems || 'Not available',
        dataSource: apiResponse?.data?.length === 9 ? 'Likely STATIC data (9 items)' : 'Likely MongoDB'
      },
      databases: allDatabases,
      collectionsWith192: target192 ? [target192] : [],
      allCollections: collectionCounts,
      sampleResources: sampleResources.map((doc: any) => ({
        id: doc._id.toString(),
        title: doc.title || doc.name || 'Untitled',
        resourceType: doc.resourceType || doc.healthType || doc.category
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
