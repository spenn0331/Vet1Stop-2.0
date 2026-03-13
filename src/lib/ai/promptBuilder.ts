/**
 * Prompt Builder
 * 
 * Utility for constructing effective prompts for different AI features
 * based on context, user profile, and specific needs.
 */

import { UserProfile } from './contextManager';

// Prompt templates for different use cases
const PROMPT_TEMPLATES = {
  // Master AI system prompt — conversational veteran navigator
  CHATBOT_SYSTEM: `You are the Vet1Stop AI — a knowledgeable, conversational AI assistant built into the Vet1Stop platform for U.S. veterans and their families.

PERSONALITY:
Talk like a real person, not a corporate helpdesk. Think of yourself as a sharp, well-informed friend who has done their homework on veteran benefits, healthcare, and life after service. You're warm, direct, and honest. You can discuss anything — sports, current events, everyday life, whatever the conversation brings. When Vet1Stop tools or veteran resources genuinely fit the conversation, bring them up naturally. Don't force them into every message. No filler phrases like "Certainly!", "Absolutely!", or "Great question!" — just respond.

CORE RULES:
- Be honest. If you don't know something, say so. Never invent phone numbers, VA form numbers, benefit dollar amounts, or resource names.
- You are NOT a VSO, attorney, or medical provider. If someone asks for official claims filing help or a medical diagnosis, be clear about that and point them to the right people.
- Match the energy of the conversation. If someone opens with "hey" just say hey back.

RESPONSE FORMAT — CRITICAL:
You are in a CHAT WIDGET, not a document editor. Keep responses SHORT and conversational.
- 2-4 sentences for simple questions or casual conversation
- A short paragraph + a 2-3 item list MAXIMUM for resource questions
- NEVER write essay-length structured responses with multiple named sections
- NO markdown section headers (## Heading) in your replies — plain conversational text only
- If you have a lot to say, pick the most important 2-3 things and offer to share more

ABOUT VET1STOP — 7 sections:

1. HEALTH (live now)
   • Browse — search hundreds of VA, federal, state, and NGO health resources with filters (subcategory, tag, sort)
   • Symptom Finder — veteran describes what's going on, AI matches them to specific VA programs and NGOs tailored to their conditions
   • Records Recon — upload military/VA medical records, AI extracts conditions and service-connection language, generates a print-ready Evidence Report
   • Smart Bridge — Records Recon findings flow directly into the Symptom Finder for deeper resource matching
   • Mission Briefings — guided step-by-step plans: Healthcare Transition, Mental Health & PTSD Support, Women's Health, Know Your Rating (VA benefits navigation), Chronic Pain, Substance Use Recovery, Aging Veterans

2. EDUCATION (coming soon)
   GI Bill, scholarships, vocational training, veteran-friendly colleges and certification programs

3. CAREERS (coming soon)
   Veteran hiring, federal and state job listings, military-to-civilian skill translation, resume help, interview prep

4. LIFE & LEISURE (coming soon)
   Housing assistance, VA home loans, adaptive sports, outdoor therapy programs, recreation, financial wellness, community activities for veterans

5. LOCAL (coming soon)
   Find veteran-owned businesses nearby — think Google Maps but veteran-focused, with ratings and directions

6. SHOP (coming soon)
   Veteran-owned products and businesses, curated spotlights and recommendations

7. SOCIAL (coming soon)
   Connect with other veterans — events, groups, community discussions

SMART ROUTING — MANDATORY tool mentions for these topics:
• Any health symptom, sleep issue, pain, mental health, or "where do I get care" question → You MUST mention: "Our Health page has a Symptom Finder that matches your specific situation to VA programs AND NGO resources — way more targeted than a general search." Then give 1-2 quick general tips.
• Medical records, disability evidence, nexus letters, C&P prep → You MUST mention Records Recon on the Health page — it extracts service-connection language from uploaded records.
• VA rating, disability claim, first-time filer → You MUST mention the "Know Your Rating" Mission Briefing on the Health page — it walks through the full claims process step by step.
• Education (GI Bill, school, training) → answer directly + mention Education section is coming soon on Vet1Stop
• Jobs/careers → answer directly + mention Careers section is coming soon
• General veteran knowledge (PACT Act, VSO, etc.) → just answer directly, no redirect needed
• Life, recreation, housing, leisure → answer directly, mention Life & Leisure is coming soon
• Off-topic or casual conversation → just be a good conversationalist, no routing needed

CRISIS PROTOCOL — NON-NEGOTIABLE:
If anyone expresses suicidal thoughts, wanting to end their life, self-harm, or a mental health crisis, lead immediately with:
"Veterans Crisis Line: Call 988, Press 1 | Text 838255 | Chat at VeteransCrisisLine.net"
This always comes first, before anything else in your response.`,

  // Resource recommendation
  RECOMMENDATION: `Based on the user profile and context provided, recommend the most relevant veteran resources.
For each recommendation, include:
1. The resource name and a brief description (1-2 sentences)
2. Why this resource is specifically relevant to the user
3. Where to find it on the Vet1Stop platform
Prioritize resources that match the user's service branch, era, location, and expressed interests.
Focus on quality over quantity - provide 3-5 highly relevant recommendations rather than a long list.`,

  // Content summarization
  SUMMARIZATION: `Summarize the following content in a clear, organized manner.
Focus on the most important information relevant to veterans.
Maintain the key points while making the content more concise and digestible.
Use bullet points for lists of benefits or resources if appropriate.
Ensure all critical details like eligibility requirements, deadlines, or contact information are preserved.`,

  // Voice command processing
  VOICE_COMMAND: `Analyze the following voice command and identify:
1. The user's primary intent (navigation, search, information, help, form completion)
2. The specific action requested
3. Any relevant parameters or search terms
Format your response as a JSON object with intent, action, and parameters fields.
Example: {"intent": "navigation", "action": "go_to_page", "parameters": {"page": "health"}}`,

  // Form field suggestions
  FORM_SUGGESTION: `For the specified form field, provide an appropriate suggestion based on the user's profile information.
Your suggestion should be helpful but respect privacy considerations.
If suggesting medical information, err on the side of caution and be general rather than specific.
For contact information, provide placeholders rather than realistic examples unless the user has explicitly shared this information.`,

  // Service discovery
  SERVICE_DISCOVERY: `Based on the veteran's profile information, identify the most relevant VA and non-VA services they might be eligible for.
Consider their service branch, era, location, and any mentioned health or educational needs.
For each service, briefly explain:
1. What the service provides
2. Basic eligibility requirements
3. How to access or apply for the service
Prioritize services with the highest likelihood of eligibility and benefit to the user.`
};

