/**
 * MongoDB Resource Backup and Standardization Script
 * 
 * This script:
 * 1. Creates backups of all MongoDB collections
 * 2. Standardizes resource schemas across collections
 * 3. Ensures data consistency for filtering and searching
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connection URI from environment variables
const uri = process.env.MONGODB_URI;

// Create timestamp for backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, 'backups');
const backupPath = path.join(backupDir, `backup-${timestamp}`);

async function backupAndStandardize() {
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  console.log('Starting resource backup and standardization process...');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const database = client.db('test');
    
    // Collections we'll be working with
    const collectionNames = ['resources', 'healthResources', 'educationResources', 'lifeLeisureResources'];
    const collections = {};
    collectionNames.forEach(name => {
      collections[name] = database.collection(name);
    });
    
    // Step 1: Create backups
    console.log('\nStep 1: Creating backups...');
    await createBackups(collections);
    
    // Step 2: Standardize resources
    console.log('\nStep 2: Standardizing resources...');
    
    // Get initial counts for verification
    const initialCounts = {};
    for (const name of collectionNames) {
      initialCounts[name] = await collections[name].countDocuments();
      console.log(`- ${name}: ${initialCounts[name]} documents`);
    }
    
    // Process each collection
    for (const name of collectionNames) {
      console.log(`\nProcessing ${name} collection...`);
      const resources = await collections[name].find({}).toArray();
      console.log(`Found ${resources.length} documents to standardize`);
      
      let standardizedCount = 0;
      for (const resource of resources) {
        const standardized = standardizeResourceDocument(resource);
        await collections[name].updateOne(
          { _id: resource._id },
          { $set: standardized }
        );
        standardizedCount++;
        
        if (standardizedCount % 10 === 0) {
          console.log(`Standardized ${standardizedCount}/${resources.length} documents...`);
        }
      }
      
      console.log(`Standardized all ${standardizedCount} documents in ${name} collection`);
    }
    
    // Verify counts after standardization
    console.log('\nVerifying document counts after standardization:');
    for (const name of collectionNames) {
      const finalCount = await collections[name].countDocuments();
      console.log(`- ${name}: ${finalCount} documents (initial: ${initialCounts[name]})`);
      if (finalCount !== initialCounts[name]) {
        console.error(`WARNING: Document count mismatch in ${name} collection!`);
      }
    }
    
    // Validate the standardized schema
    console.log('\nValidating standardized schema...');
    for (const name of collectionNames) {
      await validateResourceSchema(collections[name], name);
    }
    
    console.log('\nResource standardization completed successfully!');
    
  } catch (error) {
    console.error('Error during resource standardization:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

/**
 * Creates backups of all collections
 */
async function createBackups(collections) {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    console.log(`Creating backups in: ${backupPath}`);
    
    // Backup each collection
    for (const [name, collection] of Object.entries(collections)) {
      console.log(`Backing up ${name} collection...`);
      const documents = await collection.find({}).toArray();
      
      if (documents.length > 0) {
        const filePath = path.join(backupPath, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        console.log(`- Backed up ${documents.length} documents to ${filePath}`);
      } else {
        console.log(`- No documents found in ${name} collection`);
      }
    }
    
    console.log('All backups created successfully');
    return true;
  } catch (error) {
    console.error('Error creating backups:', error);
    return false;
  }
}

/**
 * Standardizes a resource document to follow consistent schema
 */
function standardizeResourceDocument(resource) {
  // Create a new object with standardized fields
  const standardized = {
    // Basic information
    title: resource.title || resource.name || resource.resourceName || 'Untitled Resource',
    description: resource.description || resource.summary || resource.resourceDescription || '',
    
    // Categorization
    category: standardizeCategory(resource),
    subcategory: resource.subcategory || '',
    resourceType: resource.resourceType || resource.type || 'General',
    
    // Contact information
    contact: {
      phone: resource.phone || resource.contactPhone || '',
      email: resource.email || resource.contactEmail || '',
      website: resource.website || resource.url || '',
    },
    
    // Location information
    location: {
      address: resource.address || '',
      city: resource.city || '',
      state: resource.state || '',
      zipCode: resource.zipCode || resource.zip || '',
      coordinates: resource.coordinates || null,
    },
    
    // Eligibility criteria
    eligibility: resource.eligibility || resource.requirements || '',
    veteranType: ensureArray(resource.veteranType || resource.forVeteranType || []),
    serviceBranch: ensureArray(resource.serviceBranch || resource.branch || []),
    
    // Additional metadata
    tags: standardizeTags(resource),
    isFeatured: resource.isFeatured || false,
    lastUpdated: resource.lastUpdated || new Date(),
    
    // Preserve original data
    originalData: {
      ...resource
    }
  };
  
  // Preserve the original _id
  if (resource._id) {
    standardized._id = resource._id;
  }
  
  return standardized;
}

