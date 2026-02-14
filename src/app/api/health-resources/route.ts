import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { HealthResource } from '@/models/healthResource';

// Import symptom category mapping for symptom-based resource finder with expanded categories
const SYMPTOM_CATEGORY_MAPPING: Record<string, string[]> = {
  'mental': ['Mental Health', 'Crisis Services', 'Family Support', 'Wellness Programs', 'Peer Support', 'Counseling', 'PTSD', 'Depression', 'Anxiety', 'Veteran Support', 'NGO', 'Community Support'],
  'physical': ['Physical Health', 'Specialized Care', 'Rehabilitation', 'Medical Services', 'Wellness Programs', 'NGO', 'Adaptive Sports', 'Pain Management', 'Physical Therapy', 'Veteran Support'],
  'life': ['Family Support', 'Wellness Programs', 'Specialized Care', 'Community Support', 'Social Services', 'NGO', 'Financial Assistance', 'Housing Support', 'Employment Services', 'Veteran Support'],
  'crisis': ['Crisis Services', 'Mental Health', 'Emergency Services', 'Suicide Prevention', 'Immediate Support', 'NGO', 'Hotlines', 'Peer Support', 'Veteran Support']
};

// Static health resources fallback with standardized schema
// Import static resources as fallback data
const STATIC_HEALTH_RESOURCES = [
  {
    _id: '1',
    id: '1',
    title: 'VA Health Care Enrollment',
    description: 'Apply for VA health care benefits and find out how to access services.',
    category: 'Health',
    subcategory: 'Federal',
    resourceType: 'va',
    contact: {
      phone: '1-877-222-8387',
      email: 'vainfo@va.gov',
      website: 'https://www.va.gov/health-care/'
    },
    location: {
      address: '810 Vermont Avenue, NW',
      city: 'Washington',
      state: 'DC',
      zipCode: '20420'
    },
    eligibility: 'Must be a Veteran who served in the active military, naval, or air service',
    veteranType: ['all', 'combat', 'disabled'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'enrollment', 'benefits', 'mental-health', 'primary-care', 'ptsd', 'depression'],
    isFeatured: true,
    lastUpdated: new Date('2024-01-15'),
    imageUrl: '/images/resources/va-health.jpg',
    rating: 4.8,
    reviewCount: 245
  },
  {
    _id: '2',
    id: '2',
    title: 'TRICARE Health Plans',
    description: 'Health care program for uniformed service members, retirees, and their families.',
    category: 'Health',
    subcategory: 'Federal',
    resourceType: 'federal',
    contact: {
      phone: '1-800-444-5445',
      email: 'info@tricare.mil',
      website: 'https://www.tricare.mil/'
    },
    location: {
      address: '',
      city: '',
      state: 'national',
      zipCode: ''
    },
    eligibility: 'Active duty service members, military retirees, and their families',
    veteranType: ['all', 'active-duty', 'retired'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['healthcare', 'insurance', 'military families', 'primary-care'],
    isFeatured: true,
    lastUpdated: new Date('2024-02-10'),
    imageUrl: '/images/resources/tricare.jpg',
    rating: 4.6,
    reviewCount: 189
  },
  {
    _id: '3',
    id: '3',
    title: 'Veterans Crisis Line',
    description: 'Confidential crisis support available 24/7 for Veterans and their loved ones.',
    category: 'Mental Health',
    subcategory: 'Crisis',
    resourceType: 'va',
    contact: {
      phone: '1-800-273-8255',
      website: 'https://www.veteranscrisisline.net/'
    },
    location: {
      state: 'national'
    },
    eligibility: 'Veterans, service members, National Guard and Reserve members, and their family members and friends',
    veteranType: ['all'],
    serviceBranch: ['army', 'navy', 'air force', 'marines', 'coast guard', 'space force'],
    tags: ['crisis', 'suicide prevention', 'mental health', 'emergency', 'hotline'],
    isFeatured: true,
    lastUpdated: new Date('2024-03-05'),
    rating: 4.9,
    reviewCount: 321
  }
];

/**
 * Helper function to enrich resources with inferred tags based on content
 */
export const enrichResourcesWithTags = (resources: any[]): any[] => {
  // Common health-related keywords for tag inference
  const mentalHealthKeywords = [
    'mental health', 'ptsd', 'trauma', 'stress', 'anxiety', 'depression', 'counseling',
    'therapy', 'therapist', 'psychological', 'psychiatry', 'psychiatric', 'mental illness',
    'suicide', 'crisis', 'addiction', 'substance abuse', 'alcohol', 'drugs', 'recovery'
  ];

  const primaryCareKeywords = [
    'primary care', 'doctor', 'physician', 'clinic', 'medical', 'healthcare', 'health care',
    'checkup', 'check-up', 'physical', 'exam', 'screening', 'prevention', 'wellness'
  ];

  // Category keyword mapping
  const categoryKeywordMap: { [key: string]: string[] } = {
    'Mental Health': mentalHealthKeywords,
    'Primary Care': primaryCareKeywords,
    // Add more categories as needed
  };

  // Process each resource to add inferred tags
  return resources.map(resource => {
    const enrichedResource = { ...resource };

    // Initialize tags array if it doesn't exist
    if (!enrichedResource.tags || !Array.isArray(enrichedResource.tags)) {
      enrichedResource.tags = [];
    }

    // Create a set to avoid duplicate tags
    const existingTagsSet = new Set(enrichedResource.tags.map((tag: string) =>
      typeof tag === 'string' ? tag.toLowerCase() : ''));

    // Get text to analyze for keyword matching
    const title = (enrichedResource.title || enrichedResource.name || '').toLowerCase();
    const description = (enrichedResource.description || '').toLowerCase();
    const contentToAnalyze = `${title} ${description}`;

    // Add category as a tag if it exists and not already tagged
    if (enrichedResource.category && !existingTagsSet.has(enrichedResource.category.toLowerCase())) {
      enrichedResource.tags.push(enrichedResource.category);
      existingTagsSet.add(enrichedResource.category.toLowerCase());
    }

    // Add resourceType as a tag if it exists
    if (enrichedResource.resourceType && !existingTagsSet.has(enrichedResource.resourceType.toLowerCase())) {
      enrichedResource.tags.push(enrichedResource.resourceType);
      existingTagsSet.add(enrichedResource.resourceType.toLowerCase());
    }

    // Check content against all category keywords
    Object.entries(categoryKeywordMap).forEach(([category, keywords]) => {
      // Check if content contains any keywords from this category
      const matchingKeywords = keywords.filter(keyword =>
        contentToAnalyze.includes(keyword.toLowerCase()));

      // If there are matching keywords, add the category and keywords as tags
      if (matchingKeywords.length > 0) {
        // Add category as a tag if not already present
        if (!existingTagsSet.has(category.toLowerCase())) {
          enrichedResource.tags.push(category);
          existingTagsSet.add(category.toLowerCase());
        }
      }
    });

    return enrichedResource;
  });
};

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);

    // Main filtering parameters
    const category = url.searchParams.get('category') || 'all';
    const query = url.searchParams.get('query') || '';
    const state = url.searchParams.get('state') || 'all';
    const page = parseInt(url.searchParams.get('page') || '1');
    // Increase default limit for symptom-based resource finder
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const sort = url.searchParams.get('sort') || 'relevance';

    // Symptom-based filtering parameters
    const symptomCategory = url.searchParams.get('symptomCategory') || '';
    const symptoms = url.searchParams.get('symptoms')?.split(',').filter(Boolean) || [];
    const severityLevel = url.searchParams.get('severityLevel') || '';

    // Advanced filtering parameters
    const resourceType = url.searchParams.get('resourceType') || 'all';
    const veteranTypeParam = url.searchParams.get('veteranType');
    const serviceBranchParam = url.searchParams.get('serviceBranch');
    const featuredOnly = url.searchParams.get('featuredOnly') === 'true';
    const recentlyUpdated = url.searchParams.get('recentlyUpdated') === 'true';
    const minRating = url.searchParams.get('minRating')
      ? parseFloat(url.searchParams.get('minRating') || '0')
      : undefined;

    // Convert comma-separated strings to arrays
    const veteranTypes = veteranTypeParam?.split(',').filter(Boolean) || [];
    const serviceBranches = serviceBranchParam?.split(',').filter(Boolean) || [];

    // Connect to MongoDB - always use symptomResources collection for consistent results
    const dbName = 'vet1stop';
    const collectionName = 'symptomResources';

    console.log(`Using database: ${dbName}, collection: ${collectionName}`);

    // Get database connection
    let db;
    try {
      const connection = await connectToDatabase(dbName);
      db = connection.db;
      console.log('Successfully connected to MongoDB database');
    } catch (error) {
      console.error('MongoDB connection error:', error);

      // Return static data if DB connection fails
      return NextResponse.json({
        success: true,
        message: 'Using static data due to database connection issue',
        data: STATIC_HEALTH_RESOURCES,
        pagination: {
          total: STATIC_HEALTH_RESOURCES.length,
          page: 1,
          pageSize: STATIC_HEALTH_RESOURCES.length,
          totalPages: 1
        }
      });
    }

    // List all collections in the database for debugging
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map((c: any) => c.name).join(', '));

    // Always use the symptomResources collection for consistent results
    const collection = db.collection(collectionName);
    const totalDocsInCollection = await collection.countDocuments();

    console.log(`Found ${totalDocsInCollection} documents in ${collectionName} collection`);

    // If the collection is empty, populate it with static data
    if (totalDocsInCollection === 0) {
      console.log(`Collection ${collectionName} is empty, populating with static data...`);
      try {
        // Prepare documents for MongoDB by converting string IDs to ObjectIds
        const documentsToInsert = STATIC_HEALTH_RESOURCES.map(resource => {
          // Create a new object without the string _id
          const { _id, ...resourceWithoutId } = resource;
          // Return document ready for MongoDB
          return resourceWithoutId;
        });

        // Insert static resources into the collection
        await collection.insertMany(documentsToInsert as any[]);
        console.log(`Successfully populated ${collectionName} with ${STATIC_HEALTH_RESOURCES.length} documents`);
      } catch (error) {
        console.error('Error populating collection:', error);
      }

      // Return static data since we just populated the collection
      return NextResponse.json({
        success: true,
        message: 'Using static data and populating collection',
        data: STATIC_HEALTH_RESOURCES,
        pagination: {
          total: STATIC_HEALTH_RESOURCES.length,
          page: 1,
          pageSize: STATIC_HEALTH_RESOURCES.length,
          totalPages: 1
        }
      });
    }

    // Build MongoDB query object
    let mongoQuery: Record<string, any> = {};

    // Add search query if provided
    if (query) {
      const searchTerms = query.split(/\s+/).map(term => term.trim().toLowerCase()).filter(Boolean);

      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => ({
          $or: [
            { title: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { 'tags': { $regex: term, $options: 'i' } },
            { organization: { $regex: term, $options: 'i' } }
          ]
        }));

        mongoQuery.$and = searchConditions;
      }
    }

    // Add symptom-based filtering
    if (symptomCategory && SYMPTOM_CATEGORY_MAPPING[symptomCategory]) {
      const categoryTags = SYMPTOM_CATEGORY_MAPPING[symptomCategory];

      // Add category tags to query
      if (!mongoQuery.$and) {
        mongoQuery.$and = [];
      }

      // Match resources with any of the category tags
      mongoQuery.$and.push({
        $or: [
          { categories: { $in: categoryTags } },
          { tags: { $in: categoryTags.map(tag => tag.toLowerCase()) } }
        ]
      });

      // For all severity levels, include symptom-specific matching
      // This ensures we get comprehensive results regardless of severity
      if (symptoms.length > 0) {
        const symptomConditions = [];

        // Match resources with tags that include any of the symptoms
        symptomConditions.push({
          tags: { $in: symptoms.map(s => new RegExp(s, 'i')) }
        });

        // Match resources with titles or descriptions that mention the symptoms
        symptoms.forEach(symptom => {
          symptomConditions.push({
            title: { $regex: symptom, $options: 'i' }
          });
          symptomConditions.push({
            description: { $regex: symptom, $options: 'i' }
          });
        });

        // Add the symptom conditions to the query
        mongoQuery.$and.push({ $or: symptomConditions });
      }

      // Add severity-specific adjustments
      if (severityLevel) {
        // For severe/crisis, prioritize verified resources but don't exclude others
        if (severityLevel === 'severe' || severityLevel === 'crisis') {
          // We'll handle this in the sorting phase, not in filtering
          // This ensures we get enough resources while still prioritizing verified ones
        }
      }

      // Use the selectionHash parameter to create deterministic but different results
      // This ensures different symptoms/severity combinations get different resources
      const selectionHash = url.searchParams.get('selectionHash');
      if (selectionHash) {
        console.log(`Using selection hash for deterministic ordering: ${selectionHash}`);
        // We'll use this in the sorting phase to create a deterministic but different ordering
      }
    }

    // Add category filter
    if (category && category !== 'all') {
      if (mongoQuery.$and) {
        mongoQuery.$and.push({ category: { $regex: category, $options: 'i' } });
      } else {
        mongoQuery.category = { $regex: category, $options: 'i' };
      }
    }

    // Add state/location filter
    if (state && state !== 'all' && state !== 'national') {
      // For specific state filter
      const stateCondition = { 'location.state': state };
      if (mongoQuery.$and) {
        mongoQuery.$and.push(stateCondition);
      } else {
        mongoQuery.$and = [stateCondition];
      }
    } else if (state === 'national') {
      // For national resources only
      const nationalCondition = {
        $or: [
          { 'location.state': 'national' },
          { national: true },
          { 'location.state': null },
          { 'location.state': '' }
        ]
      };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(nationalCondition);
      } else {
        mongoQuery.$and = [nationalCondition];
      }
    }

    // Add resourceType filter (VA, Federal, State, NGO, etc.)
    if (resourceType && resourceType !== 'all') {
      const resourceTypeCondition = { resourceType: { $regex: resourceType, $options: 'i' } };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(resourceTypeCondition);
      } else {
        mongoQuery.$and = [resourceTypeCondition];
      }
    }

    // Add veteran type filter
    if (veteranTypes.length > 0) {
      const veteranTypeCondition = { veteranType: { $in: veteranTypes } };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(veteranTypeCondition);
      } else {
        mongoQuery.$and = [veteranTypeCondition];
      }
    }

    // Add service branch filter
    if (serviceBranches.length > 0) {
      const branchCondition = { serviceBranch: { $in: serviceBranches } };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(branchCondition);
      } else {
        mongoQuery.$and = [branchCondition];
      }
    }

    // Add featured filter
    if (featuredOnly) {
      if (mongoQuery.$and) {
        mongoQuery.$and.push({ isFeatured: true });
      } else {
        mongoQuery.isFeatured = true;
      }
    }

    // Add recently updated filter (last 90 days)
    if (recentlyUpdated) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const recentCondition = { lastUpdated: { $gte: ninetyDaysAgo } };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(recentCondition);
      } else {
        mongoQuery.$and = [recentCondition];
      }
    }

    // Add minimum rating filter
    if (minRating) {
      const ratingCondition = { rating: { $gte: minRating } };

      if (mongoQuery.$and) {
        mongoQuery.$and.push(ratingCondition);
      } else {
        mongoQuery.$and = [ratingCondition];
      }
    }

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Determine sort options
    let sortOptions: Record<string, any> = {};

    // Special handling for symptom-based resource finder
    if (symptomCategory) {
      // For symptom-based searches, use a balanced sorting approach
      // that doesn't overly prioritize verified resources

      // For severe/crisis severity levels, prioritize verified resources but still include others
      if (severityLevel === 'severe' || severityLevel === 'crisis') {
        sortOptions = {
          isVerified: -1,        // Verified resources first, but not exclusively
          isFeatured: -1,       // Featured resources next
          isVeteranLed: -1,     // Veteran-led organizations next
          rating: -1            // Then by rating
        };
      } else {
        // For mild/moderate severity levels, use a more balanced approach
        // that includes more NGOs and community resources
        sortOptions = {
          isFeatured: -1,       // Featured resources first
          isVeteranLed: -1,     // Veteran-led organizations next
          rating: -1,           // Then by rating
          isVerified: -1        // Verified resources still matter but less prioritized
        };
      }

      // Use the selectionHash to create deterministic but different orderings
      const selectionHash = url.searchParams.get('selectionHash');
      if (selectionHash) {
        console.log(`Applying selection hash for deterministic ordering: ${selectionHash}`);
      }
    } else {
      // Standard sorting for regular searches
      switch (sort) {
        case 'newest':
          sortOptions = { lastUpdated: -1 };
          break;
        case 'rating':
          sortOptions = { rating: -1 };
          break;
        case 'alphabetical':
          sortOptions = { title: 1 };
          break;
        case 'relevance':
        default:
          // For relevance sorting, use a combination of factors
          sortOptions = { isFeatured: -1, rating: -1, lastUpdated: -1 };
          break;
      }
    }

    try {
      // Log the query for debugging
      console.log('MongoDB query:', JSON.stringify(mongoQuery, null, 2));
      console.log('Sort options:', JSON.stringify(sortOptions, null, 2));

      // Get total count of matching resources for pagination
      const totalCount = await collection.countDocuments(mongoQuery);
      console.log(`Found ${totalCount} matching resources for the query`);

      // Execute query with pagination and sorting
      let resources = await collection
        .find(mongoQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray();

      // Apply advanced deterministic shuffling based on selectionHash if present
      const selectionHash = url.searchParams.get('selectionHash');
      if (selectionHash && symptomCategory) {
        console.log(`Applying advanced deterministic shuffling with hash: ${selectionHash}`);

        // Create a more robust numeric seed from the selection hash
        // Use all characters in the hash, not just the first one
        const seed = selectionHash.split('').reduce((acc: number, char: string, index: number) => {
          return acc + (char.charCodeAt(0) * (index + 1));
        }, 0);

        // Extract timestamp component if present to ensure different results even with same inputs
        const timestampMatch = selectionHash.match(/(\d{13})/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

        // Extract symptom information to further differentiate results
        const symptomsString = symptoms.join(',');
        const symptomSeed = symptomsString.split('').reduce((acc: number, char: string) => {
          return acc + char.charCodeAt(0);
        }, 0);

        // Combine all seed components for a truly unique shuffling
        const combinedSeed = seed + (timestamp % 10000) + (symptomSeed * 31);

        // Use Fisher-Yates shuffle algorithm for better randomization
        const shuffleArray = (array: any[], seed: number) => {
          const shuffled = [...array];
          let currentIndex = shuffled.length;
          let temporaryValue, randomIndex;

          // Seed-based pseudo-random number generator
          const seededRandom = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
          };

          // While there remain elements to shuffle
          while (currentIndex !== 0) {
            // Pick a remaining element
            randomIndex = Math.floor(seededRandom() * currentIndex);
            currentIndex -= 1;

            // Swap it with the current element
            temporaryValue = shuffled[currentIndex];
            shuffled[currentIndex] = shuffled[randomIndex];
            shuffled[randomIndex] = temporaryValue;
          }

          return shuffled;
        };

        // Apply the Fisher-Yates shuffle with our combined seed
        resources = shuffleArray(resources, combinedSeed);

        // Apply organization type balancing - ensure mix of VA and NGO resources
        const vaResources = resources.filter((r: any) => {
          const org = (r.organization || '').toLowerCase();
          const title = (r.title || '').toLowerCase();
          return org.includes('va') || org.includes('veterans affairs') ||
            title.includes('va ') || title.includes('veterans affairs');
        });

        const ngoResources = resources.filter((r: any) => {
          const org = (r.organization || '').toLowerCase();
          const title = (r.title || '').toLowerCase();
          return !org.includes('va') && !org.includes('veterans affairs') &&
            !title.includes('va ') && !title.includes('veterans affairs');
        });

        // Ensure we have at least some of each type
        const totalLimit = resources.length;
        const vaLimit = Math.max(3, Math.floor(totalLimit * 0.3)); // At least 3 VA resources, up to 30%
        const ngoLimit = Math.max(5, Math.floor(totalLimit * 0.6)); // At least 5 NGO resources, up to 60%

        // Select resources with limits
        const selectedVA = vaResources.slice(0, vaLimit);
        const selectedNGO = ngoResources.slice(0, ngoLimit);
        const otherResources = resources.filter((r: any) =>
          !selectedVA.includes(r) && !selectedNGO.includes(r)
        ).slice(0, totalLimit - selectedVA.length - selectedNGO.length);

        // Combine with NGOs first for better visibility
        resources = [...selectedNGO, ...selectedVA, ...otherResources];

        console.log(`Advanced shuffling applied: ${resources.length} resources with ${selectedNGO.length} NGO and ${selectedVA.length} VA resources`);
      }

      console.log(`Returning ${resources.length} resources after pagination and sorting`);

      // Enrich resources with inferred tags
      const enrichedResources = enrichResourcesWithTags(resources);

      // Return formatted response
      return NextResponse.json({
        success: true,
        data: enrichedResources,
        pagination: {
          total: totalCount,
          page,
          pageSize: limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });

    } catch (error) {
      console.error('MongoDB query error:', error);

      // Return error response
      return NextResponse.json({
        success: false,
        message: 'Error querying health resources',
        error: error instanceof Error ? error.message : 'Unknown database error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Health resources API error:', error);

    // Return general error response
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
