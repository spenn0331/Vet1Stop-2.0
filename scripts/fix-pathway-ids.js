/**
 * Script to fix pathway step IDs
 * This ensures all pathway steps have valid IDs for proper display
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixPathwayIds() {
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

    // Get all pathways
    const pathways = await pathwaysCollection.find({}).toArray();
    
    let fixedPathwaysCount = 0;
    let fixedStepsCount = 0;
    
    // Process each pathway
    for (const pathway of pathways) {
      let pathwayUpdated = false;
      
      if (pathway.steps && Array.isArray(pathway.steps)) {
        // Fix steps without IDs
        for (let i = 0; i < pathway.steps.length; i++) {
          const step = pathway.steps[i];
          
          // If step is missing ID, generate one based on title and index
          if (!step.id || step.id === null || step.id === undefined) {
            const safeTitle = step.title ? step.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : '';
            step.id = `${pathway.id}-step-${i+1}${safeTitle ? '-' + safeTitle : ''}`;
            fixedStepsCount++;
            pathwayUpdated = true;
            console.log(`Fixed step ID: ${step.id}`);
          }
          
          // Ensure all steps have order property
          if (!step.order) {
            step.order = i + 1;
            pathwayUpdated = true;
          }
          
          // Fix null values that might cause rendering issues
          if (step.detailedContent === null) {
            step.detailedContent = undefined;
            pathwayUpdated = true;
          }
          
          if (step.relatedResources === null) {
            step.relatedResources = [];
            pathwayUpdated = true;
          }
          
          // Ensure related resources have IDs
          if (step.relatedResources && Array.isArray(step.relatedResources)) {
            for (let j = 0; j < step.relatedResources.length; j++) {
              const resource = step.relatedResources[j];
              if (!resource.id) {
                resource.id = `related-resource-${j+1}-${pathway.id}-step-${i+1}`;
                pathwayUpdated = true;
              }
            }
          }
        }
      }
      
      // Update the pathway if changes were made
      if (pathwayUpdated) {
        await pathwaysCollection.updateOne(
          { id: pathway.id },
          { $set: { steps: pathway.steps } }
        );
        fixedPathwaysCount++;
        console.log(`Updated pathway: ${pathway.title}`);
      }
    }
    
    console.log(`Fixed ${fixedStepsCount} steps across ${fixedPathwaysCount} pathways`);
    
  } catch (error) {
    console.error('Error fixing pathway IDs:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
fixPathwayIds();
