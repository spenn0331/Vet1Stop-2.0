import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/health/symptom-triage
 * 
 * Conversational triage wizard powered by Grok AI (xAI).
 * Accepts conversation history + current step data.
 * Returns: AI severity assessment, triple-track resource recommendations
 * (VA / NGO / State), and crisis-line escalation flag.
 */

// Crisis keywords that trigger immediate escalation
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'hurt myself', 'cutting', 'overdose',
  'homicidal', 'kill someone', 'voices telling me', 'hallucinating',
  'psychosis', 'can\'t go on', 'no reason to live', 'better off dead',
  'planning to end', 'emergency', 'crisis'
];

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TriageRequest {
  messages: TriageMessage[];
  step: 'welcome' | 'category' | 'symptoms' | 'severity' | 'context' | 'assess';
  category?: string;
  symptoms?: string[];
  severityLevel?: number;
  duration?: string;
  currentCare?: string;
  location?: string;
  userMessage?: string;
}

interface ResourceRecommendation {
  track: 'va' | 'ngo' | 'state';
  title: string;
  description: string;
  url: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
}

interface TriageResponse {
  aiMessage: string;
  nextStep: string;
  isCrisis: boolean;
  severity?: 'low' | 'moderate' | 'high' | 'crisis';
  recommendations?: {
    va: ResourceRecommendation[];
    ngo: ResourceRecommendation[];
    state: ResourceRecommendation[];
  };
  suggestedQuestions?: string[];
}

// Check for crisis language in any user message
function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

// Get the Grok API key from environment
function getGrokApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

// Call Grok AI (xAI) API - OpenAI-compatible endpoint
async function callGrokAI(messages: TriageMessage[], systemPrompt: string): Promise<string> {
  const apiKey = getGrokApiKey();
  
  if (!apiKey) {
    console.warn('[SymptomTriage] No Grok API key found, using fallback responses');
    return '';
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-latest',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SymptomTriage] Grok API error:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('[SymptomTriage] Error calling Grok API:', error);
    return '';
  }
}

// Build the system prompt for triage assessment
function buildTriageSystemPrompt(step: string): string {
  const basePrompt = `You are a veteran health resource navigator for Vet1Stop. You help veterans find appropriate health resources through a conversational triage process. 

CRITICAL RULES:
- You are NOT a doctor. Never diagnose or provide medical advice.
- Always recommend professional care.
- If any message indicates crisis/emergency/suicidal ideation, IMMEDIATELY respond with crisis resources.
- Be warm, respectful, and use veteran-friendly language.
- Keep responses concise (2-3 sentences max per question).
- Always include the disclaimer that this is for informational purposes only.`;

  switch (step) {
    case 'category':
      return `${basePrompt}\n\nYour task: Ask a warm follow-up question based on the health category the veteran selected. Ask about specific symptoms they're experiencing. Be conversational, not clinical.`;
    
    case 'symptoms':
      return `${basePrompt}\n\nYour task: Based on the symptoms described, ask about duration and frequency. How long have they been experiencing this? Is it getting worse?`;
    
    case 'severity':
      return `${basePrompt}\n\nYour task: Ask about how much this affects their daily life. Are they able to work/sleep/function? This helps assess severity without being clinical.`;
    
    case 'context':
      return `${basePrompt}\n\nYour task: Ask about their current care situation. Are they enrolled in VA healthcare? Have they seen a provider about this? Are they using any medications?`;
    
    case 'assess':
      return `${basePrompt}\n\nYour task: Based on the full conversation, provide a severity assessment and resource recommendations. 

You MUST respond in this exact JSON format:
{
  "severity": "low|moderate|high|crisis",
  "summary": "Brief 1-2 sentence summary of the veteran's situation",
  "aiMessage": "A warm, empathetic message to the veteran with your assessment and next steps. Include the disclaimer: 'This is for informational purposes only and is not medical advice.'",
  "vaResources": [
    {"title": "Resource Name", "description": "Why this is relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}
  ],
  "ngoResources": [
    {"title": "Resource Name", "description": "Why this is relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}
  ],
  "stateResources": [
    {"title": "Resource Name", "description": "Why this is relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}
  ]
}

Include at least 2-3 resources per track. Prioritize resources that match the veteran's specific situation.`;
    
    default:
      return basePrompt;
  }
}

