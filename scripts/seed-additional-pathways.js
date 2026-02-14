/**
 * Seed Script for Additional Health Pathways
 * 
 * This script adds 5 new health pathways to the database:
 * 1. Women's Health for Veterans
 * 2. Chronic Pain Management
 * 3. Substance Use Recovery
 * 4. Preventive Care and Wellness
 * 5. Benefits for Aging Veterans/Geriatric Care
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection string - update as needed
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'vet1stop';
const pathwaysCollection = 'pathways';

async function seedAdditionalPathways() {
  console.log('Starting to seed additional health pathways...');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection(pathwaysCollection);
    
    // Load all pathway JSON files from the pathways directory
    const pathwaysDir = path.join(__dirname, 'data', 'pathways');
    const pathwayFiles = fs.readdirSync(pathwaysDir)
      .filter(file => file.endsWith('.json'));
    
    console.log(`Found ${pathwayFiles.length} pathway files to import`);
    
    // Import each pathway
    for (const file of pathwayFiles) {
      const filePath = path.join(pathwaysDir, file);
      const pathwayData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check if pathway already exists
      const existingPathway = await collection.findOne({ id: pathwayData.id });
      
      if (existingPathway) {
        console.log(`Updating existing pathway: ${pathwayData.title}`);
        await collection.updateOne(
          { id: pathwayData.id },
          { $set: pathwayData }
        );
      } else {
        console.log(`Adding new pathway: ${pathwayData.title}`);
        await collection.insertOne(pathwayData);
      }
    }
    
    console.log('All pathways imported successfully!');
    
  } catch (error) {
    console.error('Error seeding pathways:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Create directory structure if it doesn't exist
const dataDir = path.join(__dirname, 'data');
const pathwaysDir = path.join(dataDir, 'pathways');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(pathwaysDir)) {
  fs.mkdirSync(pathwaysDir);
}

// Run the seed function
seedAdditionalPathways()
  .then(() => console.log('Seeding completed'))
  .catch(err => console.error('Seeding failed:', err));