type PromptContext = {
  userProfile?: {
    name?: string;
    branch?: string;
    era?: string;
    location?: string;
    interests?: string[];
    conditions?: string[];
    rank?: string;
    yearsOfService?: number;
  };
  conversationHistory?: { role: string; content: string }[];
  currentPage?: string;
  currentQuery?: string;
  additionalContext?: string;
  issueTopic?: string;
};

/**
 * Get resource recommendations based on specific veteran concerns
 */
function getResourceRecommendationsForConcern(concern: string): string {
  // Map common concerns to specific pages and sections on our site
  const concernMap: Record<string, { page: string, section: string, description: string }[]> = {
    'ptsd': [
      { 
        page: 'Health', 
        section: 'Mental Health Resources', 
        description: 'Our Mental Health Resources section under the Health page provides comprehensive information about PTSD treatment options, VA services, and local support groups.'
      },
      { 
        page: 'Health', 
        section: 'VA Healthcare Benefits', 
        description: 'Check the VA Healthcare Benefits section to understand how to access mental health services through your VA benefits.'
      }
    ],
    'education': [
      { 
        page: 'Education', 
        section: 'GI Bill Information', 
        description: 'Our Education page has detailed information about how to use your GI Bill benefits, including eligibility requirements and application processes.'
      }
    ],
    'employment': [
      { 
        page: 'Careers', 
        section: 'Job Listings', 
        description: 'The Careers page features veteran-friendly job listings and resources for translating your military skills to civilian employment.'
      }
    ],
    'housing': [
      { 
        page: 'Life and Leisure', 
        section: 'Housing Resources', 
        description: 'Visit our Life and Leisure page for housing assistance programs, VA home loan information, and resources for veterans facing housing insecurity.'
      }
    ],
    'benefits': [
      { 
        page: 'Health', 
        section: 'VA Healthcare Benefits', 
        description: 'Our Health page includes detailed information about VA healthcare eligibility and enrollment.'
      },
      { 
        page: 'Education', 
        section: 'GI Bill Information', 
        description: 'Check the Education page for comprehensive information about education benefits available to veterans.'
      }
    ],
    'mental health': [
      { 
        page: 'Health', 
        section: 'Mental Health Resources', 
        description: 'Our Health page features a dedicated Mental Health Resources section with information about counseling, therapy, support groups, and crisis services.'
      }
    ],
    'physical health': [
      { 
        page: 'Health', 
        section: 'Physical Health Services', 
        description: 'Visit the Physical Health Services section on our Health page for information about medical care, specialty services, and preventive health.'
      }
    ],
    'community': [
      { 
        page: 'Social', 
        section: 'Community Groups', 
        description: 'Our Social page will help you connect with other veterans in your area through discussion forums, events, and local veteran organizations.'
      }
    ],
    'local': [
      { 
        page: 'Local', 
        section: 'Map Interface', 
        description: 'Use the Map Interface on our Local page to find veteran-focused businesses and services in your area.'
      }
    ]
  };
  
  // Normalize the concern to match our map keys
  const normalizedConcern = concern.toLowerCase();
  
  // Find matching concerns (exact or partial)
  let recommendations = '';
  let matchFound = false;
  
  // Check for exact match first
  if (concernMap[normalizedConcern]) {
    recommendationsFromMap(concernMap[normalizedConcern]);
    matchFound = true;
  } else {
    // Check for partial matches
    Object.keys(concernMap).forEach(key => {
      if (normalizedConcern.includes(key) || key.includes(normalizedConcern)) {
        recommendationsFromMap(concernMap[key]);
        matchFound = true;
      }
    });
  }
  
  function recommendationsFromMap(resources: { page: string, section: string, description: string }[]) {
    recommendations += resources.map(resource => 
      `- ${resource.page} Page > ${resource.section}: ${resource.description}`
    ).join('\n');
  }
  
  // If no match was found, provide general guidance
  if (!matchFound) {
    recommendations = `For general assistance with this topic, I recommend starting with our resource categories on the Home page, or using the search function to find specific resources related to your concern.`;
  }
  
  return recommendations;
}

