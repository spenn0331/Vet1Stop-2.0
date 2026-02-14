/**
 * MongoDB Resource Standardization Script
 * 
 * This script standardizes the schema for all resources in the MongoDB database,
 * ensuring consistent field names and data structures across health, education,
 * and life/leisure resources.
 * 
 * IMPORTANT: Always back up data before running this script.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Connection URI from environment variables
const uri = process.env.MONGODB_URI;

async function standardizeResources() {
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  console.log('Starting resource standardization process...');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('test');
    
    // Collections we'll be working with
    const resourcesCollection = database.collection('resources');
    const healthResourcesCollection = database.collection('healthResources');
    const educationResourcesCollection = database.collection('educationResources');
    const lifeLeisureResourcesCollection = database.collection('lifeLeisureResources');
    
    // 1. First get total counts to verify at end
    const originalResourcesCount = await resourcesCollection.countDocuments();
    const originalHealthCount = await healthResourcesCollection.countDocuments();
    const originalEducationCount = await educationResourcesCollection.countDocuments();
    const originalLifeLeisureCount = await lifeLeisureResourcesCollection.countDocuments();
    
    console.log('Initial document counts:');
    console.log(`- Main resources: ${originalResourcesCount}`);
    console.log(`- Health resources: ${originalHealthCount}`);
    console.log(`- Education resources: ${originalEducationCount}`);
    console.log(`- Life & Leisure resources: ${originalLifeLeisureCount}`);
    
    // 2. Process main resources collection first
    console.log('\nProcessing main resources collection...');
    const allResources = await resourcesCollection.find({}).toArray();
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const resource of allResources) {
      try {
        // Build standardized document
        const standardized = standardizeResourceDocument(resource);
        
        // Update the resource document
        await resourcesCollection.updateOne(
          { _id: resource._id }, 
          { $set: standardized }
        );
        
        // Also update the specific collection based on category
        const category = standardized.category.toLowerCase();
        
        if (category === 'health') {
          await healthResourcesCollection.updateOne(
            { _id: resource._id }, 
            { $set: standardized }, 
            { upsert: true }
          );
        } else if (category === 'education') {
          await educationResourcesCollection.updateOne(
            { _id: resource._id }, 
            { $set: standardized }, 
            { upsert: true }
          );
        } else if (category === 'life' || category === 'leisure' || category === 'life and leisure') {
          await lifeLeisureResourcesCollection.updateOne(
            { _id: resource._id }, 
            { $set: standardized }, 
            { upsert: true }
          );
        }
        
        successCount++;
        
        // Logging progress
        if (successCount % 20 === 0) {
          console.log(`Processed ${successCount} resources...`);
        }
      } catch (err) {
        console.error(`Error processing resource ${resource._id}:`, err);
        errorCount++;
      }
    }
    
    // 3. Validate the results
    const newResourcesCount = await resourcesCollection.countDocuments();
    const newHealthCount = await healthResourcesCollection.countDocuments();
    const newEducationCount = await educationResourcesCollection.countDocuments();
    const newLifeLeisureCount = await lifeLeisureResourcesCollection.countDocuments();
    
    console.log('\nMigration completed:');
    console.log(`- Successfully processed: ${successCount} resources`);
    console.log(`- Errors encountered: ${errorCount} resources`);
    
    console.log('\nFinal document counts:');
    console.log(`- Main resources: ${newResourcesCount} (was ${originalResourcesCount})`);
    console.log(`- Health resources: ${newHealthCount} (was ${originalHealthCount})`);
    console.log(`- Education resources: ${newEducationCount} (was ${originalEducationCount})`);
    console.log(`- Life & Leisure resources: ${newLifeLeisureCount} (was ${originalLifeLeisureCount})`);
    
    // 4. Perform schema validation
    console.log('\nPerforming schema validation checks...');
    await validateResourceSchema(resourcesCollection);
    
  } catch (err) {
    console.error('Error in standardization process:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

/**
 * Standardizes a resource document to the new schema
 */
