/**
 * Chat API Route
 * 
 * This API route handles chatbot interactions with the Grok AI service.
 * It provides context-aware responses based on user queries and profile information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { chat, Message } from '@/lib/ai/grokService';
import { buildChatbotSystemPrompt } from '@/lib/ai/promptBuilder';
import { getTopResourcesRaw, Resource } from '@/lib/ai/mongoResourceService';
import { updateProfileFromMessage, getProfileForAIContext } from '@/lib/ai/userProfileService';
import { detectCrisis, enhanceMessageWithCrisisProtocol, getCrisisPreamble, CrisisFlag } from '@/lib/ai/crisisProtocol';
import { getLocalResourcesFromProfile } from '@/lib/ai/localResourceService';
import { scheduleFollowUp, processFollowUpResponse } from '@/lib/ai/followUpService';
import { enhanceForAccessibility } from '@/lib/ai/accessibilityService';
import { formatAIResponse } from '@/lib/ai/responseFormatter';

/**
 * Hard-cap AI responses to maxSentences. Preserves lists and the final
 * follow-up question. Falls back gracefully if parsing is ambiguous.
 */
function truncateToMaxSentences(text: string, maxSentences: number): string {
  // Don't truncate short responses
  const trimmed = text.trim();
  // Split on sentence-ending punctuation followed by whitespace or end-of-string
  // Preserve list items (lines starting with - or *) as single units
  const lines = trimmed.split('\n');
  const sentences: string[] = [];

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    // List items count as 1 sentence unit each
    if (l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l)) {
      sentences.push(l);
    } else {
      // Split prose into sentences on . ! ? (not inside abbreviations)
      const parts = l.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [l];
      sentences.push(...parts.map(p => p.trim()).filter(Boolean));
    }
  }

  if (sentences.length <= maxSentences) return trimmed;

  // Keep up to maxSentences, but always try to keep the final follow-up question
  const lastSentence = sentences[sentences.length - 1];
  const isFollowUp = lastSentence.endsWith('?');
  const keep = sentences.slice(0, maxSentences);

  // If the last kept sentence isn't a follow-up but there's one at the end, swap last for it
  if (isFollowUp && !keep[keep.length - 1].endsWith('?')) {
    keep[keep.length - 1] = lastSentence;
  }

  return keep.join(' ').replace(/\s{2,}/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      messages, 
      userProfile, 
      currentPage, 
      userId = 'anonymous',
      sessionId = 'default',
      accessibilityPreferences = {}
    } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get the user query from the last user message
    const userQuery = messages.filter(msg => msg.role === 'user').pop()?.content || '';
    
    // Update user profile with any extracted information
    if (userQuery && userId) {
      updateProfileFromMessage(userId, userQuery);
    }
    
    // Process any previous follow-up response
    if (userId && userQuery) {
      await processFollowUpResponse(userId, userQuery);
    }
    
    // Check for crisis signals in user query
    const crisisFlag = detectCrisis(userQuery);
    const isCrisis = crisisFlag !== CrisisFlag.NONE;
    
    // If crisis detected, schedule a follow-up
    if (isCrisis && userId && sessionId) {
      await scheduleFollowUp(userId, sessionId, userQuery, crisisFlag);
      console.log(`Crisis detected (${crisisFlag}). Follow-up scheduled for user ${userId}`);
    }
    
    // Always build a fresh server-side system prompt.
    // Strip any system message the client sends — client sessionStorage can hold
    // stale/poisoned prompts from previous code versions and must never be trusted.
    let chatMessages: Message[] = messages.filter((m) => m.role !== 'system');

    // Build fresh system prompt every request
    let systemPrompt = buildChatbotSystemPrompt(userProfile, currentPage);

    // Prepend crisis protocol if needed
    if (isCrisis) {
      systemPrompt = getCrisisPreamble() + '\n\n' + systemPrompt;
    }

    // Add in-session profile context (extracted from prior messages this session)
    const profileContext = getProfileForAIContext(userId);
    if (profileContext) {
      systemPrompt += `\n\nVeteRAN CONTEXT (use naturally): ${profileContext}`;
    }

    chatMessages.unshift({ role: 'system', content: systemPrompt });
    
    // Fetch top 3 matching resources — inject concise titles into system prompt,
    // return full objects to client for card rendering (no verbose text in prompt).
    let resourceCards: Resource[] = [];
    try {
      resourceCards = await getTopResourcesRaw(userQuery);
      if (resourceCards.length > 0 && chatMessages[0]?.role === 'system') {
        const conciseTitles = resourceCards
          .map((r, i) => `RESOURCE ${i + 1}: "${r.title}" — ${r.description.slice(0, 90)}${r.description.length > 90 ? '...' : ''}`)
          .join('\n');
        chatMessages[0].content +=
          `\n\nMATCHED RESOURCES (the chat UI will render these as clickable cards — just mention 1-2 by title in your reply, do NOT describe them at length):\n${conciseTitles}`;
      }
    } catch (error) {
      console.error('Error getting resource cards:', error);
    }
    
    // Add local resources based on user profile if in crisis
    if (isCrisis && userId) {
      try {
        const localResources = await getLocalResourcesFromProfile(userId);
        if (localResources && chatMessages[0]?.role === 'system') {
          chatMessages[0].content += `\n\nLocal Crisis Resources: ${localResources}`;
        }
      } catch (error) {
        console.error('Error getting local resources:', error);
      }
    }

    // Call the Grok service
    let response = await chat(chatMessages);
    
    // Enhance response with crisis protocol if needed
    if (isCrisis) {
      response = enhanceMessageWithCrisisProtocol(userQuery, response);
    } else {
      // Apply standard response formatting — site links only; no injected headers or screen-reader artifacts
      response = formatAIResponse(response, {
        includeSiteLinks: true,
        addResourceSections: false,
        optimizeForAccessibility: false
      });
    }

    // Enhance for accessibility only when the caller has explicitly set preferences
    if (Object.keys(accessibilityPreferences).length > 0) {
      response = enhanceForAccessibility(response, { ...accessibilityPreferences, optimizeForScreenReader: false });
    }

    // Strip accessibility artifacts and fix nested markdown issues
    response = response
      .replace(/\s*\(Section Heading\)/gi, '')
      .replace(/\[List starts\]\n?/gi, '')
      .replace(/\[List ends\]\s*[-\u2013]?\s*/gi, '')
      .replace(/\s*\(link to [^)]+\)/gi, '')
      .replace(/\[(?:pointing finger|checkmark|warning|phone|email|link|mobile phone|exclamation)\]\s*/gi, '')
      .replace(/^[-•*]\s*$/gm, '')
      // Fix "1. ### Heading text:" → "1. **Heading text:**"
      .replace(/^(\d+\.\s+)#{1,3}\s+(.+)/gm, '$1**$2**')
      // Fix "- ### Heading text:" → "- **Heading text:**"
      .replace(/^([-•*]\s+)#{1,3}\s+(.+)/gm, '$1**$2**')
      .trim();

    // Hard-cap non-crisis responses at 3 sentences so the AI can't write walls of text
    if (!isCrisis) {
      response = truncateToMaxSentences(response, 3);
    }

    // Log information about the interaction
    console.log(`AI Chat: ${userQuery.substring(0, 50)}... | Crisis: ${isCrisis} | Profile: ${!!userProfile} | Local Resources: ${isCrisis ? 'Added' : 'N/A'} | Follow-up: ${isCrisis ? 'Scheduled' : 'N/A'}`);

    // Return response + structured resource cards for client-side card rendering
    const resourcesPayload = resourceCards.map(r => ({
      title: r.title,
      description: r.description,
      category: r.category,
      subcategory: r.subcategory,
      website: r.contact?.website,
      phone: r.contact?.phone,
      resourceType: r.resourceType,
    }));

    return NextResponse.json({ 
      response,
      resources: resourcesPayload,
      metadata: {
        crisisDetected: isCrisis,
        crisisType: isCrisis ? crisisFlag : null,
        followUpScheduled: isCrisis,
      }
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}

/**
 * Detect the issue topic from a message to provide better context
 */
function detectIssueTopicFromMessage(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for common veteran concerns
  if (lowerMessage.includes('ptsd') || lowerMessage.includes('trauma') || 
      lowerMessage.includes('anxiety') || lowerMessage.includes('depression') ||
      lowerMessage.includes('mental health')) {
    return 'ptsd';
  }
  
  if (lowerMessage.includes('gi bill') || lowerMessage.includes('school') || 
      lowerMessage.includes('college') || lowerMessage.includes('education') || 
      lowerMessage.includes('training')) {
    return 'education';
  }
  
  if (lowerMessage.includes('job') || lowerMessage.includes('employment') || 
      lowerMessage.includes('career') || lowerMessage.includes('work') || 
      lowerMessage.includes('resume')) {
    return 'employment';
  }
  
  if (lowerMessage.includes('va') || lowerMessage.includes('benefits') || 
      lowerMessage.includes('claim') || lowerMessage.includes('rating') || 
      lowerMessage.includes('disability')) {
    return 'benefits';
  }
  
  if (lowerMessage.includes('healthcare') || lowerMessage.includes('doctor') || 
      lowerMessage.includes('medical') || lowerMessage.includes('health') || 
      lowerMessage.includes('treatment')) {
    return 'healthcare';
  }
  
  return 'general';
}
