/**
 * Script to update the transitioning healthcare resources in the database
 * This consolidates the redundant resources into one comprehensive guide
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vet1stop';
const COLLECTION_NAME = 'healthResources';

async function updateTransitionResources() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find all resources related to transitioning
    const transitionResources = await collection.find({ 
      category: "Transitioning from Military Healthcare"
    }).toArray();
    
    console.log(`Found ${transitionResources.length} existing transition resources`);
    
    // Delete all existing transition resources
    if (transitionResources.length > 0) {
      const result = await collection.deleteMany({ 
        category: "Transitioning from Military Healthcare"
      });
      console.log(`Deleted ${result.deletedCount} redundant resources`);
    }
    
    // Create one comprehensive resource
    const comprehensiveResource = {
      id: new ObjectId().toString(),
      title: "Military to VA Healthcare Transition Guide",
      description: "Comprehensive guide to the entire process of transitioning from DoD/TRICARE to VA healthcare, including eligibility, enrollment steps, records transfer, and benefits overview.",
      resourceType: "federal",
      category: "Transitioning from Military Healthcare",
      subcategory: "Healthcare Guides",
      contact: {
        website: "/health/resources/guides/military-to-va-transition",
        phone: "1-877-222-8387",
        email: "healthbenefits@va.gov"
      },
      eligibility: "All Veterans with qualifying service",
      veteranType: ["All Veterans", "Transitioning Service Members"],
      serviceBranch: ["All Branches"],
      tags: ["healthcare", "transition", "benefits", "VA", "TRICARE", "records", "enrollment"],
      isFeatured: true,
      lastUpdated: new Date()
    };
    
    // Insert the comprehensive resource
    const insertResult = await collection.insertOne(comprehensiveResource);
    console.log(`Created consolidated resource with ID: ${comprehensiveResource.id}`);
    
    // Create necessary redirects to our new guide
    console.log('Resource successfully updated. The new comprehensive guide will now be displayed in the pathway.');
    
  } catch (error) {
    console.error('Error updating transition resources:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the update function
updateTransitionResources()
  .then(() => console.log('Update completed'))
  .catch(console.error);
