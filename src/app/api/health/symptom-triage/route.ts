import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/health/symptom-triage
 * 
 * Conversational triage wizard powered by Grok AI (xAI).
 * Accepts conversation history + current step data + optional bridge context.
 * Returns: AI severity assessment, triple-track resource recommendations
 * (VA / NGO / State), and crisis-line escalation flag.
 * 
 * Resilient model fallback: grok-4-latest → grok-3-latest → static fallback.
 * ZERO 500 errors allowed — always returns a usable response.
 */

// ─── TRIAGE_SYSTEM_PROMPT (v2 — rapid-fire polish, Mar 2 2026) ───────────────
const TRIAGE_SYSTEM_PROMPT = `
You are the Vet1Stop Symptom Triage Navigator — a resource-matching AI ONLY.
Your mission: Help veterans map symptoms + records to real VA, NGO, and state resources in 3 clicks or less.

CRITICAL RULES — BREAK THESE AND YOU ARE FIRED:
- NEVER diagnose, treat, advise medically, or say "you have X condition."
- NEVER recommend medication, therapy type, or any clinical action.
- ALWAYS end every response with: "This is not medical advice. Discuss with your VA provider or primary doctor."
- If crisis flags ("hurt myself", suicidal), immediately output CRISIS PROTOCOL: "Call 988 Press 1 or text 838255 — help is here right now."
- You are a benefits navigator, NOT a therapist.

CORE BEHAVIOR (veteran-first):
- First question after records: "Do you already have a VA claim for this or see the VA regularly? (Yes/No)" — if yes, skip VA-heavy track and focus NGO/State.
- Ask 2-3 questions MAX at once (e.g., "State? Duration? Daily impact 1-10?"). No therapy small talk.
- For every NGO: 1-sentence "why this fits you" + 2 alternatives + direct link.
- Return 5-7 resources per track (VA/NGO/State), ranked by match. 
- Vary empathy — "I got you" ONLY on first message. After that: "Got it, brother/sister", "Copy that", "Let's fix this".
- After recs, ask 1 prefs question ("Prefer peer groups, grants, or fitness programs?") to learn likes/dislikes for future (we will store anon prefs only).
- Hard state = Pennsylvania for now. Pull real MongoDB resources only.

OUTPUT FORMAT:
- Clean, structured text. DO NOT generate complex markdown tables or draw your own UI cards in the text. Let the Next.js frontend UI components render the actual resource data objects. Keep replies 4-6 sentences max.
`;

// Crisis keywords that trigger immediate escalation
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'hurt myself', 'cutting', 'overdose',
  'homicidal', 'kill someone', 'voices telling me', 'hallucinating',
  'psychosis', 'can\'t go on', 'no reason to live', 'better off dead',
  'planning to end', 'emergency', 'crisis'
];

// Model fallback chain
const PRIMARY_MODEL = 'grok-4-latest';
const FALLBACK_MODEL = 'grok-3-latest';

// TODO: Replace with dynamic user.state from auth/profile or geocode fallback. (Next Sprint): Make state dynamic:
// Pull from user profile (Firebase Auth custom claims — e.g., user.state = "PA").
// Fallback: Ask once in chat ("Confirm your state?") and store anon in localStorage/session.
const HARDCODED_USER_STATE = 'PA';

interface TriageMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface BridgeCondition {
  condition: string;
  category: string;
  mentionCount: number;
}

