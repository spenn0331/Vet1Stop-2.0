// Script to analyze and diagnose issues with health resources in MongoDB
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';

async function analyzeHealthResourcesDatabase() {
  console.log('Connecting to MongoDB...');
  console.log(`URI: ${uri ? uri.substring(0, 15) + '...' : 'Not configured'}`);
  
  if (!uri) {
    console.error('MongoDB URI not configured. Check your .env.local file.');
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db(dbName);
    
    // Check all collections that might contain health resources
    const collections = ['healthResources', 'health_resources', 'resources', 'health'];
    let totalResources = 0;
    
    // Output database stats
    console.log('\n==== DATABASE INFORMATION ====');
    const dbInfo = await db.stats();
    console.log(`Database: ${dbName}`);
    console.log(`Total Collections: ${dbInfo.collections}`);
    console.log(`Total Documents: ${dbInfo.objects}`);
    
    // Analyze collections
    console.log('\n==== COLLECTIONS ANALYSIS ====');
    for (const collectionName of collections) {
      try {
        // Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray();
        if (collections.length === 0) {
          console.log(`Collection '${collectionName}' does not exist.`);
          continue;
        }
        
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`Collection '${collectionName}': ${count} documents`);
        totalResources += count;
        
        if (count > 0) {
          // Get sample document structure
          const sampleDoc = await collection.findOne({});
          console.log(`\nSample document from '${collectionName}':`);
          console.log(JSON.stringify(sampleDoc, null, 2));
          
          // Analyze tags field
          const tagStats = await analyzeTagsInCollection(collection);
          console.log(`\nTag Analysis for '${collectionName}':`);
          console.log(`- Documents with 'tags' field: ${tagStats.documentsWithTags}`);
          console.log(`- Documents with empty tags array: ${tagStats.documentsWithEmptyTags}`);
          console.log(`- Documents with non-array tags: ${tagStats.documentsWithNonArrayTags}`);
          console.log(`- Documents with string tags: ${tagStats.documentsWithStringTags}`);
          console.log(`- Total tags found: ${tagStats.totalTags}`);
          console.log(`- Unique tags found: ${tagStats.uniqueTags.size}`);
          console.log(`- Most common tags: ${Array.from(tagStats.tagFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => `${tag} (${count})`)
            .join(', ')}`);
          
          // Analyze specific tag presence for our needs-based navigation categories
          const needsBasedTags = [
            'mental health', 'ptsd', 'trauma', 'stress', 'anxiety', 'depression',
            'primary care', 'specialty care', 'disability', 'women\'s health'
          ];
          
          for (const tag of needsBasedTags) {
            const count = await collection.countDocuments({
              $or: [
                { tags: { $regex: tag, $options: 'i' } },
                { tags: { $in: [tag, new RegExp(tag, 'i')] } },
                { description: { $regex: tag, $options: 'i' } },
                { title: { $regex: tag, $options: 'i' } }
              ]
            });
            console.log(`- Resources mentioning '${tag}': ${count}`);
          }
        }
      } catch (err) {
        console.error(`Error analyzing collection '${collectionName}':`, err);
      }
    }
    
    console.log(`\nTotal health resources across all collections: ${totalResources}`);
    
    // Check if we need to update tags in the database
    console.log('\n==== RECOMMENDATION ====');
    if (totalResources > 0) {
      console.log('Based on the analysis, the following is recommended:');
      console.log('1. Create a migration script to update all health resources with proper tags');
      console.log('2. Add tags for: mental health, ptsd, trauma, stress, anxiety, primary care, etc.');
      console.log('3. Ensure all resources have a tags array (even if empty)');
      console.log('4. Convert any string tags to arrays');
    } else {
      console.log('No health resources found in the database. Consider importing data first.');
    }
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

async function analyzeTagsInCollection(collection) {
  const stats = {
    documentsWithTags: 0,
    documentsWithEmptyTags: 0,
    documentsWithNonArrayTags: 0, 
    documentsWithStringTags: 0,
    totalTags: 0,
    uniqueTags: new Set(),
    tagFrequency: new Map()
  };
  
  // Find documents with tags field
  const cursor = collection.find({});
  
  await cursor.forEach(doc => {
    if (doc.tags !== undefined) {
      stats.documentsWithTags++;
      
      if (Array.isArray(doc.tags)) {
        if (doc.tags.length === 0) {
          stats.documentsWithEmptyTags++;
        } else {
          stats.totalTags += doc.tags.length;
          doc.tags.forEach(tag => {
            const normalizedTag = String(tag).toLowerCase();
            stats.uniqueTags.add(normalizedTag);
            stats.tagFrequency.set(
              normalizedTag, 
              (stats.tagFrequency.get(normalizedTag) || 0) + 1
            );
          });
        }
      } else if (typeof doc.tags === 'string') {
        stats.documentsWithStringTags++;
        stats.totalTags += 1;
        const normalizedTag = doc.tags.toLowerCase();
        stats.uniqueTags.add(normalizedTag);
        stats.tagFrequency.set(
          normalizedTag, 
          (stats.tagFrequency.get(normalizedTag) || 0) + 1
        );
      } else {
        stats.documentsWithNonArrayTags++;
      }
    }
  });
  
  return stats;
}

// Run the analysis
analyzeHealthResourcesDatabase().catch(console.error);
