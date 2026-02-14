/**
 * Veterans Crisis Protocol
 * 
 * This module provides specialized detection and response protocols for veterans
 * who may be experiencing crisis situations.
 */

/**
 * Crisis flags that can be detected in messages
 */
export enum CrisisFlag {
  SUICIDAL_IDEATION = 'suicidal_ideation',
  SELF_HARM = 'self_harm',
  HARM_TO_OTHERS = 'harm_to_others',
  SUBSTANCE_CRISIS = 'substance_crisis',
  ACUTE_DISTRESS = 'acute_distress',
  NONE = 'none'
}

/**
 * Crisis resource information
 */
interface CrisisResource {
  name: string;
  description: string;
  contact: string;
  website?: string;
  hours: string;
  priority: number; // Lower number = higher priority
}

/**
 * Crisis resources for veterans
 */
const CRISIS_RESOURCES: Record<string, CrisisResource> = {
  veteransCrisisLine: {
    name: 'Veterans Crisis Line',
    description: 'Confidential crisis support for veterans and their loved ones',
    contact: 'Call 988 then Press 1, text 838255',
    website: 'https://www.veteranscrisisline.net',
    hours: '24/7',
    priority: 1
  },
  nationalSuicidePreventionLifeline: {
    name: 'National Suicide Prevention Lifeline',
    description: 'National network of local crisis centers providing emotional support',
    contact: 'Call 988',
    website: 'https://988lifeline.org',
    hours: '24/7',
    priority: 2
  },
  samhsaHelpline: {
    name: 'SAMHSA\'s National Helpline',
    description: 'Treatment referral and information service for substance use disorders',
    contact: 'Call 1-800-662-HELP (4357)',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    hours: '24/7, 365 days a year',
    priority: 3
  },
  vaMentalHealth: {
    name: 'VA Mental Health Services',
    description: 'Mental health services for veterans',
    contact: 'Call your local VA Medical Center',
    website: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/',
    hours: 'Varies by location',
    priority: 4
  },
  vetCenters: {
    name: 'Vet Centers',
    description: 'Community-based counseling centers providing readjustment counseling',
    contact: 'Call 1-877-WAR-VETS (927-8387)',
    website: 'https://www.va.gov/find-locations/?facilityType=vet_center',
    hours: 'Varies by location, call center available 24/7',
    priority: 5
  }
};

/**
 * Crisis detection patterns
 */
const CRISIS_PATTERNS = {
  [CrisisFlag.SUICIDAL_IDEATION]: [
    /\bsuicid(e|al)\b/i,
    /\bkill\s+(myself|me|my\s+life)\b/i,
    /\bend\s+(myself|my\s+life)\b/i,
    /\btake\s+my\s+(own\s+)?life\b/i,
    /\bdon'?t\s+want\s+to\s+live\b/i,
    /\bwant\s+to\s+di?e\b/i,
    /\bwish\s+i\s+was\s+dead\b/i,
    /\bno\s+reason\s+to\s+live\b/i,
    /\bno\s+point\s+in\s+living\b/i,
    /\bbetter\s+off\s+without\s+me\b/i
  ],
  [CrisisFlag.SELF_HARM]: [
    /\b(cut|cutting)\s+(myself|me)\b/i,
    /\bharm\s+(myself|me)\b/i,
    /\bhurt\s+(myself|me)\b/i,
    /\bself[- ]harm\b/i,
    /\boverdose\b/i,
    /\bself[- ]injury\b/i,
    /\bstarve\s+(myself|me)\b/i
  ],
  [CrisisFlag.HARM_TO_OTHERS]: [
    /\bhurt\s+(them|him|her|someone|people)\b/i,
    /\bharm\s+(them|him|her|someone|people)\b/i,
    /\bkill\s+(them|him|her|someone|people)\b/i,
    /\bwant\s+to\s+hurt\b/i,
    /\bshoot\s+(them|him|her|someone|people)\b/i,
    /\bviolent\s+thoughts\b/i,
    /\brage\b/i
  ],
  [CrisisFlag.SUBSTANCE_CRISIS]: [
    /\boverdose[d]?\b/i,
    /\bwithdrawal\b/i,
    /\btoo\s+(much|many)\s+(drug|alcohol|pills|substances)\b/i,
    /\bdetox\b/i,
    /\bdrunk\s+too\s+much\b/i,
    /\bcan'?t\s+stop\s+(drinking|using)\b/i,
    /\baddicted\b/i,
    /\balcohol\s+poisoning\b/i
  ],
  [CrisisFlag.ACUTE_DISTRESS]: [
    /\bpanic\s+attack\b/i,
    /\bcan'?t\s+breathe\b/i,
    /\bhaving\s+a\s+breakdown\b/i,
    /\bflashback\b/i,
    /\bdesperate\b/i,
    /\bsevere\s+anxiety\b/i,
    /\btrauma\s+triggered\b/i,
    /\bcan'?t\s+handle\b/i,
    /\bspiral(ing|led)?\b/i,
    /\bcrisis\b/i,
    /\bemergency\b/i
  ]
};

