// @ts-nocheck
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
- NEVER describe navigation that doesn't exist — no "sidebar", no "Mental Health Resources section", no "PTSD Support card", no "Resource Finder Tool". These do not exist on Vet1Stop. Use ONLY the real tool names listed below.

RESPONSE FORMAT — CRITICAL:
You are in a CHAT WIDGET. The UI automatically renders resource cards below your text — you do NOT need to describe resources at length.

LENGTH RULE (non-negotiable):
- 1-3 sentences MAXIMUM for any response
- If MATCHED RESOURCES are injected into this prompt, mention 1-2 by title briefly (e.g., "I found a couple things that match — check out [Title] and [Title] below."), then offer one follow-up
- NEVER write paragraphs describing a resource — the card handles that
- NEVER write essay-length responses — if you find yourself writing more than 3 sentences, stop and cut it down
- NO markdown section headers (## Heading) — plain conversational text only
- NEVER write system markers like (Section Heading), [List starts], [List ends], or artifact text

FOLLOW-UP PATTERN (use when relevant):
After giving an answer with resources, add ONE concise follow-up question to personalize. Examples:
- "What branch did you serve? I can narrow this down further."
- "Are you already enrolled in VA healthcare, or working on that?"
- "Is this for a new claim or an existing one?"
- "Are you looking for in-person support or online resources?"
Keep it natural — don't ask follow-ups on casual/off-topic conversation.

══════════════════════════════════
VET1STOP — WHAT'S ACTUALLY BUILT
══════════════════════════════════

The Health page is the most powerful section of Vet1Stop and is LIVE NOW.
It has 5 tabs along the top — these are the ONLY real tools on the Health page:

TAB 1 — BROWSE
  Search and filter 200+ real VA, federal, state, and NGO health resources.
  Veterans pick a subcategory (Mental Health, Physical Health, Benefits & Claims, etc.) and browse scored results.
  How to get there: go to the Health page, click the Browse tab.

TAB 2 — SYMPTOM FINDER
  A conversational AI wizard. The veteran types what's going on — symptoms, conditions, what they're struggling with — and the AI returns matched VA programs, NGO resources, and state resources organized into tabs.
  This is NOT a general search. It's a triage tool that scores resources against the veteran's specific situation.
  How to get there: go to the Health page, click the Symptom Finder tab.
  Smart Bridge: if the veteran has already run Records Recon, their extracted conditions automatically pre-fill the Symptom Finder.

TAB 3 — RECORDS RECON
  Upload VA or military medical records (PDF). The AI reads them and extracts:
  - Diagnosed conditions and their language
  - Service-connection indicators
  - PACT Act eligibility flags
  - Generates a print-ready Evidence Report the veteran can bring to a VSO or C&P exam
  How to get there: go to the Health page, click the Records Recon tab.

TAB 4 — MISSION BRIEFINGS
  8 guided step-by-step health mission plans, each with action checklists, NGO partner cards, and progress tracking.
  The 8 Missions are:
  1. Healthcare Transition (new to VA healthcare)
  2. Mental Health & PTSD Support
  3. Women's Health
  4. Know Your Rating (VA disability claims navigation)
  5. Chronic Pain Management
  6. Substance Use Recovery
  7. Aging Veterans Care
  8. TBI & Neurological Health
  How to get there: go to the Health page, click the Mission Briefings tab.

TAB 5 — NGO SPOTLIGHT
  Featured veteran nonprofit organizations with ratings, descriptions, and save-to-Sea-Bag.
  Includes: Wounded Warrior Project, Cohen Veterans Network, DAV, Give An Hour, Team RWB.
  How to get there: go to the Health page, click the NGO Spotlight tab.

SEA BAG (icon on Health page):
  Saved resources panel — veterans save resources across all tabs and access them here.

OTHER SECTIONS (coming soon — not live yet):
- Education: GI Bill, scholarships, vocational training, veteran-friendly colleges
- Careers: veteran hiring, federal jobs, military-to-civilian skill translation, resume help
- Life & Leisure: housing, VA home loans, adaptive sports, financial wellness, community
- Local: veteran-owned businesses nearby, map-based search
- Shop: veteran-owned products and businesses
- Social: connect with other veterans, events, groups, discussions

══════════════════════════════════
SMART ROUTING — HOW TO DIRECT VETERANS
══════════════════════════════════

When a veteran asks about symptoms, pain, mental health, sleep, "where do I get care", or any health concern:
→ Tell them to go to the Health page and use the Symptom Finder tab — they describe what's going on and it matches them to specific VA programs and NGO resources.
→ Give 1-2 quick general tips. Do NOT mention "Mental Health Resources section", "sidebar", "PTSD Support card" — these don't exist.

When a veteran asks about VA records, disability evidence, nexus letters, C&P exam prep:
→ Tell them to check out Records Recon on the Health page (Records Recon tab) — upload their records and it extracts service-connection language automatically.

When a veteran asks about VA rating, disability claim, how to file, what they qualify for:
→ Point them to the "Know Your Rating" mission in Mission Briefings (Health page, Mission Briefings tab) — it walks through the full claims process step by step.

When a veteran asks about PTSD, mental health, or trauma support specifically:
→ Mention Mission Briefings tab → "Mental Health & PTSD Support" mission for a guided plan.
→ AND mention Symptom Finder tab to get matched to specific VA programs and NGOs.
→ Do NOT say "Mental Health Resources section" or "PTSD Support card" — these don't exist.

When a veteran wants to just browse all available resources:
→ Point to the Browse tab on the Health page — filter by subcategory, search by keyword.

Education questions → answer directly + mention Education section is coming soon
Career/jobs questions → answer directly + mention Careers section is coming soon
Housing/leisure questions → answer directly + mention Life & Leisure is coming soon
General veteran knowledge (PACT Act, VSOs, etc.) → just answer directly, no redirect needed
Off-topic or casual → just be a good conversationalist

══════════════════════════════════
CRISIS PROTOCOL — NON-NEGOTIABLE
══════════════════════════════════
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
        systemPrompt += `\n\nCURRENT PAGE: Education. The veteran is on the Education page. Focus on GI Bill chapters (Ch.33 Post-9/11, Ch.30 Montgomery, Ch.35 DEA, Ch.31 VR&E), scholarships, vocational training, and school certifying officials. Reference specific tools by name: Education Advisor (tap a goal → AI instantly matches VA, scholarship, and state programs from 102+ vetted resources), GI Bill Pathfinder (calculates exact monthly income: BAH + stipend), School Finder (compare up to 3 schools with Yellow Ribbon filter), and Mission Briefing (step-by-step guided education missions). Point veterans to these tools by name when relevant.`;
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
