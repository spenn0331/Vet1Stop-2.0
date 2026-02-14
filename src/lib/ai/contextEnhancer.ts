/**
 * Context Enhancer for Grok AI
 * 
 * This module provides functions to enhance Grok AI prompts with
 * site-specific knowledge and veteran interaction guidelines.
 */

/**
 * Enhance a prompt with site-specific knowledge about PTSD resources
 */
export function enhancePTSDPrompt(prompt: string): string {
  const ptsdKnowledge = `
When discussing PTSD with veterans on Vet1Stop:

1. PTSD Resources on Vet1Stop:
   - Direct users to the Health page > Mental Health Resources section for comprehensive PTSD information
   - The exact path is: Home > Health > Mental Health Resources > PTSD Support
   - The Mental Health Resources section includes VA and non-VA treatment options, support groups, and crisis services
   - Recommend the Resource Finder Tool on the Health page to locate PTSD treatment providers by location

2. VA PTSD Programs:
   - VA offers specialized PTSD treatment programs including Cognitive Processing Therapy and Prolonged Exposure Therapy
   - Veterans can access these through VA Healthcare Benefits (specifically mentioned in Health > VA Programs section)
   - VA Vet Centers provide free counseling specifically for combat veterans and MST survivors

3. Precise Navigation Guidance:
   - From Home, click on "Health" in the main navigation menu (top navigation bar)
   - On the Health page, use the sidebar navigation to select "Mental Health Resources"
   - Within Mental Health Resources, select "PTSD Support" from the resource cards
   - The Resource Finder Tool is accessible via the blue button at the bottom of the Mental Health Resources section

4. Crisis Support:
   - Always mention the Veterans Crisis Line: 988 (press 1), text 838255, or chat at VeteransCrisisLine.net/Chat
   - This service is available 24/7 and is free and confidential
   - For screen reader users, emphasize that the Veterans Crisis Line information is available at the top of every page

5. Specific Resource Recommendations:
   - VA PTSD Coach mobile app (free self-help tool, available in the App Resources section)
   - Make the Connection (featured in the Stories of Recovery section on the Mental Health Resources page)
   - Local Vet Centers (explain these are different from VA Medical Centers and specialize in readjustment counseling)
  `;
  
  return prompt + "\n\n" + ptsdKnowledge;
}

/**
 * Enhance a prompt with site-specific knowledge about education resources
 */
export function enhanceEducationPrompt(prompt: string): string {
  const educationKnowledge = `
When discussing education benefits with veterans on Vet1Stop:

1. Education Resources on Vet1Stop:
   - Direct users to the Education page for comprehensive information about GI Bill benefits, scholarships, and training
   - The Education page includes information on all types of education benefits, application processes, and eligibility
   - Highlight the School Finder tool on the Education page that helps veterans find military-friendly institutions

2. GI Bill Programs:
   - Post-9/11 GI Bill provides up to 36 months of education benefits for those who served after September 10, 2001
   - Montgomery GI Bill provides education benefits for those who served before Post-9/11
   - Vocational Rehabilitation & Employment (VR&E) helps veterans with service-connected disabilities

3. Navigation Guidance:
   - From Home, click on "Education" in the main navigation menu
   - On the Education page, use the category tabs to find specific information
   - The School Finder tool is prominently displayed on the Education page

4. Application Process:
   - Direct veterans to the application information on the Education page
   - Highlight that they will need to complete VA Form 22-1990 to apply for benefits
   - Mention the education benefits calculator tool to estimate benefit amounts

5. Specific Resource Recommendations:
   - VA's GI Bill Comparison Tool on va.gov
   - Yellow Ribbon Program for additional funding at participating schools
   - Campus resources like Student Veteran Organizations
  `;
  
  return prompt + "\n\n" + educationKnowledge;
}

/**
 * Enhance a prompt with site-specific knowledge about employment resources
 */
export function enhanceEmploymentPrompt(prompt: string): string {
  const employmentKnowledge = `
When discussing employment with veterans on Vet1Stop:

1. Employment Resources on Vet1Stop:
   - Direct users to the Careers page for comprehensive job search tools, resume building, and interview preparation
   - The Careers page features veteran-friendly employers, federal job opportunities, and entrepreneurship resources
   - Highlight the Job Listings section that's filtered for veteran-preference positions

2. Career Services:
   - Resume Builder tool helps translate military skills to civilian terms
   - Interview Preparation section offers practice questions specific to veteran experiences
   - Career Pathways section shows common career transitions for different military specialties

3. Navigation Guidance:
   - From Home, click on "Careers" in the main navigation menu
   - On the Careers page, use the filter options to narrow down job types
   - The Resume Builder tool is accessible from the Careers page sidebar

4. Federal Employment:
   - Direct veterans to the Federal Employment section on the Careers page
   - Highlight veteran preference points and special hiring authorities
   - Mention resources for finding and applying to federal positions

5. Specific Resource Recommendations:
   - Vocational Rehabilitation & Employment (VR&E) for veterans with service-connected disabilities
   - Veteran Readiness and Employment services
   - Veteran-Owned Small Business resources and certification information
  `;
  
  return prompt + "\n\n" + employmentKnowledge;
}

/**
 * Get veteran interaction guidance
 */
export function getVeteranInteractionGuidance(): string {
  return `
When interacting with veterans:

1. General Principles:
   - Maintain a respectful, empathetic tone
   - Acknowledge service and sacrifice when appropriate
   - Use clear, direct language without unnecessary jargon
   - Provide specific, actionable information
   - Recognize diversity of veteran experiences
   - Be sensitive and non-judgmental about mental health or disability topics
   - Use "you" language to speak directly to the veteran

2. Trauma-Informed Approach:
   - Recognize that many veterans have experienced trauma
   - Avoid triggering language or abrupt topic shifts
   - Provide support options when discussing difficult topics
   - Emphasize strength and resilience rather than victimhood
   - For crisis situations, always refer to the Veterans Crisis Line (988, press 1)

3. Military Cultural Competence:
   - Use correct military terms and abbreviations when relevant
   - Understand the significance of rank and military structure
   - Recognize military values of duty, honor, integrity, and service
   - Acknowledge the challenges of military-to-civilian transition
   - Respect that military service often forms a core part of identity
  `;
}

/**
 * Enhance a general prompt with topic detection
 */
export function enhanceGeneralPrompt(prompt: string, query: string): string {
  // Detect topics in the query
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('ptsd') || 
      lowerQuery.includes('trauma') || 
      lowerQuery.includes('mental health') ||
      lowerQuery.includes('anxiety') ||
      lowerQuery.includes('depression')) {
    return enhancePTSDPrompt(prompt);
  }
  
  if (lowerQuery.includes('education') || 
      lowerQuery.includes('school') || 
      lowerQuery.includes('college') ||
      lowerQuery.includes('gi bill') ||
      lowerQuery.includes('training')) {
    return enhanceEducationPrompt(prompt);
  }
  
  if (lowerQuery.includes('job') || 
      lowerQuery.includes('career') || 
      lowerQuery.includes('employment') ||
      lowerQuery.includes('work') ||
      lowerQuery.includes('resume')) {
    return enhanceEmploymentPrompt(prompt);
  }
  
  // Add veteran interaction guidance to all prompts
  return prompt + "\n\n" + getVeteranInteractionGuidance();
}