/**
 * Detect crisis signals in a message
 */
export function detectCrisis(message: string): CrisisFlag {
  for (const [flag, patterns] of Object.entries(CRISIS_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return flag as CrisisFlag;
      }
    }
  }
  
  return CrisisFlag.NONE;
}

/**
 * Get appropriate resources for a crisis flag
 */
export function getCrisisResources(flag: CrisisFlag): CrisisResource[] {
  if (flag === CrisisFlag.NONE) {
    return [];
  }
  
  // Return all resources, sorted by priority
  return Object.values(CRISIS_RESOURCES)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Format crisis resources for an AI response
 */
export function formatCrisisResponse(flag: CrisisFlag): string {
  if (flag === CrisisFlag.NONE) {
    return '';
  }
  
  const resources = getCrisisResources(flag);
  let response = `I notice you may be experiencing significant distress. Your well-being is the top priority, and immediate support is available:\n\n`;
  
  // Add the Veterans Crisis Line information first (highest priority)
  response += `**${resources[0].name}**: ${resources[0].description}\n`;
  response += `${resources[0].contact}\n`;
  if (resources[0].website) {
    response += `${resources[0].website}\n`;
  }
  response += `Available: ${resources[0].hours}\n\n`;
  
  // Add general crisis message
  response += `These resources are confidential, available 24/7, and staffed by caring professionals, many of whom are veterans themselves. They are specifically trained to help veterans through difficult situations.\n\n`;
  
  // Add other relevant resources
  response += `Additional resources include:\n`;
  for (let i = 1; i < Math.min(resources.length, 4); i++) {
    response += `- **${resources[i].name}**: ${resources[i].contact}${resources[i].website ? ` (${resources[i].website})` : ''}\n`;
  }
  
  return response;
}

/**
 * Get crisis preamble for chat prompts
 */
export function getCrisisPreamble(): string {
  return `
If a veteran appears to be in crisis (expressing suicidal thoughts, severe distress, etc.), prioritize their safety above all else:

1. IMMEDIATE RESPONSE: Lead with the Veterans Crisis Line information.
   - Call 988 then Press 1
   - Text 838255
   - Chat at VeteransCrisisLine.net/Chat

2. VALIDATE FEELINGS: Acknowledge their pain without minimizing it.

3. FOCUS ON SAFETY: Emphasize that help is available and effective.

4. BE DIRECT: It's OK to ask directly about suicidal thoughts - this doesn't increase risk.

5. MAINTAIN HOPE: Convey that treatment works and things can improve.
`;
}

/**
 * Enhance a message with crisis protocol if needed
 */
export function enhanceMessageWithCrisisProtocol(message: string, aiResponse: string): string {
  const crisisFlag = detectCrisis(message);
  
  if (crisisFlag !== CrisisFlag.NONE) {
    const crisisResources = formatCrisisResponse(crisisFlag);
    
    // Check if the AI response already includes crisis information
    const hasVeteransCrisisLine = aiResponse.includes('Veterans Crisis Line') || 
                                 aiResponse.includes('988') || 
                                 aiResponse.includes('838255');
    
    if (!hasVeteransCrisisLine) {
      // Add crisis resources at the beginning of the response
      return crisisResources + '\n\n' + aiResponse;
    }
  }
  
  return aiResponse;
}
