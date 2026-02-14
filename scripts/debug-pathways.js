/**
 * Debug script to examine pathways structure
 * This helps identify any issues with how our enhanced pathways are structured
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugPathways() {
  let client;
  try {
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri || !dbName) {
      console.error('MongoDB connection details not found in environment variables.');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB database: ${dbName}`);
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const pathwaysCollection = db.collection('pathways');

    // Get a sample pathway
    const pathway = await pathwaysCollection.findOne({ id: 'pathway-military-healthcare' });
    
    if (!pathway) {
      console.log('Pathway not found');
      return;
    }
    
    // Log the overall structure
    console.log('Pathway structure:');
    console.log(JSON.stringify({
      id: pathway.id,
      title: pathway.title,
      description: pathway.description,
      steps: pathway.steps ? pathway.steps.length : 0,
      enhanced_props: {
        detailedContent: Boolean(pathway.detailedContent),
        lastUpdated: pathway.lastUpdated,
        difficulty: pathway.difficulty,
        requirements: pathway.requirements,
        audience: pathway.audience,
        estimatedCompletionTimeMinutes: pathway.estimatedCompletionTimeMinutes
      }
    }, null, 2));
    
    // Check first step structure
    if (pathway.steps && pathway.steps.length > 0) {
      const firstStep = pathway.steps[0];
      console.log('\nFirst step structure:');
      console.log(JSON.stringify({
        id: firstStep.id,
        title: firstStep.title,
        description: firstStep.description,
        enhanced_props: {
          detailedContent: Boolean(firstStep.detailedContent),
          first_50_chars: firstStep.detailedContent ? firstStep.detailedContent.substring(0, 50) + '...' : null,
          relatedResources: firstStep.relatedResources ? firstStep.relatedResources.length : 0,
          estimatedTimeMinutes: firstStep.estimatedTimeMinutes
        }
      }, null, 2));
      
      // Show example of related resources if they exist
      if (firstStep.relatedResources && firstStep.relatedResources.length > 0) {
        console.log('\nExample related resource:');
        console.log(JSON.stringify(firstStep.relatedResources[0], null, 2));
      }
    }
    
    // Validate all steps
    if (pathway.steps && pathway.steps.length > 0) {
      console.log('\nValidating all steps:');
      let hasIssues = false;
      
      pathway.steps.forEach((step, index) => {
        if (!step.id) {
          console.log(`Step ${index} missing ID`);
          hasIssues = true;
        }
        if (!step.detailedContent && !step.description) {
          console.log(`Step ${index} (${step.title}) missing both detailedContent and description`);
          hasIssues = true;
        }
      });
      
      if (!hasIssues) {
        console.log('All steps have valid structure');
      }
    }
    
  } catch (error) {
    console.error('Error debugging pathways:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the debug function
debugPathways();