function standardizeResourceDocument(resource) {
  return {
    // Preserve original ID
    _id: resource._id,
    id: resource.id || resource._id.toString(),
    
    // Core information
    title: resource.title || resource.name || "",
    description: resource.description || "",
    summary: resource.summary || resource.shortDescription || "",
    
    // Categorization
    category: standardizeCategory(resource),
    subcategory: resource.subcategory || "",
    resourceType: resource.resourceType || resource.type || "",
    
    // Contact info
    link: resource.link || resource.url || resource.website || "",
    contact: {
      phone: resource.contact || resource.phone || 
            (resource.contactInfo ? resource.contactInfo.phone : "") || "",
      email: resource.email || 
            (resource.contactInfo ? resource.contactInfo.email : "") || "",
      website: resource.website || 
              (resource.contactInfo ? resource.contactInfo.website : "") || 
              resource.link || resource.url || ""
    },
    
    // Location
    location: {
      state: resource.state || resource.location || "National",
      city: resource.city || "",
      address: resource.address || ""
    },
    
    // Arrays should always be arrays
    eligibility: ensureArray(resource.eligibility),
    veteranType: ensureArray(resource.veteranType),
    serviceBranch: ensureArray(resource.serviceBranch || resource.branch),
    tags: standardizeTags(resource),
    
    // Metadata
    featured: resource.featured || false,
    rating: resource.rating || 0,
    reviewCount: resource.reviews || 0,
    createdAt: resource.createdAt || resource.dateAdded || new Date(),
    updatedAt: resource.updatedAt || resource.dateUpdated || new Date(),
    sourceOrganization: resource.sourceName || resource.organization || ""
  };
}

/**
 * Ensures a field is always returned as an array
 */
function ensureArray(field) {
  if (!field) return [];
  return Array.isArray(field) ? field : [field];
}

/**
 * Standardizes the category field
 */
function standardizeCategory(resource) {
  // Try to get category from various fields
  let category = resource.category || resource.healthType || resource.educationType || '';
  
  // Normalize to one of our main categories
  category = category.toLowerCase();
  
  if (category.includes('health') || category.includes('medical') || 
      category.includes('mental') || category.includes('wellness')) {
    return 'Health';
  } 
  else if (category.includes('edu') || category.includes('learn') || 
           category.includes('train') || category.includes('school') || 
           category.includes('college')) {
    return 'Education';  
  }
  else if (category.includes('life') || category.includes('leisure') || 
           category.includes('recreation') || category.includes('hobby')) {
    return 'Life and Leisure';
  }
  else {
    // Default to the original value if we can't categorize
    return resource.category || "Uncategorized";
  }
}

/**
 * Standardizes tags for a resource
 */
function standardizeTags(resource) {
  let tags = ensureArray(resource.tags);
  
  // Add category and subcategory as tags if not already there
  if (resource.category) {
    tags.push(resource.category.toLowerCase());
  }
  if (resource.subcategory) {
    tags.push(resource.subcategory.toLowerCase());
  }
  if (resource.healthType) {
    tags.push(resource.healthType.toLowerCase());
  }
  
  // Normalize and deduplicate tags
  tags = tags.map(tag => typeof tag === 'string' ? tag.toLowerCase().trim() : '');
  return [...new Set(tags)].filter(Boolean);
}

/**
 * Validates that resources adhere to the expected schema
 */
async function validateResourceSchema(collection) {
  // Check for resources missing required fields
  const missingRequired = await collection.countDocuments({
    $or: [
      { title: { $exists: false } },
      { description: { $exists: false } },
      { category: { $exists: false } }
    ]
  });
  
  console.log(`Resources missing required fields: ${missingRequired}`);
  
  // Check for non-array fields that should be arrays
  const nonArrayFields = await collection.countDocuments({
    $or: [
      { tags: { $exists: true, $not: { $type: "array" } } },
      { eligibility: { $exists: true, $not: { $type: "array" } } },
      { veteranType: { $exists: true, $not: { $type: "array" } } },
      { serviceBranch: { $exists: true, $not: { $type: "array" } } }
    ]
  });
  
  console.log(`Resources with non-array fields: ${nonArrayFields}`);
  
  if (missingRequired === 0 && nonArrayFields === 0) {
    console.log('Schema validation passed! All resources have the required fields in the correct format.');
  } else {
    console.log('Schema validation found issues that need to be addressed.');
  }
}

// Run the script
standardizeResources()
  .then(() => {
    console.log('Resource standardization completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Resource standardization failed:', error);
    process.exit(1);
  });
