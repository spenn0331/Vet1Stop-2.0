import { connectToDatabase } from '../src/lib/mongodb';

async function seedPathways() {
  const { db } = await connectToDatabase();
  const pathwaysCollection = db.collection('pathways');

  // Check if pathways already exist
  const existingPathways = await pathwaysCollection.countDocuments();
  if (existingPathways > 0) {
    console.log('Pathways already exist in the database. Skipping seeding.');
    return;
  }

  const pathways = [
    {
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
    }
  ];

  await pathwaysCollection.insertMany(pathways);
  console.log('Pathways seeded successfully.');
}

seedPathways().catch(console.error).finally(() => process.exit());
