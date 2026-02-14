/**
 * Chat API Route
 * 
 * This API route handles chatbot interactions with the Grok AI service.
 * It provides context-aware responses based on user queries and profile information.
 */

import { NextRequest, NextResponse } from 'next/server';
import { chat, Message } from '@/lib/ai/grokService';
import { buildChatbotSystemPrompt } from '@/lib/ai/promptBuilder';
import { enhanceGeneralPrompt } from '@/lib/ai/contextEnhancer';
import { getResourcesForQuery } from '@/lib/ai/mongoResourceService';
import { updateProfileFromMessage, getProfileForAIContext } from '@/lib/ai/userProfileService';
import { detectCrisis, enhanceMessageWithCrisisProtocol, getCrisisPreamble, CrisisFlag } from '@/lib/ai/crisisProtocol';
import { getLocalResourcesFromProfile } from '@/lib/ai/localResourceService';
import { scheduleFollowUp, processFollowUpResponse } from '@/lib/ai/followUpService';
import { enhanceForAccessibility, formatCrisisInfoForAccessibility } from '@/lib/ai/accessibilityService';
import { formatAIResponse, formatCrisisResponse } from '@/lib/ai/responseFormatter';

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
    
    // Check if there's already a system message
    let chatMessages: Message[] = [...messages];
    const hasSystemMessage = chatMessages.some(
      (message) => message.role === 'system'
    );

    // Build the enhanced system prompt
    let systemPrompt = '';
    if (!hasSystemMessage) {
      // Start with base system prompt
      systemPrompt = buildChatbotSystemPrompt(userProfile, currentPage);
      
      // Add crisis protocol if needed
      if (isCrisis) {
        systemPrompt = getCrisisPreamble() + '\n\n' + systemPrompt;
      }
      
      // Add user profile context if available
      const profileContext = getProfileForAIContext(userId);
      if (profileContext) {
        systemPrompt += `\n\nVeteran Information: ${profileContext}`;
      }
      
      // Enhance with topic-specific knowledge
      systemPrompt = enhanceGeneralPrompt(systemPrompt, userQuery);
      
      // Add system message to the beginning of messages
      chatMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    } else if (chatMessages[0].role === 'system') {
      // Enhance existing system message
      systemPrompt = chatMessages[0].content;
      
      // Add crisis protocol if needed and not already present
      if (isCrisis && !systemPrompt.includes('Veterans Crisis Line')) {
        systemPrompt = getCrisisPreamble() + '\n\n' + systemPrompt;
      }
      
      // Enhance with topic-specific knowledge
      systemPrompt = enhanceGeneralPrompt(systemPrompt, userQuery);
      
      // Update the system message
      chatMessages[0].content = systemPrompt;
    }
    
    // Try to get relevant resources from MongoDB
    try {
      const resourcesContext = await getResourcesForQuery(userQuery);
      if (resourcesContext && chatMessages[0]?.role === 'system') {
        chatMessages[0].content += `\n\nRelevant Resources from Vet1Stop Database: ${resourcesContext}`;
      }
    } catch (error) {
      console.error('Error getting MongoDB resources:', error);
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
      
      // Apply crisis-specific formatting
      response = formatCrisisResponse(response);
      
      // Format crisis information for accessibility
      if (response.includes('Veterans Crisis Line')) {
        const crisisSection = response.substring(
          response.indexOf('Veterans Crisis Line'), 
          response.indexOf('\n\n', response.indexOf('Veterans Crisis Line')) || response.length
        );
        
        const formattedCrisisInfo = formatCrisisInfoForAccessibility(crisisSection);
        response = response.replace(crisisSection, formattedCrisisInfo);
      }
    } else {
      // Apply standard response formatting with site links
      response = formatAIResponse(response, {
        includeSiteLinks: true,
        addResourceSections: true,
        optimizeForAccessibility: true
      });
    }
    
    // Enhance response for accessibility based on user preferences
    response = enhanceForAccessibility(response, accessibilityPreferences);

    // Log information about the interaction
    console.log(`AI Chat: ${userQuery.substring(0, 50)}... | Crisis: ${isCrisis} | Profile: ${!!userProfile} | Local Resources: ${isCrisis ? 'Added' : 'N/A'} | Follow-up: ${isCrisis ? 'Scheduled' : 'N/A'}`);

    // Return the enhanced response
    return NextResponse.json({ 
      response,
      metadata: {
        crisisDetected: isCrisis,
        crisisType: isCrisis ? crisisFlag : null,
        followUpScheduled: isCrisis,
        resourcesAdded: true,
        accessibilityEnhanced: true
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
