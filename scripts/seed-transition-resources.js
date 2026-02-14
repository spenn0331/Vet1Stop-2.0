/**
 * Seed script for creating example resources for the Transitioning from Military Healthcare pathway
 * This ensures resources appear when using the "Find similar resources" button
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'vet1stop';
const COLLECTION_NAME = 'healthResources';

// Sample health resources for transitioning from military healthcare
const transitionResources = [
  {
    id: new ObjectId().toString(),
    title: "VA Healthcare Transition Guide",
    description: "Official guide to transitioning from military healthcare to VA benefits and services for separating service members.",
    resourceType: "federal",
    category: "Transitioning from Military Healthcare",
    subcategory: "VA Benefits",
    contact: {
      website: "https://www.va.gov/health-care/",
      phone: "1-877-222-8387",
      email: "healthbenefits@va.gov"
    },
    eligibility: "All Veterans with qualifying service",
    veteranType: ["All Veterans", "Transitioning Service Members"],
    serviceBranch: ["All Branches"],
    tags: ["healthcare", "transition", "benefits", "VA"],
    isFeatured: true,
    lastUpdated: new Date()
  },
  {
    id: new ObjectId().toString(),
    title: "TRICARE Transition Assistance",
    description: "Resources for transitioning from active duty TRICARE to veteran healthcare options, including TRICARE for Life and VA healthcare.",
    resourceType: "federal",
    category: "Transitioning from Military Healthcare",
    subcategory: "TRICARE",
    contact: {
      website: "https://www.tricare.mil/Plans/TransitionAssistance",
      phone: "1-800-444-5445",
      email: "tricare-support@dha.mil"
    },
    eligibility: "Service members transitioning to civilian life",
    veteranType: ["Transitioning Service Members", "Veterans", "Retirees"],
    serviceBranch: ["All Branches"],
    tags: ["tricare", "healthcare", "transition", "benefits"],
    isFeatured: true,
    lastUpdated: new Date()
  },
  {
    id: new ObjectId().toString(),
    title: "Veterans Medical Records Transfer Assistance",
    description: "Resource to help veterans transfer their medical records from the DoD system to VA healthcare or private providers.",
    resourceType: "federal",
    category: "Transitioning from Military Healthcare",
    subcategory: "Medical Records",
    contact: {
      website: "https://www.va.gov/health-care/about-va-health-benefits/medical-records/",
      phone: "1-866-272-6272",
      email: "records@va.gov"
    },
    eligibility: "All Veterans",
    veteranType: ["All Veterans", "Transitioning Service Members"],
    serviceBranch: ["All Branches"],
    tags: ["medical records", "healthcare", "transition", "documentation"],
    isFeatured: false,
    lastUpdated: new Date()
  },
  {
    id: new ObjectId().toString(),
    title: "REE Medical Veterans Support",
    description: "Nonprofit organization assisting veterans with medical evaluations and disability claims during their transition to civilian healthcare.",
    resourceType: "nonprofit",
    category: "Transitioning from Military Healthcare",
    subcategory: "Disability Claims",
    contact: {
      website: "https://reemedical.com",
      phone: "1-800-994-9944",
      email: "veterans@reemedical.com"
    },
    eligibility: "All Veterans, priority for combat veterans",
    veteranType: ["All Veterans", "Transitioning Service Members", "Disabled Veterans"],
    serviceBranch: ["All Branches"],
    tags: ["disability", "healthcare", "claims", "evaluations", "nonprofit"],
    isFeatured: true,
    lastUpdated: new Date()
  },
  {
    id: new ObjectId().toString(),
    title: "Veteran Advocacy Services",
    description: "Nonprofit providing advocacy services for veterans transitioning to civilian healthcare and navigating the VA system.",
    resourceType: "nonprofit",
    category: "Transitioning from Military Healthcare",
    subcategory: "Advocacy",
    contact: {
      website: "https://veteranadvocacy.org",
      phone: "1-888-555-4567",
      email: "help@veteranadvocacy.org"
    },
    eligibility: "All Veterans",
    veteranType: ["All Veterans", "Transitioning Service Members", "Disabled Veterans"],
    serviceBranch: ["All Branches"],
    tags: ["advocacy", "healthcare", "transition", "support", "nonprofit"],
    isFeatured: false,
    lastUpdated: new Date()
  }
];

async function seedResources() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const collection = db.collection(COLLECTION_NAME);
    
    // Check if we already have resources for transitioning from military healthcare
    const existingCount = await collection.countDocuments({ 
      category: "Transitioning from Military Healthcare"
    });
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing resources for Transitioning from Military Healthcare. Skipping seed.`);
      return;
    }
    
    // Insert the sample resources
    const result = await collection.insertMany(transitionResources);
    console.log(`${result.insertedCount} resources inserted successfully.`);
    
    // Create text index for better search capabilities
    await collection.createIndex({ 
      title: "text", 
      description: "text", 
      tags: "text", 
      category: "text", 
      subcategory: "text" 
    });
    console.log('Text index created for better search capabilities');
    
  } catch (error) {
    console.error('Error seeding transition resources:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the seed function
seedResources()
  .then(() => console.log('Seed completed'))
  .catch(console.error);
