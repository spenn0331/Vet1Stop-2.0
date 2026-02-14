const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function seedPathways() {
  let client;
  try {
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri || !dbName) {
      console.error('MongoDB connection details not found in environment variables.');
      console.error('Please ensure MONGODB_URI and MONGODB_DB are set in .env.local');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB database: ${dbName}`);
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const pathwaysCollection = db.collection('pathways');

    // Check if pathways already exist
    const existingPathways = await pathwaysCollection.countDocuments();
    if (existingPathways > 0) {
      console.log(`Pathways already exist in the database (${existingPathways} found). Skipping seeding.`);
      return;
    }

    console.log('No existing pathways found. Seeding database with initial pathways data...');
    
    // Simplified pathway data with steps and tags
    const pathways = [
      {
        id: 'pathway-military-healthcare',
        title: 'Transitioning from Military Healthcare',
        description: 'Guide for veterans transitioning from military to civilian healthcare systems.',
        steps: [
          { title: 'Register with VA Healthcare', description: 'Enroll in VA healthcare benefits.', order: 1 },
          { title: 'Find a Primary Care Provider', description: 'Choose a doctor for ongoing care.', order: 2 },
          { title: 'Transfer Medical Records', description: 'Ensure continuity of care by transferring records.', order: 3 }
        ],
        featured: true,
        tags: ['healthcare', 'transition', 'va'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'pathway-ptsd',
        title: 'Managing PTSD',
        description: 'Steps to access mental health support for PTSD.',
        steps: [
          { title: 'Recognize Symptoms', description: 'Identify signs of PTSD.', order: 1 },
          { title: 'Seek Professional Help', description: 'Contact a mental health provider.', order: 2 },
          { title: 'Join Support Groups', description: 'Connect with others who understand.', order: 3 }
        ],
        featured: true,
        tags: ['mental-health', 'ptsd', 'support'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'pathway-disability-benefits',
        title: 'Applying for Disability Benefits',
        description: 'Navigate the process of applying for VA disability benefits.',
        steps: [
          { title: 'Gather Documentation', description: 'Collect medical records and service history.', order: 1 },
          { title: 'File a Claim', description: 'Submit your application to the VA.', order: 2 },
          { title: 'Attend Evaluations', description: 'Complete any required medical exams.', order: 3 }
        ],
        featured: false,
        tags: ['disability', 'benefits', 'va'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'pathway-womens-health',
        title: 'Women\'s Health for Veterans',
        description: 'A comprehensive guide to women\'s health services and resources for women veterans.',
        steps: [
          { title: 'Find Women\'s Health Services', description: 'Locate VA Women\'s Health clinics near you.', order: 1 },
          { title: 'Schedule a Well-Woman Visit', description: 'Book your annual preventive care appointment.', order: 2 },
          { title: 'Access Specialized Care', description: 'Learn about maternity care, reproductive health, and more.', order: 3 }
        ],
        featured: true,
        tags: ['women-veterans', 'healthcare', 'preventive-care'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'pathway-mental-health',
        title: 'Accessing Mental Health Services',
        description: 'A guide to mental health resources and support available to veterans.',
        steps: [
          { title: 'Explore Available Services', description: 'Learn about different mental health programs offered by VA.', order: 1 },
          { title: 'Connect with a Provider', description: 'Find and schedule with a mental health professional.', order: 2 },
          { title: 'Engage with Treatment', description: 'Understand different therapy options and medication management.', order: 3 }
        ],
        featured: true,
        tags: ['mental-health', 'counseling', 'therapy'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = await pathwaysCollection.insertMany(pathways);
    console.log(`Successfully added ${result.insertedCount} pathways to the database.`);
  } catch (error) {
    console.error('Error seeding pathways:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
    process.exit();
  }
}

// Execute the function
seedPathways();
