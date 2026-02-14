/**
 * NGO Data Seeding Script
 * 
 * This script seeds the MongoDB database with NGO data for the Health page.
 * It ensures that featured NGOs and NGO of the month are properly set up.
 * 
 * Usage: 
 * 1. Make sure your MongoDB connection is configured in .env
 * 2. Run: node scripts/seed-ngo-data.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Mock NGO data from our utilities but converted to a Node.js compatible format
const NGO_DATA = [
  {
    id: 'wounded-warrior-project',
    name: 'Wounded Warrior Project',
    description: 'Empowering veterans with physical and mental health programs, career counseling, and long-term rehabilitative care to help warriors thrive after service.',
    link: 'https://www.woundedwarriorproject.org',
    image: '/images/ngo/wounded-warrior.jpg',
    logo: '/images/ngo/logos/wounded-warrior-logo.png',
    focus: ['mental-health', 'physical-health', 'family-support'],
    location: {
      national: true,
      address: '4899 Belfort Road, Suite 300',
      city: 'Jacksonville',
      state: 'FL',
      zipCode: '32256'
    },
    veteranFounded: true,
    rating: 4.7,
    reviewCount: 1256,
    metrics: {
      impactScore: 92,
      engagementRate: 0.78,
      veteransSupportedCount: 142000,
      fundingEfficiency: 0.72
    },
    tags: ['mental-health', 'physical-rehabilitation', 'peer-support', 'adaptive-sports'],
    // Fields to match API expectations
    isFeatured: true,
    status: 'active',
    featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    featuredPriority: 10, // Higher priority
    isNGOOfTheMonth: false,
    focusAreas: ['mental-health', 'physical-health', 'family-support'],
    createdAt: new Date(),
    updatedAt: new Date(),
    averageRating: 4.7,
    engagementScore: 85,
    establishedYear: 2003,
    contact: {
      phone: '888-997-2586',
      email: 'resourcecenter@woundedwarriorproject.org',
      website: 'https://www.woundedwarriorproject.org'
    },
    achievements: [
      'Served over 140,000 wounded veterans and their families since 2003',
      'Invested more than $200 million in mental health programs',
      'Helped 16,000+ warriors transition to civilian careers',
      'Provided 42,000+ hours of intensive outpatient care for PTSD'
    ],
    veteranTypes: ['combat-veteran', 'wounded-veteran', 'disabled-veteran', 'post-911'],
    serviceBranches: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'National Guard'],
    focusArea: 'health',
    category: 'health-support'
  },
  {
    id: 'team-rubicon',
    name: 'Team Rubicon',
    description: 'Veteran-led disaster response organization that utilizes the skills of veterans to rapidly deploy emergency response teams to communities affected by disasters.',
    link: 'https://teamrubiconusa.org',
    image: '/images/ngo/team-rubicon.jpg',
    logo: '/images/ngo/logos/team-rubicon-logo.png',
    focus: ['emergency-relief', 'mental-health', 'community-service'],
    location: {
      national: true,
      address: '6171 W Century Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90045'
    },
    veteranFounded: true,
    rating: 4.9,
    reviewCount: 867,
    metrics: {
      impactScore: 95,
      engagementRate: 0.89,
      veteransSupportedCount: 15000,
      fundingEfficiency: 0.83
    },
    tags: ['disaster-response', 'emergency-services', 'humanitarian', 'community-rebuilding'],
    // Fields to match API expectations
    isFeatured: false,
    status: 'active',
    isNGOOfTheMonth: true,
    focusAreas: ['emergency-relief', 'disaster-response', 'community-service'],
    createdAt: new Date(),
    updatedAt: new Date(),
    averageRating: 4.9,
    engagementScore: 90,
    establishedYear: 2010,
    contact: {
      phone: '310-640-8787',
      email: 'support@teamrubiconusa.org',
      website: 'https://teamrubiconusa.org'
    },
    achievements: [
      'Responded to over 500 disasters across 40 states and 15 countries',
      'Deployed 120,000+ volunteers to disaster zones',
      'Served 1.2 million people affected by natural disasters',
      'Provided $80 million in disaster recovery services'
    ],
    veteranTypes: ['all-veterans', 'active-duty'],
    serviceBranches: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'National Guard'],
    focusArea: 'health',
    category: 'emergency-support'
  },
  {
    id: 'disabled-american-veterans',
    name: 'Disabled American Veterans (DAV)',
    description: 'Providing support for veterans of all generations and their families, helping more than 1 million veterans in positive, life-changing ways each year.',
    link: 'https://www.dav.org',
    image: '/images/ngo/dav.jpg',
    logo: '/images/ngo/logos/dav-logo.png',
    focus: ['disability-support', 'benefits-assistance', 'employment'],
    location: {
      national: true,
      address: '860 Dolwick Drive',
      city: 'Erlanger',
      state: 'KY',
      zipCode: '41018'
    },
    veteranFounded: true,
    rating: 4.6,
    reviewCount: 943,
    metrics: {
      impactScore: 91,
      engagementRate: 0.72,
      veteransSupportedCount: 1000000,
      fundingEfficiency: 0.77
    },
    tags: ['disability-claims', 'va-benefits', 'transportation', 'employment-assistance'],
    // Fields to match API expectations
    isFeatured: true,
    status: 'active',
    featuredUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    featuredPriority: 5, // Lower priority than Wounded Warrior Project
    isNGOOfTheMonth: false,
    focusAreas: ['disability-claims', 'va-benefits', 'employment-assistance'],
    createdAt: new Date(),
    updatedAt: new Date(),
    averageRating: 4.6,
    engagementScore: 82,
    establishedYear: 1920,
    contact: {
      phone: '877-426-2838',
      email: 'info@dav.org',
      website: 'https://www.dav.org'
    },
    achievements: [
      'Secured more than $25 billion in earned benefits for veterans in 2021 alone',
      'Provides free rides to medical appointments for more than 600,000 veterans annually',
      'Helped 160,000+ veterans file claims for VA benefits last year',
      'Connects thousands of veterans with meaningful employment each year'
    ],
    veteranTypes: ['disabled-veteran', 'all-veterans'],
    serviceBranches: ['Army', 'Navy', 'Air Force', 'Marines', 'Coast Guard', 'National Guard', 'Reserves'],
    focusArea: 'health',
    category: 'disability-support'
  }
];

async function seedDatabase() {
  // MongoDB connection string from environment variables
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not found');
    console.error('Please create a .env file with your MongoDB connection string');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const database = client.db('vet1stop'); // Database name
    const ngoCollection = database.collection('ngos'); // Collection name (using existing collection)

    // Delete existing data
    console.log('🗑️ Clearing existing NGO data...');
    await ngoCollection.deleteMany({});

    // Insert new NGO data
    console.log('🌱 Seeding NGO data...');
    const result = await ngoCollection.insertMany(NGO_DATA);
    
    console.log(`✅ Successfully seeded ${result.insertedCount} NGO resources`);
    console.log('NGOs inserted:');
    NGO_DATA.forEach(ngo => {
      let status = '';
      if (ngo.isNGOOfTheMonth) status = '🏆 NGO of the Month';
      if (ngo.isFeatured) status = '🌟 Featured NGO';
      console.log(`- ${ngo.name} ${status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seeding function
seedDatabase().catch(console.error);
