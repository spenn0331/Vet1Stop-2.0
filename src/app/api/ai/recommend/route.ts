/**
 * AI Recommendation API Route
 * 
 * Handles recommendation requests to the Grok AI service.
 * Provides personalized resource recommendations based on user profile and context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/ai/grokService';
import { buildRecommendationPrompt } from '@/lib/ai/promptBuilder';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userProfile, category, specificNeeds, count } = body;

    // Validate request
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Resource category is required' },
        { status: 400 }
      );
    }

    // Get recommendations
    const recommendations = await getRecommendations(
      userProfile,
      category,
      count || 3
    );

    // Parse recommendations from text format to structured data
    // In production with the real API, this would parse the text response
    // from Grok into a structured format. For now, we're using mock data
    // that's already structured
    const parsedRecommendations = recommendations.split('\n\n')
      .filter(item => item.trim())
      .map(item => {
        // Extract information from structured text
        const titleMatch = item.match(/^(\d+)\)\s+(.+?)(?:\s*-\s*|\n)/);
        const descriptionMatch = item.match(/-\s*([^(]+)(?:\(|$)/);
        const reasonMatch = item.match(/\((.+?)\)$/);

        return {
          title: titleMatch ? titleMatch[2].trim() : 'Unknown Resource',
          description: descriptionMatch ? descriptionMatch[1].trim() : 'No description available',
          reason: reasonMatch ? reasonMatch[1].trim() : 'Recommended based on your profile',
          url: `/resources/${category}/${titleMatch ? titleMatch[2].toLowerCase().replace(/\s+/g, '-') : 'resource'}`
        };
      });

    // Return the recommendations
    return NextResponse.json({
      recommendations: parsedRecommendations,
      category,
      count: parsedRecommendations.length
    });
  } catch (error) {
    console.error('Error in AI recommendation API route:', error);
    return NextResponse.json(
      { error: 'Failed to process recommendation request' },
      { status: 500 }
    );
  }
}
