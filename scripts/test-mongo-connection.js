// Simple script to test MongoDB connection
require('dotenv').config({ path: './.env.local' });
const { MongoClient, ServerApiVersion } = require('mongodb');

// Log environment variables (without showing full credentials)
console.log('---- Environment Check ----');
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  // Only show the first part of the connection string for security
  const maskedUri = uri.replace(/(mongodb\+srv:\/\/[^:]+):[^@]+(@.+)/, '$1:***$2');
  console.log('MONGODB_URI present:', maskedUri);
} else {
  console.error('MONGODB_URI is missing!');
  process.exit(1);
}

async function testConnection() {
  console.log('\n---- Connection Test ----');
  
  // Get MongoDB URI
  const uri = process.env.MONGODB_URI;
  
  // Create MongoDB client
  console.log('Creating MongoDB client...');
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  try {
    // Connect to the MongoDB server
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database access
    console.log('\n---- Database Access Test ----');
    const database = client.db('vet1stop');
    console.log('Accessed database:', database.databaseName);
    
    // List collections
    console.log('\n---- Collections Test ----');
    const collections = await database.listCollections().toArray();
    console.log('Collections in database:');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach((collection, i) => {
        console.log(`${i+1}. ${collection.name}`);
      });
    }
    
    // Check resources collection
    console.log('\n---- Resources Collection Test ----');
    const resourcesCollection = database.collection('resources');
    const count = await resourcesCollection.countDocuments();
    console.log(`Resource count: ${count}`);
    
    if (count > 0) {
      console.log('\n---- Sample Resource Test ----');
      const sample = await resourcesCollection.findOne({});
      console.log('Sample resource:', JSON.stringify(sample, null, 2));
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during MongoDB connection test:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
testConnection().catch(console.error);
