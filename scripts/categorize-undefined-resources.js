// categorize-undefined-resources.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Logging setup
const logDir = path.join(__dirname, 'logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logDir, `categorize-undefined-log-${timestamp}.txt`);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

async function categorizeUndefinedResources() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    log('Connected to MongoDB');

    const db = client.db('vet1stop');
    const undefinedCollection = db.collection('undefinedResources');
    const shopCollection = db.collection('shopResources');
    const localCollection = db.collection('localResources');

    const resources = await undefinedCollection.find().toArray();
    log(`Found ${resources.length} resources in 'undefinedResources' collection to categorize.`);

    // Counters for logging
    let shopCount = 0;
    let localCount = 0;
    let uncategorizedCount = 0;

    for (const resource of resources) {
      // Analyze content to determine category
      const contentText = JSON.stringify(resource).toLowerCase();
      let targetCollection = null;
      let categoryName = '';

      if (contentText.includes('business') || contentText.includes('shop') || contentText.includes('store') || contentText.includes('discount')) {
        targetCollection = shopCollection;
        categoryName = 'shop';
        shopCount++;
      } else if (contentText.includes('local') || contentText.includes('community') || contentText.includes('service') || contentText.includes('location')) {
        targetCollection = localCollection;
        categoryName = 'local';
        localCount++;
      } else {
        log(`Resource ID ${resource._id} does not match shop or local criteria, remains uncategorized.`);
        uncategorizedCount++;
        continue;
      }

      // Add metadata and note for placeholder
      resource.updatedAt = new Date();
      resource.note = 'Placeholder content - to be revamped or improved in future updates.';

      // Move resource to target collection
      await targetCollection.insertOne(resource);
      await undefinedCollection.deleteOne({ _id: resource._id });
      log(`Moved resource ID ${resource._id} from undefinedResources to ${categoryName}Resources.`);
    }

    // Summary
    log(`Categorization completed. Summary of changes:`);
    log(`  - Moved to shopResources: ${shopCount} resources`);
    log(`  - Moved to localResources: ${localCount} resources`);
    log(`  - Remain uncategorized: ${uncategorizedCount} resources`);

    // Validation check
    log('Validating data integrity post-categorization...');
    const undefinedCount = await undefinedCollection.countDocuments();
    const shopCountFinal = await shopCollection.countDocuments();
    const localCountFinal = await localCollection.countDocuments();
    log(`Post-categorization count for undefinedResources: ${undefinedCount} documents`);
    log(`Post-categorization count for shopResources: ${shopCountFinal} documents`);
    log(`Post-categorization count for localResources: ${localCountFinal} documents`);

    log('Categorization process finished successfully.');
  } catch (error) {
    log(`Error during categorization: ${error.message}`);
    console.error('Categorization error:', error);
  } finally {
    await client.close();
    log('MongoDB connection closed.');
  }
}

categorizeUndefinedResources();
