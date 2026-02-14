/**
 * AI Summarization API Route
 * 
 * Handles content summarization requests to the Grok AI service.
 * Provides condensed versions of lengthy content for easier consumption.
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeContent } from '@/lib/ai/grokService';
import { buildSummarizationPrompt } from '@/lib/ai/promptBuilder';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { content, length } = body;

    // Validate request
    if (!content) {
      return NextResponse.json(
        { error: 'Content to summarize is required' },
        { status: 400 }
      );
    }

    // Check content length
    if (content.length < 100) {
      return NextResponse.json(
        { summary: content, message: 'Content is too short to summarize' },
        { status: 200 }
      );
    }

    // Validate length parameter
    const validLengths = ['brief', 'standard', 'detailed'];
    const summaryLength = validLengths.includes(length) 
      ? length as 'brief' | 'standard' | 'detailed'
      : 'standard';

    // Generate summary
    const summary = await summarizeContent(content, summaryLength);

    // Return the summary
    return NextResponse.json({
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      reductionPercentage: Math.round((1 - summary.length / content.length) * 100),
      length: summaryLength
    });
  } catch (error) {
    console.error('Error in AI summarization API route:', error);
    return NextResponse.json(
      { error: 'Failed to process summarization request' },
      { status: 500 }
    );
  }
}
