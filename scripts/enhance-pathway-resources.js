/**
 * Improved script to enhance pathway resources
 * This addresses specific pathway content issues and improves resource matching
 */
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function enhancePathwayResources() {
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
    
    // Step 1: Fix the Transitioning from Military Healthcare pathway
    console.log('Fixing Military Healthcare Pathway content...');
    await fixMilitaryHealthcarePathway(pathwaysCollection);
    
    // Step 2: Improve PTSD pathway resources
    console.log('Enhancing PTSD pathway resources...');
    await enhancePTSDPathwayResources(pathwaysCollection, healthResourcesCollection, healthResources);
    
    // Step 3: General resource matching improvement for all pathways
    console.log('Improving resource matching for all pathways...');
    await improveAllPathwayResources(pathwaysCollection, healthResourcesCollection, healthResources);
    
    console.log('Pathway resources have been enhanced!');
    
  } catch (error) {
    console.error('Error enhancing pathway resources:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

/**
 * Fix issues with the Military Healthcare Pathway content
 */
async function fixMilitaryHealthcarePathway(pathwaysCollection) {
  try {
    // Find the Military Healthcare pathway
    const pathway = await pathwaysCollection.findOne({ 
      title: { $regex: /military healthcare/i }
    });
    
    if (!pathway) {
      console.log('Military Healthcare pathway not found');
      return;
    }
    
    // Find the registration step
    const registerStepIndex = pathway.steps.findIndex(step => 
      step.id.includes('register-with-va-healthcare') || 
      step.title.toLowerCase().includes('register')
    );
    
    if (registerStepIndex === -1) {
      console.log('Registration step not found in Military Healthcare pathway');
      return;
    }
    
    // Get the register step
    const registerStep = pathway.steps[registerStepIndex];
    
    // Fix the content to move mail links to online section and remove duplicates
    if (registerStep.detailedContent) {
      // Update the content by moving mail links to online section and removing duplicates
      let updatedContent = registerStep.detailedContent;
      
      // Replace the "By Mail" section
      updatedContent = updatedContent.replace(
        /<li>By Mail: Complete\s+<a[^>]*>VA VA<\/a>\s*<a[^>]*>VA Form 10-10EZ<\/a>\s+and mail it to your nearest VA facility<\/li>/,
        '<li>By Mail: Complete <a href="https://www.va.gov/health-care/apply/application/introduction" target="_blank" rel="noopener noreferrer" class="va-form-link">VA Form 10-10EZ</a> and mail it to your nearest VA facility</li>'
      );
      
      // Update the "Online" section to include the form
      updatedContent = updatedContent.replace(
        /<li>Online: Apply through VA.gov<\/li>/,
        '<li>Online: Apply through <a href="https://www.va.gov/health-care/apply/application/introduction" target="_blank" rel="noopener noreferrer">VA.gov</a> (Complete <a href="https://www.va.gov/health-care/apply/application/introduction" target="_blank" rel="noopener noreferrer" class="va-form-link">VA Form 10-10EZ</a> online)</li>'
      );
      
      // Update the pathway step with fixed content
      await pathwaysCollection.updateOne(
        { _id: pathway._id, "steps.id": registerStep.id },
        { $set: { "steps.$.detailedContent": updatedContent } }
      );
      
      console.log('Updated Transitioning from Military Healthcare pathway content');
    } else {
      console.log('No detailed content found for registration step');
    }
    
  } catch (error) {
    console.error('Error fixing Military Healthcare pathway:', error);
  }
}

/**
 * Enhance PTSD pathway with more relevant resources
 */
async function enhancePTSDPathwayResources(pathwaysCollection, healthResourcesCollection, healthResources) {
  try {
    // Find the PTSD pathway
    const pathway = await pathwaysCollection.findOne({ 
      title: { $regex: /PTSD|Post-Traumatic Stress/i }
    });
    
    if (!pathway) {
      console.log('PTSD pathway not found');
      return;
    }
    
    console.log(`Found PTSD pathway: ${pathway.title}`);
    
    // Filter resources by PTSD-related terms
    const ptsdResources = healthResources.filter(resource => {
      const text = `${resource.title} ${resource.description}`.toLowerCase();
      
      // Check for PTSD-related keywords
      return text.includes('ptsd') || 
             text.includes('post-traumatic') || 
             text.includes('trauma') || 
             text.includes('mental health') ||
             text.includes('counseling') ||
             text.includes('therapy') ||
             text.includes('veteran support') ||
             text.includes('anxiety') ||
             text.includes('depression') ||
             (resource.tags && resource.tags.some(tag => 
                tag.toLowerCase().includes('ptsd') || 
                tag.toLowerCase().includes('mental health') ||
                tag.toLowerCase().includes('veteran support') ||
                tag.toLowerCase().includes('trauma')
             ));
    });
    
    console.log(`Found ${ptsdResources.length} PTSD-related resources`);
    
    // For each step in the PTSD pathway, assign relevant resources
    for (const step of pathway.steps) {
      // Different resources for different steps
      let stepResources = [];
      
      if (step.id.includes('recognize-symptoms') || step.title.toLowerCase().includes('recognize')) {
        stepResources = filterResourcesForSymptomRecognition(ptsdResources);
      } else if (step.id.includes('seek-professional') || step.title.toLowerCase().includes('professional')) {
        stepResources = filterResourcesForProfessionalHelp(ptsdResources);
      } else if (step.id.includes('support-group') || step.title.toLowerCase().includes('support')) {
        stepResources = filterResourcesForSupportGroups(ptsdResources);
      } else {
        // General PTSD resources
        stepResources = ptsdResources.slice(0, 8);
      }
      
      // Format resources for pathway step
      const relatedResources = stepResources.map(resource => ({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description || 'No description available',
        relevanceScore: 5,
        resourceType: resource.resourceType || 'information'
      }));
      
      // Update the pathway step with enhanced resources
      await pathwaysCollection.updateOne(
        { _id: pathway._id, "steps.id": step.id },
        { $set: { "steps.$.relatedResources": relatedResources } }
      );
      
      console.log(`Updated resources for step: ${step.title} (${relatedResources.length} resources added)`);
    }
    
  } catch (error) {
    console.error('Error enhancing PTSD pathway resources:', error);
  }
}

/**
 * Filter resources specifically for PTSD symptom recognition
 */
function filterResourcesForSymptomRecognition(ptsdResources) {
  // Resources focused on education and symptom recognition
  return ptsdResources.filter(resource => {
    const text = `${resource.title} ${resource.description}`.toLowerCase();
    
    return (
      text.includes('symptom') ||
      text.includes('recognize') ||
      text.includes('sign') ||
      text.includes('identify') ||
      text.includes('understand')
    );
  });
}

/**
 * Filter resources specifically for seeking professional help for PTSD
 */
function filterResourcesForProfessionalHelp(ptsdResources) {
  // Resources focused on professional treatment and providers
  return ptsdResources.filter(resource => {
    const text = `${resource.title} ${resource.description}`.toLowerCase();
    
    return (
      text.includes('treatment') ||
      text.includes('therapy') ||
      text.includes('counseling') ||
      text.includes('psychiatrist') ||
      text.includes('psychologist') ||
      text.includes('clinical') ||
      text.includes('professional help') ||
      text.includes('mental health provider')
    );
  });
}

/**
 * Filter resources specifically for PTSD support groups
 */
function filterResourcesForSupportGroups(ptsdResources) {
  // Resources focused on peer support and community
  return ptsdResources.filter(resource => {
    const text = `${resource.title} ${resource.description}`.toLowerCase();
    
    return (
      text.includes('support group') ||
      text.includes('peer support') ||
      text.includes('community') ||
      text.includes('connect with others') ||
      text.includes('connect with veterans') ||
      text.includes('group therapy')
    );
  });
}

/**
 * Improve resource matching for all pathways
 */
async function improveAllPathwayResources(pathwaysCollection, healthResourcesCollection, healthResources) {
  try {
    // Get all pathways
    const pathways = await pathwaysCollection.find({}).toArray();
    console.log(`Found ${pathways.length} pathways`);
    
    for (const pathway of pathways) {
      console.log(`Processing pathway: ${pathway.title}`);
      
      // Only process steps that don't have enough resources
      for (const step of pathway.steps) {
        // Skip if already has enough resources
        if (step.relatedResources && step.relatedResources.length >= 5) {
          console.log(`Step "${step.title}" already has ${step.relatedResources.length} resources, skipping`);
          continue;
        }
        
        // Generate search terms based on step
        const searchTerms = generateSearchTerms(pathway.title, step.title, step.description || '');
        console.log(`Search terms for step "${step.title}": ${searchTerms.join(', ')}`);
        
        // Find matching resources using search terms
        const matchingResources = findMatchingResources(healthResources, searchTerms, step.id);
        console.log(`Found ${matchingResources.length} matching resources for step "${step.title}"`);
        
        if (matchingResources.length > 0) {
          // Format resources for pathway step
          const relatedResources = matchingResources.map((resource, index) => ({
            id: resource._id.toString(),
            title: resource.title,
            description: resource.description || 'No description available',
            relevanceScore: 5 - index % 5,  // Ensure some variety in relevance scores
            resourceType: resource.resourceType || 'information'
          }));
          
          // Update the pathway step with enhanced resources
          await pathwaysCollection.updateOne(
            { _id: pathway._id, "steps.id": step.id },
            { $set: { "steps.$.relatedResources": relatedResources } }
          );
          
          console.log(`Updated resources for step: ${step.title} (${relatedResources.length} resources added)`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error improving all pathway resources:', error);
  }
}

/**
 * Generate search terms based on pathway and step information
 */
function generateSearchTerms(pathwayTitle, stepTitle, stepDescription) {
  const combinedText = `${pathwayTitle} ${stepTitle} ${stepDescription}`.toLowerCase();
  const terms = new Set();
  
  // Extract key healthcare terms
  if (combinedText.includes('healthcare') || combinedText.includes('health care')) {
    terms.add('healthcare');
    terms.add('medical');
    terms.add('health');
    
    // Add specifics based on different healthcare aspects
    if (combinedText.includes('register') || combinedText.includes('enroll')) {
      terms.add('enrollment');
      terms.add('registration');
      terms.add('VA healthcare');
    }
    
    if (combinedText.includes('provider') || combinedText.includes('doctor')) {
      terms.add('primary care');
      terms.add('provider');
      terms.add('physician');
    }
    
    if (combinedText.includes('record') || combinedText.includes('file')) {
      terms.add('medical records');
      terms.add('health records');
      terms.add('transfer');
    }
  }
  
  // Extract mental health terms
  if (combinedText.includes('ptsd') || combinedText.includes('trauma') || combinedText.includes('stress')) {
    terms.add('ptsd');
    terms.add('trauma');
    terms.add('post-traumatic stress');
    terms.add('mental health');
    
    // Add specifics based on different mental health aspects
    if (combinedText.includes('symptom') || combinedText.includes('recognize')) {
      terms.add('symptoms');
      terms.add('signs');
      terms.add('diagnosis');
    }
    
    if (combinedText.includes('professional') || combinedText.includes('treatment')) {
      terms.add('therapy');
      terms.add('treatment');
      terms.add('counseling');
    }
    
    if (combinedText.includes('support') || combinedText.includes('group')) {
      terms.add('support group');
      terms.add('peer support');
      terms.add('community');
    }
  }
  
  // Extract education terms
  if (combinedText.includes('education') || combinedText.includes('learn') || combinedText.includes('study')) {
    terms.add('education');
    terms.add('gi bill');
    terms.add('college');
    terms.add('university');
    terms.add('training');
  }
  
  // If no specific terms were identified, extract key words from titles
  if (terms.size === 0) {
    const words = stepTitle.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 3 && !['with', 'from', 'your', 'this', 'that', 'step'].includes(word)) {
        terms.add(word);
      }
    }
  }
  
  return Array.from(terms);
}

/**
 * Find matching resources based on search terms
 */
function findMatchingResources(resources, searchTerms, stepId) {
  // Score each resource based on relevance to search terms
  const scoredResources = resources.map(resource => {
    const text = `${resource.title} ${resource.description || ''}`.toLowerCase();
    let score = 0;
    
    // Score by search terms
    for (const term of searchTerms) {
      if (text.includes(term)) {
        score += 2;
      }
    }
    
    // Boost score for federal resources when appropriate
    if (stepId.includes('va-') || stepId.includes('military')) {
      if (resource.resourceType === 'federal' || 
         (resource.tags && resource.tags.includes('federal'))) {
        score += 3;
      }
      
      // Extra points for VA.gov resources
      if (resource.contact && resource.contact.website && 
         resource.contact.website.includes('va.gov')) {
        score += 2;
      }
    }
    
    // Boost score for state/local resources when appropriate for community-focused steps
    if (stepId.includes('community') || stepId.includes('local')) {
      if (resource.resourceType === 'state' || resource.resourceType === 'local' ||
         (resource.tags && (resource.tags.includes('state') || resource.tags.includes('local')))) {
        score += 2;
      }
    }
    
    return { resource, score };
  });
  
  // Filter resources with a minimum score and sort by score
  const matchingResources = scoredResources
    .filter(item => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(item => item.resource);
  
  // Take top 8 resources for variety
  return matchingResources.slice(0, 8);
}

// Run the function
enhancePathwayResources();
