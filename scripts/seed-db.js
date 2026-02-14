// Basic MongoDB connection test and seeder
require('dotenv').config({ path: './.env.local' });
const { MongoClient, ServerApiVersion } = require('mongodb');

// Ensure we have the MongoDB connection string
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('MongoDB URI found, attempting connection...');

// Create a new MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Sample resources (simplified for testing)
const sampleResources = [
  {
    title: 'GI Bill Benefits',
    description: 'Information about education benefits for veterans',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/',
    category: 'education',
    subcategory: 'benefits',
    source: 'government',
    sourceName: 'VA',
    dateAdded: new Date(),
    dateUpdated: new Date(),
    featured: true,
    isPremiumContent: false,
    tags: ['education', 'benefits', 'gi bill']
  },
  {
    title: 'VA Healthcare',
    description: 'Information about healthcare services for veterans',
    url: 'https://www.va.gov/health-care/',
    category: 'health',
    subcategory: 'general',
    source: 'government',
    sourceName: 'VA',
    dateAdded: new Date(),
    dateUpdated: new Date(),
    featured: true,
    isPremiumContent: false,
    tags: ['health', 'healthcare', 'services']
  }
];

async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // Get reference to the database and collection
    const database = client.db('vet1stop');
    const collection = database.collection('resources');
    
    // Check if collection has existing data
    const existingCount = await collection.countDocuments();
    console.log(`Current resource count: ${existingCount}`);
    
    // Clear collection if it has data
    if (existingCount > 0) {
      await collection.deleteMany({});
      console.log('Cleared existing resources');
    }
    
    // Insert sample data
    const result = await collection.insertMany(sampleResources);
    console.log(`${result.insertedCount} resources inserted successfully`);
    
    // Create indexes
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ title: "text", description: "text" });
    console.log('Indexes created');
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the main function
main().catch(console.error);
