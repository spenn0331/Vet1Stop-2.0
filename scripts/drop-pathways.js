const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function dropPathwaysCollection() {
  let client;
  try {
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri || !dbName) {
      console.error('MongoDB connection details not found in environment variables.');
      console.error('Please ensure MONGODB_URI and MONGODB_DB are set in .env.local');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB database: ${dbName}`);
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Drop the pathways collection
    console.log('Dropping pathways collection...');
    await db.collection('pathways').drop().catch(error => {
      // Ignore 'ns not found' error (collection doesn't exist)
      if (error.code !== 26) {
        throw error;
      }
      console.log('Collection does not exist, nothing to drop');
    });
    
    console.log('Pathways collection dropped successfully.');
  } catch (error) {
    console.error('Error dropping pathways collection:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
    process.exit();
  }
}

// Execute the function
dropPathwaysCollection();
