/**
 * Vet1Stop Site Knowledge Base
 * 
 * This module provides structured information about the Vet1Stop website,
 * resources, and guidelines for interacting with veterans.
 * This knowledge is used to enhance AI responses with site-specific context.
 */

/**
 * Site structure information
 */
export const siteStructure = {
  pages: [
    {
      name: 'Home',
      path: '/',
      description: 'Main landing page with overview of all veteran resources and services.',
      key_features: ['Resource categories', 'Latest updates', 'Quick access links', 'Hero video']
    },
    {
      name: 'Health',
      path: '/health',
      description: 'Comprehensive healthcare information and resources for veterans.',
      key_features: [
        'VA Healthcare Benefits',
        'Mental Health Resources',
        'Physical Health Services',
        'Community Care Network',
        'Wellness & Prevention',
        'Caregiver Support',
        'Pharmacy Services',
        'Resource Finder Tool'
      ],
      sub_sections: [
        {
          name: 'VA Healthcare Benefits',
          description: 'Information about VA health benefits, priority groups, and enrollment process.'
        },
        {
          name: 'Mental Health Resources',
          description: 'Resources for PTSD, depression, anxiety, substance use, and military sexual trauma with Vet Centers spotlight.'
        },
        {
          name: 'Physical Health Services',
          description: 'Grid of physical health services with specialized program information and Whole Health approach.'
        },
        {
          name: 'Community Care Network',
          description: 'Explains VA Community Care Network, eligibility, and accessing care outside VA facilities.'
        },
        {
          name: 'Wellness & Prevention',
          description: 'Preventive services, program spotlights for conditions like diabetes, and Healthy Living Circle concept.'
        },
        {
          name: 'Caregiver Support',
          description: 'Program of Comprehensive Assistance for Family Caregivers, support resources, and self-care.'
        },
        {
          name: 'Pharmacy Services',
          description: 'Prescription benefits, ways to fill prescriptions, and My HealtheVet pharmacy services.'
        },
        {
          name: 'Resource Finder Tool',
          description: 'Interactive tool to find specific health resources based on needs and location.'
        }
      ]
    },
    {
      name: 'Education',
      path: '/education',
      description: 'Educational resources, benefits, and opportunities for veterans.',
      key_features: ['GI Bill Information', 'School Finder', 'Vocational Training', 'Scholarships', 'Success Stories']
    },
    {
      name: 'Life and Leisure',
      path: '/life',
      description: 'Resources for housing, financial assistance, recreation, and community activities.',
      key_features: ['Housing Resources', 'Financial Assistance', 'Recreation Programs', 'Community Events']
    },
    {
      name: 'Careers',
      path: '/careers',
      description: 'Career resources including job opportunities, resume building, and entrepreneurship.',
      key_features: ['Job Listings', 'Resume Builder', 'Interview Preparation', 'Entrepreneurship Resources', 'Career Pathways']
    },
    {
      name: 'Local',
      path: '/local',
      description: 'Find veteran-focused businesses and services in your local area.',
      key_features: ['Map Interface', 'Business Directory', 'Service Providers', 'Local Events']
    },
    {
      name: 'Shop',
      path: '/shop',
      description: 'Shop from veteran-owned businesses and support the veteran community.',
      key_features: ['Veteran Business Spotlights', 'Product Categories', 'Special Offers']
    },
    {
      name: 'Social',
      path: '/social',
      description: 'Connect with other veterans through forums, events, and social media.',
      key_features: ['Discussion Forums', 'Event Calendar', 'Veteran Stories', 'Community Groups']
    }
  ],
  resource_types: [
    {
      type: 'Federal',
      description: 'Resources provided by federal government agencies like the VA, DoD, etc.',
      examples: ['VA Healthcare', 'GI Bill', 'Federal Employment']
    },
    {
      type: 'State',
      description: 'Resources provided by state government agencies.',
      examples: ['State Veterans Benefits', 'State Employment Services', 'State Education Benefits']
    },
    {
      type: 'NGO',
      description: 'Resources provided by non-governmental organizations.',
      examples: ['Wounded Warrior Project', 'Disabled American Veterans', 'Veterans of Foreign Wars']
    },
    {
      type: 'Local',
      description: 'Resources provided by local community organizations.',
      examples: ['Local VA Clinics', 'Community Support Groups', 'Local Veterans Service Officers']
    },
    {
      type: 'Private',
      description: 'Resources provided by private companies and individuals.',
      examples: ['Veteran-Owned Businesses', 'Military-Friendly Employers', 'Private Healthcare Providers']
    }
  ],
  user_journey: {
    new_visitors: [
      'Explore resource categories on the homepage',
      'Create an account to save resources',
      'Complete profile to get personalized recommendations',
      'Use the AI assistant for guidance on where to start'
    ],
    returning_visitors: [
      'Check saved resources',
      'View recommended content based on profile',
      'Engage with community features',
      'Explore new resources and updates'
    ]
  }
};

/**
 * Veteran interaction guidelines
 */
