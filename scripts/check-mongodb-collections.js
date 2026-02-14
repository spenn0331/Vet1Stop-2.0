// Script to analyze MongoDB collections for the Symptom-Based Resource Finder
const { MongoClient } = require('mongodb');

async function analyzeCollection() {
  try {
    // Connection URI (using the same connection string from the application)
    const uri = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/';
    const client = await MongoClient.connect(uri);
    console.log('Connected to MongoDB Atlas');
    
    // Get database
    const db = client.db('vet1stop');
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check symptomResources collection
    const symptomResources = db.collection('symptomResources');
    const healthResources = db.collection('healthResources');
    
    // Count documents in each collection
    const symptomCount = await symptomResources.countDocuments();
    const healthCount = await healthResources.countDocuments();
    
    console.log(`\nCollection counts:`);
    console.log(`- symptomResources: ${symptomCount} documents`);
    console.log(`- healthResources: ${healthCount} documents`);
    
    // Analyze symptomResources collection if it exists
    if (symptomCount > 0) {
      console.log('\n=== Analyzing symptomResources collection ===');
      
      // Check for required fields
      const fieldAnalysis = await symptomResources.aggregate([
        {
          $project: {
            hasId: { $cond: [{ $ifNull: ['$_id', false] }, true, false] },
            hasTitle: { $cond: [{ $ifNull: ['$title', false] }, true, false] },
            hasDescription: { $cond: [{ $ifNull: ['$description', false] }, true, false] },
            hasCategory: { $cond: [{ $ifNull: ['$category', false] }, true, false] },
            hasCategories: { $cond: [{ $ifNull: ['$categories', false] }, true, false] },
            hasTags: { $cond: [{ $ifNull: ['$tags', false] }, true, false] },
            hasRating: { $cond: [{ $ifNull: ['$rating', false] }, true, false] },
            hasOrganization: { $cond: [{ $ifNull: ['$organization', false] }, true, false] },
            hasResourceType: { $cond: [{ $ifNull: ['$resourceType', false] }, true, false] },
            hasIsVerified: { $cond: [{ $ifNull: ['$isVerified', false] }, true, false] },
            tagsCount: { $cond: [{ $isArray: '$tags' }, { $size: '$tags' }, 0] },
            categoriesCount: { $cond: [{ $isArray: '$categories' }, { $size: '$categories' }, 0] }
          }
        },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            documentsWithId: { $sum: { $cond: ['$hasId', 1, 0] } },
            documentsWithTitle: { $sum: { $cond: ['$hasTitle', 1, 0] } },
            documentsWithDescription: { $sum: { $cond: ['$hasDescription', 1, 0] } },
            documentsWithCategory: { $sum: { $cond: ['$hasCategory', 1, 0] } },
            documentsWithCategories: { $sum: { $cond: ['$hasCategories', 1, 0] } },
            documentsWithTags: { $sum: { $cond: ['$hasTags', 1, 0] } },
            documentsWithRating: { $sum: { $cond: ['$hasRating', 1, 0] } },
            documentsWithOrganization: { $sum: { $cond: ['$hasOrganization', 1, 0] } },
            documentsWithResourceType: { $sum: { $cond: ['$hasResourceType', 1, 0] } },
            documentsWithIsVerified: { $sum: { $cond: ['$hasIsVerified', 1, 0] } },
            avgTagsCount: { $avg: '$tagsCount' },
            avgCategoriesCount: { $avg: '$categoriesCount' }
          }
        }
      ]).toArray();
      
      console.log('\nField coverage analysis:');
      if (fieldAnalysis.length > 0) {
        const analysis = fieldAnalysis[0];
        const total = analysis.totalDocuments;
        
        console.log(`- Documents with title: ${analysis.documentsWithTitle}/${total} (${Math.round(analysis.documentsWithTitle/total*100)}%)`);
        console.log(`- Documents with description: ${analysis.documentsWithDescription}/${total} (${Math.round(analysis.documentsWithDescription/total*100)}%)`);
        console.log(`- Documents with category: ${analysis.documentsWithCategory}/${total} (${Math.round(analysis.documentsWithCategory/total*100)}%)`);
        console.log(`- Documents with categories array: ${analysis.documentsWithCategories}/${total} (${Math.round(analysis.documentsWithCategories/total*100)}%)`);
        console.log(`- Documents with tags: ${analysis.documentsWithTags}/${total} (${Math.round(analysis.documentsWithTags/total*100)}%)`);
        console.log(`- Documents with rating: ${analysis.documentsWithRating}/${total} (${Math.round(analysis.documentsWithRating/total*100)}%)`);
        console.log(`- Documents with organization: ${analysis.documentsWithOrganization}/${total} (${Math.round(analysis.documentsWithOrganization/total*100)}%)`);
        console.log(`- Documents with resourceType: ${analysis.documentsWithResourceType}/${total} (${Math.round(analysis.documentsWithResourceType/total*100)}%)`);
        console.log(`- Documents with isVerified: ${analysis.documentsWithIsVerified}/${total} (${Math.round(analysis.documentsWithIsVerified/total*100)}%)`);
        console.log(`- Average tags per document: ${analysis.avgTagsCount.toFixed(2)}`);
        console.log(`- Average categories per document: ${analysis.avgCategoriesCount.toFixed(2)}`);
      }
      
      // Check for symptom coverage
      const commonSymptoms = [
        'anxiety', 'depression', 'ptsd', 'stress', 'sleep', 'substance', 'isolation', 'loneliness', 
        'grief', 'suicidal', 'chronic pain', 'fatigue', 'tbi', 'mobility', 'hearing', 'vision'
      ];
      
      console.log('\nSymptom coverage analysis:');
      for (const symptom of commonSymptoms) {
        const count = await symptomResources.countDocuments({
          $or: [
            { tags: { $elemMatch: { $regex: symptom, $options: 'i' } } },
            { title: { $regex: symptom, $options: 'i' } },
            { description: { $regex: symptom, $options: 'i' } },
            { categories: { $elemMatch: { $regex: symptom, $options: 'i' } } }
          ]
        });
        
        console.log(`- Resources for "${symptom}": ${count} (${Math.round(count/symptomCount*100)}% coverage)`);
      }
      
      // Check for organization type distribution
      const vaCount = await symptomResources.countDocuments({
        $or: [
          { organization: { $regex: 'va|veterans affairs|veterans health', $options: 'i' } },
          { title: { $regex: 'va |veterans affairs|veterans health', $options: 'i' } },
          { resourceType: { $regex: 'va', $options: 'i' } },
          { category: { $regex: 'va', $options: 'i' } }
        ]
      });
      
      const ngoCount = await symptomResources.countDocuments({
        $and: [
          { organization: { $not: { $regex: 'va|veterans affairs|veterans health', $options: 'i' } } },
          { title: { $not: { $regex: 'va |veterans affairs|veterans health', $options: 'i' } } },
          { $or: [
            { resourceType: { $regex: 'ngo', $options: 'i' } },
            { category: { $regex: 'ngo', $options: 'i' } }
          ]}
        ]
      });
      
      console.log('\nOrganization type distribution:');
      console.log(`- VA resources: ${vaCount} (${Math.round(vaCount/symptomCount*100)}%)`);
      console.log(`- NGO resources: ${ngoCount} (${Math.round(ngoCount/symptomCount*100)}%)`);
      console.log(`- Other/Unclassified: ${symptomCount - vaCount - ngoCount} (${Math.round((symptomCount - vaCount - ngoCount)/symptomCount*100)}%)`);
      
      // Sample documents
      console.log('\nSample documents:');
      const samples = await symptomResources.find().limit(2).toArray();
      console.log(JSON.stringify(samples, null, 2));
    } else {
      console.log('\nThe symptomResources collection is empty. Analyzing healthResources instead.');
      
      // Analyze healthResources collection instead
      console.log('\n=== Analyzing healthResources collection ===');
      
      // Check for required fields
      const fieldAnalysis = await healthResources.aggregate([
        {
          $project: {
            hasId: { $cond: [{ $ifNull: ['$_id', false] }, true, false] },
            hasTitle: { $cond: [{ $ifNull: ['$title', false] }, true, false] },
            hasDescription: { $cond: [{ $ifNull: ['$description', false] }, true, false] },
            hasCategory: { $cond: [{ $ifNull: ['$category', false] }, true, false] },
            hasCategories: { $cond: [{ $ifNull: ['$categories', false] }, true, false] },
            hasTags: { $cond: [{ $ifNull: ['$tags', false] }, true, false] },
            hasRating: { $cond: [{ $ifNull: ['$rating', false] }, true, false] },
            hasOrganization: { $cond: [{ $ifNull: ['$organization', false] }, true, false] },
            hasResourceType: { $cond: [{ $ifNull: ['$resourceType', false] }, true, false] },
            hasIsVerified: { $cond: [{ $ifNull: ['$isVerified', false] }, true, false] },
            tagsCount: { $cond: [{ $isArray: '$tags' }, { $size: '$tags' }, 0] },
            categoriesCount: { $cond: [{ $isArray: '$categories' }, { $size: '$categories' }, 0] }
          }
        },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            documentsWithId: { $sum: { $cond: ['$hasId', 1, 0] } },
            documentsWithTitle: { $sum: { $cond: ['$hasTitle', 1, 0] } },
            documentsWithDescription: { $sum: { $cond: ['$hasDescription', 1, 0] } },
            documentsWithCategory: { $sum: { $cond: ['$hasCategory', 1, 0] } },
            documentsWithCategories: { $sum: { $cond: ['$hasCategories', 1, 0] } },
            documentsWithTags: { $sum: { $cond: ['$hasTags', 1, 0] } },
            documentsWithRating: { $sum: { $cond: ['$hasRating', 1, 0] } },
            documentsWithOrganization: { $sum: { $cond: ['$hasOrganization', 1, 0] } },
            documentsWithResourceType: { $sum: { $cond: ['$hasResourceType', 1, 0] } },
            documentsWithIsVerified: { $sum: { $cond: ['$hasIsVerified', 1, 0] } },
            avgTagsCount: { $avg: '$tagsCount' },
            avgCategoriesCount: { $avg: '$categoriesCount' }
          }
        }
      ]).toArray();
      
      console.log('\nField coverage analysis:');
      if (fieldAnalysis.length > 0) {
        const analysis = fieldAnalysis[0];
        const total = analysis.totalDocuments;
        
        console.log(`- Documents with title: ${analysis.documentsWithTitle}/${total} (${Math.round(analysis.documentsWithTitle/total*100)}%)`);
        console.log(`- Documents with description: ${analysis.documentsWithDescription}/${total} (${Math.round(analysis.documentsWithDescription/total*100)}%)`);
        console.log(`- Documents with category: ${analysis.documentsWithCategory}/${total} (${Math.round(analysis.documentsWithCategory/total*100)}%)`);
        console.log(`- Documents with categories array: ${analysis.documentsWithCategories}/${total} (${Math.round(analysis.documentsWithCategories/total*100)}%)`);
        console.log(`- Documents with tags: ${analysis.documentsWithTags}/${total} (${Math.round(analysis.documentsWithTags/total*100)}%)`);
        console.log(`- Documents with rating: ${analysis.documentsWithRating}/${total} (${Math.round(analysis.documentsWithRating/total*100)}%)`);
        console.log(`- Documents with organization: ${analysis.documentsWithOrganization}/${total} (${Math.round(analysis.documentsWithOrganization/total*100)}%)`);
        console.log(`- Documents with resourceType: ${analysis.documentsWithResourceType}/${total} (${Math.round(analysis.documentsWithResourceType/total*100)}%)`);
        console.log(`- Documents with isVerified: ${analysis.documentsWithIsVerified}/${total} (${Math.round(analysis.documentsWithIsVerified/total*100)}%)`);
        console.log(`- Average tags per document: ${analysis.avgTagsCount.toFixed(2)}`);
        console.log(`- Average categories per document: ${analysis.avgCategoriesCount.toFixed(2)}`);
      }
      
      // Sample documents
      console.log('\nSample documents:');
      const samples = await healthResources.find().limit(2).toArray();
      console.log(JSON.stringify(samples, null, 2));
    }
    
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('Error analyzing MongoDB collections:', error);
  }
}

// Run the analysis
analyzeCollection();
