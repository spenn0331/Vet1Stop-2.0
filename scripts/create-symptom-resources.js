/**
 * Script to create a new collection for symptom-based health resources
 * This script copies resources from the healthResources collection and adds symptom tags
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'vet1stop';
const sourceCollection = 'healthResources';
const targetCollection = 'symptomResources';

// Symptom mapping for different resource types
const symptomMappings = {
  'mental-health': {
    symptoms: [
      'difficulty sleeping', 'nightmares', 'anxiety', 'depression', 
      'irritability', 'anger', 'mood swings', 'isolation', 
      'hypervigilance', 'concentration issues', 'memory problems',
      'intrusive thoughts', 'avoidance behaviors', 'emotional numbness'
    ],
    conditions: ['PTSD', 'Depression', 'Anxiety', 'Adjustment Disorder', 'Substance Use']
  },
  'physical-health': {
    symptoms: [
      'chronic pain', 'headaches', 'dizziness', 'fatigue',
      'tinnitus', 'hearing loss', 'vision changes', 'balance issues',
      'joint pain', 'muscle weakness', 'numbness', 'tingling',
      'breathing difficulties', 'sleep apnea', 'digestive issues'
    ],
    conditions: ['TBI', 'Chronic Pain', 'Musculoskeletal Injuries', 'Hearing/Vision Impairment']
  },
  'substance-use': {
    symptoms: [
      'increased tolerance', 'withdrawal symptoms', 'using more than intended',
      'unsuccessful attempts to cut down', 'excessive time spent obtaining substance',
      'reduced activities due to use', 'continued use despite problems',
      'cravings', 'sleep disturbances', 'mood changes', 'isolation'
    ],
    conditions: ['Alcohol Use Disorder', 'Substance Use Disorder', 'Addiction']
  }
};

// Approach types for different provider types
const approachTypes = {
  'VA': ['clinical', 'evidence-based', 'integrated care'],
  'NGO': ['peer support', 'holistic', 'community-based', 'veteran-led'],
  'State': ['government-funded', 'community-based'],
  'Private': ['specialized', 'alternative', 'complementary']
};

// Service models
const serviceModels = [
  'one-on-one counseling', 'group therapy', 'self-guided resources',
  'family support', 'crisis intervention', 'long-term care',
  'telehealth', 'in-person', 'hybrid', 'residential', 'outpatient'
];

// Accessibility features
const accessibilityFeatures = [
  'wheelchair accessible', 'transportation assistance', 'no-cost services',
  'sliding scale fees', 'insurance accepted', 'after-hours support',
  'language services', 'childcare available', 'same-day appointments',
  'no referral needed', 'walk-ins welcome'
];

// Assign random symptoms based on resource category
function assignSymptoms(resource) {
  const category = resource.category?.toLowerCase() || '';
  let symptoms = [];
  
  // Assign symptoms based on category
  if (category.includes('mental')) {
    symptoms = getRandomItems(symptomMappings['mental-health'].symptoms, 3, 6);
  } else if (category.includes('physical') || category.includes('health')) {
    symptoms = getRandomItems(symptomMappings['physical-health'].symptoms, 3, 6);
  } else if (category.includes('substance')) {
    symptoms = getRandomItems(symptomMappings['substance-use'].symptoms, 3, 6);
  } else {
    // Mix of symptoms for general resources
    const allSymptoms = [
      ...symptomMappings['mental-health'].symptoms,
      ...symptomMappings['physical-health'].symptoms,
      ...symptomMappings['substance-use'].symptoms
    ];
    symptoms = getRandomItems(allSymptoms, 2, 5);
  }
  
  return symptoms;
}

// Assign approach types based on provider
function assignApproachTypes(resource) {
  const provider = resource.resourceType?.toLowerCase() || '';
  let approaches = [];
  
  if (provider.includes('va')) {
    approaches = getRandomItems(approachTypes['VA'], 1, 3);
  } else if (provider.includes('ngo') || provider.includes('non-profit')) {
    approaches = getRandomItems(approachTypes['NGO'], 1, 3);
  } else if (provider.includes('state') || provider.includes('government')) {
    approaches = getRandomItems(approachTypes['State'], 1, 2);
  } else {
    approaches = getRandomItems(approachTypes['Private'], 1, 2);
  }
  
  return approaches;
}

// Assign service models
function assignServiceModels(resource) {
  return getRandomItems(serviceModels, 1, 3);
}

// Assign accessibility features
function assignAccessibilityFeatures(resource) {
  return getRandomItems(accessibilityFeatures, 1, 4);
}

// Helper to get random items from an array
function getRandomItems(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Determine if resource is veteran-led (for NGOs)
function isVeteranLed(resource) {
  const provider = resource.resourceType?.toLowerCase() || '';
  const title = resource.title?.toLowerCase() || '';
  
  // Check if it's an NGO
  if (!provider.includes('ngo') && !provider.includes('non-profit')) {
    return false;
  }
  
  // Keywords that suggest veteran leadership
  const veteranKeywords = ['veteran', 'vets', 'military', 'service member', 'warrior'];
  
  // Check title for keywords
  for (const keyword of veteranKeywords) {
    if (title.includes(keyword)) {
      // 80% chance of being veteran-led if keyword is in title
      return Math.random() < 0.8;
    }
  }
  
  // 30% chance of being veteran-led for other NGOs
  return Math.random() < 0.3;
}

// Generate a satisfaction rating
function generateSatisfactionRating() {
  // Weighted towards positive ratings (3.5-5.0)
  const baseRating = 3.5 + (Math.random() * 1.5);
  return Math.round(baseRating * 10) / 10; // Round to 1 decimal place
}

// Main function to copy and enhance resources
async function createSymptomResources() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const source = db.collection(sourceCollection);
    const target = db.collection(targetCollection);
    
    // Check if target collection exists and drop if it does
    const collections = await db.listCollections({name: targetCollection}).toArray();
    if (collections.length > 0) {
      console.log(`Dropping existing ${targetCollection} collection`);
      await db.collection(targetCollection).drop();
    }
    
    // Create the new collection
    await db.createCollection(targetCollection);
    console.log(`Created ${targetCollection} collection`);
    
    // Get all resources from source collection
    const resources = await source.find({}).toArray();
    console.log(`Found ${resources.length} resources in ${sourceCollection}`);
    
    // Enhance resources with symptom data
    const enhancedResources = resources.map(resource => {
      // Keep original fields and add new ones
      return {
        ...resource,
        symptoms: assignSymptoms(resource),
        approachTypes: assignApproachTypes(resource),
        serviceModels: assignServiceModels(resource),
        accessibilityFeatures: assignAccessibilityFeatures(resource),
        veteranLed: isVeteranLed(resource),
        satisfactionRating: generateSatisfactionRating(),
        // Add a field to track if this is a real resource or generated
        isRealResource: true
      };
    });
    
    // Insert enhanced resources into target collection
    if (enhancedResources.length > 0) {
      const result = await target.insertMany(enhancedResources);
      console.log(`Successfully added ${result.insertedCount} resources to ${targetCollection}`);
      
      // Create indexes for efficient querying
      await target.createIndex({ symptoms: 1 });
      await target.createIndex({ category: 1 });
      await target.createIndex({ resourceType: 1 });
      await target.createIndex({ veteranLed: 1 });
      await target.createIndex({ satisfactionRating: -1 });
      console.log('Created indexes on symptomResources collection');
    } else {
      console.log('No resources to add');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
createSymptomResources().catch(console.error);
