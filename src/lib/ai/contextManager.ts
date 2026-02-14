/**
 * AI Context Manager
 * 
 * This module handles storing and retrieving conversation context
 * to maintain coherent AI interactions across user sessions.
 */

import { Message } from './grokService';

// Maximum number of messages to keep in context
const MAX_CONTEXT_MESSAGES = 10;

// Maximum character length for context storage
const MAX_CONTEXT_LENGTH = 4000;

/**
 * Conversation context interface
 */
export interface ConversationContext {
  messages: Message[];
  userProfile?: UserProfile;
  currentPage?: string;
  lastInteractionTime: number;
}

/**
 * User profile information to enhance context
 */
export interface UserProfile {
  serviceBranch?: string;
  serviceEra?: string;
  location?: string;
  interests?: string[];
  savedResources?: string[];
  disabilityRating?: string;
  name?: string;
}

/**
 * Get the system prompt based on user context
 */
export function getSystemPrompt(userProfile?: UserProfile, currentPage?: string): string {
  let systemPrompt = `You are a helpful AI assistant for Vet1Stop, a platform dedicated to helping U.S. veterans access resources and opportunities.
Your goal is to provide accurate, helpful information about veteran resources and guide users through the site.
Be respectful, empathetic, and understanding of veterans' unique experiences and needs.`;

  // Add user context if available
  if (userProfile) {
    systemPrompt += `\n\nYou are currently assisting a veteran`;
    
    if (userProfile.serviceBranch) {
      systemPrompt += ` who served in the ${userProfile.serviceBranch}`;
    }
    
    if (userProfile.serviceEra) {
      systemPrompt += ` during the ${userProfile.serviceEra} era`;
    }
    
    if (userProfile.location) {
      systemPrompt += ` and is located in ${userProfile.location}`;
    }
    
    systemPrompt += '.';
    
    if (userProfile.interests && userProfile.interests.length > 0) {
      systemPrompt += ` They've expressed interest in: ${userProfile.interests.join(', ')}.`;
    }
    
    if (userProfile.disabilityRating) {
      systemPrompt += ` They have indicated a disability rating of ${userProfile.disabilityRating}.`;
    }
  }

  // Add page context if available
  if (currentPage) {
    systemPrompt += `\n\nThe user is currently on the ${currentPage} page. Provide relevant information and resources related to this section when appropriate.`;
  }

  return systemPrompt;
}

/**
 * Generate a unique session ID for the conversation
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the current conversation context from storage
 */
export function getConversationContext(): ConversationContext {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      messages: [],
      lastInteractionTime: Date.now()
    };
  }

  try {
    const storedContext = localStorage.getItem('vet1stop_ai_context');
    if (storedContext) {
      return JSON.parse(storedContext);
    }
  } catch (error) {
    console.error('Error retrieving conversation context:', error);
  }

  // Return empty context if nothing is stored
  return {
    messages: [],
    lastInteractionTime: Date.now()
  };
}

/**
 * Save the conversation context to storage
 */
export function saveConversationContext(context: ConversationContext): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('vet1stop_ai_context', JSON.stringify(context));
  } catch (error) {
    console.error('Error saving conversation context:', error);
  }
}

/**
 * Add a message to the conversation context
 */
export function addMessageToContext(message: Message): void {
  const context = getConversationContext();
  
  // Add the new message
  context.messages.push(message);
  
  // Limit the number of messages to prevent context overflow
  if (context.messages.length > MAX_CONTEXT_MESSAGES) {
    // Keep the first system message if it exists
    const systemMessage = context.messages.find(m => m.role === 'system');
    
    // Remove oldest messages (but keep the system message)
    context.messages = context.messages.slice(-MAX_CONTEXT_MESSAGES);
    
    // Add back the system message if it was lost in slicing
    if (systemMessage && !context.messages.some(m => m.role === 'system')) {
      context.messages.unshift(systemMessage);
    }
  }
  
  // Update interaction time
  context.lastInteractionTime = Date.now();
  
  // Save updated context
  saveConversationContext(context);
}

/**
 * Update user profile information in the context
 */
export function updateUserProfile(profile: Partial<UserProfile>): void {
  const context = getConversationContext();
  
  // Initialize profile if it doesn't exist
  if (!context.userProfile) {
    context.userProfile = {};
  }
  
  // Update with new information
  context.userProfile = {
    ...context.userProfile,
    ...profile
  };
  
  // Save updated context
  saveConversationContext(context);
}

/**
 * Update the current page in the context
 */
export function updateCurrentPage(page: string): void {
  const context = getConversationContext();
  context.currentPage = page;
  saveConversationContext(context);
}

/**
 * Clear the conversation context
 */
export function clearConversationContext(): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('vet1stop_ai_context');
  } catch (error) {
    console.error('Error clearing conversation context:', error);
  }
}

/**
 * Check if context is expired (inactive for more than 24 hours)
 */
export function isContextExpired(): boolean {
  const context = getConversationContext();
  const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return Date.now() - context.lastInteractionTime > expirationTime;
}

/**
 * Initialize conversation with system prompt
 */
export function initializeConversation(userProfile?: UserProfile, currentPage?: string): void {
  // Clear existing context if expired
  if (isContextExpired()) {
    clearConversationContext();
  }
  
  const context = getConversationContext();
  
  // Only initialize if there are no messages yet
  if (context.messages.length === 0) {
    const systemPrompt = getSystemPrompt(userProfile, currentPage);
    
    addMessageToContext({
      role: 'system',
      content: systemPrompt
    });
    
    // Set user profile and page
    if (userProfile) {
      updateUserProfile(userProfile);
    }
    
    if (currentPage) {
      updateCurrentPage(currentPage);
    }
  }
}
