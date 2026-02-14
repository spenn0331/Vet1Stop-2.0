// migrate-mongodb.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Logging setup
const logDir = path.join(__dirname, 'logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logDir, `migration-log-${timestamp}.txt`);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

async function migrateData() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    log('Connected to MongoDB');

    const sourceDb = client.db('test');
    const targetDb = client.db('vet1stop');

    const sourceCollection = sourceDb.collection('resources');
    const resources = await sourceCollection.find().toArray();

    log(`Found ${resources.length} resources to migrate from 'test.resources'`);

    // Define target collections
    const collectionMap = {
      'health': targetDb.collection('healthResources'),
      'education': targetDb.collection('educationResources'),
      'life_leisure': targetDb.collection('lifeLeisureResources'),
      'jobs': targetDb.collection('jobResources'),
      'shop': targetDb.collection('shopResources'),
      'local': targetDb.collection('localResources'),
      'social': targetDb.collection('socialResources'),
      'undefined': targetDb.collection('undefinedResources')
    };

    // Clear existing data in target collections to avoid duplicate key errors
    log('Clearing existing data in target collections...');
    for (const [type, collection] of Object.entries(collectionMap)) {
      const countBefore = await collection.countDocuments();
      if (countBefore > 0) {
        await collection.deleteMany({});
        log(`Cleared ${countBefore} documents from ${type} collection.`);
      } else {
        log(`No documents to clear in ${type} collection.`);
      }
    }

    // Counters for logging
    let migratedCount = 0;
    const categoryCounts = {};

    for (const resource of resources) {
      // Determine the resource type using the 'category' field
      let resourceType = resource.category ? resource.category.toLowerCase() : 'unknown';
      
      // Map category values to collection names
      if (resourceType === 'health' || resourceType.includes('medical')) {
        resourceType = 'health';
      } else if (resourceType === 'education' || resourceType.includes('school') || resourceType.includes('training')) {
        resourceType = 'education';
      } else if (resourceType === 'life' || resourceType.includes('leisure') || resourceType.includes('housing')) {
        resourceType = 'life_leisure';
      } else if (resourceType.includes('job') || resourceType.includes('career') || resourceType.includes('employment')) {
        resourceType = 'jobs';
      } else if (resourceType.includes('shop') || resourceType.includes('business') || resourceType.includes('discount')) {
        resourceType = 'shop';
      } else if (resourceType.includes('local') || resourceType.includes('community') || resourceType.includes('service')) {
        resourceType = 'local';
      } else if (resourceType.includes('social') || resourceType.includes('event') || resourceType.includes('group') || resourceType.includes('news')) {
        resourceType = 'social';
      } else {
        // Default to undefined if no clear match is found
        resourceType = 'undefined';
        log(`Unknown resource category for document ID ${resource._id}, defaulting to undefined`);
      }

      // Add metadata
      resource.createdAt = new Date();
      resource.updatedAt = new Date();
      resource.isPremium = false; // Default for future feature
      
      // Add a note for placeholder content to be revamped later
      if (resourceType === 'local' || resourceType === 'shop' || resourceType === 'social') {
        resource.note = 'Placeholder content - to be revamped or improved in future updates.';
      }

      // Insert into appropriate collection
      if (collectionMap[resourceType]) {
        await collectionMap[resourceType].insertOne(resource);
        migratedCount++;
        categoryCounts[resourceType] = (categoryCounts[resourceType] || 0) + 1;
        log(`Migrated resource ID ${resource._id} to ${resourceType} collection`);
      } else {
        log(`Skipped resource ID ${resource._id} due to unmapped type: ${resourceType}`);
      }

      // Periodic logging
      if (migratedCount % 50 === 0) {
        log(`Progress: Migrated ${migratedCount} of ${resources.length} resources`);
      }
    }

    // Summary
    log(`Migration completed. Total resources migrated: ${migratedCount} of ${resources.length}`);
    for (const [category, count] of Object.entries(categoryCounts)) {
      log(`  - ${category}: ${count} resources`);
    }

    // Validation check
    log('Validating data integrity post-migration...');
    for (const [type, collection] of Object.entries(collectionMap)) {
      const count = await collection.countDocuments();
      log(`Post-migration count for ${type}: ${count} documents`);
    }

    log('Migration process finished successfully.');
  } catch (error) {
    log(`Error during migration: ${error.message}`);
    console.error('Migration error:', error);
  } finally {
    await client.close();
    log('MongoDB connection closed.');
  }
}

migrateData();
