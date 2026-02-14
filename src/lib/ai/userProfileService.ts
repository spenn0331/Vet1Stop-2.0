/**
 * User Profile Service for AI
 * 
 * This service manages veteran user profiles to enable personalized AI responses
 * based on service branch, era, location, and other relevant factors.
 */

// Profile storage (replace with database in production)
const profileStorage = new Map<string, VeteranProfile>();

/**
 * Veteran profile interface
 */
export interface VeteranProfile {
  userId: string;
  name?: string;
  serviceBranch?: string;
  serviceEra?: string;
  rank?: string;
  yearsOfService?: number;
  location?: string;
  conditions?: string[];
  interests?: string[];
  lastInteraction?: Date;
  preferredTopics?: string[];
}

/**
 * Get a veteran's profile by user ID
 */
export function getVeteranProfile(userId: string): VeteranProfile | null {
  if (!profileStorage.has(userId)) {
    return null;
  }
  
  return profileStorage.get(userId) || null;
}

/**
 * Create or update a veteran's profile
 */
export function updateVeteranProfile(profile: Partial<VeteranProfile> & { userId: string }): VeteranProfile {
  const existingProfile = profileStorage.get(profile.userId) || { 
    userId: profile.userId,
    lastInteraction: new Date()
  };
  
  const updatedProfile = {
    ...existingProfile,
    ...profile,
    lastInteraction: new Date()
  };
  
  profileStorage.set(profile.userId, updatedProfile);
  return updatedProfile;
}

/**
 * Extract profile information from conversation
 */
export function extractProfileFromMessage(userId: string, message: string): Partial<VeteranProfile> {
  const profile: Partial<VeteranProfile> = { userId };
  const lowerMessage = message.toLowerCase();
  
  // Extract service branch
  const branchMatches = [
    { regex: /\barmy\b/i, value: 'Army' },
    { regex: /\bnavy\b/i, value: 'Navy' },
    { regex: /\bair\s*force\b/i, value: 'Air Force' },
    { regex: /\bmarines?\b/i, value: 'Marines' },
    { regex: /\bcoast\s*guard\b/i, value: 'Coast Guard' },
    { regex: /\bspace\s*force\b/i, value: 'Space Force' },
    { regex: /\bnational\s*guard\b/i, value: 'National Guard' }
  ];
  
  for (const { regex, value } of branchMatches) {
    if (regex.test(lowerMessage)) {
      profile.serviceBranch = value;
      break;
    }
  }
  
  // Extract service era
  const eraMatches = [
    { regex: /\bpost[- ]9[/\\]11\b/i, value: 'Post-9/11' },
    { regex: /\biraq\b/i, value: 'Iraq War' },
    { regex: /\bafghanistan\b/i, value: 'Afghanistan War' },
    { regex: /\bgulf\s*war\b/i, value: 'Gulf War' },
    { regex: /\bvietnam\b/i, value: 'Vietnam Era' },
    { regex: /\bkorea\b/i, value: 'Korean War' },
    { regex: /\bworld\s*war\s*(ii|2)\b/i, value: 'World War II' },
    { regex: /\bcold\s*war\b/i, value: 'Cold War' }
  ];
  
  for (const { regex, value } of eraMatches) {
    if (regex.test(lowerMessage)) {
      profile.serviceEra = value;
      break;
    }
  }
  
  // Extract name (simple pattern: "my name is [name]" or "I am [name]")
  const nameMatches = [
    /my\s+name\s+is\s+([A-Za-z]+)/i,
    /i(?:'m|\s+am)\s+([A-Za-z]+)/i
  ];
  
  for (const regex of nameMatches) {
    const match = lowerMessage.match(regex);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name.length > 1 && !['a', 'the', 'an', 'he', 'she', 'they', 'we', 'you'].includes(name.toLowerCase())) {
        profile.name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        break;
      }
    }
  }
  
  // Extract health conditions
  const conditionMatches = [
    { regex: /\bptsd\b/i, value: 'PTSD' },
    { regex: /\bdepression\b/i, value: 'Depression' },
    { regex: /\banxiety\b/i, value: 'Anxiety' },
    { regex: /\btbi\b|\btraumatic\s+brain\s+injury\b/i, value: 'TBI' },
    { regex: /\bhearing\s+loss\b|\bdeaf\b/i, value: 'Hearing Loss' },
    { regex: /\bamputation\b|\bamputee\b/i, value: 'Amputation' },
    { regex: /\bdiabetes\b/i, value: 'Diabetes' },
    { regex: /\bhypertension\b|\bhigh\s+blood\s+pressure\b/i, value: 'Hypertension' },
    { regex: /\bsubstance\s+(abuse|use)\b|\balcohol\b|\baddiction\b/i, value: 'Substance Use' }
  ];
  
  const conditions: string[] = [];
  for (const { regex, value } of conditionMatches) {
    if (regex.test(lowerMessage)) {
      conditions.push(value);
    }
  }
  
  if (conditions.length > 0) {
    profile.conditions = conditions;
  }
  
  return profile;
}

/**
 * Update profile based on user message
 */
export function updateProfileFromMessage(userId: string, message: string): VeteranProfile {
  const extractedInfo = extractProfileFromMessage(userId, message);
  return updateVeteranProfile({ userId, ...extractedInfo });
}

/**
 * Get profile information for AI context
 */
export function getProfileForAIContext(userId: string): string {
  const profile = getVeteranProfile(userId);
  
  if (!profile) {
    return '';
  }
  
  let profileContext = '';
  
  if (profile.name) {
    profileContext += `The veteran's name is ${profile.name}. `;
  }
  
  if (profile.serviceBranch) {
    profileContext += `They served in the ${profile.serviceBranch}. `;
  }
  
  if (profile.serviceEra) {
    profileContext += `Their service era is ${profile.serviceEra}. `;
  }
  
  if (profile.rank) {
    profileContext += `Their rank was ${profile.rank}. `;
  }
  
  if (profile.yearsOfService) {
    profileContext += `They served for ${profile.yearsOfService} years. `;
  }
  
  if (profile.location) {
    profileContext += `They are located in ${profile.location}. `;
  }
  
  if (profile.conditions && profile.conditions.length > 0) {
    profileContext += `They have mentioned these health conditions: ${profile.conditions.join(', ')}. `;
  }
  
  if (profile.interests && profile.interests.length > 0) {
    profileContext += `Their interests include: ${profile.interests.join(', ')}. `;
  }
  
  return profileContext;
}
