/**
 * Script to fix step content and ensure detailed content is properly applied
 * This will directly update step content in the MongoDB pathways collection
 */
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixStepContent() {
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

    // Enhanced content for steps
    const enhancedStepContent = {
      // Military Healthcare pathway
      'pathway-military-healthcare-step-1-register-with-va-healthcare': `
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
      `,
      'pathway-military-healthcare-step-2-find-a-primary-care-provider': `
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
      `,
      'pathway-military-healthcare-step-3-transfer-medical-records': `
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
      `,
      
      // PTSD pathway
      'pathway-ptsd-step-1-recognize-symptoms': `
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
      `,
      'pathway-ptsd-step-2-seek-professional-help': `
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
      `,
      'pathway-ptsd-step-3-join-support-groups': `
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
      `
    };

    // Add content for each pathway
    for (const [stepId, detailedContent] of Object.entries(enhancedStepContent)) {
      // Update step with the enhanced content
      const result = await pathwaysCollection.updateOne(
        { "steps.id": stepId },
        { $set: { "steps.$.detailedContent": detailedContent.trim() } }
      );
      
      console.log(`Updated step ${stepId}: ${result.modifiedCount} document(s) modified`);
    }
    
    console.log('All steps have been updated with enhanced content');
    
  } catch (error) {
    console.error('Error fixing step content:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the function
fixStepContent();
