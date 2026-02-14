import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Static fallback resources with diverse options
const FALLBACK_RESOURCES = [
  {
    id: 'va-mental-health',
    title: 'VA Mental Health Services',
    description: 'Comprehensive mental health services for veterans, including treatment for depression, PTSD, anxiety, and substance use disorders.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/',
    categories: ['Mental Health', 'VA', 'Crisis Services'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Substance Use'],
    rating: 4.5,
    reviewCount: 128,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3', '4', '5'],
    isMentalHealthResource: true
  },
  {
    id: 'team-rwb',
    title: 'Team Red, White & Blue',
    description: 'Enriching veterans\'s lives by connecting them to their community through physical and social activity.',
    url: 'https://www.teamrwb.org/',
    categories: ['Physical Health', 'Wellness Programs', 'NGO'],
    tags: ['Physical Activity', 'Social Connection', 'Community'],
    rating: 4.9,
    reviewCount: 156,
    provider: 'Team RWB',
    isVerified: true,
    isVeteranLed: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3'],
    isMentalHealthResource: false
  },
  {
    id: 'wounded-warrior',
    title: 'Wounded Warrior Project',
    description: 'Programs and services for veterans and service members who incurred a physical or mental injury or illness on or after September 11, 2001.',
    url: 'https://www.woundedwarriorproject.org/',
    categories: ['Physical Health', 'Mental Health', 'NGO'],
    tags: ['PTSD', 'TBI', 'Physical Injury', 'Rehabilitation'],
    rating: 4.3,
    reviewCount: 215,
    provider: 'Wounded Warrior Project',
    isVerified: true,
    isVeteranLed: true,
    geographicScope: 'national',
    severityLevels: ['3', '4', '5'],
    isMentalHealthResource: true
  },
  {
    id: 'headstrong',
    title: 'Headstrong Project',
    description: 'Confidential, cost-free, and frictionless mental health treatment for post-9/11 veterans and their families.',
    url: 'https://getheadstrong.org/',
    categories: ['Mental Health', 'NGO', 'Crisis Services'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Trauma'],
    rating: 4.6,
    reviewCount: 87,
    provider: 'Headstrong Project',
    isVerified: true,
    isVeteranLed: true,
    geographicScope: 'national',
    severityLevels: ['2', '3', '4', '5'],
    isMentalHealthResource: true
  },
  {
    id: 'give-an-hour',
    title: 'Give An Hour',
    description: 'Free mental health services provided by volunteer mental health professionals to veterans, service members, and their families.',
    url: 'https://giveanhour.org/',
    categories: ['Mental Health', 'NGO', 'Family Support'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Family'],
    rating: 4.8,
    reviewCount: 92,
    provider: 'Give An Hour',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3', '4'],
    isMentalHealthResource: true
  },
  {
    id: 'cohen-veterans-network',
    title: 'Cohen Veterans Network',
    description: 'High-quality, accessible mental health care for veterans and their families through a nationwide network of clinics.',
    url: 'https://www.cohenveteransnetwork.org/',
    categories: ['Mental Health', 'NGO', 'Family Support'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Family'],
    rating: 4.7,
    reviewCount: 103,
    provider: 'Cohen Veterans Network',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['2', '3', '4'],
    isMentalHealthResource: true
  },
  {
    id: 'va-caregiver-support',
    title: 'VA Caregiver Support Program',
    description: 'Support and resources for family caregivers of veterans, including education, training, and respite care.',
    url: 'https://www.caregiver.va.gov/',
    categories: ['Family Support', 'VA', 'Wellness Programs'],
    tags: ['Caregivers', 'Family', 'Support'],
    rating: 4.0,
    reviewCount: 65,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3', '4', '5'],
    isMentalHealthResource: false
  },
  {
    id: 'va-mental-health-services',
    title: 'VA Mental Health Services',
    description: 'Comprehensive mental health services for veterans, including treatment for depression, PTSD, substance use disorders, and more.',
    url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/',
    categories: ['Mental Health', 'VA', 'Crisis Services'],
    tags: ['PTSD', 'Depression', 'Anxiety', 'Substance Use'],
    rating: 4.5,
    reviewCount: 128,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3', '4', '5'],
    isMentalHealthResource: true
  },
  {
    id: 'va-whole-health',
    title: 'VA Whole Health',
    description: 'A personalized health approach that considers the full range of physical, emotional, mental, social, spiritual, and environmental influences.',
    url: 'https://www.va.gov/wholehealth/',
    categories: ['Physical Health', 'Wellness Programs', 'VA'],
    tags: ['Wellness', 'Prevention', 'Holistic'],
    rating: 4.2,
    reviewCount: 78,
    provider: 'Department of Veterans Affairs',
    isVerified: true,
    geographicScope: 'national',
    severityLevels: ['1', '2', '3'],
    isMentalHealthResource: false
  }
];

export async function GET(request: Request) {
  // Parse query parameters
  const url = new URL(request.url);

  // Extract parameters
  const category = url.searchParams.get('category');
  const searchTerm = url.searchParams.get('searchTerm');
  const tags = url.searchParams.getAll('tags');
  const severity = url.searchParams.get('severity');
  const minRating = url.searchParams.get('minRating');
  const state = url.searchParams.get('state');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  console.log('Symptom resource request parameters:', {
    category, searchTerm, tags, severity, minRating, state, limit
  });

  // Database connection parameters
  const dbName = 'vet1stop';
  const collectionName = 'symptomResources';

  // Get database connection
  try {
    const { db } = await connectToDatabase(dbName);
    console.log(`Successfully connected to MongoDB database: ${dbName}`);

    // Verify the collection exists (should always exist based on Compass screenshot)
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      console.error(`Collection ${collectionName} does not exist in database ${dbName}`);
      return NextResponse.json({
        success: true,
        message: 'Using fallback resources (collection not found)',
        resources: FALLBACK_RESOURCES
      });
    }

    const collection = db.collection(collectionName);

    // Build a more flexible query based on the actual document structure
    const query: any = {};

    // Add category filter - match against category, subcategory, or categories array
    if (category && category !== 'all') {
      query.$or = [
        { category: { $regex: category, $options: 'i' } },
        { subcategory: { $regex: category, $options: 'i' } }
      ];

      // Also try to match against categories array if it exists
      try {
        // This is safer than direct $regex on an array field
        query.$or.push({ categories: { $elemMatch: { $regex: category, $options: 'i' } } });
      } catch (err) {
        console.warn('Error adding categories matcher:', err);
      }
    }

    // Add tag filters for symptoms - match against tags array or title/description
    if (tags && tags.length > 0) {
      // Join all tags with | for an OR regex pattern
      const tagPattern = tags.join('|');

      // If we already have $or, we need to use $and to combine with it
      if (query.$or) {
        if (!query.$and) query.$and = [];
        query.$and.push({
          $or: [
            { tags: { $elemMatch: { $regex: tagPattern, $options: 'i' } } },
            { title: { $regex: tagPattern, $options: 'i' } },
            { description: { $regex: tagPattern, $options: 'i' } }
          ]
        });
      } else {
        query.$or = [
          { tags: { $elemMatch: { $regex: tagPattern, $options: 'i' } } },
          { title: { $regex: tagPattern, $options: 'i' } },
          { description: { $regex: tagPattern, $options: 'i' } }
        ];
      }
    }

    // Add search term filter
    if (searchTerm) {
      const searchConditions = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];

      if (query.$or) {
        if (!query.$and) query.$and = [];
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    // Add severity filter using the rating field
    if (severity) {
      try {
        const severityLevel = parseInt(severity);
        if (!isNaN(severityLevel)) {
          // Map severity levels to minimum rating values
          let minRatingValue = 0;
          switch (severityLevel) {
            case 5: minRatingValue = 4.5; break; // Crisis/highest severity
            case 4: minRatingValue = 4.0; break; // Severe
            case 3: minRatingValue = 3.5; break; // Moderate
            case 2: minRatingValue = 3.0; break; // Mild
            case 1: minRatingValue = 0; break;   // Any rating
            default: minRatingValue = 0;
          }

          query.rating = { $gte: minRatingValue };
          console.log(`Mapped severity ${severityLevel} to minimum rating ${minRatingValue}`);
        }
      } catch (err) {
        console.error(`Error parsing severity value: ${severity}`, err);
      }
    } else if (minRating) {
      // Directly use minRating if provided
      const minRatingValue = parseFloat(minRating);
      if (!isNaN(minRatingValue)) {
        query.rating = { $gte: minRatingValue };
      }
    }

    // Add state/location filter
    if (state && state !== 'all') {
      const locationConditions = [
        { geographicScope: 'national' },
        { location: state },
        { 'location.state': state }
      ];

      if (query.$or) {
        if (!query.$and) query.$and = [];
        query.$and.push({ $or: locationConditions });
      } else {
        query.$or = locationConditions;
      }
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    // Execute query
    try {
      // Get resources with sorting by rating (highest first)
      const resources = await collection
        .find(query)
        .sort({ rating: -1 })
        .limit(limit)
        .toArray();

      console.log(`Retrieved ${resources.length} resources from database`);

      // If we found resources, return them
      if (resources.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Resources retrieved successfully',
          resources: resources
        });
      }

      // If no resources found, try a simpler query just by category
      console.log('No resources found with detailed query, trying simpler query');

      const simpleQuery: any = {};
      if (category && category !== 'all') {
        simpleQuery.$or = [
          { category: { $regex: category, $options: 'i' } },
          { subcategory: { $regex: category, $options: 'i' } }
        ];
      }

      const simpleResources = await collection
        .find(simpleQuery)
        .sort({ rating: -1 })
        .limit(limit)
        .toArray();

      if (simpleResources.length > 0) {
        console.log(`Retrieved ${simpleResources.length} resources with simpler query`);
        return NextResponse.json({
          success: true,
          message: 'Resources retrieved with simpler query',
          resources: simpleResources
        });
      }

      // If still no resources, return fallback resources
      console.log('No resources found in database, using fallback resources');
      return NextResponse.json({
        success: true,
        message: 'Using fallback resources (no matching results)',
        resources: FALLBACK_RESOURCES
      });
    } catch (queryError) {
      console.error('Error executing MongoDB query:', queryError);
      return NextResponse.json({
        success: true,
        message: 'Using fallback resources (query error)',
        resources: FALLBACK_RESOURCES
      });
    }
  } catch (dbError) {
    // Database connection error - use fallback resources
    console.error('Error connecting to MongoDB:', dbError);
    return NextResponse.json({
      success: true,
      message: 'Using fallback resources (database connection error)',
      resources: FALLBACK_RESOURCES
    });
  }
}
