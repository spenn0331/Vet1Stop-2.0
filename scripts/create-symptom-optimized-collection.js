/**
 * Script to create a symptom-optimized collection in MongoDB
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Copies resources from healthResources to a new symptomResources collection
 * 3. Enhances resources with additional symptom-related tags and metadata
 * 4. Creates appropriate indexes for optimized querying
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'vet1stop';
const SOURCE_COLLECTION = 'healthResources';
const TARGET_COLLECTION = 'symptomResources';

// Category mapping for resources
const categoryMapping = {
  'mental-health': ['anxiety', 'depression', 'ptsd', 'stress', 'substance-use', 'counseling', 'therapy'],
  'physical-health': ['chronic-pain', 'mobility', 'rehabilitation', 'primary-care', 'specialty-care'],
  'preventive-care': ['wellness', 'screening', 'vaccination', 'nutrition', 'fitness'],
  'specialized-care': ['traumatic-brain-injury', 'spinal-cord', 'prosthetics', 'audiology', 'vision'],
  'benefits': ['eligibility', 'enrollment', 'claims', 'coverage', 'community-care']
};

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

// Function to determine resource category based on content
function determineResourceCategory(resource) {
  // Default to the existing category if available
  if (resource.category) {
    return resource.category;
  }
  
  // Check title and description for category keywords
  const content = `${resource.title} ${resource.description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryMapping)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      return category;
    }
  }
  
  // Default to general health if no category detected
  return 'general-health';
}

// Function to identify symptom tags from resource content
function identifySymptomTags(resource) {
  const content = `${resource.title} ${resource.description}`.toLowerCase();
  const existingTags = resource.tags || [];
  const newTags = new Set(existingTags);
  
  // Check for each symptom keyword
  for (const [symptomId, keywords] of Object.entries(symptomKeywords)) {
    if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
      newTags.add(symptomId);
    }
  }
  
  return Array.from(newTags);
}

// Function to enhance a resource with symptom-related metadata
function enhanceResource(resource) {
  // Create a new object with the original resource properties
  const enhancedResource = {
    ...resource,
    
    // Ensure ID field exists
    id: resource.id || resource._id.toString(),
    
    // Determine category if not already present
    category: determineResourceCategory(resource),
    
    // Enhance tags with symptom-related keywords
    tags: identifySymptomTags(resource),
    
    // Ensure featured flag exists (using either isFeatured or featured)
    featured: resource.featured || resource.isFeatured || false,
    
    // Add timestamp for when the resource was optimized
    optimizedAt: new Date(),
    
    // Add a flag to indicate this is a symptom-optimized resource
    isSymptomOptimized: true
  };
  
  // Remove MongoDB _id field to avoid duplication
  delete enhancedResource._id;
  
  return enhancedResource;
}

// Main function to create the symptom-optimized collection
async function createSymptomOptimizedCollection() {
  console.log('Creating symptom-optimized collection...');
  
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }
  
  // Create MongoDB client
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    // Get database and collections
    const db = client.db(DB_NAME);
    const sourceCollection = db.collection(SOURCE_COLLECTION);
    
    // Check if target collection exists and drop it if it does
    const collections = await db.listCollections({ name: TARGET_COLLECTION }).toArray();
    if (collections.length > 0) {
      console.log(`Dropping existing ${TARGET_COLLECTION} collection...`);
      await db.collection(TARGET_COLLECTION).drop();
    }
    
    // Create the target collection
    const targetCollection = db.collection(TARGET_COLLECTION);
    
    // Get all resources from the source collection
    console.log(`Fetching resources from ${SOURCE_COLLECTION}...`);
    const resources = await sourceCollection.find({}).toArray();
    console.log(`Found ${resources.length} resources in ${SOURCE_COLLECTION}`);
    
    if (resources.length === 0) {
      console.error('Error: No resources found in source collection');
      process.exit(1);
    }
    
    // Enhance each resource with symptom-related metadata
    console.log('Enhancing resources with symptom-related metadata...');
    const enhancedResources = resources.map(enhanceResource);
    
    // Insert enhanced resources into the target collection
    console.log(`Inserting ${enhancedResources.length} enhanced resources into ${TARGET_COLLECTION}...`);
    const result = await targetCollection.insertMany(enhancedResources);
    console.log(`Successfully inserted ${result.insertedCount} resources`);
    
    // Create indexes for optimized querying
    console.log('Creating indexes for optimized querying...');
    await targetCollection.createIndex({ tags: 1 });
    await targetCollection.createIndex({ category: 1 });
    await targetCollection.createIndex({ featured: 1 });
    await targetCollection.createIndex({ title: "text", description: "text" });
    console.log('Indexes created successfully');
    
    // Verify the new collection
    const count = await targetCollection.countDocuments();
    console.log(`Verification: ${TARGET_COLLECTION} now contains ${count} resources`);
    
    // Show sample resource
    const sample = await targetCollection.findOne({});
    console.log('\nSample enhanced resource:');
    console.log(JSON.stringify(sample, null, 2));
    
    console.log('\nSymptom-optimized collection created successfully!');
  } catch (error) {
    console.error('Error creating symptom-optimized collection:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createSymptomOptimizedCollection().catch(console.error);
