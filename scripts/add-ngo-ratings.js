// Script to add pre-launch ratings to NGO resources
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Helper to generate a weighted random rating
function generateRating(type, size) {
  // Base rating by organization type
  let baseRating = 4.2; // Default base
  
  // Adjust base rating by organization type (national orgs tend to have more resources/better rating)
  if (type === 'national') baseRating = 4.5;
  else if (type === 'regional') baseRating = 4.3;
  else if (type === 'local') baseRating = 4.1;
  
  // Adjust by size
  if (size === 'large') baseRating += 0.2;
  else if (size === 'small') baseRating -= 0.1;
  
  // Add small random variation (-0.3 to +0.3)
  const variation = (Math.random() * 0.6) - 0.3;
  
  // Calculate final rating (capped between 3.5 and 5.0)
  let finalRating = baseRating + variation;
  finalRating = Math.min(5.0, Math.max(3.5, finalRating));
  
  // Round to 1 decimal place
  return Math.round(finalRating * 10) / 10;
}

// Helper to generate review count based on organization size/type
function generateReviewCount(type, size) {
  let baseCount = 25; // Default base
  
  // Adjust by organization type
  if (type === 'national') baseCount = 120;
  else if (type === 'regional') baseCount = 50;
  else if (type === 'local') baseCount = 15;
  
  // Adjust by size
  if (size === 'large') baseCount *= 1.5;
  else if (size === 'small') baseCount *= 0.7;
  
  // Add variation (+/- 30%)
  const variation = (Math.random() * 0.6) - 0.3;
  
  // Calculate final count
  const finalCount = Math.round(baseCount * (1 + variation));
  
  // Ensure minimum of 5 reviews
  return Math.max(5, finalCount);
}

// Determine organization type based on name and description
function determineOrgType(name, description, tags) {
  const lowerName = (name || '').toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const joinedTags = (tags || []).join(' ').toLowerCase();
  
  // Check for national indicators
  if (
    lowerName.includes('national') || 
    lowerName.includes('american') || 
    lowerName.includes('usa') ||
    lowerName.includes('united states') ||
    lowerDesc.includes('nationwide') ||
    lowerDesc.includes('across the country') ||
    joinedTags.includes('national')
  ) {
    return 'national';
  }
  
  // Check for regional indicators
  if (
    lowerDesc.includes('regional') ||
    lowerDesc.includes('serving the') ||
    lowerDesc.includes('multi-state') ||
    joinedTags.includes('regional')
  ) {
    return 'regional';
  }
  
  // Default to local
  return 'local';
}

// Determine organization size based on description and tags
function determineOrgSize(name, description, tags) {
  const lowerName = (name || '').toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const joinedTags = (tags || []).join(' ').toLowerCase();
  
  // Check for large organization indicators
  if (
    lowerDesc.includes('largest') ||
    lowerDesc.includes('leading') ||
    lowerDesc.includes('premier') ||
    lowerName.includes('association') ||
    lowerName.includes('foundation')
  ) {
    return 'large';
  }
  
  // Check for small organization indicators
  if (
    lowerDesc.includes('small') ||
    lowerDesc.includes('volunteer') ||
    lowerDesc.includes('community-based') ||
    lowerDesc.includes('grassroots')
  ) {
    return 'small';
  }
  
  // Default to medium
  return 'medium';
}

// Function to determine if an organization is "featured"
function determineIsFeatured(name, rating, tags) {
  // Well-known organizations are more likely to be featured
  const wellKnownOrgs = [
    'red cross', 'wounded warrior', 'disabled veterans', 'american legion',
    'veterans of foreign wars', 'vfw', 'dav', 'iraq and afghanistan',
    'vietnam veterans', 'purple heart', 'uso', 'military'
  ];
  
  const lowerName = (name || '').toLowerCase();
  
  // Check if name matches any well-known organization
  const isWellKnown = wellKnownOrgs.some(org => lowerName.includes(org));
  
  // Featured if it's well-known with high rating
  const isFeatured = isWellKnown && rating >= 4.3;
  
  return isFeatured;
}

async function addNGORatings() {
  console.log('Starting NGO ratings update...');
  
  // Get MongoDB connection string from env
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'vet1stop';
  
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable not set');
    process.exit(1);
  }
  
  console.log(`Connecting to MongoDB database ${dbName}...`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('healthResources');
    
    // Find all health NGO resources without ratings
    const ngosWithoutRatings = await collection.find({ 
      category: 'health',
      subcategory: 'ngo',
      rating: { $exists: false }
    }).toArray();
    
    console.log(`Found ${ngosWithoutRatings.length} health NGO resources without ratings`);
    
    if (ngosWithoutRatings.length === 0) {
      console.log('No resources need ratings. Exiting.');
      return;
    }
    
    // Process each NGO
    let updated = 0;
    for (const ngo of ngosWithoutRatings) {
      // Determine organization type and size
      const orgType = determineOrgType(ngo.title, ngo.description, ngo.tags);
      const orgSize = determineOrgSize(ngo.title, ngo.description, ngo.tags);
      
      // Generate rating and review count
      const rating = generateRating(orgType, orgSize);
      const reviewCount = generateReviewCount(orgType, orgSize);
      
      // Determine if featured
      const isFeatured = determineIsFeatured(ngo.title, rating, ngo.tags);
      
      // Check if veteran-founded (approximate based on name/description)
      const lowerName = (ngo.title || '').toLowerCase();
      const lowerDesc = (ngo.description || '').toLowerCase();
      const veteranFounded = 
        lowerName.includes('veteran') || 
        lowerName.includes('military') ||
        lowerDesc.includes('founded by veterans') || 
        lowerDesc.includes('veteran-founded') ||
        (Math.random() < 0.3); // 30% chance even if not explicit
      
      // Update the document
      const result = await collection.updateOne(
        { _id: ngo._id },
        { 
          $set: { 
            rating,
            reviewCount,
            isFeatured,
            veteranFounded,
            isPreLaunchRating: true, // Mark as pre-launch rating
            ratingLastUpdated: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        updated++;
        console.log(`Updated ${ngo.title} - Type: ${orgType}, Size: ${orgSize}, Rating: ${rating}, Reviews: ${reviewCount}, Featured: ${isFeatured}, Veteran-founded: ${veteranFounded}`);
      }
    }
    
    console.log(`Successfully updated ${updated} out of ${ngosWithoutRatings.length} resources`);
    
  } catch (err) {
    console.error('MongoDB Error:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

addNGORatings().catch(console.error);
