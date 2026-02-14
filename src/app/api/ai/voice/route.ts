/**
 * AI Voice Command API Route
 * 
 * Handles voice command processing requests to the Grok AI service.
 * This server-side implementation protects API keys and provides a consistent
 * interface for voice command handling across the application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/lib/ai/grokService';
import { buildVoiceCommandPrompt } from '@/lib/ai/promptBuilder';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { transcript, userProfile } = body;

    // Validate request
    if (!transcript) {
      return NextResponse.json(
        { error: 'Voice transcript is required' },
        { status: 400 }
      );
    }

    // Process the voice command
    const result = await processVoiceCommand(transcript);

    // Return the processed command
    return NextResponse.json({
      result,
      transcript
    });
  } catch (error) {
    console.error('Error in voice command API route:', error);
    return NextResponse.json(
      { error: 'Failed to process voice command' },
      { status: 500 }
    );
  }
}
