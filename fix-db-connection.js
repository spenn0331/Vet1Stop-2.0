/**
 * MongoDB Connection Fix for Vet1Stop
 * 
 * This script updates the .env.local file to test different database
 * and collection names to find where your 192 health resources are stored.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

// Possible database names to try
const POSSIBLE_DB_NAMES = [
  'vet1stop',
  'Vet1Stop',
  'vet1Stop',
  'VET1STOP',
  'sample_mflix',
  'VetUnite',
  'vetunite',
  'Cluster0',
  'cluster0',
  'test',
  'admin'
];

// Possible collection names to try
const POSSIBLE_COLLECTION_NAMES = [
  'healthResources',
  'health_resources', 
  'HealthResources',
  'health-resources',
  'resources',
  'health',
  'movies',  // Some test collections in MongoDB Atlas
  'Resources'
];

async function main() {
  console.log('🔍 Starting database connection diagnostic...');
  console.log('🔄 Checking current .env.local configuration...');
  
  // Read current .env.local file
  const envFilePath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envFilePath, 'utf8');
  
  // Extract current config
  const currentUri = process.env.MONGODB_URI || '';
  const currentDbName = process.env.MONGODB_DB || 'vet1stop';
  const currentCollectionName = process.env.MONGODB_COLLECTION || 'healthResources';
  
  console.log(`📌 Current configuration:
- URI: ${currentUri.substring(0, 25)}...
- Database: ${currentDbName}
- Collection: ${currentCollectionName}
`);
  
  // Connect to MongoDB
  try {
    console.log('🔌 Connecting to MongoDB...');
    const client = new MongoClient(currentUri);
    await client.connect();
    console.log('✅ Connected to MongoDB server');
    
    // Get all available databases
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    const availableDatabases = dbList.databases.map(db => db.name);
    
    console.log(`📋 Available databases: ${availableDatabases.join(', ')}`);
    
    // Find health resources collection with 192 documents
    console.log('\n🔍 Searching for a collection with 192 documents (health resources)...');
    let found = false;
    let correctDbName = '';
    let correctCollectionName = '';
    
    // Check each database and collection
    for (const dbName of availableDatabases) {
      if (dbName === 'admin' || dbName === 'local' || dbName === 'config') continue;
      
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      console.log(`\n📁 Checking database: ${dbName}`);
      console.log(`   Collections: ${collectionNames.join(', ')}`);
      
      for (const collName of collectionNames) {
        try {
          const count = await db.collection(collName).countDocuments();
          const status = count === 192 ? '🎯 MATCH!' : '❌';
          console.log(`   - ${collName}: ${count} documents ${status}`);
          
          if (count === 192) {
            found = true;
            correctDbName = dbName;
            correctCollectionName = collName;
            
            // Get a sample document to verify it's health resources
            const sample = await db.collection(collName).findOne({});
            const hasHealthContent = sample && (
              (sample.category && sample.category.toString().toLowerCase().includes('health')) ||
              (sample.healthType) ||
              (sample.tags && Array.isArray(sample.tags) && 
               sample.tags.some(tag => tag.toString().toLowerCase().includes('health')))
            );
            
            console.log(`     ✅ Found collection with 192 documents!`);
            console.log(`     📄 Sample document ID: ${sample._id}`);
            console.log(`     📄 Sample title: ${sample.title || sample.name || 'No title'}`);
            console.log(`     📄 Is health-related: ${hasHealthContent ? 'Yes' : 'No'}`);
            
            if (hasHealthContent) {
              console.log('     ✅ CONFIRMED: This is the health resources collection!');
            }
          }
        } catch (err) {
          console.log(`   - ${collName}: Error: ${err.message}`);
        }
      }
    }
    
    await client.close();
    
    // Update the .env.local file if we found the correct database and collection
    if (found) {
      console.log('\n🎉 SUCCESS! Found the correct database and collection');
      console.log(`\n📝 Updating .env.local with the correct values:
- Database: ${correctDbName}
- Collection: ${correctCollectionName}
`);
      
      // Update the .env.local file
      let newEnvContent = envContent;
      
      // Update or add the database name
      if (newEnvContent.includes('MONGODB_DB=')) {
        newEnvContent = newEnvContent.replace(
          /MONGODB_DB=.*/,
          `MONGODB_DB="${correctDbName}"`
        );
      } else {
        newEnvContent += `\nMONGODB_DB="${correctDbName}"`;
      }
      
      // Update or add the collection name
      if (newEnvContent.includes('MONGODB_COLLECTION=')) {
        newEnvContent = newEnvContent.replace(
          /MONGODB_COLLECTION=.*/,
          `MONGODB_COLLECTION="${correctCollectionName}"`
        );
      } else {
        newEnvContent += `\nMONGODB_COLLECTION="${correctCollectionName}"`;
      }
      
      // Create a backup of the current .env.local file
      fs.writeFileSync(`${envFilePath}.backup`, envContent);
      console.log(`📑 Created backup of original .env.local at ${envFilePath}.backup`);
      
      // Save the new .env.local file
      fs.writeFileSync(envFilePath, newEnvContent);
      console.log(`📝 Updated .env.local file with correct database and collection names`);
      
      console.log(`\n✅ DONE! Please restart your server with 'npm run dev' to apply the changes.`);
    } else {
      console.log('\n❌ Could not find a collection with exactly 192 documents.');
      console.log('Please check your MongoDB connection and make sure the database and collection exist.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

main().catch(console.error);
