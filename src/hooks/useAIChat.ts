/**
 * useAIChat Hook
 * 
 * Custom React hook for interacting with the AI chatbot.
 * Handles sending messages, maintaining chat history, and loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Message } from '@/lib/ai/grokService';
import {
  getConversationContext,
  addMessageToContext,
  updateUserProfile,
  updateCurrentPage,
  initializeConversation,
  UserProfile
} from '@/lib/ai/contextManager';
import { buildChatbotSystemPrompt } from '@/lib/ai/promptBuilder';

export interface ResourceCard {
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  website?: string;
  phone?: string;
  resourceType?: string;
}

export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
  resources?: ResourceCard[];
}

/**
 * Custom hook for AI chat functionality
 */
export default function useAIChat(initialUserProfile?: UserProfile, currentPage?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(initialUserProfile);

  // Initialize the conversation context with system prompt
  useEffect(() => {
    // Initialize conversation with system prompt
    initializeConversation(userProfile, currentPage);
    
    // Load existing messages from context
    const context = getConversationContext();
    if (context.messages.some(m => m.role !== 'system')) {
      const chatMessages = context.messages.map(msg => ({
        ...msg,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }));
      
      setMessages(chatMessages);
    } else {
      // Add a welcome message if no existing conversation
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: 'Hey — what\'s going on? Ask me anything, or let me know what you\'re looking for and I\'ll point you in the right direction.',
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      setMessages([welcomeMessage]);
      // Welcome message is UI-only — NOT added to API context so the AI never mimics it
    }
    
    // Update user profile from context if available
    if (context.userProfile && !userProfile) {
      setUserProfile(context.userProfile);
    }
  }, []);

  // Update current page in context when it changes
  useEffect(() => {
    if (currentPage) {
      updateCurrentPage(currentPage);
    }
  }, [currentPage]);

  /**
   * Send a message to the AI chatbot
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message to UI
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add to context
      addMessageToContext({
        role: 'user',
        content
      });
      
      // Get context for API call
      const context = getConversationContext();

      // Send to the server-side AI route (avoids CORS failure from browser → x.ai directly)
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: context.messages,
          currentPage,
          userProfile,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }
      const data = await res.json();
      const response: string = data.response;
      const resources: ResourceCard[] = data.resources || [];
      
      // Create assistant message — carries resource cards for widget rendering
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        resources: resources.length > 0 ? resources : undefined,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      // Add to UI and context
      setMessages(prev => [...prev, assistantMessage]);
      addMessageToContext({
        role: 'assistant',
        content: response
      });
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update the user profile
   */
  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...profile };
      updateUserProfile(updated);
      return updated;
    });
  }, []);

  /**
   * Clear the chat history
   */
  const clearChat = useCallback(() => {
    // Initialize a new conversation
    initializeConversation(userProfile, currentPage);
    
    // Add a welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Hey — what\'s going on? Ask me anything, or let me know what you\'re looking for and I\'ll point you in the right direction.',
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
    // Welcome message is UI-only — NOT added to API context
  }, [userProfile, currentPage]);

  return {
    messages,
    isLoading,
    error,
    userProfile,
    sendMessage,
    updateProfile,
    clearChat
  };
}
