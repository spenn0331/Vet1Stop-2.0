// Script to update health resource tags in MongoDB for needs-based navigation compatibility
// This script DOES NOT delete any existing data - it only enriches resources with additional tags
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'vet1stop';
const collectionName = 'healthResources'; // The main collection with 192 resources

// Categories and keywords for tag enrichment
const tagCategories = {
  'Mental Health': [
    'mental health', 'ptsd', 'trauma', 'stress', 'anxiety', 'depression', 'counseling', 
    'therapy', 'therapist', 'psychological', 'psychiatry', 'psychiatric', 'mental illness',
    'suicide', 'crisis', 'addiction', 'substance abuse', 'alcohol', 'drugs', 'recovery',
    'support group', 'peer support', 'emotional', 'grief', 'bereavement', 'loss'
  ],
  'Primary Care': [
    'primary care', 'doctor', 'physician', 'clinic', 'medical', 'healthcare', 'health care',
    'checkup', 'check-up', 'physical', 'exam', 'screening', 'prevention', 'wellness',
    'family medicine', 'general practice', 'health', 'hospital', 'urgent care'
  ],
  'Specialty Care': [
    'specialty', 'specialist', 'cardiology', 'heart', 'orthopedic', 'bone', 'joint',
    'neurology', 'brain', 'spine', 'dermatology', 'skin', 'oncology', 'cancer',
    'gastroenterology', 'digestive', 'endocrinology', 'diabetes', 'urology',
    'nephrology', 'kidney', 'pulmonology', 'lung', 'respiratory', 'ent', 'ear', 'nose', 'throat'
  ],
  'Disability': [
    'disability', 'disabled', 'impairment', 'accommodation', 'adaptive', 'assistive technology',
    'mobility', 'wheelchair', 'prosthetic', 'hearing', 'vision', 'blind', 'deaf', 'amputation',
    'paralysis', 'tbi', 'traumatic brain injury', 'spinal cord', 'accessibility'
  ],
  'Women\'s Health': [
    'women', 'female', 'gynecology', 'obstetrics', 'obgyn', 'pregnancy', 'prenatal',
    'postnatal', 'maternity', 'breast', 'cervical', 'ovarian', 'uterine'
  ],
  'Caregiver Support': [
    'caregiver', 'caregiving', 'family caregiver', 'care coordination', 'respite',
    'home care', 'assisted living', 'nursing home', 'long-term care'
  ]
};

async function updateHealthResourceTags() {
  console.log('Connecting to MongoDB...');
  
  if (!uri) {
    console.error('MongoDB URI not configured. Check your .env.local file.');
    return;
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    // Get all health resources
    const resources = await collection.find({}).toArray();
    console.log(`Found ${resources.length} health resources to process`);
    
    // Track statistics for reporting
    const stats = {
      totalResources: resources.length,
      resourcesUpdated: 0,
      tagsAdded: 0,
      resourcesWithExistingTags: 0,
      resourcesWithoutTags: 0
    };
    
    // Process each resource
    for (const resource of resources) {
      // Check if resource already has tags
      let tags = resource.tags || [];
      
      // If tags is a string, convert to array
      if (typeof tags === 'string') {
        tags = [tags];
      }
      
      // Ensure tags is an array
      if (!Array.isArray(tags)) {
        tags = [];
      }
      
      // Track if this resource already had tags
      if (tags.length > 0) {
        stats.resourcesWithExistingTags++;
      } else {
        stats.resourcesWithoutTags++;
      }
      
      // Create a set to track unique tags (case-insensitive)
      const existingTags = new Set(tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : String(tag)));
      const initialTagCount = existingTags.size;
      
      // Get text content for keyword matching
      const title = (resource.title || resource.name || '').toLowerCase();
      const description = (resource.description || '').toLowerCase();
      const content = `${title} ${description}`;
      
      // Add category tags if present and not already tagged
      if (resource.category && typeof resource.category === 'string') {
        const categoryTag = resource.category.trim();
        if (categoryTag && !existingTags.has(categoryTag.toLowerCase())) {
          existingTags.add(categoryTag.toLowerCase());
          tags.push(categoryTag);
        }
      }
      
      if (resource.healthType && typeof resource.healthType === 'string') {
        const healthTypeTag = resource.healthType.trim();
        if (healthTypeTag && !existingTags.has(healthTypeTag.toLowerCase())) {
          existingTags.add(healthTypeTag.toLowerCase());
          tags.push(healthTypeTag);
        }
      }
      
      // Scan content for keywords from tag categories
      for (const [category, keywords] of Object.entries(tagCategories)) {
        let categoryAdded = false;
        
        for (const keyword of keywords) {
          if (content.includes(keyword.toLowerCase())) {
            // Add keyword as tag if not already present
            if (!existingTags.has(keyword.toLowerCase())) {
              existingTags.add(keyword.toLowerCase());
              tags.push(keyword);
            }
            
            // Add the category as tag if not already present
            if (!categoryAdded && !existingTags.has(category.toLowerCase())) {
              existingTags.add(category.toLowerCase());
              tags.push(category);
              categoryAdded = true;
            }
          }
        }
      }
      
      // Calculate tags added
      const tagsAdded = existingTags.size - initialTagCount;
      stats.tagsAdded += tagsAdded;
      
      // Update the resource if tags were added
      if (tagsAdded > 0) {
        await collection.updateOne(
          { _id: resource._id },
          { $set: { tags: tags } }
        );
        stats.resourcesUpdated++;
      }
    }
    
    // Report results
    console.log('\n==== TAG UPDATE SUMMARY ====');
    console.log(`Total resources processed: ${stats.totalResources}`);
    console.log(`Resources already having tags: ${stats.resourcesWithExistingTags}`);
    console.log(`Resources without any tags: ${stats.resourcesWithoutTags}`);
    console.log(`Resources updated with new tags: ${stats.resourcesUpdated}`);
    console.log(`Total tags added: ${stats.tagsAdded}`);
    console.log('\nTag update completed successfully!');
    
  } catch (err) {
    console.error('Error updating health resource tags:', err);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the update
updateHealthResourceTags().catch(console.error);
