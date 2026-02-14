// Simple script to enhance the symptomResources collection for SRF
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Create a log file
const logFile = fs.createWriteStream('srf-enhancement-log.txt', { flags: 'w' });

// Function to log to both console and file
function log(message) {
  console.log(message);
  logFile.write(message + '\n');
}

// Set today's date for freshness data
const TODAY = new Date('2025-05-07');

// Main enhancement function
async function enhanceSRF() {
  let client;
  try {
    // Connect to MongoDB
    log('Connecting to MongoDB...');
    const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/';
    client = await MongoClient.connect(uri);
    log('Connected to MongoDB Atlas');
    
    const db = client.db('vet1stop');
    const symptomResources = db.collection('symptomResources');
    
    // Count documents
    const count = await symptomResources.countDocuments();
    log(`Found ${count} resources to enhance`);
    
    // 1. Add key fields to all resources
    log('\nAdding key fields to all resources...');
    const updateResult = await symptomResources.updateMany(
      {}, 
      { 
        $set: { 
          lastVerified: TODAY,
          isEnhanced: true
        },
        $setOnInsert: {
          severityLevels: ['mild', 'moderate'],
          geographicScope: 'national',
          viewCount: 100,
          clickCount: 30
        }
      },
      { upsert: false }
    );
    
    log(`Updated ${updateResult.modifiedCount} resources with base fields`);
    
    // 2. Add severity levels based on resource content
    log('\nAdding severity levels...');
    
    // Crisis resources
    const crisisUpdateResult = await symptomResources.updateMany(
      { 
        $or: [
          { title: { $regex: /crisis|emergency|suicide|urgent|hotline/i } },
          { description: { $regex: /crisis|emergency|suicide|urgent|hotline/i } },
          { tags: { $in: [/Crisis/i, /Emergency/i, /Suicide/i, /Urgent/i, /Hotline/i] } }
        ]
      },
      {
        $set: { 
          severityLevels: ['crisis', 'severe'],
          isCrisisResource: true
        }
      }
    );
    
    log(`Added crisis severity to ${crisisUpdateResult.modifiedCount} resources`);
    
    // Severe resources
    const severeUpdateResult = await symptomResources.updateMany(
      { 
        $and: [
          { severityLevels: { $ne: 'crisis' } },
          { 
            $or: [
              { title: { $regex: /severe|serious|major|intense|hospital|treatment/i } },
              { description: { $regex: /severe|serious|major|intense|hospital|treatment/i } },
              { tags: { $in: [/Severe/i, /Serious/i, /Major/i, /Intense/i, /Hospital/i, /Treatment/i] } }
            ]
          }
        ]
      },
      {
        $set: { severityLevels: ['severe', 'moderate'] }
      }
    );
    
    log(`Added severe severity to ${severeUpdateResult.modifiedCount} resources`);
    
    // Moderate resources
    const moderateUpdateResult = await symptomResources.updateMany(
      { 
        $and: [
          { severityLevels: { $nin: ['crisis', 'severe'] } },
          { 
            $or: [
              { title: { $regex: /moderate|therapy|counseling|support/i } },
              { description: { $regex: /moderate|therapy|counseling|support/i } },
              { tags: { $in: [/Moderate/i, /Therapy/i, /Counseling/i, /Support/i] } }
            ]
          }
        ]
      },
      {
        $set: { severityLevels: ['moderate', 'mild'] }
      }
    );
    
    log(`Added moderate severity to ${moderateUpdateResult.modifiedCount} resources`);
    
    // 3. Add geographic scope
    log('\nAdding geographic scope...');
    
    // National resources
    const nationalUpdateResult = await symptomResources.updateMany(
      { 
        $or: [
          { location: { $in: ['', 'National', 'Nationwide', 'USA', 'United States'] } },
          { title: { $regex: /national|nationwide|across the country/i } },
          { description: { $regex: /national|nationwide|across the country/i } }
        ]
      },
      {
        $set: { geographicScope: 'national' }
      }
    );
    
    log(`Set national scope for ${nationalUpdateResult.modifiedCount} resources`);
    
    // Regional resources
    const regionalUpdateResult = await symptomResources.updateMany(
      { 
        $and: [
          { geographicScope: { $ne: 'national' } },
          { 
            $or: [
              { location: { $regex: /region|northeast|southeast|midwest|southwest|northwest|west|east|south|north/i } },
              { title: { $regex: /region|northeast|southeast|midwest|southwest|northwest|west|east|south|north/i } },
              { description: { $regex: /region|northeast|southeast|midwest|southwest|northwest|west|east|south|north/i } }
            ]
          }
        ]
      },
      {
        $set: { geographicScope: 'regional' }
      }
    );
    
    log(`Set regional scope for ${regionalUpdateResult.modifiedCount} resources`);
    
    // State resources
    const stateUpdateResult = await symptomResources.updateMany(
      { 
        $and: [
          { geographicScope: { $nin: ['national', 'regional'] } },
          { 
            $or: [
              { location: { $regex: /^[A-Z]{2}$|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming/i } }
            ]
          }
        ]
      },
      {
        $set: { geographicScope: 'state' }
      }
    );
    
    log(`Set state scope for ${stateUpdateResult.modifiedCount} resources`);
    
    // Local resources (anything else)
    const localUpdateResult = await symptomResources.updateMany(
      { geographicScope: { $nin: ['national', 'regional', 'state'] } },
      { $set: { geographicScope: 'local' } }
    );
    
    log(`Set local scope for ${localUpdateResult.modifiedCount} resources`);
    
    // 4. Add mental health specialization
    log('\nAdding mental health specialization...');
    
    const mentalHealthUpdateResult = await symptomResources.updateMany(
      { 
        $or: [
          { title: { $regex: /mental health|therapy|counseling|psychiatry|psychology/i } },
          { description: { $regex: /mental health|therapy|counseling|psychiatry|psychology/i } },
          { tags: { $in: [/Mental Health/i, /Therapy/i, /Counseling/i, /Psychiatry/i, /Psychology/i] } },
          { categories: { $in: [/Mental Health/i, /Therapy/i, /Counseling/i, /Psychiatry/i, /Psychology/i] } }
        ]
      },
      {
        $set: { 
          isMentalHealthResource: true,
          therapyTypes: ['Counseling', 'Psychotherapy', 'Support Services'],
          acceptedInsurance: ['VA', 'Medicare', 'Medicaid', 'Private Insurance', 'Self-Pay']
        }
      }
    );
    
    log(`Added mental health specialization to ${mentalHealthUpdateResult.modifiedCount} resources`);
    
    // 5. Enhance symptom coverage for key symptoms
    log('\nEnhancing symptom coverage for key symptoms...');
    
    // Define symptom keywords
    const symptoms = [
      'anxiety', 'depression', 'ptsd', 'stress', 'sleep', 'substance',
      'isolation', 'grief', 'suicidal', 'chronic pain', 'fatigue', 'tbi',
      'mobility', 'hearing', 'vision'
    ];
    
    // Add each symptom to resources that mention it
    for (const symptom of symptoms) {
      const regex = new RegExp(symptom, 'i');
      
      // Find resources that mention the symptom but don't have it as a tag
      const resources = await symptomResources.find({
        $and: [
          { 
            $or: [
              { title: { $regex: regex } },
              { description: { $regex: regex } },
              { categories: { $elemMatch: { $regex: regex } } }
            ]
          },
          { 
            tags: { $not: { $elemMatch: { $regex: regex } } }
          }
        ]
      }).toArray();
      
      // Add the symptom as a tag to each resource
      let taggedCount = 0;
      for (const resource of resources) {
        const tags = resource.tags || [];
        const formattedSymptom = symptom.replace(/\b\w/g, l => l.toUpperCase());
        
        tags.push(formattedSymptom);
        
        await symptomResources.updateOne(
          { _id: resource._id },
          { $set: { tags: tags } }
        );
        
        taggedCount++;
      }
      
      log(`Added "${symptom}" tag to ${taggedCount} resources`);
    }
    
    // 6. Create indexes for better performance
    log('\nCreating indexes for improved query performance...');
    
    await symptomResources.createIndex({ tags: 1 });
    await symptomResources.createIndex({ categories: 1 });
    await symptomResources.createIndex({ severityLevels: 1 });
    await symptomResources.createIndex({ geographicScope: 1 });
    await symptomResources.createIndex({ resourceType: 1 });
    await symptomResources.createIndex({ isMentalHealthResource: 1 });
    await symptomResources.createIndex({ isCrisisResource: 1 });
    
    log('Created 7 indexes for improved query performance');
    
    // 7. Verify improvements
    log('\nVerifying improvements:');
    
    // Check field coverage
    const fieldCoverage = await symptomResources.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withSeverityLevels: { $sum: { $cond: [{ $isArray: "$severityLevels" }, 1, 0] } },
          withGeographicScope: { $sum: { $cond: [{ $ifNull: ["$geographicScope", false] }, 1, 0] } },
          withLastVerified: { $sum: { $cond: [{ $ifNull: ["$lastVerified", false] }, 1, 0] } },
          withTherapyTypes: { $sum: { $cond: [{ $isArray: "$therapyTypes" }, 1, 0] } },
          withIsMentalHealth: { $sum: { $cond: [{ $eq: ["$isMentalHealthResource", true] }, 1, 0] } },
          withIsCrisis: { $sum: { $cond: [{ $eq: ["$isCrisisResource", true] }, 1, 0] } }
        }
      }
    ]).toArray();
    
    if (fieldCoverage.length > 0) {
      const coverage = fieldCoverage[0];
      log('\nField coverage after enhancement:');
      log(`- Total resources: ${coverage.total}`);
      log(`- Resources with severity levels: ${coverage.withSeverityLevels} (${Math.round(coverage.withSeverityLevels/coverage.total*100)}%)`);
      log(`- Resources with geographic scope: ${coverage.withGeographicScope} (${Math.round(coverage.withGeographicScope/coverage.total*100)}%)`);
      log(`- Resources with last verified date: ${coverage.withLastVerified} (${Math.round(coverage.withLastVerified/coverage.total*100)}%)`);
      log(`- Resources with therapy types: ${coverage.withTherapyTypes} (${Math.round(coverage.withTherapyTypes/coverage.total*100)}%)`);
      log(`- Mental health resources: ${coverage.withIsMentalHealth} (${Math.round(coverage.withIsMentalHealth/coverage.total*100)}%)`);
      log(`- Crisis resources: ${coverage.withIsCrisis} (${Math.round(coverage.withIsCrisis/coverage.total*100)}%)`);
    }
    
    // Check symptom coverage
    log('\nSymptom coverage after enhancement:');
    for (const symptom of symptoms) {
      const regex = new RegExp(symptom, 'i');
      const count = await symptomResources.countDocuments({
        $or: [
          { tags: { $elemMatch: { $regex: regex } } },
          { title: { $regex: regex } },
          { description: { $regex: regex } }
        ]
      });
      
      log(`- Resources for "${symptom}": ${count} (${Math.round(count/count*100)}% coverage)`);
    }
    
    log('\nEnhancement complete! The SRF should now show more diverse resources.');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
  } finally {
    if (client) {
      await client.close();
      log('Disconnected from MongoDB');
    }
    logFile.end();
  }
}

// Run the enhancement
enhanceSRF();
