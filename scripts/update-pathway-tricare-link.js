/**
 * Script to update the Military Healthcare Pathway with TRICARE link for transferring records
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function updateTransferRecordsStep() {
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

    // Find the Military Healthcare pathway
    const pathway = await pathwaysCollection.findOne({ 
      title: { $regex: /military healthcare/i }
    });
    
    if (!pathway) {
      console.log('Military Healthcare pathway not found');
      return;
    }
    
    console.log(`Found pathway: ${pathway.title}`);
    
    // Find the transfer medical records step
    const transferStepIndex = pathway.steps.findIndex(step => 
      step.id.includes('transfer-medical-records') || 
      step.title.toLowerCase().includes('transfer') ||
      step.title.toLowerCase().includes('medical records')
    );
    
    if (transferStepIndex === -1) {
      console.log('Transfer medical records step not found in pathway');
      return;
    }
    
    // Get the transfer step
    const transferStep = pathway.steps[transferStepIndex];
    console.log(`Found transfer step: ${transferStep.title}`);
    
    // Check if detailed content exists
    if (!transferStep.detailedContent) {
      console.log('No detailed content found for transfer step');
      return;
    }
    
    // Add TRICARE link to transfer step content
    let updatedContent = transferStep.detailedContent;
    
    // Check if the link already exists
    if (updatedContent.includes('tricare.mil/PatientResources/MedicalRecords/TransfertoVA')) {
      console.log('TRICARE link already exists in content');
      return;
    }
    
    // Find the appropriate location to add the link
    // Look for VA form or release of information mentions
    if (updatedContent.includes('VA Form 10-5345') || updatedContent.includes('release of information')) {
      // Add TRICARE link next to the VA release of information link
      updatedContent = updatedContent.replace(
        /(VA Form 10-5345|release of information)/gi,
        match => `${match} and visit <a href="https://tricare.mil/PatientResources/MedicalRecords/TransfertoVA" target="_blank" rel="noopener noreferrer" class="va-form-link">TRICARE's Transfer to VA process</a>`
      );
    } else {
      // If no specific mention is found, add it to a logical place
      // Look for transfer or records mentions
      updatedContent = updatedContent.replace(
        /(transfer.{1,40}records|medical records)/i,
        match => `${match} using <a href="https://tricare.mil/PatientResources/MedicalRecords/TransfertoVA" target="_blank" rel="noopener noreferrer" class="va-form-link">TRICARE's Transfer to VA process</a>`
      );
    }
    
    // Update the pathway step with the new content
    await pathwaysCollection.updateOne(
      { _id: pathway._id, "steps.id": transferStep.id },
      { $set: { "steps.$.detailedContent": updatedContent } }
    );
    
    console.log('Successfully added TRICARE link to Transfer Medical Records step');
    
  } catch (error) {
    console.error('Error updating transfer records step:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
updateTransferRecordsStep();