export const veteranInteractionGuidelines = {
  general_principles: [
    'Always maintain a respectful, empathetic tone',
    'Acknowledge the veteran's service and sacrifice',
    'Use clear, direct language without unnecessary jargon',
    'Provide specific, actionable information when possible',
    'Recognize the diversity of veteran experiences - not all veterans have the same background or needs',
    'For sensitive topics like mental health or disability, maintain a supportive, non-judgmental tone',
    'Use "you" language to speak directly to the veteran'
  ],
  service_era_awareness: {
    'Post-9/11': 'Veterans from Afghanistan and Iraq wars may have specific concerns about PTSD, TBI, and reintegration into civilian society.',
    'Gulf War': 'May have concerns about Gulf War Syndrome and related health issues.',
    'Vietnam Era': 'May have concerns about Agent Orange exposure, delayed recognition of service, and age-related healthcare needs.',
    'Korean War': 'Aging veterans with healthcare, long-term care, and end-of-life needs.',
    'World War II': 'Our oldest veterans with significant healthcare and support needs.'
  },
  common_veteran_concerns: {
    'Healthcare': [
      'Accessing VA healthcare',
      'Understanding healthcare benefits',
      'Finding mental health support',
      'Navigating healthcare systems outside the VA',
      'Managing service-connected conditions'
    ],
    'Education': [
      'Using GI Bill benefits',
      'Finding military-friendly schools',
      'Transferring military credits',
      'Accessing additional scholarships',
      'Navigating vocational training options'
    ],
    'Employment': [
      'Translating military skills to civilian terms',
      'Finding veteran-friendly employers',
      'Overcoming hiring barriers',
      'Starting a business',
      'Accessing vocational rehabilitation'
    ],
    'Benefits': [
      'Understanding eligibility',
      'Applying for benefits',
      'Appealing denied claims',
      'Finding assistance with applications',
      'Tracking application status'
    ],
    'Housing': [
      'Accessing VA home loans',
      'Finding affordable housing',
      'Preventing/addressing homelessness',
      'Making home modifications for disabilities',
      'Transitional housing options'
    ]
  },
  trauma_informed_approach: [
    'Recognize that many veterans have experienced trauma',
    'Avoid triggering language or abrupt topic shifts when discussing sensitive subjects',
    'Provide resources and support options when discussing difficult topics',
    'Emphasize strength and resilience rather than victimhood',
    'For crisis situations, always refer to the Veterans Crisis Line (988, press 1)'
  ],
  military_cultural_competence: {
    'Terminology': 'Use correct military terms and abbreviations when relevant',
    'Hierarchy': 'Understand the significance of rank and military structure',
    'Values': 'Recognize military values of duty, honor, integrity, and service',
    'Transitions': 'Acknowledge the challenges of military-to-civilian transition',
    'Identity': 'Respect that military service often forms a core part of a veteran identity'
  }
};

/**
 * Resource recommendation guidelines
 */
export const resourceRecommendationGuidelines = {
  prioritization: [
    'Official VA resources for benefits and services the VA directly provides',
    'Federal and state resources with verified information',
    'Established non-profit organizations with proven track records of serving veterans',
    'Local resources based on the veteran's location',
    'Peer support and community-based options'
  ],
  personalization_factors: [
    'Service era (different eras have different available benefits)',
    'Service branch (some resources are branch-specific)',
    'Location (many resources are location-dependent)',
    'Disability status (affects eligibility for many programs)',
    'Discharge status (affects eligibility for VA benefits)',
    'Family situation (different resources for families, spouses, children)',
    'Employment status (different resources for employed vs. unemployed veterans)',
    'Education level (different resources for different education goals)'
  ],
  explanation_format: {
    'Structure': 'Name of resource, brief description, why it is relevant to the veteran, how to access it',
    'Relevance': 'Always explain why a particular resource is being recommended based on the veterans specific situation',
    'Access': 'Provide clear next steps on how to access the resource (e.g., "You can apply online at va.gov/health-care/apply/")'
  }
};

/**
 * Get comprehensive site knowledge for AI context
 */
export function getSiteKnowledge(): string {
  let knowledge = `# Vet1Stop Website Knowledge\n\n`;
  
  // Add site structure
  knowledge += `## Site Structure\n`;
  siteStructure.pages.forEach(page => {
    knowledge += `### ${page.name} (${page.path})\n${page.description}\n`;
    knowledge += `Key features: ${page.key_features.join(', ')}\n\n`;
    
    if (page.sub_sections) {
      knowledge += `Sections:\n`;
      page.sub_sections.forEach(section => {
        knowledge += `- ${section.name}: ${section.description}\n`;
      });
      knowledge += `\n`;
    }
  });
  
  // Add resource types
  knowledge += `## Resource Types\n`;
  siteStructure.resource_types.forEach(type => {
    knowledge += `### ${type.type}\n${type.description}\n`;
    knowledge += `Examples: ${type.examples.join(', ')}\n\n`;
  });
  
  // Add veteran interaction guidelines summary
  knowledge += `## Veteran Interaction Guidelines\n`;
  knowledge += `- ${veteranInteractionGuidelines.general_principles.join('\n- ')}\n\n`;
  
  // Add resource recommendation guidelines summary
  knowledge += `## Resource Recommendation Guidelines\n`;
  knowledge += `Prioritization:\n- ${resourceRecommendationGuidelines.prioritization.join('\n- ')}\n\n`;
  knowledge += `Personalization factors:\n- ${resourceRecommendationGuidelines.personalization_factors.join('\n- ')}\n\n`;
  
  return knowledge;
}
