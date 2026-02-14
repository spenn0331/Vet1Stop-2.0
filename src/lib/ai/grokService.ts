/**
 * Grok AI Service
 * 
 * This service handles all interactions with the Grok AI API.
 * It provides methods for chat, recommendations, summarization, and voice commands.
 * During development, it uses mock responses to avoid API costs.
 */

import { getMockResponse } from '../../utils/ai/mockResponses';

// Types
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatCompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: MessageRole;
    };
  }[];
}

export type AIFeature = 'chat' | 'recommend' | 'summarize' | 'voice' | 'form';

// Configuration
const config = {
  apiUrl: 'https://api.x.ai/v1/chat/completions',
  model: 'grok-3-latest',
  useMocks: process.env.NEXT_PUBLIC_USE_MOCK_AI === 'true', // Use real API when set to false
};

/**
 * Send a request to the Grok API
 */
async function sendRequest(
  feature: AIFeature,
  messages: Message[],
  options: { temperature?: number; max_tokens?: number; stream?: boolean } = {}
): Promise<string> {
  // Use mock responses in development to avoid API costs
  if (config.useMocks) {
    // For mock responses, we just use the last user message as the query
    const lastUserMessage = messages.findLast(m => m.role === 'user')?.content || '';
    return await getMockResponse(feature, lastUserMessage);
  }

  try {
    // For actual API calls using personal API key
    const apiKey = process.env.NEXT_PUBLIC_GROK_API_KEY || '';
    
    if (!apiKey) {
      console.error('No API key provided for Grok service');
      throw new Error('API key is required');
    }
    
    console.log('Using real Grok API with provided key');

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        stream: options.stream || false,
      } as ChatCompletionRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
}

/**
 * Chat functionality - for the main chatbot
 */
export async function chat(messages: Message[]): Promise<string> {
  return sendRequest('chat', messages);
}

/**
 * Get personalized recommendations based on user profile and context
 */
export async function getRecommendations(
  userProfile: any,
  context: string,
  count: number = 3
): Promise<string> {
  const prompt = `Based on the user profile (${JSON.stringify(userProfile)}) 
  and in the context of "${context}", recommend ${count} resources that would be most helpful.`;
  
  const messages: Message[] = [
    {
      role: 'system',
      content: 'You are a veteran resource recommendation assistant. Provide specific, relevant resource recommendations with brief explanations.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  return sendRequest('recommend', messages);
}

/**
 * Summarize content to make it more digestible
 */
export async function summarizeContent(
  content: string,
  length: 'brief' | 'standard' | 'detailed' = 'standard'
): Promise<string> {
  const lengthInstructions = {
    brief: 'in 1-2 sentences',
    standard: 'in a short paragraph',
    detailed: 'in a comprehensive way but much shorter than the original',
  };

  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a content summarization assistant. Summarize the provided content ${lengthInstructions[length]}.`,
    },
    {
      role: 'user',
      content: `Summarize this: ${content}`,
    },
  ];

  return sendRequest('summarize', messages);
}

/**
 * Process voice commands and determine actions
 */
export async function processVoiceCommand(
  transcript: string
): Promise<{ intent: string; action: string; parameters?: Record<string, any> }> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are a voice command processor for a veteran resource website. 
      Identify the user's intent from their voice command and return a JSON object with intent, action, and any parameters.
      Possible intents: navigation, search, form, info, help`,
    },
    {
      role: 'user',
      content: transcript,
    },
  ];

  const response = await sendRequest('voice', messages);
  
  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Error parsing voice command response:', e);
    return {
      intent: 'error',
      action: 'unknown_command',
    };
  }
}

/**
 * Get form field suggestions based on field type and user profile
 */
export async function getFormSuggestions(
  fieldName: string,
  fieldType: string,
  userProfile: any
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: 'You are a form completion assistant for veterans. Provide appropriate suggestions for form fields based on user profile.',
    },
    {
      role: 'user',
      content: `Suggest a value for the form field "${fieldName}" of type "${fieldType}" based on this user profile: ${JSON.stringify(userProfile)}`,
    },
  ];

  return sendRequest('form', messages);
}

export default {
  chat,
  getRecommendations,
  summarizeContent,
  processVoiceCommand,
  getFormSuggestions,
};
