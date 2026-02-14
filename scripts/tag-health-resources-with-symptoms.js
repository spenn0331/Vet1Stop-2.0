/**
 * Script to tag existing health resources with symptom-related keywords
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Retrieves all health resources
 * 3. Analyzes each resource's title, description, and existing tags
 * 4. Adds symptom-related tags based on content analysis
 * 5. Updates the resources in the database
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB || 'vet1stop';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'healthResources';

// Symptom keywords mapping
const symptomKeywords = {
  // Mental health symptoms
  'anxiety': ['anxiety', 'anxious', 'worry', 'panic', 'stress', 'nervous'],
  'depression': ['depression', 'depressed', 'sad', 'hopeless', 'mood', 'grief'],
  'ptsd': ['ptsd', 'trauma', 'traumatic', 'flashback', 'nightmare'],
  'sleep-issues': ['insomnia', 'sleep', 'nightmare', 'rest', 'fatigue'],
  'anger': ['anger', 'angry', 'irritable', 'rage', 'irritability'],
  'hypervigilance': ['hypervigilance', 'alert', 'on edge', 'jumpy', 'startle'],
  'concentration': ['concentration', 'focus', 'attention', 'memory', 'cognitive'],
  'isolation': ['isolation', 'lonely', 'withdraw', 'social', 'alone'],
  
  // Physical symptoms
  'chronic-pain': ['pain', 'chronic', 'ache', 'discomfort', 'persistent pain'],
  'headaches': ['headache', 'migraine', 'head pain', 'tension headache'],
  'dizziness': ['dizzy', 'dizziness', 'vertigo', 'balance', 'equilibrium'],
  'fatigue': ['fatigue', 'tired', 'exhaustion', 'energy', 'lethargy'],
  'tinnitus': ['tinnitus', 'ringing', 'ears', 'hearing', 'noise'],
  'vision': ['vision', 'sight', 'eye', 'visual', 'blur'],
  
  // Behavioral symptoms
  'substance-use': ['substance', 'alcohol', 'drug', 'addiction', 'dependence', 'recovery'],
  'risk-taking': ['risk', 'impulsive', 'reckless', 'dangerous', 'thrill'],
  'avoidance': ['avoid', 'avoidance', 'escape', 'withdrawal', 'hiding'],
  'relationship': ['relationship', 'marriage', 'family', 'interpersonal', 'social']
};

// Severity levels
const severityTags = {
  'low': ['self-help', 'wellness', 'prevention', 'mild', 'peer support'],
  'medium': ['counseling', 'therapy', 'treatment', 'support group'],
  'high': ['clinical', 'professional', 'intensive', 'crisis', 'emergency', 'inpatient']
};

// Duration-related tags
const durationTags = {
  'recent': ['immediate', 'crisis', 'urgent', 'acute', 'new onset'],
  'months': ['short-term', 'developing', 'recent onset'],
  'years': ['chronic', 'long-term', 'persistent', 'ongoing'],
  'since-service': ['service-connected', 'military-related', 'veteran-specific']
};

// Support type tags
const supportTypeTags = {
  'va': ['va', 'veterans affairs', 'federal', 'government'],
  'ngo': ['ngo', 'non-profit', 'nonprofit', 'organization', 'foundation'],
  'peer': ['peer support', 'veteran-led', 'peer-to-peer', 'community support'],
  'community': ['community', 'local', 'civilian', 'private']
};

// Function to analyze text and identify matching symptom tags
function identifySymptomTags(text, resource) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const matchedTags = [];
  
  // Check for each symptom keyword
  for (const [symptomId, keywords] of Object.entries(symptomKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      matchedTags.push(symptomId);
    }
  }
  
  // Check for severity indicators
  for (const [severity, keywords] of Object.entries(severityTags)) {
    if (keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
      matchedTags.push(severity);
    }
  }
  
  // Check resource type for support type tags
  if (resource.resourceType) {
    const resourceType = resource.resourceType.toLowerCase();
    
    if (/va|veterans affairs|federal/.test(resourceType)) {
      matchedTags.push('va');
    } else if (/ngo|non-profit|nonprofit|organization|foundation/.test(resourceType)) {
      matchedTags.push('ngo');
    }
  }
  
  // Check if resource is veteran-led
  if (resource.veteranLed) {
    matchedTags.push('peer support');
    matchedTags.push('veteran-led');
  }
  
  return matchedTags;
}

// Main function to process all resources
async function tagHealthResources() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get all health resources
    const resources = await collection.find({}).toArray();
    console.log(`Found ${resources.length} health resources to process`);
    
    let updatedCount = 0;
    
    // Process each resource
    for (const resource of resources) {
      // Initialize tags array if it doesn't exist
      const currentTags = resource.tags || [];
      const newTags = new Set(currentTags);
      
      // Analyze title and description
      const titleTags = identifySymptomTags(resource.title, resource);
      const descriptionTags = identifySymptomTags(resource.description, resource);
      
      // Add all identified tags to the set
      [...titleTags, ...descriptionTags].forEach(tag => newTags.add(tag));
      
      // Convert set back to array
      const updatedTags = Array.from(newTags);
      
      // Only update if tags have changed
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(updatedTags.sort())) {
        await collection.updateOne(
          { _id: resource._id },
          { $set: { tags: updatedTags } }
        );
        updatedCount++;
        console.log(`Updated resource: ${resource.title}`);
        console.log(`Added tags: ${updatedTags.filter(tag => !currentTags.includes(tag)).join(', ')}`);
      }
    }
    
    console.log(`Updated ${updatedCount} resources with symptom tags`);
    
  } catch (error) {
    console.error('Error tagging health resources:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the script
tagHealthResources()
  .then(() => console.log('Finished tagging health resources'))
  .catch(err => console.error('Script failed:', err));