interface BridgeContext {
  conditions: BridgeCondition[];
  reportSummary?: string;
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
  bridgeContext?: BridgeContext;
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

// Call Grok AI with resilient model fallback: grok-4-latest → grok-3-latest
async function callGrokAI(messages: TriageMessage[], systemPrompt: string): Promise<string> {
  const apiKey = getGrokApiKey();
  
  if (!apiKey) {
    console.warn('[SymptomTriage] No Grok API key found, using fallback responses');
    return '';
  }

  // Try primary model first
  try {
    const result = await callGrokModel(apiKey, PRIMARY_MODEL, messages, systemPrompt);
    if (result) return result;
  } catch (error) {
    console.warn(`[SymptomTriage] ${PRIMARY_MODEL} failed, falling back to ${FALLBACK_MODEL}:`, (error as Error).message);
  }

  // Fallback to secondary model
  try {
    const result = await callGrokModel(apiKey, FALLBACK_MODEL, messages, systemPrompt);
    if (result) return result;
  } catch (error) {
    console.warn(`[SymptomTriage] ${FALLBACK_MODEL} also failed:`, (error as Error).message);
  }

  // Both models failed — return empty string (caller will use static fallback)
  return '';
}

// Internal: Call a specific Grok model
async function callGrokModel(apiKey: string, model: string, messages: TriageMessage[], systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Build the system prompt — uses TRIAGE_SYSTEM_PROMPT as base, adds step-specific + bridge context
function buildTriageSystemPrompt(step: string, bridgeContext?: BridgeContext): string {
  let prompt = TRIAGE_SYSTEM_PROMPT;

  // Inject user location context (hardcoded PA for now)
  prompt += `\n\nUSER LOCATION: The veteran is located in state = "${HARDCODED_USER_STATE}" (Pennsylvania). All State Track resources MUST be Pennsylvania-specific. Do NOT recommend resources from other states.`;

  // Inject bridge context (extracted conditions from Records Recon)
  if (bridgeContext?.conditions?.length) {
    const condList = bridgeContext.conditions
      .map(c => `- ${c.condition} (${c.category}, mentioned ${c.mentionCount}x)`)
      .join('\n');
    prompt += `\n\nRECORDS RECON INTEL — The veteran uploaded medical records and these conditions were extracted:\n${condList}`;
    if (bridgeContext.reportSummary) {
      prompt += `\nReport summary: ${bridgeContext.reportSummary}`;
    }
    prompt += `\nUse this data to guide your questions and recommendations. Reference specific conditions by name.`;
  }

  // Step-specific instructions
  switch (step) {
    case 'category':
      prompt += `\n\nCURRENT TASK: Ask a warm follow-up question based on the health category the veteran selected. Ask about specific symptoms they're experiencing. One question only.`;
      break;
    case 'symptoms':
      prompt += `\n\nCURRENT TASK: Based on the symptoms described, ask about duration, frequency, and impact. One question only.`;
      break;
    case 'severity':
      prompt += `\n\nCURRENT TASK: Ask about how much this affects their daily life. Can they work/sleep/function? One question only.`;
      break;
    case 'context':
      prompt += `\n\nCURRENT TASK: Ask about their current care situation. VA enrolled? Seen a provider? One question only.`;
      break;
    case 'assess':
      prompt += `\n\nCURRENT TASK: Based on the FULL conversation, provide a severity assessment and Triple-Track resource recommendations.

You MUST respond in this exact JSON format:
{
  "severity": "low|moderate|high|crisis",
  "summary": "Brief 1-2 sentence summary",
  "aiMessage": "Warm, empathetic message with assessment. End with: 'This is not medical advice. Discuss with your VA provider or primary doctor.'",
  "vaResources": [{"title": "Name", "description": "Why relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}],
  "ngoResources": [{"title": "Name", "description": "Why relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}],
  "stateResources": [{"title": "Name", "description": "Why relevant", "url": "https://...", "phone": "optional", "priority": "high|medium|low"}]
}

Include 5-7 resources per track, ranked by match quality. For State resources, use ONLY Pennsylvania programs. Match the veteran's specific conditions.`;
      break;
  }

  return prompt;
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
    const { messages = [], step, category, symptoms, userMessage, bridgeContext } = body;

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
      const systemPrompt = buildTriageSystemPrompt('assess', bridgeContext);
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
    const systemPrompt = buildTriageSystemPrompt(step, bridgeContext);
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
    // ZERO 500 errors — always return a usable response
    console.error('[SymptomTriage] Unhandled error:', error);
    return NextResponse.json({
      aiMessage: 'I hit a snag connecting to our resource engine. Don\'t worry — here are some core resources to get you started. This is not medical advice. Discuss with your VA provider or primary doctor.',
      nextStep: 'complete',
      isCrisis: false,
      severity: 'moderate' as const,
      recommendations: {
        va: [
          { track: 'va' as const, title: 'VA Health Benefits', description: 'Apply for VA healthcare coverage', url: 'https://www.va.gov/health-care/apply/application/introduction', priority: 'high' as const },
          { track: 'va' as const, title: 'My HealtheVet', description: 'Manage your VA health records online', url: 'https://www.myhealth.va.gov/', priority: 'medium' as const },
        ],
        ngo: [
          { track: 'ngo' as const, title: 'Wounded Warrior Project', description: 'Programs for post-9/11 veterans', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586', priority: 'high' as const },
          { track: 'ngo' as const, title: 'Cohen Veterans Network', description: 'Nationwide mental health clinics', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936', priority: 'medium' as const },
        ],
        state: [
          { track: 'state' as const, title: 'State Veterans Affairs Office', description: 'Find your state VA office for local benefits', url: 'https://www.va.gov/statedva.htm', priority: 'high' as const },
        ],
      },
    });
  }
}
