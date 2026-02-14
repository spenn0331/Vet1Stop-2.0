/**
 * useAIChat Hook
 * 
 * Custom React hook for interacting with the AI chatbot.
 * Handles sending messages, maintaining chat history, and loading states.
 */

import { useState, useEffect, useCallback } from 'react';
import { chat, Message } from '@/lib/ai/grokService';
import {
  getConversationContext,
  addMessageToContext,
  updateUserProfile,
  updateCurrentPage,
  initializeConversation,
  UserProfile
} from '@/lib/ai/contextManager';
import { buildChatbotSystemPrompt } from '@/lib/ai/promptBuilder';

export interface ChatMessage extends Message {
  id: string;
  timestamp: number;
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
    if (context.messages.length > 0) {
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
        content: 'Hello! I\'m the Vet1Stop AI Assistant. How can I help you find veteran resources today?',
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      
      setMessages([welcomeMessage]);
      addMessageToContext({
        role: 'assistant',
        content: welcomeMessage.content
      });
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
      
      // Send to API
      const response = await chat(context.messages);
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
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
      content: 'Hello! I\'m the Vet1Stop AI Assistant. How can I help you find veteran resources today?',
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
    addMessageToContext({
      role: 'assistant',
      content: welcomeMessage.content
    });
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
