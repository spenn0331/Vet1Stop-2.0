/**
 * Voice Command Processor
 * 
 * This module enhances voice command capabilities by providing context-aware
 * processing and specialized handling for veteran voice interactions.
 */

import { getResourcesForQuery } from './mongoResourceService';
import { updateProfileFromMessage, getProfileForAIContext } from './userProfileService';
import { detectCrisis, getCrisisPreamble } from './crisisProtocol';
import { enhanceGeneralPrompt } from './contextEnhancer';
import { chat, Message } from './grokService';

/**
 * Voice command result interface
 */
export interface VoiceCommandResult {
  response: string;
  action?: 'navigate' | 'search' | 'play' | 'pause' | 'call';
  actionTarget?: string;
  shouldSpeak: boolean;
  priority: 'normal' | 'high' | 'critical';
}

/**
 * Navigation command map
 */
const NAVIGATION_COMMANDS = new Map<RegExp, string>([
  [/go\s+to\s+(the\s+)?home\s+(page)?/i, '/'],
  [/go\s+to\s+(the\s+)?health\s+(page)?/i, '/health'],
  [/go\s+to\s+(the\s+)?education\s+(page)?/i, '/education'],
  [/go\s+to\s+(the\s+)?life(\s+and\s+leisure)?\s+(page)?/i, '/life'],
  [/go\s+to\s+(the\s+)?careers?\s+(page)?/i, '/careers'],
  [/go\s+to\s+(the\s+)?local\s+(page)?/i, '/local'],
  [/go\s+to\s+(the\s+)?shop\s+(page)?/i, '/shop'],
  [/go\s+to\s+(the\s+)?social\s+(page)?/i, '/social'],
]);

/**
 * Direct action commands
 */
const ACTION_COMMANDS = new Map<RegExp, { action: string, target?: string }>([
  [/call\s+veterans\s+crisis\s+line/i, { action: 'call', target: '988' }],
  [/search\s+for\s+(.+)/i, { action: 'search', target: '$1' }],
  [/find\s+resources?\s+for\s+(.+)/i, { action: 'search', target: '$1' }],
  [/find\s+(.+)\s+resources?/i, { action: 'search', target: '$1' }],
  [/play\s+video/i, { action: 'play' }],
  [/pause\s+video/i, { action: 'pause' }],
]);

/**
 * Process a voice command with enhanced context
 */
export async function processVoiceCommand(
  command: string,
  userId: string,
  currentPage: string
): Promise<VoiceCommandResult> {
  // First, check for navigation commands
  const navigationEntries = Array.from(NAVIGATION_COMMANDS.entries());
  for (const [pattern, path] of navigationEntries) {
    if (pattern.test(command)) {
      return {
        response: `Navigating to ${path === '/' ? 'the Home page' : path}`,
        action: 'navigate',
        actionTarget: path,
        shouldSpeak: true,
        priority: 'normal'
      };
    }
  }
  
  // Check for direct action commands
  const actionEntries = Array.from(ACTION_COMMANDS.entries());
  for (const [pattern, actionInfo] of actionEntries) {
    const match = command.match(pattern);
    if (match) {
      let target = actionInfo.target;
      
      // Replace $1, $2, etc. with captured groups
      if (target && match.length > 1) {
        for (let i = 1; i < match.length; i++) {
          target = target.replace(`$${i}`, match[i]);
        }
      }
      
      return {
        response: `Executing ${actionInfo.action} ${target ? `for ${target}` : ''}`,
        action: actionInfo.action as any,
        actionTarget: target,
        shouldSpeak: true,
        priority: 'normal'
      };
    }
  }
  
  // Check for crisis signals
  const crisisFlag = detectCrisis(command);
  if (crisisFlag !== 'none') {
    return processAsCrisisCommand(command, userId, crisisFlag);
  }
  
  // Process as general conversation with enhanced context
  return processAsGeneralCommand(command, userId, currentPage);
}

/**
 * Process a command that indicates a crisis
 */
async function processAsCrisisCommand(
  command: string,
  userId: string,
  crisisFlag: string
): Promise<VoiceCommandResult> {
  // Update user profile with any extracted information
  updateProfileFromMessage(userId, command);
  
  // Create messages with crisis-specific system prompt
  const messages: Message[] = [
    {
      role: 'system',
      content: `${getCrisisPreamble()}\n\nThis is a voice interaction with a veteran who may be in crisis. Be concise but supportive and emphasize immediate resources.`
    },
    { role: 'user', content: command }
  ];
  
  // Get AI response
  const response = await chat(messages);
  
  return {
    response,
    shouldSpeak: true,
    priority: 'critical'
  };
}

/**
 * Process a general conversational command
 */
async function processAsGeneralCommand(
  command: string,
  userId: string,
  currentPage: string
): Promise<VoiceCommandResult> {
  // Update user profile with any extracted information
  updateProfileFromMessage(userId, command);
  
  // Get user profile context
  const profileContext = getProfileForAIContext(userId);
  
  // Try to get relevant resources
  let resourcesContext = '';
  try {
    resourcesContext = await getResourcesForQuery(command);
  } catch (error) {
    console.error('Error getting resources for voice command:', error);
  }
  
  // Create base system prompt
  let systemPrompt = `You are Vet1Stop's AI assistant responding to a voice command from a veteran. 
Keep responses concise and direct since they will be spoken aloud.
The veteran is currently on the ${currentPage} page.`;

  // Add profile context if available
  if (profileContext) {
    systemPrompt += `\n\nVeteran Information: ${profileContext}`;
  }
  
  // Add resource context if available
  if (resourcesContext) {
    systemPrompt += `\n\nRelevant Resources: ${resourcesContext}`;
  }
  
  // Enhance with topic-specific knowledge
  systemPrompt = enhanceGeneralPrompt(systemPrompt, command);
  
  // Create messages
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: command }
  ];
  
  // Get AI response
  const response = await chat(messages);
  
  return {
    response,
    shouldSpeak: true,
    priority: 'normal'
  };
}
