/**
 * MongoDB Resource Standardization Script
 * 
 * This script performs a full backup of your MongoDB collections and then
 * standardizes all resource data to ensure consistent field names and structure.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Use the connection string directly from your existing backup script
const uri = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Create timestamp for backup
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(__dirname, 'backups');
const backupPath = path.join(backupDir, `backup-${timestamp}`);

// Log file for tracking the standardization process
const logPath = path.join(backupDir, `standardization-log-${timestamp}.txt`);
let logStream = null;

/**
 * Log message to console and log file
 */
function log(message) {
  console.log(message);
  if (logStream) {
    logStream.write(message + '\n');
  }
}

async function backupAndStandardize() {
  // Initialize log file
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  log('='.repeat(80));
  log(`STARTING RESOURCE STANDARDIZATION PROCESS - ${new Date().toLocaleString()}`);
  log('='.repeat(80));
  
  const client = new MongoClient(uri);
  
  try {
    log('\nConnecting to MongoDB...');
    await client.connect();
    log('Connected successfully to MongoDB');
    
    const database = client.db('test');
    
    // Collections we'll be working with
    const collectionNames = ['resources', 'healthResources', 'educationResources', 'lifeLeisureResources'];
    const collections = {};
    
    for (const name of collectionNames) {
      collections[name] = database.collection(name);
    }
    
    // STEP 1: Create backups
    log('\nSTEP 1: Creating backups');
    log('-'.repeat(50));
    const backupSuccess = await createBackups(collections);
    
    if (!backupSuccess) {
      throw new Error('Backup process failed. Standardization aborted for safety.');
    }
    
    // STEP 2: Get initial counts for verification
    log('\nSTEP 2: Recording initial document counts');
    log('-'.repeat(50));
    
    const initialCounts = {};
    for (const name of collectionNames) {
      initialCounts[name] = await collections[name].countDocuments();
      log(`- ${name}: ${initialCounts[name]} documents`);
    }
    
    // STEP 3: Standardize resources
    log('\nSTEP 3: Standardizing resources');
    log('-'.repeat(50));
    
    for (const name of collectionNames) {
      log(`\nProcessing ${name} collection...`);
      const resources = await collections[name].find({}).toArray();
      log(`Found ${resources.length} documents to standardize`);
      
      let standardizedCount = 0;
      const batchSize = 10;
      const batches = Math.ceil(resources.length / batchSize);
      
      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, resources.length);
        const batch = resources.slice(start, end);
        
        log(`Processing batch ${batchIndex + 1}/${batches} (documents ${start + 1}-${end})`);
        
        for (const resource of batch) {
          const standardized = standardizeResourceDocument(resource);
          
          try {
            await collections[name].updateOne(
              { _id: resource._id },
              { $set: standardized }
            );
            standardizedCount++;
          } catch (error) {
            log(`ERROR: Failed to update document ${resource._id}: ${error.message}`);
          }
        }
      }
      
      log(`Completed standardization of ${standardizedCount}/${resources.length} documents in ${name} collection`);
    }
    
    // STEP 4: Verify counts after standardization
    log('\nSTEP 4: Verifying document counts after standardization');
    log('-'.repeat(50));
    
    let allCountsMatch = true;
    for (const name of collectionNames) {
      const finalCount = await collections[name].countDocuments();
      log(`- ${name}: ${finalCount} documents (initial: ${initialCounts[name]})`);
      
      if (finalCount !== initialCounts[name]) {
        log(`WARNING: Document count mismatch in ${name} collection!`);
        allCountsMatch = false;
      }
    }
    
    if (!allCountsMatch) {
      log('\nWARNING: Some document counts do not match initial counts.');
      log('Please check the backup files and review the standardization process.');
    } else {
      log('\nAll document counts match initial counts. No data was lost.');
    }
    
    // STEP 5: Validate the standardized schema
    log('\nSTEP 5: Validating standardized schema');
    log('-'.repeat(50));
    
    for (const name of collectionNames) {
      await validateResourceSchema(collections[name], name);
    }
    
    log('\nSTANDARDIZATION PROCESS COMPLETED');
    log('='.repeat(80));
    log(`Backups stored in: ${backupPath}`);
    log(`Process log stored in: ${logPath}`);
    log('='.repeat(80));
    
  } catch (error) {
    log(`\nERROR DURING STANDARDIZATION: ${error.message}`);
    log(error.stack || 'No stack trace available');
    log('\nStandardization process aborted. Please check the log file and backups.');
    return false;
  } finally {
    if (client) {
      await client.close();
      log('\nMongoDB connection closed');
    }
    
    if (logStream) {
      logStream.end();
      logStream = null;
    }
  }
  
  return true;
}

