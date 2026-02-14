/**
 * Seed script for adding initial resources to MongoDB
 * 
 * Run with: node scripts/seed-resources.js
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient, ServerApiVersion } = require('mongodb');

// Check if MongoDB URI exists
if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI environment variable');
  process.exit(1);
}

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Sample education resources
const educationResources = [
  {
    title: 'Post-9/11 GI Bill',
    description: 'The Post-9/11 GI Bill provides financial support for education and housing to individuals with at least 90 days of aggregate service after September 10, 2001.',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/',
    category: 'education',
    subcategory: 'benefits',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-15'),
    dateUpdated: new Date('2025-03-20'),
    featured: true,
    isPremiumContent: false,
    tags: ['gi bill', 'tuition', 'housing allowance', 'books stipend']
  },
  {
    title: 'Montgomery GI Bill Active Duty',
    description: 'The Montgomery GI Bill Active Duty provides education benefits to Veterans and Service Members who have at least two years of active duty.',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/montgomery-active-duty/',
    category: 'education',
    subcategory: 'benefits',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-20'),
    dateUpdated: new Date('2025-03-20'),
    featured: false,
    isPremiumContent: false,
    tags: ['gi bill', 'montgomery', 'active duty']
  },
  {
    title: 'Yellow Ribbon Program',
    description: 'The Yellow Ribbon Program helps you pay for out-of-state, private school, or graduate school tuition that the Post-9/11 GI Bill doesn\'t cover.',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program/',
    category: 'education',
    subcategory: 'benefits',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-25'),
    dateUpdated: new Date('2025-03-22'),
    featured: true,
    isPremiumContent: false,
    tags: ['yellow ribbon', 'tuition', 'private school', 'out-of-state']
  },
  {
    title: 'Veteran Readiness and Employment (VR&E)',
    description: 'The Veteran Readiness and Employment (VR&E) program helps veterans with service-connected disabilities prepare for, find, and keep suitable jobs.',
    url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/',
    category: 'education',
    subcategory: 'vocational',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-02-01'),
    dateUpdated: new Date('2025-03-25'),
    featured: false,
    isPremiumContent: false,
    tags: ['vocational rehabilitation', 'employment', 'disabilities', 'career counseling']
  },
  {
    title: 'Troops to Teachers',
    description: 'Troops to Teachers helps eligible military personnel begin new careers as teachers in public schools.',
    url: 'https://www.dantes.doded.mil/EducationPrograms/become-a-teacher/troopstoteachers.html',
    category: 'education',
    subcategory: 'career transitions',
    source: 'government',
    sourceName: 'Defense Activity for Non-Traditional Education Support (DANTES)',
    dateAdded: new Date('2025-02-10'),
    dateUpdated: new Date('2025-03-27'),
    featured: false,
    isPremiumContent: false,
    tags: ['teaching', 'career transition', 'public schools']
  },
  {
    title: 'VET TEC Program',
    description: 'The Veteran Employment Through Technology Education Courses (VET TEC) program helps Veterans get training in high-tech fields like information science, computer programming, data processing, and more.',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/how-to-use-benefits/vettec-high-tech-program/',
    category: 'education',
    subcategory: 'technology',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-02-25'),
    dateUpdated: new Date('2025-03-30'),
    featured: true,
    isPremiumContent: false,
    tags: ['technology', 'programming', 'training', 'high-tech']
  }
];

// Sample health resources
const healthResources = [
  {
    title: 'VA Health Care Enrollment',
    description: 'Find out how to apply for VA health care benefits as a Veteran or Servicemember.',
    url: 'https://www.va.gov/health-care/how-to-apply/',
    category: 'health',
    subcategory: 'enrollment',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-10'),
    dateUpdated: new Date('2025-03-15'),
    featured: true,
    isPremiumContent: false,
    tags: ['health care', 'enrollment', 'benefits', 'coverage']
  },
  {
    title: 'MISSION Act and Community Care',
    description: 'The MISSION Act strengthens the VA's ability to deliver trusted care to Veterans when and where they need it.',
    url: 'https://www.va.gov/COMMUNITYCARE/programs/veterans/index.asp',
    category: 'health',
    subcategory: 'care options',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-15'),
    dateUpdated: new Date('2025-03-18'),
    featured: false,
    isPremiumContent: false,
    tags: ['mission act', 'community care', 'healthcare options']
  },
  {
    title: 'Veterans Crisis Line',
    description: 'Connect with qualified responders with the Department of Veterans Affairs, many of whom are Veterans themselves.',
    url: 'https://www.veteranscrisisline.net/',
    category: 'health',
    subcategory: 'mental health',
    source: 'government',
    sourceName: 'U.S. Department of Veterans Affairs',
    dateAdded: new Date('2025-01-20'),
    dateUpdated: new Date('2025-03-20'),
    featured: true,
    isPremiumContent: false,
    tags: ['crisis line', 'mental health', 'suicide prevention', 'emergency']
  }
];

async function seedDatabase() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected to MongoDB server');
    
    // Access the database
    const database = client.db('vet1stop');
    const resources = database.collection('resources');
    
    // Check if collection has data and clear it
    const count = await resources.countDocuments();
    if (count > 0) {
      console.log(`Found ${count} existing resources. Clearing collection...`);
      await resources.deleteMany({});
      console.log('Collection cleared');
    }
    
    // Insert education resources
    await resources.insertMany(educationResources);
    console.log(`Inserted ${educationResources.length} education resources`);
    
    // Insert health resources
    await resources.insertMany(healthResources);
    console.log(`Inserted ${healthResources.length} health resources`);
    
    // Create indexes for better query performance
    await resources.createIndex({ category: 1 });
    await resources.createIndex({ subcategory: 1 });
    await resources.createIndex({ featured: 1 });
    await resources.createIndex({ tags: 1 });
    await resources.createIndex({ title: "text", description: "text" });
    console.log('Created indexes for better query performance');
    
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedDatabase();
