const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

/**
 * Script to enhance pathways with additional details and related resources
 * This will make pathways more valuable for veterans by connecting resources
 * from our health resources database to each pathway step
 */
async function enhancePathways() {
  let client;
  try {
    // Get MongoDB connection details from environment variables
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!uri || !dbName) {
      console.error('MongoDB connection details not found in environment variables.');
      console.error('Please ensure MONGODB_URI and MONGODB_DB are set in .env.local');
      process.exit(1);
    }
    
    console.log(`Connecting to MongoDB database: ${dbName}`);
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const pathwaysCollection = db.collection('pathways');
    const healthResourcesCollection = db.collection('healthResources');

    // Get all existing pathways
    const pathways = await pathwaysCollection.find({}).toArray();
    
    if (pathways.length === 0) {
      console.log('No pathways found in the database.');
      return;
    }
    
    console.log(`Found ${pathways.length} pathways to enhance.`);
    
    // Get all health resources to use for association with pathway steps
    const healthResources = await healthResourcesCollection.find({}).toArray();
    
    if (healthResources.length === 0) {
      console.log('No health resources found. Cannot enhance pathways with related resources.');
      return;
    }
    
    console.log(`Found ${healthResources.length} health resources to associate with pathways.`);
    
    // Enhance each pathway
    for (const pathway of pathways) {
      console.log(`Enhancing pathway: ${pathway.title}`);
      
      // Enhanced metadata
      const enhancedPathway = {
        ...pathway,
        lastUpdated: new Date(),
        estimatedCompletionTimeMinutes: calculateEstimatedTime(pathway),
        difficulty: getDifficultyLevel(pathway),
        audience: getTargetAudience(pathway),
        requirements: getRequirements(pathway),
      };
      
      // Enhanced steps with detailed content and related resources
      if (enhancedPathway.steps && Array.isArray(enhancedPathway.steps)) {
        enhancedPathway.steps = enhancedPathway.steps.map(step => {
          // Enhanced step with detailed content
          const enhancedStep = {
            ...step,
            detailedContent: getDetailedContent(pathway.id, step),
            estimatedTimeMinutes: step.estimatedTimeMinutes || 10,
            relatedResources: findRelatedResources(step, healthResources, pathway.tags)
          };
          
          return enhancedStep;
        });
      }
      
      // Update the pathway in the database
      await pathwaysCollection.updateOne(
        { id: pathway.id },
        { $set: enhancedPathway }
      );
      
      console.log(`Successfully enhanced pathway: ${pathway.title}`);
    }
    
    console.log('All pathways have been enhanced with detailed content and related resources.');
  } catch (error) {
    console.error('Error enhancing pathways:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
    process.exit();
  }
}

/**
 * Calculate the estimated time to complete a pathway
 */
function calculateEstimatedTime(pathway) {
  if (pathway.steps && Array.isArray(pathway.steps)) {
    // Sum the estimated time of all steps or default to 10 minutes per step
    return pathway.steps.reduce((total, step) => total + (step.estimatedTimeMinutes || 10), 0);
  }
  // Default: 30 minutes if no steps
  return 30;
}

/**
 * Determine the difficulty level of a pathway
 */
function getDifficultyLevel(pathway) {
  // Default difficulty based on pathway type
  if (pathway.id.includes('disability') || pathway.id.includes('claim')) {
    return 'challenging';
  } else if (pathway.id.includes('ptsd') || pathway.id.includes('mental-health')) {
    return 'moderate';
  }
  return 'beginner';
}

/**
 * Determine the target audience for a pathway
 */
function getTargetAudience(pathway) {
  // Default audiences based on pathway content
  if (pathway.id.includes('military-healthcare')) {
    return ['Recently separated veterans', 'Veterans transitioning to civilian life'];
  } else if (pathway.id.includes('ptsd')) {
    return ['Veterans with PTSD', 'Veterans seeking mental health support'];
  } else if (pathway.id.includes('disability')) {
    return ['Veterans with service-connected disabilities', 'Veterans seeking benefits'];
  } else if (pathway.id.includes('womens-health')) {
    return ['Women veterans', 'Veterans seeking gender-specific care'];
  } else if (pathway.id.includes('mental-health')) {
    return ['Veterans seeking mental health support', 'Family members of veterans'];
  }
  
  return ['All veterans'];
}

/**
 * Determine any requirements for a pathway
 */
function getRequirements(pathway) {
  // Default requirements based on pathway type
  if (pathway.id.includes('disability')) {
    return [
      'DD-214 or separation documents',
      'Medical documentation of conditions',
      'Service treatment records if available'
    ];
  } else if (pathway.id.includes('military-healthcare')) {
    return [
      'Proof of military service',
      'VA health care enrollment form (10-10EZ)'
    ];
  }
  
  return [];
}

