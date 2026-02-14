// Script to enhance the symptomResources collection for better SRF performance
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Create a log file for reliable output
const logFile = fs.createWriteStream('mongodb-enhancement-log.txt', { flags: 'w' });

// Override console.log to write to both console and log file
const originalConsoleLog = console.log;
console.log = function() {
  const args = Array.from(arguments);
  originalConsoleLog.apply(console, args);
  logFile.write(args.join(' ') + '\n');
};

async function enhanceSymptomResources() {
  try {
    // Connection URI
    const uri = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/';
    const client = await MongoClient.connect(uri);
    console.log('Connected to MongoDB Atlas');
    
    // Get database
    const db = client.db('vet1stop');
    
    // Get symptomResources collection
    const symptomResources = db.collection('symptomResources');
    
    // Count documents before enhancement
    const beforeCount = await symptomResources.countDocuments();
    console.log(`Starting enhancement of ${beforeCount} documents in symptomResources collection`);
    
    // 1. Fetch all resources
    const resources = await symptomResources.find({}).toArray();
    console.log(`Retrieved ${resources.length} resources for enhancement`);
    
    // 2. Define organization patterns for classification
    const vaPatterns = [
      /\bva\b/i, 
      /veterans affairs/i, 
      /veterans health/i, 
      /veterans administration/i,
      /department of veterans/i
    ];
    
    const ngoPatterns = [
      /foundation/i,
      /association/i,
      /society/i,
      /nonprofit/i,
      /non-profit/i,
      /ngo/i,
      /organization/i,
      /institute/i,
      /center/i,
      /coalition/i,
      /alliance/i,
      /network/i,
      /project/i,
      /program/i,
      /service/i,
      /trust/i,
      /charity/i
    ];
    
    // 3. Define common symptom keywords to expand tags
    const symptomKeywords = {
      'anxiety': ['anxiety', 'anxious', 'worry', 'panic', 'stress', 'nervous'],
      'depression': ['depression', 'depressed', 'mood', 'sadness', 'hopelessness'],
      'ptsd': ['ptsd', 'post-traumatic', 'trauma', 'traumatic', 'flashback'],
      'stress': ['stress', 'stressed', 'tension', 'pressure', 'burnout'],
      'sleep': ['sleep', 'insomnia', 'nightmares', 'rest', 'fatigue'],
      'substance': ['substance', 'alcohol', 'drug', 'addiction', 'recovery', 'sober'],
      'isolation': ['isolation', 'isolated', 'alone', 'lonely', 'loneliness', 'social'],
      'grief': ['grief', 'loss', 'bereavement', 'mourning'],
      'suicidal': ['suicide', 'suicidal', 'crisis', 'prevention', 'hotline'],
      'chronic pain': ['pain', 'chronic', 'physical', 'management'],
      'fatigue': ['fatigue', 'tired', 'exhaustion', 'energy'],
      'tbi': ['tbi', 'traumatic brain', 'brain injury', 'concussion', 'cognitive'],
      'mobility': ['mobility', 'movement', 'physical', 'disability', 'accessible'],
      'hearing': ['hearing', 'deaf', 'audio', 'ear', 'auditory'],
      'vision': ['vision', 'sight', 'eye', 'visual', 'blind']
    };
    
    // 4. Define common categories for resources
    const categoryMappings = {
      'health': ['Health Care', 'Healthcare', 'Medical', 'Wellness', 'Physical Health', 'Mental Health'],
      'mental': ['Mental Health', 'Behavioral Health', 'Psychological', 'Counseling', 'Therapy'],
      'physical': ['Physical Health', 'Medical Care', 'Healthcare', 'Rehabilitation', 'Physical Therapy'],
      'crisis': ['Crisis Services', 'Emergency', 'Hotline', 'Immediate Help', 'Urgent Care'],
      'support': ['Support Services', 'Assistance', 'Aid', 'Help', 'Resources'],
      'community': ['Community Services', 'Local Support', 'Social Services', 'Community Resources'],
      'family': ['Family Services', 'Family Support', 'Dependents', 'Caregiver', 'Spouse']
    };
    
    // 5. Process each resource
    let updatedCount = 0;
    for (const resource of resources) {
      const updates = {};
      let tagsAdded = false;
      let categoriesAdded = false;
      
      // 5.1 Determine organization type and add organization field if missing
      if (!resource.organization) {
        // Try to extract organization from title or description
        const title = resource.title || '';
        const description = resource.description || '';
        
        // Check if it's a VA resource
        const isVA = vaPatterns.some(pattern => 
          pattern.test(title) || pattern.test(description) || 
          (resource.tags && resource.tags.some(tag => pattern.test(tag)))
        );
        
        // Check if it's an NGO resource
        const isNGO = !isVA && ngoPatterns.some(pattern => 
          pattern.test(title) || pattern.test(description) ||
          (resource.tags && resource.tags.some(tag => pattern.test(tag)))
        );
        
        // Set organization based on detection
        if (isVA) {
          updates.organization = 'Department of Veterans Affairs';
          updates.resourceType = 'va';
        } else if (isNGO) {
          // Extract organization name from title if possible
          const orgName = title.split('-')[0].trim();
          updates.organization = orgName;
          updates.resourceType = 'ngo';
        } else {
          updates.organization = 'Other Support Service';
          updates.resourceType = 'other';
        }
      }
      
      // 5.2 Add isVerified field if missing
      if (resource.isVerified === undefined) {
        // VA resources are automatically verified
        updates.isVerified = updates.resourceType === 'va' || 
                            resource.resourceType === 'va' || 
                            (resource.organization && /va|veterans affairs/i.test(resource.organization));
      }
      
      // 5.3 Add categories array if missing
      if (!resource.categories || !Array.isArray(resource.categories) || resource.categories.length === 0) {
        const categories = [];
        const category = resource.category ? resource.category.toLowerCase() : '';
        const title = resource.title ? resource.title.toLowerCase() : '';
        const description = resource.description ? resource.description.toLowerCase() : '';
        
        // Add primary category based on resource.category
        if (category) {
          if (categoryMappings[category]) {
            categories.push(...categoryMappings[category]);
          } else {
            // Capitalize first letter of each word
            categories.push(category.replace(/\b\w/g, l => l.toUpperCase()));
          }
        }
        
        // Add mental health category if relevant
        if (/mental|ptsd|anxiety|depression|stress|counseling|therapy/i.test(title) || 
            /mental|ptsd|anxiety|depression|stress|counseling|therapy/i.test(description) ||
            (resource.tags && resource.tags.some(tag => 
              /mental|ptsd|anxiety|depression|stress|counseling|therapy/i.test(tag)
            ))) {
          if (!categories.includes('Mental Health')) {
            categories.push('Mental Health');
          }
        }
        
        // Add physical health category if relevant
        if (/physical|medical|health|care|treatment|therapy|rehabilitation/i.test(title) || 
            /physical|medical|health|care|treatment|therapy|rehabilitation/i.test(description) ||
            (resource.tags && resource.tags.some(tag => 
              /physical|medical|health|care|treatment|therapy|rehabilitation/i.test(tag)
            ))) {
          if (!categories.includes('Physical Health') && !categories.includes('Healthcare')) {
            categories.push('Physical Health');
          }
        }
        
        // Add crisis category if relevant
        if (/crisis|emergency|urgent|hotline|suicide|immediate/i.test(title) || 
            /crisis|emergency|urgent|hotline|suicide|immediate/i.test(description) ||
            (resource.tags && resource.tags.some(tag => 
              /crisis|emergency|urgent|hotline|suicide|immediate/i.test(tag)
            ))) {
          if (!categories.includes('Crisis Services')) {
            categories.push('Crisis Services');
          }
        }
        
        // Deduplicate categories
        const uniqueCategories = [...new Set(categories)];
        if (uniqueCategories.length > 0) {
          updates.categories = uniqueCategories;
          categoriesAdded = true;
        }
      }
      
      // 5.4 Enhance tags with symptom keywords
      if (resource.tags && Array.isArray(resource.tags)) {
        const enhancedTags = [...resource.tags];
        const title = resource.title ? resource.title.toLowerCase() : '';
        const description = resource.description ? resource.description.toLowerCase() : '';
        
        // Check for each symptom in title, description, and existing tags
        for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
          // Check if any keyword is in title or description
          const hasSymptom = keywords.some(keyword => 
            title.includes(keyword) || description.includes(keyword) ||
            resource.tags.some(tag => tag.toLowerCase().includes(keyword))
          );
          
          // If symptom is relevant, add all its keywords as tags
          if (hasSymptom) {
            for (const keyword of keywords) {
              // Capitalize first letter of each word for consistency
              const formattedKeyword = keyword.replace(/\b\w/g, l => l.toUpperCase());
              if (!enhancedTags.includes(formattedKeyword) && 
                  !enhancedTags.includes(keyword) && 
                  !enhancedTags.some(tag => tag.toLowerCase() === keyword.toLowerCase())) {
                enhancedTags.push(formattedKeyword);
                tagsAdded = true;
              }
            }
          }
        }
        
        // Add organization type as tag if not already present
        if (updates.resourceType === 'va' && 
            !enhancedTags.includes('VA') && 
            !enhancedTags.includes('Veterans Affairs')) {
          enhancedTags.push('VA');
          tagsAdded = true;
        } else if (updates.resourceType === 'ngo' && 
                  !enhancedTags.includes('NGO') && 
                  !enhancedTags.includes('Non-Profit')) {
          enhancedTags.push('NGO');
          tagsAdded = true;
        }
        
        // Update tags if new ones were added
        if (tagsAdded) {
          updates.tags = enhancedTags;
        }
      }
      
      // 5.5 Add rating if missing
      if (resource.rating === undefined) {
        // Assign rating based on verification status and organization type
        if (updates.isVerified || resource.isVerified) {
          updates.rating = 4.5; // Higher rating for verified resources
        } else if (updates.resourceType === 'va' || resource.resourceType === 'va') {
          updates.rating = 4.3; // Good rating for VA resources
        } else if (updates.resourceType === 'ngo' || resource.resourceType === 'ngo') {
          updates.rating = 4.2; // Good rating for NGO resources
        } else {
          updates.rating = 4.0; // Default rating for other resources
        }
      }
      
      // 5.6 Update the resource if changes were made
      if (Object.keys(updates).length > 0) {
        await symptomResources.updateOne(
          { _id: resource._id },
          { $set: updates }
        );
        updatedCount++;
        
        // Log progress every 10 documents
        if (updatedCount % 10 === 0) {
          console.log(`Updated ${updatedCount}/${resources.length} resources`);
        }
      }
    }
    
    console.log(`\nEnhancement complete: Updated ${updatedCount}/${resources.length} resources`);
    
    // 6. Verify improvements
    console.log('\nVerifying improvements:');
    
    // Check organization type distribution
    const vaCount = await symptomResources.countDocuments({ resourceType: 'va' });
    const ngoCount = await symptomResources.countDocuments({ resourceType: 'ngo' });
    const otherCount = await symptomResources.countDocuments({ resourceType: 'other' });
    
    console.log('\nOrganization type distribution after enhancement:');
    console.log(`- VA resources: ${vaCount} (${Math.round(vaCount/resources.length*100)}%)`);
    console.log(`- NGO resources: ${ngoCount} (${Math.round(ngoCount/resources.length*100)}%)`);
    console.log(`- Other resources: ${otherCount} (${Math.round(otherCount/resources.length*100)}%)`);
    
    // Check field coverage
    const fieldAnalysis = await symptomResources.aggregate([
      {
        $project: {
          hasOrganization: { $cond: [{ $ifNull: ['$organization', false] }, true, false] },
          hasResourceType: { $cond: [{ $ifNull: ['$resourceType', false] }, true, false] },
          hasIsVerified: { $cond: [{ $ifNull: ['$isVerified', false] }, true, false] },
          hasCategories: { $cond: [{ $ifNull: ['$categories', false] }, true, false] },
          hasRating: { $cond: [{ $ifNull: ['$rating', false] }, true, false] },
          categoriesCount: { $cond: [{ $isArray: '$categories' }, { $size: '$categories' }, 0] },
          tagsCount: { $cond: [{ $isArray: '$tags' }, { $size: '$tags' }, 0] }
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          documentsWithOrganization: { $sum: { $cond: ['$hasOrganization', 1, 0] } },
          documentsWithResourceType: { $sum: { $cond: ['$hasResourceType', 1, 0] } },
          documentsWithIsVerified: { $sum: { $cond: ['$hasIsVerified', 1, 0] } },
          documentsWithCategories: { $sum: { $cond: ['$hasCategories', 1, 0] } },
          documentsWithRating: { $sum: { $cond: ['$hasRating', 1, 0] } },
          avgCategoriesCount: { $avg: '$categoriesCount' },
          avgTagsCount: { $avg: '$tagsCount' }
        }
      }
    ]).toArray();
    
    console.log('\nField coverage after enhancement:');
    if (fieldAnalysis.length > 0) {
      const analysis = fieldAnalysis[0];
      const total = analysis.totalDocuments;
      
      console.log(`- Documents with organization: ${analysis.documentsWithOrganization}/${total} (${Math.round(analysis.documentsWithOrganization/total*100)}%)`);
      console.log(`- Documents with resourceType: ${analysis.documentsWithResourceType}/${total} (${Math.round(analysis.documentsWithResourceType/total*100)}%)`);
      console.log(`- Documents with isVerified: ${analysis.documentsWithIsVerified}/${total} (${Math.round(analysis.documentsWithIsVerified/total*100)}%)`);
      console.log(`- Documents with categories array: ${analysis.documentsWithCategories}/${total} (${Math.round(analysis.documentsWithCategories/total*100)}%)`);
      console.log(`- Documents with rating: ${analysis.documentsWithRating}/${total} (${Math.round(analysis.documentsWithRating/total*100)}%)`);
      console.log(`- Average categories per document: ${analysis.avgCategoriesCount.toFixed(2)}`);
      console.log(`- Average tags per document: ${analysis.avgTagsCount.toFixed(2)}`);
    }
    
    // Check symptom coverage
    console.log('\nSymptom coverage after enhancement:');
    for (const symptom of Object.keys(symptomKeywords)) {
      const count = await symptomResources.countDocuments({
        $or: [
          { tags: { $elemMatch: { $regex: symptom, $options: 'i' } } },
          { title: { $regex: symptom, $options: 'i' } },
          { description: { $regex: symptom, $options: 'i' } },
          { categories: { $elemMatch: { $regex: symptom, $options: 'i' } } }
        ]
      });
      
      console.log(`- Resources for "${symptom}": ${count} (${Math.round(count/resources.length*100)}% coverage)`);
    }
    
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
    console.log('\nDatabase enhancement complete! The SRF should now show more diverse resources.');
    
  } catch (error) {
    console.error('Error enhancing symptomResources collection:', error);
  }
}

// Run the enhancement
enhanceSymptomResources();