/**
 * Build a system prompt for the chatbot based on user context
 */
export function buildChatbotSystemPrompt(userProfile?: UserProfile, currentPage?: string): string {
  let systemPrompt = PROMPT_TEMPLATES.CHATBOT_SYSTEM;

  // --- Page-specific context ---
  if (currentPage) {
    const page = currentPage.toLowerCase();
    switch (page) {
      case 'health':
        systemPrompt += `\n\nCURRENT PAGE: Health. The veteran is already on the Health page. You can reference specific tools by name: Browse (filter resources), Symptom Finder (describe symptoms → AI matches programs), Records Recon (upload records → Evidence Report), Mission Briefings (step-by-step plans). Point to these directly if relevant.`;
        break;
      case 'education':
        systemPrompt += `\n\nCURRENT PAGE: Education. The veteran is on the Education page. Focus on GI Bill chapters (Ch.33 Post-9/11, Ch.30 Montgomery, Ch.35 DEA, Ch.31 VR&E), scholarships, vocational training, and school certifying officials. Education is coming soon on Vet1Stop but you can answer education questions directly.`;
        break;
      case 'careers':
      case 'jobs':
        systemPrompt += `\n\nCURRENT PAGE: Careers. The veteran is on the Careers page. Focus on veteran hiring preferences, USAJOBS, military skill translation, resume tips, and federal/state/private sector options. Careers is coming soon on Vet1Stop but answer career questions directly.`;
        break;
      case 'life':
      case 'leisure':
      case 'life-and-leisure':
        systemPrompt += `\n\nCURRENT PAGE: Life & Leisure. The veteran is on the Life & Leisure page. Focus on housing (VA home loan, HUD-VASH), adaptive sports, outdoor programs, financial wellness, and community. This section is coming soon but answer life & leisure questions directly.`;
        break;
      case 'local':
        systemPrompt += `\n\nCURRENT PAGE: Local. The veteran is on the Local page, which helps find veteran-owned businesses nearby. Think Google Maps but veteran-focused. Coming soon — answer local business and community questions directly.`;
        break;
      case 'shop':
        systemPrompt += `\n\nCURRENT PAGE: Shop. The veteran is browsing veteran-owned products and businesses. Coming soon — answer product and veteran business questions directly.`;
        break;
      case 'social':
        systemPrompt += `\n\nCURRENT PAGE: Social. The veteran is on the Social page, for connecting with other veterans via groups, events, and discussions. Coming soon — answer community and connection questions directly.`;
        break;
      default:
        systemPrompt += `\n\nCURRENT PAGE: ${currentPage}. Help the veteran navigate to the right section of Vet1Stop based on what they need.`;
    }
  }

  // --- Veteran profile context (if available) ---
  if (userProfile) {
    const profileParts: string[] = [];
    if (userProfile.serviceBranch) profileParts.push(`Branch: ${userProfile.serviceBranch}`);
    if (userProfile.serviceEra)    profileParts.push(`Era: ${userProfile.serviceEra}`);
    if (userProfile.location)      profileParts.push(`Location: ${userProfile.location}`);
    if (userProfile.disabilityRating) profileParts.push(`Disability rating on file: ${userProfile.disabilityRating}`);
    if (userProfile.interests?.length) profileParts.push(`Interests: ${userProfile.interests.join(', ')}`);
    if (profileParts.length > 0) {
      systemPrompt += `\n\nVETERAN CONTEXT (use naturally, don't recite): ${profileParts.join(' | ')}`;
    }
  }

  return systemPrompt;
}

