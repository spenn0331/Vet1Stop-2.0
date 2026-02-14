const { MongoClient } = require('mongodb');

// Using the same MongoDB URI as in the application
const MONGODB_URI = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkCollections() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI);
    
    console.log('Successfully connected to MongoDB');
    const db = client.db('vet1stop');
    
    const collections = [
      'healthResources', 
      'educationResources', 
      'lifeLeisureResources', 
      'jobResources', 
      'shopResources', 
      'localResources'
    ];
    
    console.log('\nChecking collection counts:');
    for (const collection of collections) {
      const count = await db.collection(collection).countDocuments();
      console.log(`- ${collection}: ${count} documents`);
      
      // If there are documents, show a sample document
      if (count > 0) {
        const sample = await db.collection(collection).findOne({});
        console.log(`  Sample document from ${collection}:`);
        console.log('  ', JSON.stringify(sample, null, 2).substring(0, 150) + '...');
      }
    }
    
    await client.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error checking MongoDB collections:', error);
  }
}

checkCollections();
