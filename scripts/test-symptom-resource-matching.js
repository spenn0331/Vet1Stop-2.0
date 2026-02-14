/**
 * Script to test symptom-based resource matching directly with MongoDB
 * 
 * This script:
 * 1. Connects to MongoDB directly
 * 2. Performs the same queries that the symptom-finder API would do
 * 3. Logs the results to verify the matching logic works
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'vet1stop';
const COLLECTION_NAME = 'healthResources';

// Test cases
const testCases = [
  {
    name: 'Mental health symptoms',
    query: {
      $or: [
        { tags: { $in: ['anxiety', 'depression', 'stress'] } },
        { title: { $regex: 'anxiety|depression|stress', $options: 'i' } },
        { description: { $regex: 'anxiety|depression|stress', $options: 'i' } }
      ]
    }
  },
  {
    name: 'PTSD resources (VA only)',
    query: {
      $and: [
        {
          $or: [
            { tags: { $in: ['ptsd', 'trauma'] } },
            { title: { $regex: 'ptsd|trauma', $options: 'i' } },
            { description: { $regex: 'ptsd|trauma', $options: 'i' } }
          ]
        },
        { resourceType: { $regex: /va|federal/i } }
      ]
    }
  },
  {
    name: 'Substance use resources (NGO only)',
    query: {
      $and: [
        {
          $or: [
            { tags: { $in: ['substance-use', 'addiction', 'recovery'] } },
            { title: { $regex: 'substance|addiction|recovery', $options: 'i' } },
            { description: { $regex: 'substance|addiction|recovery', $options: 'i' } }
          ]
        },
        { resourceType: { $regex: /ngo|non-profit|nonprofit/i } }
      ]
    }
  },
  {
    name: 'Featured resources (fallback)',
    query: { 
      $or: [
        { featured: true },
        { isFeatured: true }
      ]
    }
  }
];

// Function to test MongoDB queries
async function testSymptomResourceMatching() {
  console.log('Testing symptom-based resource matching with MongoDB...\n');
  
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }
  
  // Create MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB\n');
    
    // Get database and collection
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Count total resources
    const totalCount = await collection.countDocuments();
    console.log(`Total health resources in database: ${totalCount}\n`);
    
    // Run test cases
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.name} ---`);
      console.log('Query:', JSON.stringify(testCase.query, null, 2));
      
      try {
        // Execute query
        const results = await collection.find(testCase.query).limit(10).toArray();
        
        console.log(`Results: ${results.length} resources found`);
        
        if (results.length > 0) {
          // Show first result
          console.log('\nSample resource:');
          const sample = results[0];
          
          // Format the output for readability
          const formattedSample = {
            id: sample.id || sample._id,
            title: sample.title,
            resourceType: sample.resourceType,
            tags: sample.tags || [],
            featured: sample.featured || sample.isFeatured || false
          };
          
          console.log(JSON.stringify(formattedSample, null, 2));
          
          // Show resource types distribution
          const resourceTypes = {};
          results.forEach(r => {
            const type = r.resourceType || 'unknown';
            resourceTypes[type] = (resourceTypes[type] || 0) + 1;
          });
          
          console.log('\nResource types distribution:');
          console.log(JSON.stringify(resourceTypes, null, 2));
        } else {
          console.log('No resources found for this query');
        }
      } catch (error) {
        console.error('Error executing query:', error);
      }
    }
  } catch (error) {
    console.error('MongoDB connection or query error:', error);
  } finally {
    // Close the connection
    console.log('\nClosing MongoDB connection...');
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testSymptomResourceMatching().catch(console.error);