/**
 * Build a prompt for resource recommendations
 */
export function buildRecommendationPrompt(
  userProfile: UserProfile,
  category: string,
  specificNeeds?: string[]
): string {
  let prompt = PROMPT_TEMPLATES.RECOMMENDATION;
  
  prompt += `\n\nUser Profile:\n`;
  prompt += userProfile.serviceBranch ? `- Service Branch: ${userProfile.serviceBranch}\n` : '- Service Branch: Unknown\n';
  prompt += userProfile.serviceEra ? `- Service Era: ${userProfile.serviceEra}\n` : '- Service Era: Unknown\n';
  prompt += userProfile.location ? `- Location: ${userProfile.location}\n` : '- Location: Unknown\n';
  
  if (userProfile.interests && userProfile.interests.length > 0) {
    prompt += `- Interests: ${userProfile.interests.join(', ')}\n`;
  }
  
  if (userProfile.disabilityRating) {
    prompt += `- Disability Rating: ${userProfile.disabilityRating}\n`;
  }
  
  prompt += `\nResource Category: ${category}\n`;
  
  if (specificNeeds && specificNeeds.length > 0) {
    prompt += `\nSpecific Needs: ${specificNeeds.join(', ')}\n`;
  }
  
  prompt += `\nPlease provide 3-5 personalized resource recommendations based on this information.`;
  
  return prompt;
}

/**
 * Build a prompt for content summarization
 */
export function buildSummarizationPrompt(
  content: string,
  length: 'brief' | 'standard' | 'detailed' = 'standard'
): string {
  const lengthInstructions = {
    brief: 'Provide a very brief summary in 1-2 sentences that captures the most critical information.',
    standard: 'Provide a concise summary in a short paragraph that includes the main points.',
    detailed: 'Provide a detailed summary that covers all important aspects while still being more concise than the original.'
  };
  
  let prompt = PROMPT_TEMPLATES.SUMMARIZATION;
  prompt += `\n\n${lengthInstructions[length]}\n\nContent to summarize:\n${content}`;
  
  return prompt;
}

/**
 * Build a prompt for voice command processing
 */
export function buildVoiceCommandPrompt(transcript: string): string {
  let prompt = PROMPT_TEMPLATES.VOICE_COMMAND;
  prompt += `\n\nVoice Command: "${transcript}"`;
  
  return prompt;
}

/**
 * Build a prompt for form field suggestions
 */
export function buildFormSuggestionPrompt(
  fieldName: string,
  fieldType: string,
  userProfile: UserProfile
): string {
  let prompt = PROMPT_TEMPLATES.FORM_SUGGESTION;
  
  prompt += `\n\nField Name: ${fieldName}`;
  prompt += `\nField Type: ${fieldType}`;
  prompt += `\n\nUser Profile Information:`;
  
  // Add relevant profile information
  if (userProfile.name && (fieldName.includes('name') || fieldType.includes('name'))) {
    prompt += `\n- Name: ${userProfile.name}`;
  }
  
  if (userProfile.serviceBranch) {
    prompt += `\n- Service Branch: ${userProfile.serviceBranch}`;
  }
  
  if (userProfile.serviceEra) {
    prompt += `\n- Service Era: ${userProfile.serviceEra}`;
  }
  
  if (userProfile.location && (fieldName.includes('location') || fieldName.includes('address') || fieldType.includes('location'))) {
    prompt += `\n- Location: ${userProfile.location}`;
  }
  
  if (userProfile.disabilityRating && (fieldName.includes('disability') || fieldName.includes('medical') || fieldType.includes('disability'))) {
    prompt += `\n- Disability Rating: ${userProfile.disabilityRating}`;
  }
  
  prompt += `\n\nProvide a suggestion for this form field based on the available profile information.`;
  
  return prompt;
}

export default {
  buildChatbotSystemPrompt,
  buildRecommendationPrompt,
  buildSummarizationPrompt,
  buildVoiceCommandPrompt,
  buildFormSuggestionPrompt
};
