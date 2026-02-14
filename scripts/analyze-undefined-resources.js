// analyze-undefined-resources.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Logging setup
const logDir = path.join(__dirname, 'logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(logDir, `undefined-resources-analysis-${timestamp}.txt`);
const outputFile = path.join(logDir, `undefined-resources-summary-${timestamp}.json`);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

async function analyzeUndefinedResources() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    log('Connected to MongoDB');

    const db = client.db('vet1stop');
    const undefinedCollection = db.collection('undefinedResources');

    const resources = await undefinedCollection.find().toArray();
    log(`Found ${resources.length} resources in 'undefinedResources' collection.`);

    // Summary object to store analysis results
    const summary = {
      totalResources: resources.length,
      resources: []
    };

    // Analyze each resource
    for (const resource of resources) {
      const resourceSummary = {
        id: resource._id.toString(),
        title: resource.title || 'No Title',
        description: resource.description || 'No Description',
        categoryField: resource.category || 'Not Specified',
        possibleCategory: 'TBD',
        keyFields: []
      };

      // Extract key fields for analysis
      for (const [key, value] of Object.entries(resource)) {
        if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && value && typeof value === 'string' && value.length > 0) {
          resourceSummary.keyFields.push(`${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        }
      }

      // Suggest possible category based on content analysis
      const contentText = JSON.stringify(resource).toLowerCase();
      if (contentText.includes('business') || contentText.includes('shop') || contentText.includes('store') || contentText.includes('discount')) {
        resourceSummary.possibleCategory = 'shop';
      } else if (contentText.includes('local') || contentText.includes('community') || contentText.includes('service') || contentText.includes('location')) {
        resourceSummary.possibleCategory = 'local';
      } else if (contentText.includes('social') || contentText.includes('event') || contentText.includes('group') || contentText.includes('news') || contentText.includes('article')) {
        resourceSummary.possibleCategory = 'social';
      } else if (contentText.includes('job') || contentText.includes('career') || contentText.includes('employment')) {
        resourceSummary.possibleCategory = 'jobs';
      }

      summary.resources.push(resourceSummary);
      log(`Analyzed resource ID ${resource._id}: ${resource.title || 'Untitled'} - Possible Category: ${resourceSummary.possibleCategory}`);
    }

    // Write summary to JSON file for easy review
    fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));
    log(`Analysis summary written to ${outputFile}`);

    // Print summary stats
    const categorySuggestions = {};
    summary.resources.forEach(res => {
      categorySuggestions[res.possibleCategory] = (categorySuggestions[res.possibleCategory] || 0) + 1;
    });
    log('Summary of Suggested Categories:');
    for (const [cat, count] of Object.entries(categorySuggestions)) {
      log(`  - ${cat}: ${count} resources`);
    }

    log('Analysis completed successfully.');
  } catch (error) {
    log(`Error during analysis: ${error.message}`);
    console.error('Analysis error:', error);
  } finally {
    await client.close();
    log('MongoDB connection closed.');
  }
}

analyzeUndefinedResources();
