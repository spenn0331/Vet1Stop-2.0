/**
 * Prompt Builder
 * 
 * Utility for constructing effective prompts for different AI features
 * based on context, user profile, and specific needs.
 */

import { UserProfile } from './contextManager';

// Prompt templates for different use cases
const PROMPT_TEMPLATES = {
  // Chatbot system prompt
  CHATBOT_SYSTEM: `You are a helpful AI assistant for Vet1Stop, a centralized hub for U.S. veterans to access resources and opportunities.
Your name is Vet1Stop AI Assistant.
You help veterans find resources related to Education, Health, Life and Leisure, Jobs, and connect with other veterans through our Social page.
You also help veterans discover veteran-owned businesses through our Local and Shop pages.
Your tone should be respectful, clear, and compassionate while maintaining a professional demeanor.
Always be mindful that you're speaking to individuals who have served their country.
When you don't know the answer, admit it clearly and direct users to the appropriate resource page.
Keep responses concise but informative, and use a supportive tone when discussing sensitive topics like mental health or disability.
When providing resource recommendations, prioritize official sources like VA.gov before suggesting third-party options.`,

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
 * Get navigation guidance based on the current page and target page
 */
function getNavigationGuidance(currentPage: string, targetPage: string): string {
  if (currentPage === targetPage) {
    return `You're already on the ${targetPage} page. `;
  }
  
  // Find the target page in our site structure
  const targetPageInfo = siteStructure.pages.find(page => 
    page.name.toLowerCase() === targetPage.toLowerCase());
  
  if (!targetPageInfo) {
    return `To navigate to the ${targetPage} page, look for it in the main navigation menu at the top of the page. `;
  }
  
  return `To navigate to the ${targetPageInfo.name} page from the ${currentPage} page, click on "${targetPageInfo.name}" in the main navigation menu at the top of the page. ${targetPageInfo.description} `;
}

/**
 * Build a trauma-informed prompt addition based on the issue topic
 */
function getTraumaInformedGuidance(issueTopic?: string): string {
  if (!issueTopic) return '';
  
  const sensitiveTopics = ['ptsd', 'trauma', 'suicide', 'depression', 'anxiety', 'substance abuse', 'military sexual trauma', 'mst', 'combat', 'grief', 'loss'];
  
  let isTraumaSensitive = false;
  
  // Check if the issue involves a trauma-sensitive topic
  for (const topic of sensitiveTopics) {
    if (issueTopic.toLowerCase().includes(topic)) {
      isTraumaSensitive = true;
      break;
    }
  }
  
  if (isTraumaSensitive) {
    return `\n\nThis conversation involves trauma-sensitive topics. Use a trauma-informed approach:` +
      `\n- ${veteranInteractionGuidelines.trauma_informed_approach.join('\n- ')}` +
      `\n\nFor immediate crisis support, always provide the Veterans Crisis Line information: Call 988 then Press 1, text 838255, or chat at VeteransCrisisLine.net/Chat.`;
  }
  
  return '';
}

/**
 * Build service era-specific guidance based on user profile
 */
function getServiceEraGuidance(era?: string): string {
  if (!era) return '';
  
  // Normalize the era name
  const normalizedEra = era.toLowerCase();
  
  // Check against our known eras
  for (const [knownEra, guidance] of Object.entries(veteranInteractionGuidelines.service_era_awareness)) {
    if (normalizedEra.includes(knownEra.toLowerCase())) {
      return `\n\nService Era Considerations: ${guidance}`;
    }
  }
  
  return '';
}

/**
 * Build a system prompt for the AI based on the feature and context
 */
export function buildSystemPrompt(feature: string, context: PromptContext): string {
  // Get site knowledge
  const siteKnowledge = getSiteKnowledge();
  
  // Base system prompt that applies to all features
  let systemPrompt = SYSTEM_PROMPTS.CHATBOT_BASE;
  systemPrompt += `You should use the following Vet1Stop site knowledge to provide accurate, specific guidance:\n\n${siteKnowledge}\n\n`;
  
  // Veteran interaction guidelines
  systemPrompt += `When interacting with veterans, follow these principles:\n- ${veteranInteractionGuidelines.general_principles.join('\n- ')}\n\n`;
  
  // Feature-specific prompt additions
  switch (feature) {
    case 'chat':
      systemPrompt += `As a chatbot, your goal is to provide friendly, informative guidance to veterans navigating the platform. `;
      systemPrompt += `Focus on helping veterans find resources, understand benefits, and connect with support services. `;
      systemPrompt += `Always maintain a respectful, empathetic tone and acknowledge the veteran's service when appropriate. `;
      systemPrompt += `If a veteran appears to be in crisis, prioritize directing them to immediate help resources like the Veterans Crisis Line.`;
      
      // Add trauma-informed guidance if we have an issue topic
      if (context.issueTopic) {
        systemPrompt += getTraumaInformedGuidance(context.issueTopic);
      }
      break;
      
    case 'recommend':
      systemPrompt += `Your task is to provide personalized resource recommendations based on the veteran's profile, interests, and needs. `;
      systemPrompt += `Focus on relevance and actionability - suggest resources the veteran can access immediately. `;
      systemPrompt += `Explain why each resource might be helpful for their specific situation.`;
      
      // Add specific resource recommendations if we have an issue topic
      if (context.issueTopic) {
        const recommendations = getResourceRecommendationsForConcern(context.issueTopic);
        systemPrompt += `\n\nFor concerns about ${context.issueTopic}, recommend these specific Vet1Stop resources:\n${recommendations}`;
      }
      break;
      
    case 'summarize':
      systemPrompt += `Your role is to provide clear, concise summaries of veteran-related information. `;
      systemPrompt += `Highlight the most important points, especially eligibility criteria, application processes, and contact information. `;
      systemPrompt += `Make the information accessible and actionable for veterans who may be overwhelmed by details.`;
      break;
      
    case 'voice':
      systemPrompt += `As a voice assistant, your responses should be concise and direct. `;
      systemPrompt += `Focus on providing clear navigation assistance and quick answers to veteran questions. `;
      systemPrompt += `Use simple language and avoid long explanations that would be difficult to process in audio format.`;
      break;
      
    case 'form':
      systemPrompt += `Your job is to help veterans complete forms and applications effectively. `;
      systemPrompt += `Provide clear guidance on fields, required documentation, and submission processes. `;
      systemPrompt += `Be patient with questions and offer explanations for complex terminology or requirements.`;
      break;
      
    default:
      // Default case if feature is not recognized
      systemPrompt += `Provide helpful, respectful assistance to veterans using the Vet1Stop platform.`;
  }
  
  // Add context-aware modifications to the prompt
  if (context.userProfile) {
    systemPrompt += `\n\nUser context: `;
    
    if (context.userProfile.name) {
      systemPrompt += `The veteran's name is ${context.userProfile.name}. `;
    }
    
    if (context.userProfile.branch) {
      systemPrompt += `They served in the ${context.userProfile.branch}. `;
    }
    
    if (context.userProfile.era) {
      systemPrompt += `Their service era is ${context.userProfile.era}. ${getServiceEraGuidance(context.userProfile.era)}`;
    }
    
    if (context.userProfile.rank) {
      systemPrompt += `Their rank was ${context.userProfile.rank}. `;
    }
    
    if (context.userProfile.yearsOfService) {
      systemPrompt += `They served for ${context.userProfile.yearsOfService} years. `;
    }
    
    if (context.userProfile.location) {
      systemPrompt += `They are located in ${context.userProfile.location}. `;
    }
    
    if (context.userProfile.conditions && context.userProfile.conditions.length > 0) {
      systemPrompt += `They have mentioned these health conditions: ${context.userProfile.conditions.join(', ')}. `;
    }
    
    if (context.userProfile.interests && context.userProfile.interests.length > 0) {
      systemPrompt += `Their interests include: ${context.userProfile.interests.join(', ')}.`;
    }
  }
  
  if (context.currentPage && context.issueTopic) {
    // Add navigation guidance if we have both a current page and issue topic
    const recommendedPages = [];
    
    // Simple mapping of concerns to pages
    if (context.issueTopic.toLowerCase().includes('ptsd') || 
        context.issueTopic.toLowerCase().includes('mental health') ||
        context.issueTopic.toLowerCase().includes('healthcare')) {
      recommendedPages.push('Health');
    }
    if (context.issueTopic.toLowerCase().includes('education') || 
        context.issueTopic.toLowerCase().includes('school') ||
        context.issueTopic.toLowerCase().includes('gi bill')) {
      recommendedPages.push('Education');
    }
    if (context.issueTopic.toLowerCase().includes('job') || 
        context.issueTopic.toLowerCase().includes('employ') ||
        context.issueTopic.toLowerCase().includes('career')) {
      recommendedPages.push('Careers');
    }
    
    if (recommendedPages.length > 0 && !recommendedPages.includes(context.currentPage)) {
      systemPrompt += `\n\nNavigation guidance: ${getNavigationGuidance(context.currentPage, recommendedPages[0])}`;
    } else {
      systemPrompt += `\n\nThe user is currently on the ${context.currentPage} page of Vet1Stop.`;
    }
  } else if (context.currentPage) {
    systemPrompt += `\n\nThe user is currently on the ${context.currentPage} page of Vet1Stop.`;
  }
  
  if (context.additionalContext) {
    systemPrompt += `\n\nAdditional context: ${context.additionalContext}`;
  }
  
  return systemPrompt;
}

/**
 * Build a user prompt based on the context and current query
 */
export function buildUserPrompt(context: PromptContext): string {
  if (!context.currentQuery) {
    return "How can I help you with Vet1Stop's veteran resources today?";
  }
  
  return context.currentQuery;
}

/**
 * Build a complete prompt object with system and user messages
 */
export function buildCompletePrompt(feature: string, context: PromptContext): { role: string; content: string }[] {
  const systemPrompt = buildSystemPrompt(feature, context);
  const userPrompt = buildUserPrompt(context);
  
  const messages = [
    { role: 'system', content: systemPrompt },
  ];
  
  // Add conversation history if available
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    messages.push(...context.conversationHistory);
  } else {
    // If no history, just add the current user prompt
    messages.push({ role: 'user', content: userPrompt });
  }
  
  return messages;
}