/**
 * Generate detailed content for a pathway step
 */
function getDetailedContent(pathwayId, step) {
  // Create detailed HTML content based on step type
  let content = '';
  
  // Transitioning from Military Healthcare pathway
  if (pathwayId === 'pathway-military-healthcare') {
    if (step.title.includes('Register with VA Healthcare')) {
      content = `
        <h2>Registering with VA Healthcare</h2>
        <p>Enrolling in VA healthcare is an essential step for veterans transitioning from military to civilian healthcare.</p>
        
        <h3>How to Apply</h3>
        <ul>
          <li><strong>Online:</strong> Apply through VA.gov</li>
          <li><strong>By Phone:</strong> Call 1-877-222-VETS (8387)</li>
          <li><strong>In Person:</strong> Visit your local VA medical center or clinic</li>
          <li><strong>By Mail:</strong> Complete VA Form 10-10EZ and mail it to your nearest VA facility</li>
        </ul>
        
        <h3>Required Documents</h3>
        <ul>
          <li>DD-214 or separation documents</li>
          <li>Personal identification</li>
          <li>Income information (for non-service-connected care)</li>
        </ul>
        
        <h3>Timeline</h3>
        <p>The application process typically takes 1-2 weeks. For priority processing, apply online or in person.</p>
      `;
    } else if (step.title.includes('Find a Primary Care Provider')) {
      content = `
        <h2>Finding a Primary Care Provider</h2>
        <p>Your Primary Care Provider (PCP) will be your main point of contact for healthcare needs.</p>
        
        <h3>Steps to Choose a PCP</h3>
        <ol>
          <li>After enrolling in VA healthcare, you'll be assigned to a Patient Aligned Care Team (PACT)</li>
          <li>You can request a specific provider by contacting your local VA facility</li>
          <li>If you prefer a female provider or have other preferences, make these known during your first appointment</li>
        </ol>
        
        <h3>What to Consider</h3>
        <ul>
          <li>Provider's specialty areas</li>
          <li>Location and accessibility</li>
          <li>Appointment availability</li>
          <li>Communication style and approach to care</li>
        </ul>
        
        <h3>Community Care Options</h3>
        <p>If VA care isn't available in your area or wait times are too long, you may be eligible for community care through non-VA providers.</p>
      `;
    } else if (step.title.includes('Transfer Medical Records')) {
      content = `
        <h2>Transferring Your Medical Records</h2>
        <p>Ensuring continuity of care requires transferring your military medical records to your new healthcare providers.</p>
        
        <h3>How to Request Records</h3>
        <ol>
          <li>Complete VA Form 10-5345 (Request for and Authorization to Release Medical Records)</li>
          <li>Submit the form to your previous military treatment facility</li>
          <li>Specify where you want the records sent (your VA facility or community provider)</li>
        </ol>
        
        <h3>Important Tips</h3>
        <ul>
          <li>Request complete records, including lab results, imaging studies, and specialist reports</li>
          <li>Keep a personal copy of all medical records</li>
          <li>Follow up if records aren't received within 30 days</li>
          <li>Consider using the Blue Button feature on My HealtheVet to download your VA health records</li>
        </ul>
        
        <h3>Electronic Health Record Modernization</h3>
        <p>The VA is transitioning to a new electronic health record system that will be compatible with DoD systems, making future transfers easier.</p>
      `;
    }
  }
  
  // PTSD pathway
  else if (pathwayId === 'pathway-ptsd') {
    if (step.title.includes('Recognize Symptoms')) {
      content = `
        <h2>Recognizing PTSD Symptoms</h2>
        <p>Understanding the signs of PTSD is the first step toward getting help.</p>
        
        <h3>Common PTSD Symptoms</h3>
        <ul>
          <li><strong>Re-experiencing:</strong> Flashbacks, nightmares, intrusive memories</li>
          <li><strong>Avoidance:</strong> Avoiding people, places, or situations that remind you of the trauma</li>
          <li><strong>Negative Changes in Thinking and Mood:</strong> Negative thoughts about yourself or the world, feeling detached from others</li>
          <li><strong>Hyperarousal:</strong> Being easily startled, feeling tense, difficulty sleeping, angry outbursts</li>
        </ul>
        
        <h3>When to Seek Help</h3>
        <p>Consider seeking help if symptoms:</p>
        <ul>
          <li>Last longer than a month</li>
          <li>Cause significant distress</li>
          <li>Interfere with daily activities, work, or relationships</li>
        </ul>
        
        <h3>Self-Assessment Tools</h3>
        <p>The PTSD Checklist (PCL-5) is a self-report measure that can help you assess your symptoms. It's available on the VA website.</p>
      `;
    } else if (step.title.includes('Seek Professional Help')) {
      content = `
        <h2>Seeking Professional Help for PTSD</h2>
        <p>Professional treatment can significantly improve PTSD symptoms and quality of life.</p>
        
        <h3>Treatment Options at VA</h3>
        <ul>
          <li><strong>Evidence-Based Psychotherapies:</strong> Cognitive Processing Therapy (CPT), Prolonged Exposure (PE)</li>
          <li><strong>Medication:</strong> SSRIs, SNRIs, and other medications that may help manage symptoms</li>
          <li><strong>Residential Treatment Programs:</strong> Intensive programs for those needing more support</li>
        </ul>
        
        <h3>How to Access VA Mental Health Services</h3>
        <ol>
          <li>Contact your local VA Medical Center</li>
          <li>Call the Veterans Crisis Line at 1-800-273-8255 (Press 1)</li>
          <li>Use the VA Mental Health Services Locator on VA.gov</li>
        </ol>
        
        <h3>What to Expect</h3>
        <p>Your first appointment will typically involve an assessment of your symptoms, history, and treatment goals. You'll work with your provider to develop a personalized treatment plan.</p>
      `;
    } else if (step.title.includes('Join Support Groups')) {
      content = `
        <h2>Joining PTSD Support Groups</h2>
        <p>Connecting with others who understand can be a powerful part of healing.</p>
        
        <h3>Benefits of Support Groups</h3>
        <ul>
          <li>Reduced isolation and feeling understood</li>
          <li>Learning coping strategies from peers</li>
          <li>Building a community of support</li>
          <li>Opportunity to help others</li>
        </ul>
        
        <h3>Types of Support Groups</h3>
        <ul>
          <li><strong>VA-Led Groups:</strong> Facilitated by mental health professionals</li>
          <li><strong>Vet Center Groups:</strong> Specifically for combat veterans</li>
          <li><strong>Peer Support Groups:</strong> Led by veterans who have experienced PTSD</li>
          <li><strong>Online Communities:</strong> Forums and virtual groups for those unable to attend in person</li>
        </ul>
        
        <h3>Finding a Group</h3>
        <p>Contact your local VA, Vet Center, or check with organizations like NAMI or Make the Connection to find groups in your area.</p>
      `;
    }
  }
  
  // Default content if nothing specific is defined
  if (!content) {
    content = `
      <h2>${step.title}</h2>
      <p>${step.description}</p>
      <p>This step is an important part of your healthcare journey. Work with your healthcare team to ensure you're taking the right approach for your specific situation.</p>
    `;
  }
  
  return content;
}

