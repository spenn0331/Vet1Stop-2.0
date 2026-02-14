// Script to deeply analyze NGO resources in MongoDB
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function analyzeNGOResources() {
  console.log('===== DETAILED NGO RESOURCES ANALYSIS =====');
  
  // Get MongoDB connection string from env
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'vet1stop';
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable not set');
    process.exit(1);
  }
  
  console.log(`Connecting to MongoDB at ${uri.substring(0, 20)}... using database ${dbName}`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(dbName);
    const collection = db.collection('healthResources');
    
    // 1. Total documents in healthResources
    const totalCount = await collection.countDocuments();
    console.log(`\n📊 COLLECTION OVERVIEW:`);
    console.log(`Total documents in healthResources: ${totalCount}`);
    
    // 2. Check for category distribution
    const categoryResults = await collection.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📂 CATEGORIES:');
    categoryResults.forEach(cat => {
      console.log(`${cat._id || 'undefined'}: ${cat.count} documents`);
    });
    
    // 3. Check for subcategory distribution
    const subcategoryResults = await collection.aggregate([
      { $group: { _id: "$subcategory", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📂 SUBCATEGORIES:');
    subcategoryResults.forEach(subcat => {
      console.log(`${subcat._id || 'undefined'}: ${subcat.count} documents`);
    });
    
    // 4. Look for exact match of health/ngo
    const healthNgoExact = await collection.countDocuments({
      category: 'health',
      subcategory: 'ngo'
    });
    
    console.log(`\n🔍 EXACT MATCH SEARCH:`);
    console.log(`Documents with exact {category: 'health', subcategory: 'ngo'}: ${healthNgoExact}`);
    
    // 5. Look for case insensitive matches
    const healthNgoCaseInsensitive = await collection.countDocuments({
      category: { $regex: '^health$', $options: 'i' },
      subcategory: { $regex: '^ngo$', $options: 'i' }
    });
    
    console.log(`Documents with case-insensitive {category: /^health$/i, subcategory: /^ngo$/i}: ${healthNgoCaseInsensitive}`);
    
    // 6. Check for potential variations
    const variations = [
      { category: 'Health', subcategory: 'ngo' },
      { category: 'health', subcategory: 'NGO' },
      { category: 'Health', subcategory: 'NGO' },
      { category: 'health', subcategory: 'Ngo' }
    ];
    
    console.log('\n🔎 VARIATION CHECKS:');
    for (const variation of variations) {
      const count = await collection.countDocuments(variation);
      console.log(`${JSON.stringify(variation)}: ${count} documents`);
    }
    
    // 7. Sample a few documents if any exist
    if (healthNgoExact > 0) {
      console.log('\n📄 SAMPLE DOCUMENTS:');
      const samples = await collection.find({ 
        category: 'health', 
        subcategory: 'ngo' 
      }).limit(2).toArray();
      
      samples.forEach((doc, idx) => {
        console.log(`\nSample document ${idx + 1}:`);
        console.log(JSON.stringify({
          _id: doc._id.toString(),
          title: doc.title,
          category: doc.category,
          subcategory: doc.subcategory,
          tags: doc.tags,
          // Include other fields that might be relevant
          rating: doc.rating,
          contact: doc.contact
        }, null, 2));
      });
    } else if (healthNgoCaseInsensitive > 0) {
      console.log('\n📄 SAMPLE DOCUMENTS (case insensitive match):');
      const samples = await collection.find({ 
        category: { $regex: '^health$', $options: 'i' },
        subcategory: { $regex: '^ngo$', $options: 'i' }
      }).limit(2).toArray();
      
      samples.forEach((doc, idx) => {
        console.log(`\nSample document ${idx + 1}:`);
        console.log(JSON.stringify({
          _id: doc._id.toString(),
          title: doc.title,
          category: doc.category,
          subcategory: doc.subcategory,
          tags: doc.tags,
          rating: doc.rating,
          contact: doc.contact
        }, null, 2));
      });
    }
    
    // 8. Check for common missing fields
    const criticalFields = ['title', 'description', 'contact', 'tags', 'rating'];
    console.log('\n⚠️ MISSING FIELD ANALYSIS:');
    
    for (const field of criticalFields) {
      const missingCount = await collection.countDocuments({
        category: 'health',
        subcategory: 'ngo',
        [field]: { $exists: false }
      });
      
      console.log(`Documents missing '${field}': ${missingCount} out of ${healthNgoExact}`);
    }

    // 9. Test our query that we use in the API
    console.log('\n🧪 TESTING API QUERY:');
    const simpleFilter = {
      category: 'health',
      subcategory: 'ngo'
    };
    
    const apiQueryResults = await collection.find(simpleFilter).limit(5).toArray();
    console.log(`API query returned ${apiQueryResults.length} results`);
    
    if (apiQueryResults.length > 0) {
      console.log('First result:');
      console.log(JSON.stringify({
        _id: apiQueryResults[0]._id.toString(),
        title: apiQueryResults[0].title,
        description: apiQueryResults[0].description?.substring(0, 50) + '...',
      }, null, 2));
    }
    
  } catch (err) {
    console.error('❌ MongoDB Error:', err);
  } finally {
    await client.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

analyzeNGOResources().catch(console.error);