/**
 * Build a system prompt for the chatbot based on user context
 */
export function buildChatbotSystemPrompt(userProfile?: UserProfile, currentPage?: string): string {
  let systemPrompt = PROMPT_TEMPLATES.CHATBOT_SYSTEM;
  
  // Add user-specific context if available
  if (userProfile) {
    systemPrompt += '\n\nUser Profile Information:';
    
    if (userProfile.serviceBranch) {
      systemPrompt += `\n- Service Branch: ${userProfile.serviceBranch}`;
    }
    
    if (userProfile.serviceEra) {
      systemPrompt += `\n- Service Era: ${userProfile.serviceEra}`;
    }
    
    if (userProfile.location) {
      systemPrompt += `\n- Location: ${userProfile.location}`;
    }
    
    if (userProfile.interests && userProfile.interests.length > 0) {
      systemPrompt += `\n- Interests: ${userProfile.interests.join(', ')}`;
    }
    
    if (userProfile.disabilityRating) {
      systemPrompt += `\n- Has indicated a disability rating: ${userProfile.disabilityRating}`;
    }
    
    if (userProfile.savedResources && userProfile.savedResources.length > 0) {
      systemPrompt += `\n- Has saved these resources: ${userProfile.savedResources.join(', ')}`;
    }
  }
  
  // Add page-specific context if available
  if (currentPage) {
    systemPrompt += `\n\nThe user is currently on the ${currentPage} page. Provide information relevant to this context when appropriate and reference features available on this page.`;
    
    // Add page-specific guidance
    switch (currentPage.toLowerCase()) {
      case 'health':
        systemPrompt += `\nOn this page, veterans can find resources related to physical health, mental health, and wellness from VA, federal programs, state programs, and NGOs. There are filtering options for service type, service branch, and veteran era.`;
        break;
      case 'education':
        systemPrompt += `\nOn this page, veterans can find resources about GI Bill benefits, scholarships, vocational training, and educational institutions that support veterans.`;
        break;
      case 'careers':
      case 'jobs':
        systemPrompt += `\nOn this page, veterans can find resources for job searching, resume building, interview preparation, and connecting with veteran-friendly employers.`;
        break;
      case 'life':
      case 'leisure':
        systemPrompt += `\nOn this page, veterans can find resources for housing, financial assistance, recreation, and community activities.`;
        break;
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
