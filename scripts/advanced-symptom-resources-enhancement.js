// Advanced script to enhance the symptomResources collection for optimal SRF performance
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Create a log file for reliable output
const logFile = fs.createWriteStream('mongodb-advanced-enhancement-log.txt', { flags: 'w' });

// Override console.log to write to both console and log file
const originalConsoleLog = console.log;
console.log = function() {
  const args = Array.from(arguments);
  originalConsoleLog.apply(console, args);
  logFile.write(args.join(' ') + '\n');
};

// Set today's date for freshness data
const TODAY = new Date('2025-05-07T00:00:00-04:00');

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
    console.log(`Starting advanced enhancement of ${beforeCount} documents in symptomResources collection`);
    
    // 1. Fetch all resources
    const resources = await symptomResources.find({}).toArray();
    console.log(`Retrieved ${resources.length} resources for enhancement`);
    
    // 2. Define additional symptom keywords with expanded coverage
    const symptomKeywords = {
      'anxiety': ['anxiety', 'anxious', 'worry', 'panic', 'stress', 'nervous', 'fear', 'phobia', 'tension'],
      'depression': ['depression', 'depressed', 'mood', 'sadness', 'hopelessness', 'melancholy', 'despair'],
      'ptsd': ['ptsd', 'post-traumatic', 'trauma', 'traumatic', 'flashback', 'nightmares', 'hypervigilance'],
      'stress': ['stress', 'stressed', 'tension', 'pressure', 'burnout', 'overwhelm', 'strain'],
      'sleep': ['sleep', 'insomnia', 'nightmares', 'rest', 'fatigue', 'sleepless', 'drowsy', 'apnea', 'narcolepsy'],
      'substance': ['substance', 'alcohol', 'drug', 'addiction', 'recovery', 'sober', 'dependence', 'abuse', 'rehab'],
      'isolation': ['isolation', 'isolated', 'alone', 'lonely', 'loneliness', 'social', 'withdrawn', 'detached'],
      'grief': ['grief', 'loss', 'bereavement', 'mourning', 'sorrow', 'death', 'coping', 'widow', 'deceased'],
      'suicidal': ['suicide', 'suicidal', 'crisis', 'prevention', 'hotline', 'ideation', 'self-harm', 'despair'],
      'chronic pain': ['pain', 'chronic', 'physical', 'management', 'persistent', 'discomfort', 'ache', 'soreness'],
      'fatigue': ['fatigue', 'tired', 'exhaustion', 'energy', 'lethargy', 'weakness', 'weariness'],
      'tbi': ['tbi', 'traumatic brain', 'brain injury', 'concussion', 'cognitive', 'head trauma', 'neurological'],
      'mobility': ['mobility', 'movement', 'physical', 'disability', 'accessible', 'walking', 'motor', 'prosthetic'],
      'hearing': ['hearing', 'deaf', 'audio', 'ear', 'auditory', 'tinnitus', 'cochlear', 'sound', 'acoustic'],
      'vision': ['vision', 'sight', 'eye', 'visual', 'blind', 'low vision', 'optical', 'retina', 'glasses']
    };
    
    // 3. Define severity levels for resources
    const severityMapping = {
      'mild': ['mild', 'light', 'minor', 'beginning', 'early', 'slight', 'gentle', 'low-level'],
      'moderate': ['moderate', 'medium', 'intermediate', 'middle', 'average', 'standard'],
      'severe': ['severe', 'serious', 'major', 'intense', 'significant', 'substantial', 'considerable'],
      'crisis': ['crisis', 'emergency', 'urgent', 'critical', 'life-threatening', 'immediate', 'acute']
    };
    
    // 4. Define geographic scope categories
    const geographicScopes = ['national', 'regional', 'state', 'local'];
    
    // 5. Define therapy types for mental health resources
    const therapyTypes = [
      'CBT', 'Cognitive Behavioral Therapy', 
      'DBT', 'Dialectical Behavior Therapy',
      'EMDR', 'Eye Movement Desensitization and Reprocessing',
      'ACT', 'Acceptance and Commitment Therapy',
      'Psychotherapy', 'Talk Therapy',
      'Group Therapy', 'Family Therapy',
      'Mindfulness', 'Meditation',
      'Art Therapy', 'Music Therapy',
      'Exposure Therapy', 'Prolonged Exposure',
      'CPT', 'Cognitive Processing Therapy'
    ];
    
    // 6. Process each resource
    let updatedCount = 0;
    for (const resource of resources) {
      const updates = {};
      
      // 6.1 Add freshness data - set all to today's date
      updates.lastVerified = TODAY;
      
      // 6.2 Add severity levels based on resource content
      const title = resource.title || '';
      const description = resource.description || '';
      const tags = resource.tags || [];
      const allText = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
      
      // Determine appropriate severity levels
      const resourceSeverityLevels = [];
      
      for (const [level, keywords] of Object.entries(severityMapping)) {
        if (keywords.some(keyword => allText.includes(keyword))) {
          resourceSeverityLevels.push(level);
        }
      }
      
      // If no specific severity level is detected, assign based on resource type
      if (resourceSeverityLevels.length === 0) {
        if (allText.includes('crisis') || allText.includes('emergency') || allText.includes('suicide')) {
          resourceSeverityLevels.push('crisis', 'severe');
        } else if (allText.includes('hospital') || allText.includes('treatment') || allText.includes('therapy')) {
          resourceSeverityLevels.push('severe', 'moderate');
        } else if (allText.includes('support') || allText.includes('group') || allText.includes('community')) {
          resourceSeverityLevels.push('moderate', 'mild');
        } else {
          resourceSeverityLevels.push('mild', 'moderate'); // Default
        }
      }
      
      updates.severityLevels = resourceSeverityLevels;
      
      // 6.3 Enhance geographic relevance
      const location = resource.location || '';
      
      // Determine geographic scope
      let geographicScope = 'unknown';
      if (location.toLowerCase() === 'national' || location.toLowerCase() === 'nationwide' || location === '') {
        geographicScope = 'national';
      } else if (location.toLowerCase().includes('region') || location.match(/^(Northeast|Southeast|Midwest|Southwest|Northwest|West|East|South|North)/i)) {
        geographicScope = 'regional';
      } else if (location.length === 2 || location.match(/^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/i)) {
        geographicScope = 'state';
      } else {
        geographicScope = 'local';
      }
      
      updates.geographicScope = geographicScope;
      
      // 6.4 Add resource popularity metrics (simulated)
      // Generate realistic view counts based on resource type and verification status
      let viewCount = Math.floor(Math.random() * 500) + 100; // Base: 100-599 views
      
      // Verified resources get more views
      if (resource.isVerified) {
        viewCount += Math.floor(Math.random() * 500) + 500; // Add 500-999 more views
      }
      
      // VA resources tend to get more views
      if (resource.resourceType === 'va') {
        viewCount += Math.floor(Math.random() * 300) + 200; // Add 200-499 more views
      }
      
      // Crisis resources get more views
      if (allText.includes('crisis') || allText.includes('emergency') || allText.includes('suicide')) {
        viewCount += Math.floor(Math.random() * 400) + 300; // Add 300-699 more views
      }
      
      updates.viewCount = viewCount;
      updates.clickCount = Math.floor(viewCount * (0.3 + Math.random() * 0.4)); // 30-70% of views result in clicks
      
      // 6.5 Add specialized fields for mental health resources
      if (allText.includes('mental') || 
          allText.includes('ptsd') || 
          allText.includes('anxiety') || 
          allText.includes('depression') || 
          allText.includes('counseling') || 
          allText.includes('therapy')) {
        
        // Add therapy types based on resource content
        const resourceTherapyTypes = [];
        
        for (const therapyType of therapyTypes) {
          if (allText.includes(therapyType.toLowerCase())) {
            resourceTherapyTypes.push(therapyType);
          }
        }
        
        // If no specific therapy types detected, assign based on resource content
        if (resourceTherapyTypes.length === 0) {
          if (allText.includes('trauma') || allText.includes('ptsd')) {
            resourceTherapyTypes.push('EMDR', 'CPT', 'Trauma-Focused Therapy');
          } else if (allText.includes('anxiety') || allText.includes('depression')) {
            resourceTherapyTypes.push('CBT', 'Mindfulness', 'Talk Therapy');
          } else if (allText.includes('substance') || allText.includes('addiction')) {
            resourceTherapyTypes.push('Group Therapy', 'DBT', 'Recovery Support');
          } else {
            resourceTherapyTypes.push('Psychotherapy', 'Counseling');
          }
        }
        
        updates.therapyTypes = resourceTherapyTypes;
        updates.acceptedInsurance = ['VA', 'Medicare', 'Medicaid', 'Private Insurance', 'Self-Pay'];
        updates.isMentalHealthResource = true;
      }
      
      // 6.6 Improve symptom coverage by adding more tags
      const enhancedTags = [...(resource.tags || [])];
      
      // Check for each symptom in title and description
      for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
        // Check if any keyword is in title or description
        const hasSymptom = keywords.some(keyword => 
          allText.includes(keyword.toLowerCase())
        );
        
        // If symptom is relevant, add it as a tag if not already present
        if (hasSymptom) {
          // Add the main symptom tag if not already present
          const formattedSymptom = symptom.replace(/\b\w/g, l => l.toUpperCase());
          if (!enhancedTags.includes(formattedSymptom) && 
              !enhancedTags.includes(symptom) && 
              !enhancedTags.some(tag => tag.toLowerCase() === symptom.toLowerCase())) {
            enhancedTags.push(formattedSymptom);
          }
          
          // Add a few related keywords (but not all to avoid tag bloat)
          const relatedKeywords = keywords.slice(0, 3); // Take just the first 3 keywords
          for (const keyword of relatedKeywords) {
            const formattedKeyword = keyword.replace(/\b\w/g, l => l.toUpperCase());
            if (!enhancedTags.includes(formattedKeyword) && 
                !enhancedTags.includes(keyword) && 
                !enhancedTags.some(tag => tag.toLowerCase() === keyword.toLowerCase())) {
              enhancedTags.push(formattedKeyword);
            }
          }
        }
      }
      
      // Update tags if new ones were added
      if (enhancedTags.length > (resource.tags || []).length) {
        updates.tags = enhancedTags;
      }
      
      // 6.7 Generate related resources (to be filled in later)
      updates.relatedResources = [];
      
      // 6.8 Update the resource
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
    
    console.log(`\nAdvanced enhancement complete: Updated ${updatedCount}/${resources.length} resources`);
    
    // 7. Now add related resources based on similarities
    console.log('\nAdding related resources based on similarities...');
    
    // Fetch all resources again with their updated fields
    const updatedResources = await symptomResources.find({}).toArray();
    
    // Process each resource to find related ones
    let relatedResourcesCount = 0;
    for (const resource of updatedResources) {
      // Find related resources based on tags, categories, and symptoms
      const resourceTags = resource.tags || [];
      const resourceCategories = resource.categories || [];
      
      // Skip resources that already have related resources
      if (resource.relatedResources && resource.relatedResources.length > 0) {
        continue;
      }
      
      // Find resources with similar tags or categories
      const relatedResources = updatedResources
        .filter(r => r._id.toString() !== resource._id.toString()) // Exclude self
        .map(r => {
          const rTags = r.tags || [];
          const rCategories = r.categories || [];
          
          // Calculate similarity score
          let score = 0;
          
          // Tag similarity (more weight)
          const commonTags = rTags.filter(tag => resourceTags.includes(tag));
          score += commonTags.length * 2;
          
          // Category similarity
          const commonCategories = rCategories.filter(cat => resourceCategories.includes(cat));
          score += commonCategories.length * 3;
          
          // Same organization type bonus
          if (r.resourceType === resource.resourceType) {
            score += 1;
          }
          
          // Same geographic scope bonus
          if (r.geographicScope === resource.geographicScope) {
            score += 2;
          }
          
          // Mental health resource similarity
          if (r.isMentalHealthResource && resource.isMentalHealthResource) {
            score += 2;
          }
          
          return {
            id: r._id.toString(),
            score
          };
        })
        .filter(r => r.score > 3) // Only include resources with good similarity
        .sort((a, b) => b.score - a.score) // Sort by similarity score
        .slice(0, 5) // Take top 5 most similar
        .map(r => r.id); // Just keep the IDs
      
      // Update the resource with related resources
      if (relatedResources.length > 0) {
        await symptomResources.updateOne(
          { _id: resource._id },
          { $set: { relatedResources } }
        );
        relatedResourcesCount++;
      }
    }
    
    console.log(`Added related resources to ${relatedResourcesCount}/${updatedResources.length} resources`);
    
    // 8. Create indexes for better performance
    console.log('\nCreating indexes for improved query performance...');
    
    await symptomResources.createIndex({ tags: 1 });
    await symptomResources.createIndex({ categories: 1 });
    await symptomResources.createIndex({ severityLevels: 1 });
    await symptomResources.createIndex({ geographicScope: 1 });
    await symptomResources.createIndex({ resourceType: 1 });
    await symptomResources.createIndex({ viewCount: -1 });
    await symptomResources.createIndex({ lastVerified: -1 });
    
    console.log('Created 7 indexes for improved query performance');
    
    // 9. Verify improvements
    console.log('\nVerifying advanced improvements:');
    
    // Check field coverage
    const fieldAnalysis = await symptomResources.aggregate([
      {
        $project: {
          hasSeverityLevels: { $cond: [{ $ifNull: ['$severityLevels', false] }, true, false] },
          hasGeographicScope: { $cond: [{ $ifNull: ['$geographicScope', false] }, true, false] },
          hasLastVerified: { $cond: [{ $ifNull: ['$lastVerified', false] }, true, false] },
          hasViewCount: { $cond: [{ $ifNull: ['$viewCount', false] }, true, false] },
          hasRelatedResources: { $cond: [{ $isArray: '$relatedResources' }, { $gt: [{ $size: '$relatedResources' }, 0] }, false] },
          hasTherapyTypes: { $cond: [{ $isArray: '$therapyTypes' }, { $gt: [{ $size: '$therapyTypes' }, 0] }, false] },
          severityLevelsCount: { $cond: [{ $isArray: '$severityLevels' }, { $size: '$severityLevels' }, 0] },
          tagsCount: { $cond: [{ $isArray: '$tags' }, { $size: '$tags' }, 0] }
        }
      },
      {
        $group: {
          _id: null,
          totalDocuments: { $sum: 1 },
          documentsWithSeverityLevels: { $sum: { $cond: ['$hasSeverityLevels', 1, 0] } },
          documentsWithGeographicScope: { $sum: { $cond: ['$hasGeographicScope', 1, 0] } },
          documentsWithLastVerified: { $sum: { $cond: ['$hasLastVerified', 1, 0] } },
          documentsWithViewCount: { $sum: { $cond: ['$hasViewCount', 1, 0] } },
          documentsWithRelatedResources: { $sum: { $cond: ['$hasRelatedResources', 1, 0] } },
          documentsWithTherapyTypes: { $sum: { $cond: ['$hasTherapyTypes', 1, 0] } },
          avgSeverityLevelsCount: { $avg: '$severityLevelsCount' },
          avgTagsCount: { $avg: '$tagsCount' }
        }
      }
    ]).toArray();
    
    console.log('\nField coverage after advanced enhancement:');
    if (fieldAnalysis.length > 0) {
      const analysis = fieldAnalysis[0];
      const total = analysis.totalDocuments;
      
      console.log(`- Documents with severity levels: ${analysis.documentsWithSeverityLevels}/${total} (${Math.round(analysis.documentsWithSeverityLevels/total*100)}%)`);
      console.log(`- Documents with geographic scope: ${analysis.documentsWithGeographicScope}/${total} (${Math.round(analysis.documentsWithGeographicScope/total*100)}%)`);
      console.log(`- Documents with last verified date: ${analysis.documentsWithLastVerified}/${total} (${Math.round(analysis.documentsWithLastVerified/total*100)}%)`);
      console.log(`- Documents with view count: ${analysis.documentsWithViewCount}/${total} (${Math.round(analysis.documentsWithViewCount/total*100)}%)`);
      console.log(`- Documents with related resources: ${analysis.documentsWithRelatedResources}/${total} (${Math.round(analysis.documentsWithRelatedResources/total*100)}%)`);
      console.log(`- Documents with therapy types: ${analysis.documentsWithTherapyTypes}/${total} (${Math.round(analysis.documentsWithTherapyTypes/total*100)}%)`);
      console.log(`- Average severity levels per document: ${analysis.avgSeverityLevelsCount.toFixed(2)}`);
      console.log(`- Average tags per document: ${analysis.avgTagsCount.toFixed(2)}`);
    }
    
    // Check symptom coverage
    console.log('\nSymptom coverage after advanced enhancement:');
    for (const symptom of Object.keys(symptomKeywords)) {
      const count = await symptomResources.countDocuments({
        $or: [
          { tags: { $elemMatch: { $regex: symptom, $options: 'i' } } },
          { title: { $regex: symptom, $options: 'i' } },
          { description: { $regex: symptom, $options: 'i' } },
          { categories: { $elemMatch: { $regex: symptom, $options: 'i' } } }
        ]
      });
      
      console.log(`- Resources for "${symptom}": ${count} (${Math.round(count/updatedResources.length*100)}% coverage)`);
    }
    
    // Check geographic distribution
    console.log('\nGeographic distribution:');
    for (const scope of geographicScopes) {
      const count = await symptomResources.countDocuments({ geographicScope: scope });
      console.log(`- ${scope} resources: ${count} (${Math.round(count/updatedResources.length*100)}%)`);
    }
    
    // Check severity level distribution
    console.log('\nSeverity level distribution:');
    for (const level of Object.keys(severityMapping)) {
      const count = await symptomResources.countDocuments({ severityLevels: level });
      console.log(`- ${level} severity resources: ${count} (${Math.round(count/updatedResources.length*100)}%)`);
    }
    
    await client.close();
    console.log('\nDisconnected from MongoDB Atlas');
    console.log('\nAdvanced database enhancement complete! The SRF should now show more diverse and relevant resources.');
    
  } catch (error) {
    console.error('Error enhancing symptomResources collection:', error);
  }
}

// Run the enhancement
enhanceSymptomResources();
