// Script to test NGO filtering and debug issues
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function debugNGOFilters() {
  console.log('===== NGO FILTER DEBUGGING TOOL =====');
  
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
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('healthResources');
    
    // 1. Check database items with our exact filter criteria
    const exactFilter = {
      category: 'health',
      subcategory: 'ngo'
    };
    
    const ngoCount = await collection.countDocuments(exactFilter);
    console.log(`\n🔍 DATABASE QUERY:`)
    console.log(`Documents matching filter ${JSON.stringify(exactFilter)}: ${ngoCount}`);
    
    if (ngoCount > 0) {
      // Get a sample
      const sample = await collection.findOne(exactFilter);
      console.log('\n📄 SAMPLE DOCUMENT:');
      console.log(JSON.stringify({
        _id: sample._id.toString(),
        title: sample.title,
        description: sample.description?.substring(0, 50) + '...',
        category: sample.category,
        subcategory: sample.subcategory,
        rating: sample.rating,
        tags: sample.tags
      }, null, 2));
      
      // Check all the rating values
      const ratingStats = await collection.aggregate([
        { $match: exactFilter },
        { $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            minRating: { $min: '$rating' },
            maxRating: { $max: '$rating' },
            countWithRating: { 
              $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] }
            },
            countWithoutRating: { 
              $sum: { $cond: [{ $eq: ['$rating', null] }, 1, 0] }
            }
          }
        }
      ]).toArray();
      
      if (ratingStats.length > 0) {
        console.log('\n📊 RATING STATISTICS:');
        console.log(`Average Rating: ${ratingStats[0].avgRating?.toFixed(2) || 'N/A'}`);
        console.log(`Min Rating: ${ratingStats[0].minRating || 'N/A'}`);
        console.log(`Max Rating: ${ratingStats[0].maxRating || 'N/A'}`);
        console.log(`NGOs with ratings: ${ratingStats[0].countWithRating}`);
        console.log(`NGOs without ratings: ${ratingStats[0].countWithoutRating}`);
      }
      
      // Simulate our component filtering
      console.log('\n🧪 SIMULATED FILTER TESTS:');
      
      // Test cases that simulate our component's filter logic
      const testFilters = [
        { showAll: true },
        { rating: '4+', showAll: false },
        { rating: '3+', showAll: false },
        { veteranFounded: true, showAll: false },
        { rating: '4+', veteranFounded: true, showAll: false }
      ];
      
      // Get all NGOs with our filter
      const allNgos = await collection.find(exactFilter).toArray();
      console.log(`Retrieved ${allNgos.length} NGOs from database for filter testing`);
      
      for (const filter of testFilters) {
        // Simulate our component's filtering logic
        const filteredNgos = allNgos.filter(ngo => {
          // Always show all NGOs when filters are reset
          if (filter.showAll) return true;
          
          // Apply rating filter with more permissive handling
          if (filter.rating === '4+') {
            const effectiveRating = typeof ngo.rating === 'number' ? ngo.rating : 4.2;
            if (effectiveRating < 4) return false;
          }
          
          if (filter.rating === '3+') {
            const effectiveRating = typeof ngo.rating === 'number' ? ngo.rating : 4.2;
            if (effectiveRating < 3) return false;
          }
          
          // Apply veteran founded filter with fallback
          if (filter.veteranFounded && ngo.veteranFounded === false) return false;
          
          return true;
        });
        
        console.log(`- Filter ${JSON.stringify(filter)}: ${filteredNgos.length} NGOs passed`);
      }
      
      // Check if we need to run the database update script again
      const needsRatings = await collection.countDocuments({
        ...exactFilter,
        rating: { $exists: false }
      });
      
      if (needsRatings > 0) {
        console.log(`\n⚠️ ATTENTION: ${needsRatings} NGOs still need ratings. Run the add-ngo-ratings.js script.`);
      } else {
        console.log(`\n✅ All NGOs have ratings assigned.`);
      }
      
      // Check if we should try to fix filter state
      console.log('\n📋 RECOMMENDATION:');
      console.log('1. Verify the initial filter state in NGOResourcesSection.tsx is set to showAll: true');
      console.log('2. Check that the Filter component is not automatically applying a rating filter on load');
      console.log('3. Make sure the "Show All" button explicitly resets all filters');
      console.log('4. Add a console.log right after fetching NGOs in the component to verify they are received');
    }
    
  } catch (err) {
    console.error('MongoDB Error:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

debugNGOFilters().catch(console.error);