/**
 * Find related health resources for a pathway step
 */
function findRelatedResources(step, allResources, pathwayTags = []) {
  const relatedResources = [];
  const stepKeywords = extractKeywords(step.title + ' ' + step.description);
  
  // Prioritize resources that match step keywords in their title, description, or tags
  for (const resource of allResources) {
    // Skip if we already have 5 related resources
    if (relatedResources.length >= 5) break;
    
    // Extract resource keywords from title, description, and tags
    const resourceText = [
      resource.title || '',
      resource.description || '',
      (resource.tags || []).join(' ')
    ].join(' ');
    
    const resourceKeywords = extractKeywords(resourceText);
    
    // Calculate relevance score based on keyword matches
    let score = 0;
    
    for (const keyword of stepKeywords) {
      if (resourceKeywords.includes(keyword)) {
        score += 1;
      }
    }
    
    // Boost score if resource tags match pathway tags
    if (resource.tags && pathwayTags) {
      for (const tag of resource.tags) {
        if (pathwayTags.includes(tag)) {
          score += 2;
        }
      }
    }
    
    // Add resource if it has a minimum relevance score
    if (score >= 2) {
      relatedResources.push({
        id: resource.id || resource._id.toString(),
        title: resource.title,
        description: resource.description,
        relevanceScore: score
      });
    }
  }
  
  // Sort by relevance score (highest first)
  return relatedResources.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Extract keywords from text for matching
 */
function extractKeywords(text) {
  if (!text) return [];
  
  // Convert to lowercase and split by non-alphanumeric characters
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3); // Only words longer than 3 characters
  
  // Remove common stopwords
  const stopwords = ['this', 'that', 'these', 'those', 'with', 'from', 'have', 'will'];
  return words.filter(word => !stopwords.includes(word));
}

// Execute the function
enhancePathways();