/**
 * Creates backups of all collections
 */
async function createBackups(collections) {
  try {
    // Create backup directory
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    log(`Creating backups in: ${backupPath}`);
    
    // Backup each collection
    for (const [name, collection] of Object.entries(collections)) {
      log(`Backing up ${name} collection...`);
      const documents = await collection.find({}).toArray();
      
      if (documents.length > 0) {
        const filePath = path.join(backupPath, `${name}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        log(`- Backed up ${documents.length} documents to ${filePath}`);
      } else {
        log(`- No documents found in ${name} collection`);
      }
    }
    
    log('All backups created successfully');
    return true;
  } catch (error) {
    log(`ERROR CREATING BACKUPS: ${error.message}`);
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
      phone: resource.phone || resource.contactPhone || (resource.contact && resource.contact.phone) || '',
      email: resource.email || resource.contactEmail || (resource.contact && resource.contact.email) || '',
      website: resource.website || resource.url || (resource.contact && resource.contact.website) || '',
    },
    
    // Location information
    location: {
      address: resource.address || (resource.location && resource.location.address) || '',
      city: resource.city || (resource.location && resource.location.city) || '',
      state: resource.state || (resource.location && resource.location.state) || '',
      zipCode: resource.zipCode || resource.zip || (resource.location && resource.location.zipCode) || '',
      coordinates: resource.coordinates || (resource.location && resource.location.coordinates) || null,
    },
    
    // Eligibility criteria
    eligibility: resource.eligibility || resource.requirements || '',
    veteranType: ensureArray(resource.veteranType || resource.forVeteranType || []),
    serviceBranch: ensureArray(resource.serviceBranch || resource.branch || []),
    
    // Additional metadata
    tags: standardizeTags(resource),
    isFeatured: resource.isFeatured || false,
    lastUpdated: resource.lastUpdated || new Date(),
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
  
  log(`Validating schema for ${collectionName} collection (${samples.length} samples):`);
  
  if (samples.length === 0) {
    log(`- No documents found in ${collectionName} collection`);
    return;
  }
  
  let validCount = 0;
  for (const sample of samples) {
    let isValid = true;
    
    // Check for required fields
    const requiredFields = ['title', 'description', 'category'];
    for (const field of requiredFields) {
      if (!sample[field]) {
        log(`- Missing required field '${field}' in document ${sample._id}`);
        isValid = false;
      }
    }
    
    // Check nested objects
    const nestedObjects = ['contact', 'location'];
    for (const obj of nestedObjects) {
      if (!sample[obj] || typeof sample[obj] !== 'object') {
        log(`- Invalid or missing '${obj}' object in document ${sample._id}`);
        isValid = false;
      }
    }
    
    // Check array fields
    const arrayFields = ['tags', 'veteranType', 'serviceBranch'];
    for (const field of arrayFields) {
      if (!Array.isArray(sample[field])) {
        log(`- '${field}' is not an array in document ${sample._id}`);
        isValid = false;
      }
    }
    
    if (isValid) {
      validCount++;
    }
  }
  
  log(`- ${validCount}/${samples.length} samples passed validation`);
  
  if (validCount === samples.length) {
    log(`- All validated documents in ${collectionName} follow the standardized schema`);
  } else {
    log(`- Some documents in ${collectionName} may not follow the standardized schema`);
  }
}

// Run the backup and standardization process
backupAndStandardize()
  .then(success => {
    if (success) {
      log('Process completed successfully');
    } else {
      log('Process completed with errors');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
