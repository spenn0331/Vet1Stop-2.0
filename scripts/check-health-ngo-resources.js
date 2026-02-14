// Script to directly check health NGO resources in MongoDB
require('dotenv').config({ path: '.env.local' });

const { MongoClient } = require('mongodb');

async function checkHealthNGOResources() {
  console.log('Starting MongoDB health NGO resources check...');
  
  // Get MongoDB connection string from env
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'vet1stop';
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable not set');
    process.exit(1);
  }
  
  console.log(`Connecting to MongoDB at ${uri.substring(0, 30)}... using database ${dbName}`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n=== COLLECTIONS ===');
    collections.forEach(coll => {
      console.log(`- ${coll.name}`);
    });
    
    // Check healthResources collection specifically
    const healthResCollection = 'healthResources';
    if (collections.some(c => c.name === healthResCollection)) {
      console.log(`\n=== ${healthResCollection.toUpperCase()} COLLECTION FOUND ===`);
      
      // Count total documents
      const totalCount = await db.collection(healthResCollection).countDocuments();
      console.log(`Total documents: ${totalCount}`);
      
      // Count documents with category 'health'
      const healthCount = await db.collection(healthResCollection).countDocuments({ category: 'health' });
      console.log(`Documents with category 'health': ${healthCount}`);
      
      // Count documents with subcategory 'ngo'
      const ngoCount = await db.collection(healthResCollection).countDocuments({ subcategory: 'ngo' });
      console.log(`Documents with subcategory 'ngo': ${ngoCount}`);
      
      // Count documents with both category 'health' AND subcategory 'ngo'
      const healthNgoCount = await db.collection(healthResCollection).countDocuments({ 
        category: 'health', 
        subcategory: 'ngo' 
      });
      console.log(`Documents with category 'health' AND subcategory 'ngo': ${healthNgoCount}`);
      
      // Get distinct subcategories
      const subcategories = await db.collection(healthResCollection).distinct('subcategory');
      console.log('\n=== DISTINCT SUBCATEGORIES ===');
      console.log(subcategories);
      
      // Get sample health NGO document if any exist
      if (healthNgoCount > 0) {
        console.log('\n=== SAMPLE HEALTH NGO DOCUMENT ===');
        const sampleDoc = await db.collection(healthResCollection).findOne({ 
          category: 'health', 
          subcategory: 'ngo' 
        });
        console.log(JSON.stringify(sampleDoc, null, 2));
      } else {
        console.log('\n=== Checking for case sensitivity issues ===');
        // Try different case variations
        const variations = [
          { category: 'Health', subcategory: 'ngo' },
          { category: 'health', subcategory: 'NGO' },
          { category: 'Health', subcategory: 'NGO' },
          { category: 'health', subcategory: 'Ngo' }
        ];
        
        for (const variation of variations) {
          const count = await db.collection(healthResCollection).countDocuments(variation);
          console.log(`Documents with category '${variation.category}' and subcategory '${variation.subcategory}': ${count}`);
          
          if (count > 0) {
            const sample = await db.collection(healthResCollection).findOne(variation);
            console.log(`Sample document with these criteria:`);
            console.log(JSON.stringify(sample, null, 2));
          }
        }
      }
    } else {
      console.error(`Collection '${healthResCollection}' not found in database`);
    }
    
  } catch (err) {
    console.error('MongoDB Error:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

checkHealthNGOResources().catch(console.error);