/**
 * Ensures a field is always returned as an array
 */
function ensureArray(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  return [field];
}

/**
 * Standardizes the category field
 */
function standardizeCategory(resource) {
  // First check for explicit category
  if (resource.category) {
    return resource.category;
  }
  
  // Determine from collection or type
  if (resource.resourceType === 'Health' || resource.type === 'Health') {
    return 'Health';
  } else if (resource.resourceType === 'Education' || resource.type === 'Education') {
    return 'Education';
  } else if (
    resource.resourceType === 'Life and Leisure' || 
    resource.type === 'Life and Leisure' ||
    resource.resourceType === 'Life & Leisure' || 
    resource.type === 'Life & Leisure'
  ) {
    return 'Life and Leisure';
  }
  
  // Check for keywords in title or description
  const content = `${resource.title || ''} ${resource.description || ''}`.toLowerCase();
  
  if (content.includes('health') || content.includes('medical') || content.includes('hospital') || content.includes('doctor')) {
    return 'Health';
  } else if (content.includes('education') || content.includes('school') || content.includes('college') || content.includes('university')) {
    return 'Education';
  } else if (content.includes('leisure') || content.includes('recreation') || content.includes('hobby') || content.includes('activity')) {
    return 'Life and Leisure';
  }
  
  // Default
  return 'General';
}

/**
 * Standardizes tags for a resource
 */
function standardizeTags(resource) {
  // Start with any existing tags
  let tags = ensureArray(resource.tags);
  
  // Add any keywords
  if (resource.keywords) {
    const keywords = ensureArray(resource.keywords);
    tags = [...tags, ...keywords];
  }
  
  // Add category and subcategory as tags if not already present
  const category = standardizeCategory(resource);
  if (category && !tags.includes(category)) {
    tags.push(category);
  }
  
  if (resource.subcategory && !tags.includes(resource.subcategory)) {
    tags.push(resource.subcategory);
  }
  
  // Remove duplicates and empty strings
  return [...new Set(tags)].filter(tag => tag.trim() !== '');
}

/**
 * Validates that resources adhere to the expected schema
 */
async function validateResourceSchema(collection, collectionName) {
  const sampleSize = 5;
  const samples = await collection.find({}).limit(sampleSize).toArray();
  
  console.log(`Validating schema for ${collectionName} collection (${samples.length} samples):`);
  
  if (samples.length === 0) {
    console.log(`- No documents found in ${collectionName} collection`);
    return;
  }
  
  let validCount = 0;
  for (const sample of samples) {
    let isValid = true;
    
    // Check for required fields
    const requiredFields = ['title', 'description', 'category'];
    for (const field of requiredFields) {
      if (!sample[field]) {
        console.log(`- Missing required field '${field}' in document ${sample._id}`);
        isValid = false;
      }
    }
    
    // Check nested objects
    const nestedObjects = ['contact', 'location'];
    for (const obj of nestedObjects) {
      if (!sample[obj] || typeof sample[obj] !== 'object') {
        console.log(`- Invalid or missing '${obj}' object in document ${sample._id}`);
        isValid = false;
      }
    }
    
    // Check array fields
    const arrayFields = ['tags', 'veteranType', 'serviceBranch'];
    for (const field of arrayFields) {
      if (!Array.isArray(sample[field])) {
        console.log(`- '${field}' is not an array in document ${sample._id}`);
        isValid = false;
      }
    }
    
    if (isValid) {
      validCount++;
    }
  }
  
  console.log(`- ${validCount}/${samples.length} samples passed validation`);
  
  if (validCount === samples.length) {
    console.log(`- All validated documents in ${collectionName} follow the standardized schema`);
  } else {
    console.warn(`- Some documents in ${collectionName} may not follow the standardized schema`);
  }
}

// Run the backup and standardization process
backupAndStandardize()
  .then(() => {
    console.log('Backup and standardization process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in backup and standardization process:', error);
    process.exit(1);
  });
