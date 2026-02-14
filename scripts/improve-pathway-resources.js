/**
 * Script to improve pathway resources
 * This will update the related resources for each pathway step to ensure
 * they are more relevant and context-appropriate
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function improvePathwayResources() {
  let client;
  try {
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri || !dbName) {
      console.error('MongoDB connection details not found in environment variables.');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB database: ${dbName}`);
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const pathwaysCollection = db.collection('pathways');
    const healthResourcesCollection = db.collection('healthResources');

    // Get all health resources
    const healthResources = await healthResourcesCollection.find({}).toArray();
    console.log(`Found ${healthResources.length} health resources`);
    
    // Define better resources for specific pathway steps
    const keyResources = {
      // VA Healthcare Registration step
      'pathway-military-healthcare-step-1-register-with-va-healthcare': {
        keyword: 'VA healthcare enrollment',
        types: ['federal', 'healthcare', 'enrollment'],
        tags: ['va', 'enrollment', 'healthcare', 'benefits', 'registration'],
        priorityUrl: 'va.gov',
        excludeTypes: ['state'] // Exclude state resources for federal programs
      },
      
      // Primary Care Provider step
      'pathway-military-healthcare-step-2-find-a-primary-care-provider': {
        keyword: 'VA primary care',
        types: ['healthcare', 'provider', 'primary care'],
        tags: ['va', 'doctor', 'physician', 'primary care', 'pact'],
        priorityUrl: 'va.gov'
      },
      
      // Medical Records step
      'pathway-military-healthcare-step-3-transfer-medical-records': {
        keyword: 'medical records transfer',
        types: ['records', 'healthcare'],
        tags: ['medical records', 'transfer', 'electronic health records', 'ehr'],
        priorityUrl: 'health.mil'
      },
      
      // PTSD Recognition
      'pathway-ptsd-step-1-recognize-symptoms': {
        keyword: 'PTSD symptoms',
        types: ['mental health', 'education'],
        tags: ['ptsd', 'symptoms', 'trauma', 'mental health'],
        priorityUrl: 'ptsd.va.gov'
      },
      
      // PTSD Professional Help
      'pathway-ptsd-step-2-seek-professional-help': {
        keyword: 'PTSD treatment',
        types: ['mental health', 'treatment', 'provider'],
        tags: ['ptsd', 'therapy', 'treatment', 'mental health'],
        priorityUrl: 'mentalhealth.va.gov'
      },
      
      // PTSD Support Groups
      'pathway-ptsd-step-3-join-support-groups': {
        keyword: 'veteran support groups',
        types: ['support', 'community'],
        tags: ['support group', 'ptsd', 'peer support', 'community'],
        priorityUrl: 'maketheconnection.net'
      }
    };

    // Get federal VA resources for healthcare
    const federalVaResources = healthResources.filter(resource => {
      // Check if resource is from a federal VA domain
      const isFederalVA = resource.contact && resource.contact.website && 
        (resource.contact.website.includes('va.gov') || 
         resource.contact.website.includes('veterans.gov') ||
         resource.contact.website.includes('ebenefits.va.gov'));
      
      // Check if resource is categorized as federal
      const isFederalCategory = resource.resourceType === 'federal' || 
                               (resource.tags && resource.tags.includes('federal'));
      
      return isFederalVA || isFederalCategory;
    });
    
    console.log(`Found ${federalVaResources.length} federal VA resources`);
    
    // Update pathway steps with better resources
    for (const [stepId, criteria] of Object.entries(keyResources)) {
      // Find pathway containing this step
      const pathway = await pathwaysCollection.findOne({ 'steps.id': stepId });
      
      if (!pathway) {
        console.log(`No pathway found with step ID: ${stepId}`);
        continue;
      }
      
      // Find the specific step
      const stepIndex = pathway.steps.findIndex(step => step.id === stepId);
      
      if (stepIndex === -1) {
        console.log(`Step not found in pathway: ${stepId}`);
        continue;
      }
      
      // Get the step
      const step = pathway.steps[stepIndex];
      console.log(`Updating resources for step: ${step.title}`);
      
      // Find matching resources based on criteria
      let matchingResources = [];
      
      // For VA healthcare registration, prioritize federal resources
      if (stepId === 'pathway-military-healthcare-step-1-register-with-va-healthcare') {
        // Prioritize federal VA healthcare enrollment resources
        matchingResources = federalVaResources.filter(resource => {
          // Check title and description
          const titleAndDesc = (resource.title + ' ' + resource.description).toLowerCase();
          
          // Check for healthcare enrollment keywords
          const hasEnrollmentKeywords = titleAndDesc.includes('enroll') || 
                                      titleAndDesc.includes('registration') ||
                                      titleAndDesc.includes('sign up') ||
                                      titleAndDesc.includes('apply');
          
          // Check for healthcare keywords
          const hasHealthcareKeywords = titleAndDesc.includes('healthcare') ||
                                      titleAndDesc.includes('health care') ||
                                      titleAndDesc.includes('medical');
          
          return hasEnrollmentKeywords && hasHealthcareKeywords;
        });
        
        // If we don't have enough, add some general VA healthcare resources
        if (matchingResources.length < 3) {
          const generalVaHealthcare = federalVaResources.filter(resource => {
            const titleAndDesc = (resource.title + ' ' + resource.description).toLowerCase();
            return titleAndDesc.includes('healthcare') || titleAndDesc.includes('health care');
          }).slice(0, 5 - matchingResources.length);
          
          matchingResources = [...matchingResources, ...generalVaHealthcare];
        }
      } else {
        // For other steps, use more general matching
        const criteriaObj = criteria;
        const keywords = criteriaObj.keyword.toLowerCase().split(' ');
        const types = criteriaObj.types || [];
        const tags = criteriaObj.tags || [];
        const priorityUrl = criteriaObj.priorityUrl;
        
        matchingResources = healthResources.filter(resource => {
          // Start with zero score
          let score = 0;
          
          // Check title and description for keywords
          const titleAndDesc = (resource.title + ' ' + resource.description).toLowerCase();
          
          // Score by keywords
          for (const keyword of keywords) {
            if (titleAndDesc.includes(keyword)) {
              score += 2;
            }
          }
          
          // Score by resource type
          if (resource.resourceType && types.includes(resource.resourceType.toLowerCase())) {
            score += 3;
          }
          
          // Score by tags
          if (resource.tags) {
            for (const tag of tags) {
              if (resource.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))) {
                score += 2;
              }
            }
          }
          
          // Score by website domain priority
          if (priorityUrl && resource.contact && resource.contact.website && 
              resource.contact.website.includes(priorityUrl)) {
            score += 5;
          }
          
          // Federal resources get a boost for VA-related steps
          if (stepId.includes('va-healthcare') && 
              (resource.resourceType === 'federal' || 
              (resource.tags && resource.tags.includes('federal')))) {
            score += 4;
          }
          
          return score >= 3; // Only include resources with a minimum score
        });
        
        // Sort by relevance score (calculated above)
        matchingResources.sort((a, b) => {
          // Prioritize federal resources for VA steps
          if (stepId.includes('va-healthcare')) {
            const aIsFederal = a.resourceType === 'federal' || (a.tags && a.tags.includes('federal'));
            const bIsFederal = b.resourceType === 'federal' || (b.tags && b.tags.includes('federal'));
            
            if (aIsFederal && !bIsFederal) return -1;
            if (!aIsFederal && bIsFederal) return 1;
          }
          
          // Otherwise sort by title
          return a.title.localeCompare(b.title);
        });
      }
      
      // Take the top 5 resources
      matchingResources = matchingResources.slice(0, 5);
      
      // Create related resource objects
      const relatedResources = matchingResources.map((resource, index) => ({
        id: resource.id || resource._id.toString(),
        title: resource.title,
        description: resource.description || 'No description available.',
        relevanceScore: 5 - index  // Higher score for earlier resources
      }));
      
      console.log(`Found ${relatedResources.length} matching resources for step: ${step.title}`);
      
      // Update the step with new related resources
      pathway.steps[stepIndex].relatedResources = relatedResources;
      
      // Update the pathway in the database
      await pathwaysCollection.updateOne(
        { id: pathway.id },
        { $set: { steps: pathway.steps } }
      );
      
      console.log(`Updated step in pathway: ${pathway.title}`);
    }
    
    console.log('Pathway resources have been improved!');
    
  } catch (error) {
    console.error('Error improving pathway resources:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
improvePathwayResources();