// Fallback responses when AI is unavailable
function getFallbackResponse(step: string, category?: string): TriageResponse {
  switch (step) {
    case 'category':
      return {
        aiMessage: `Thank you for reaching out about ${category || 'your health concerns'}. Can you tell me a bit more about what you're experiencing? What specific symptoms are you dealing with?`,
        nextStep: 'symptoms',
        isCrisis: false,
        suggestedQuestions: [
          'I\'ve been having trouble sleeping',
          'I\'m dealing with chronic pain',
          'I\'ve been feeling anxious or depressed',
          'I have a physical injury or condition'
        ]
      };
    case 'symptoms':
      return {
        aiMessage: 'I appreciate you sharing that. How long have you been experiencing these symptoms? Have they been getting better, worse, or staying about the same?',
        nextStep: 'severity',
        isCrisis: false,
        suggestedQuestions: [
          'Less than a month',
          'A few months',
          'More than 6 months',
          'It comes and goes'
        ]
      };
    case 'severity':
      return {
        aiMessage: 'Thank you. On a scale of 1 to 10, how much does this affect your daily life? Can you still work, sleep, and do your normal activities?',
        nextStep: 'context',
        isCrisis: false,
        suggestedQuestions: [
          'Mild - I can still function normally',
          'Moderate - It affects some daily activities',
          'Severe - It significantly limits what I can do',
          'Very severe - I struggle with basic daily tasks'
        ]
      };
    case 'context':
      return {
        aiMessage: 'One last question — are you currently enrolled in VA healthcare? Have you talked to a healthcare provider about this?',
        nextStep: 'assess',
        isCrisis: false,
        suggestedQuestions: [
          'Yes, I\'m enrolled in VA healthcare',
          'No, I haven\'t enrolled yet',
          'I\'ve seen a provider but need more help',
          'I\'m not sure what I\'m eligible for'
        ]
      };
    default:
      return {
        aiMessage: 'Based on what you\'ve shared, here are some resources that may help. Remember, this is for informational purposes only — please consult a healthcare provider for personalized medical advice.',
        nextStep: 'complete',
        isCrisis: false,
        severity: 'moderate',
        recommendations: {
          va: [
            { track: 'va', title: 'VA Health Benefits', description: 'Apply for VA healthcare coverage', url: 'https://www.va.gov/health-care/apply/application/introduction', priority: 'high' },
            { track: 'va', title: 'VA Mental Health Services', description: 'Counseling, therapy, and support', url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/', priority: 'medium' },
            { track: 'va', title: 'My HealtheVet', description: 'Manage your VA health records online', url: 'https://www.myhealth.va.gov/', priority: 'medium' },
          ],
          ngo: [
            { track: 'ngo', title: 'Wounded Warrior Project', description: 'Programs for post-9/11 veterans', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586', priority: 'high' },
            { track: 'ngo', title: 'Give An Hour', description: 'Free mental health services', url: 'https://giveanhour.org/', priority: 'medium' },
            { track: 'ngo', title: 'Cohen Veterans Network', description: 'Nationwide mental health clinics', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936', priority: 'medium' },
          ],
          state: [
            { track: 'state', title: 'State Veterans Affairs Office', description: 'Find your state VA office for local benefits', url: 'https://www.va.gov/statedva.htm', priority: 'high' },
            { track: 'state', title: 'State Health Programs', description: 'State-specific health programs for veterans', url: 'https://www.benefits.gov/categories/Health', priority: 'medium' },
          ],
        }
      };
  }
}

// Build the crisis response
function getCrisisResponse(): TriageResponse {
  return {
    aiMessage: `I hear you, and I want you to know that help is available right now. You don't have to face this alone.\n\n**If you or someone you know is in immediate danger, please call 911.**\n\nThis is for informational purposes only — trained crisis counselors are available 24/7 at the numbers below.`,
    nextStep: 'crisis',
    isCrisis: true,
    severity: 'crisis',
    recommendations: {
      va: [
        { track: 'va', title: 'Veterans Crisis Line', description: 'Free, confidential support 24/7. Dial 988 then Press 1.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)', priority: 'high' },
        { track: 'va', title: 'VA Crisis Text Line', description: 'Text HOME to 838255 for confidential support', url: 'https://www.veteranscrisisline.net/get-help-now/chat', phone: 'Text 838255', priority: 'high' },
        { track: 'va', title: 'VA Emergency Care', description: 'Go to your nearest VA Emergency Room or call 911', url: 'https://www.va.gov/find-locations/', priority: 'high' },
      ],
      ngo: [
        { track: 'ngo', title: 'Crisis Text Line', description: 'Text HOME to 741741', url: 'https://www.crisistextline.org/', phone: 'Text 741741', priority: 'high' },
        { track: 'ngo', title: 'SAMHSA National Helpline', description: 'Free, confidential, 24/7 treatment referral', url: 'https://www.samhsa.gov/find-help/national-helpline', phone: '1-800-662-4357', priority: 'high' },
      ],
      state: [
        { track: 'state', title: '911 Emergency Services', description: 'For immediate life-threatening emergencies', url: '', phone: '911', priority: 'high' },
        { track: 'state', title: 'Local Crisis Centers', description: 'Find crisis services in your area', url: 'https://findtreatment.gov/', priority: 'high' },
      ],
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TriageRequest = await request.json();
    const { messages = [], step, category, symptoms, userMessage } = body;

    // Check for crisis language in any user message
    const allUserText = [
      userMessage || '',
      ...(messages.filter(m => m.role === 'user').map(m => m.content)),
      ...(symptoms || [])
    ].join(' ');

    if (detectCrisis(allUserText)) {
      return NextResponse.json(getCrisisResponse());
    }

    // For assessment step, try AI-powered assessment
    if (step === 'assess') {
      const systemPrompt = buildTriageSystemPrompt('assess');
      const aiResponse = await callGrokAI(messages, systemPrompt);
      
      if (aiResponse) {
        try {
          // Try to parse JSON from AI response
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            const response: TriageResponse = {
              aiMessage: parsed.aiMessage || parsed.summary || aiResponse,
              nextStep: 'complete',
              isCrisis: parsed.severity === 'crisis',
              severity: parsed.severity || 'moderate',
              recommendations: {
                va: (parsed.vaResources || []).map((r: any) => ({ ...r, track: 'va' })),
                ngo: (parsed.ngoResources || []).map((r: any) => ({ ...r, track: 'ngo' })),
                state: (parsed.stateResources || []).map((r: any) => ({ ...r, track: 'state' })),
              }
            };

            // If crisis detected in assessment, override with crisis response
            if (response.isCrisis) {
              return NextResponse.json(getCrisisResponse());
            }

            return NextResponse.json(response);
          }
        } catch (parseError) {
          console.warn('[SymptomTriage] Could not parse AI JSON response, using text response');
        }

        // If JSON parsing failed, return the text response with fallback recommendations
        const fallback = getFallbackResponse('assess', category);
        return NextResponse.json({
          ...fallback,
          aiMessage: aiResponse,
        });
      }

      // Fallback if AI unavailable
      return NextResponse.json(getFallbackResponse('assess', category));
    }

    // For conversation steps, use AI for natural follow-up questions
    const systemPrompt = buildTriageSystemPrompt(step);
    const aiResponse = await callGrokAI(messages, systemPrompt);

    if (aiResponse) {
      const stepMap: Record<string, string> = {
        'category': 'symptoms',
        'symptoms': 'severity',
        'severity': 'context',
        'context': 'assess',
        'welcome': 'category',
      };

      return NextResponse.json({
        aiMessage: aiResponse,
        nextStep: stepMap[step] || 'assess',
        isCrisis: false,
        suggestedQuestions: getFallbackResponse(step, category).suggestedQuestions,
      });
    }

    // Fallback response
    return NextResponse.json(getFallbackResponse(step, category));

  } catch (error) {
    console.error('[SymptomTriage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process triage request', message: (error as Error).message },
      { status: 500 }
    );
  }
}
