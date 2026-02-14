const { MongoClient } = require('mongodb');

async function analyzeCluster() {
  try {
    console.log('Analyzing MongoDB Cluster...');
    const uri = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connection successful!');
    
    // List all databases
    console.log('\nAVAILABLE DATABASES:');
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Check each database in detail
    console.log('\nDETAILED DATABASE ANALYSIS:');
    for(const dbInfo of dbs.databases) {
      // Skip system databases
      if(['admin', 'local', 'config'].includes(dbInfo.name)) continue;
      
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      console.log(`\nDatabase '${dbInfo.name}' contains ${collections.length} collections:`);
      
      // Examine each collection
      for(const collection of collections) {
        try {
          const count = await db.collection(collection.name).countDocuments();
          console.log(`- Collection '${collection.name}' contains ${count} documents`);
          
          // If collection has documents, check for health-related content
          if(count > 0) {
            // Get a sample document to analyze
            const sample = await db.collection(collection.name).find().limit(1).toArray();
            
            // Check if this might contain health resources
            if(sample[0]) {
              const doc = sample[0];
              const keys = Object.keys(doc).join(', ');
              
              console.log(`  Keys: ${keys}`);
              
              // Check if this looks like a resource
              if(doc.title || doc.category || doc.description) {
                console.log('  This collection appears to contain resources!');
                
                // If it has few documents, show them all
                if(count <= 5) {
                  const allDocs = await db.collection(collection.name).find().toArray();
                  console.log('  All documents:');
                  allDocs.forEach((d, i) => {
                    console.log(`  Document ${i+1}:`);
                    console.log(`    Title: ${d.title || 'N/A'}`);
                    console.log(`    Category: ${d.category || 'N/A'}`);
                    console.log(`    Description: ${d.description ? d.description.substring(0, 100) + '...' : 'N/A'}`);
                  });
                } else {
                  // If it has many docs, check specifically for health resources
                  console.log('  Checking for health-related resources:');
                  
                  // Try different queries that might find health resources
                  const healthQuery = {
                    $or: [
                      { category: { $regex: /health/i } },
                      { tags: { $regex: /health/i } },
                      { title: { $regex: /health|medical|wellness|care/i } },
                      { description: { $regex: /health|medical|wellness|care/i } }
                    ]
                  };
                  
                  const healthCount = await db.collection(collection.name).countDocuments(healthQuery);
                  console.log(`  Found ${healthCount} potential health-related resources`);
                  
                  if(healthCount > 0) {
                    // This might be the collection we're looking for!
                    console.log('  ***THIS COLLECTION LIKELY CONTAINS HEALTH RESOURCES***');
                    const healthDocs = await db.collection(collection.name)
                      .find(healthQuery)
                      .limit(3)
                      .toArray();
                    
                    healthDocs.forEach((d, i) => {
                      console.log(`  Health Resource ${i+1}:`);
                      console.log(`    Title: ${d.title || 'N/A'}`);
                      console.log(`    Category: ${d.category || 'N/A'}`);
                      console.log(`    Description: ${d.description ? d.description.substring(0, 100) + '...' : 'N/A'}`);
                    });
                  }
                }
              }
            }
          }
        } catch (collErr) {
          console.log(`  Error analyzing collection ${collection.name}:`, collErr.message);
        }
      }
    }
    
    console.log('\nAnalysis complete!');
    await client.close();
    
  } catch (error) {
    console.error('Error analyzing MongoDB cluster:', error);
  }
}

analyzeCluster();
