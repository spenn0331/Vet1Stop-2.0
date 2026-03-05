// Fixed per Living Master MD Section 2 Phase 1 ★ — Strike 1 API Stabilization March 2026

import { NextRequest, NextResponse } from 'next/server';
import {
  scoreAndSortResources,
  buildScoringContext,
  type ResourceInput,
} from '@/lib/resources-scoring';

/**
 * POST /api/health/symptom-triage  (v3 — Triage V3, Mar 2026)
 *
 * Conversational triage wizard powered by Grok AI (xAI).
 * Phase 1 flow: quick_triage (3 questions combined) → assess (scored results).
 * All resources returned from the assess step are scored and ranked by
 * resources-scoring.ts before serialization.
 *
 * Model: grok-4 (stipulated — do not change without PM approval).
 * Resilient fallback: grok-4 → grok-3-latest → static.
 * ZERO 500 errors — always returns a usable response.
 */

// ─── Model chain ──────────────────────────────────────────────────────────────

const PRIMARY_MODEL = 'grok-4';
const FALLBACK_MODEL = 'grok-3-latest';

// ─── Location context (MVP hardcoded — dynamic in Pass 2) ────────────────────
// TODO Pass 2: pull from Firebase Auth custom claim (user.state) or ask once in chat
const CARLISLE_PA_CONTEXT = 'Carlisle, PA'; // MVP testing — make dynamic in Pass 2

// ─── System prompt ────────────────────────────────────────────────────────────

const TRIAGE_SYSTEM_PROMPT = `
You are the Vet1Stop Symptom Triage Navigator — running on grok-4.
Your ONLY mission: map veteran symptoms + records to real VA, NGO, and state health resources.

CRITICAL RULES (non-negotiable):
- NEVER diagnose, treat, advise medically, or say "you have X condition."
- NEVER recommend specific medication, therapy type, or clinical action.
- ALWAYS end every response with: "This is not medical advice. Discuss with your VA provider or primary doctor."
- Crisis trigger ("hurt myself", "suicidal", etc.) → immediately output CRISIS PROTOCOL: "Call 988 Press 1 or text 838255 — help is here right now."
- You are a benefits/resource navigator, NOT a therapist.

CRITICAL RULE — STRUCTURED OUTPUT ENFORCEMENT:
When providing resource recommendations in the assess phase, you MUST return ONLY valid JSON matching the exact schema required by the tool call. Do not output raw JSON as standard conversational text. Do not wrap the JSON in markdown blocks (e.g., no \`\`\`json). Do not add introductory or concluding text. The output must be parsable immediately.

DOMAIN CONSTRAINT RULE:
- NEVER recommend education-focused NGOs (like Warrior-Scholar Project) or career NGOs unless the user explicitly mentions school, GI Bill, or employment.
- Strictly prioritize health, mental health, and physical wellness NGOs for all symptom-related queries.
- If the conversation is about symptoms, pain, PTSD, sleep, or any health concern, resources MUST be health/wellness focused.

PHASE 1 QUICK TRIAGE BEHAVIOR:
- Ask EXACTLY 3 clarifying questions in a single reply — never more.
  Q1: "Do you already have an active VA claim for any of these conditions?"
  Q2: "Are you currently receiving care at the VA, and are you satisfied with it?"
  Q3: A brief, friendly, open-ended prompt: "Is there anything else about your situation you'd like to share before I find your resources?"
- Close with a warm, professional offer to hear more before moving to assessment.
- No therapy small talk. No category menus. 3 questions, then assess.
- Vary empathy: "I got you" ONLY on first message. After that: "Got it", "Copy that", "Let's fix this."

ASSESS STEP OUTPUT (JSON only — no prose wrapper):
{
  "severity": "low|moderate|high|crisis",
  "aiMessage": "1–3 sentence warm summary. End with: 'This is not medical advice. Discuss with your VA provider or primary doctor.'",
  "vaResources": [{"title":"","description":"","url":"","phone":"","priority":"high|medium|low","tags":[],"isFree":false,"costLevel":"free|low|moderate|high","rating":0}],
  "ngoResources": [...same shape...],
  "stateResources": [...same shape...]
}
Include 5–7 resources per track ranked by relevance. For State track: ONLY Pennsylvania programs.
Each description must be exactly 2 sentences.
`;

// ─── Crisis keywords ──────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'self harm', 'hurt myself', 'cutting', 'overdose',
  'homicidal', 'kill someone', 'voices telling me', 'hallucinating',
  'psychosis', "can't go on", 'no reason to live', 'better off dead',
  'planning to end', 'emergency', 'crisis',
];

function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw));
}

// ─── Types ────────────────────────────────────────────────────────────────────

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
  step: 'welcome' | 'quick_triage' | 'category' | 'symptoms' | 'severity' | 'context' | 'assess';
  category?: string;
  userMessage?: string;
  bridgeContext?: BridgeContext;
  userState?: string;
}

// ─── Grok API helpers ─────────────────────────────────────────────────────────

function getGrokApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

async function callGrokModel(
  apiKey: string,
  model: string,
  messages: TriageMessage[],
  systemPrompt: string,
): Promise<string> {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok ${model} error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGrokAI(messages: TriageMessage[], systemPrompt: string): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    console.warn('[SymptomTriage] No Grok API key — using static fallback');
    return '';
  }

  try {
    const result = await callGrokModel(apiKey, PRIMARY_MODEL, messages, systemPrompt);
    if (result) return result;
  } catch (err) {
    console.warn(`[SymptomTriage] ${PRIMARY_MODEL} failed:`, (err as Error).message);
  }

  try {
    const result = await callGrokModel(apiKey, FALLBACK_MODEL, messages, systemPrompt);
    if (result) return result;
  } catch (err) {
    console.warn(`[SymptomTriage] ${FALLBACK_MODEL} also failed:`, (err as Error).message);
  }

  return '';
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(step: string, bridgeContext?: BridgeContext): string {
  let prompt = TRIAGE_SYSTEM_PROMPT;

  // Inject location context
  prompt += `\n\nUSER LOCATION: Veteran is in ${CARLISLE_PA_CONTEXT}. State Track MUST be Pennsylvania-only.`;

  // Inject bridge context
  if (bridgeContext?.conditions?.length) {
    const condList = bridgeContext.conditions
      .map(c => `- ${c.condition} (${c.category}, mentioned ${c.mentionCount}x)`)
      .join('\n');
    prompt += `\n\nRECORDS RECON INTEL — Conditions extracted from uploaded records:\n${condList}`;
    if (bridgeContext.reportSummary) {
      prompt += `\nSummary: ${bridgeContext.reportSummary}`;
    }
    prompt += `\nReference these conditions by name when asking clarifying questions.`;
  }

  // Step-specific overrides
  if (step === 'quick_triage') {
    prompt += `\n\nCURRENT TASK: Ask your 3 standard clarifying questions in a single reply. Be warm but brief (3–4 sentences max before the questions). Close with a friendly, professional offer to hear more.`;
  } else if (step === 'assess') {
    prompt += `\n\nCURRENT TASK: Based on the full conversation, output the JSON assessment. No prose outside the JSON object.`;
  }

  return prompt;
}

// ─── Resource scorer integration ─────────────────────────────────────────────

interface RawResource {
  title: string;
  description: string;
  url: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
  isFree?: boolean;
  costLevel?: 'free' | 'low' | 'moderate' | 'high';
  rating?: number;
  location?: string;
}

interface ScoredRawResource extends RawResource {
  score?: number;
  matchPercent?: number;
  badge?: string | null;
  whyMatches?: string;
  track?: string;
}

function applyScoring(
  vaResources: RawResource[],
  ngoResources: RawResource[],
  stateResources: RawResource[],
  bridgeContext?: BridgeContext,
): {
  va: ScoredRawResource[];
  ngo: ScoredRawResource[];
  state: ScoredRawResource[];
  keywords: string[];
} {
  const conditions = bridgeContext?.conditions?.map(c => c.condition) ?? [];
  const scoringContext = buildScoringContext({
    conditions,
    hasVaClaim: false, // extracted from conversation in Pass 2
    preferences: [],
  });

  const scoreTrack = (resources: RawResource[]) =>
    scoreAndSortResources(
      resources.map((r): ResourceInput => ({
        title: r.title,
        description: r.description,
        tags: r.tags,
        isFree: r.isFree,
        costLevel: r.costLevel,
        rating: r.rating,
        location: r.location ?? CARLISLE_PA_CONTEXT,
        url: r.url,
        phone: r.phone,
      })),
      scoringContext,
    ).map((scored, idx): ScoredRawResource => ({
      ...resources[idx], // preserve original fields (url, phone, priority, track)
      ...scored,         // overlay scored fields
      location: typeof scored.location === 'object' ? undefined : scored.location,
    }));

  return {
    va:    scoreTrack(vaResources),
    ngo:   scoreTrack(ngoResources),
    state: scoreTrack(stateResources.map(r => ({ ...r, location: r.location ?? 'Pennsylvania, PA' }))),
    keywords: scoringContext.keywords,
  };
}

// ─── Static fallbacks ─────────────────────────────────────────────────────────

function getQuickTriageFallback(): object {
  return {
    aiMessage: `I got you. To find the right resources for your situation, I just need a few quick answers:\n\n**1.** Do you already have an active VA claim for any of these conditions?\n\n**2.** Are you currently receiving care at the VA, and are you satisfied with it?\n\n**3.** Is there anything else about your situation you'd like to share before I find your resources?\n\nTake your time — I'm here to listen. This is not medical advice. Discuss with your VA provider or primary doctor.`,
    nextStep: 'awaiting_answers',
    isCrisis: false,
    suggestedQuestions: [
      'Yes, I have an active VA claim',
      "No, I don't have a VA claim yet",
      "I'm receiving VA care but not satisfied",
      "I'm not sure about my claim status",
    ],
  };
}

function getAssessFallback(bridgeContext?: BridgeContext): object {
  const conditions = bridgeContext?.conditions?.map(c => c.condition) ?? [];
  const condText = conditions.length > 0 ? conditions.slice(0, 2).join(' and ') : 'your health concerns';

  const rawVa: RawResource[] = [
    { title: 'VA Health Benefits Enrollment', description: 'Apply for VA healthcare coverage based on your service. Enrollment unlocks all VA medical programs and services.', url: 'https://www.va.gov/health-care/apply/application/introduction', priority: 'high', tags: ['veteran', 'healthcare', 'enrollment'], isFree: true },
    { title: 'VA Mental Health Services', description: 'Comprehensive counseling, PTSD treatment, and peer support programs. Available at all VA medical centers nationwide.', url: 'https://www.va.gov/health-care/health-needs-conditions/mental-health/', priority: 'high', tags: ['mental health', 'ptsd', 'counseling', 'veteran'], isFree: true },
    { title: 'VA Whole Health Program', description: 'Integrative health approach combining conventional care with yoga, nutrition, and fitness. Free for enrolled veterans.', url: 'https://www.va.gov/wholehealth/', priority: 'medium', tags: ['wellness', 'fitness', 'yoga', 'veteran', 'free'], isFree: true },
    { title: 'VA Physical Therapy & Rehab', description: 'Evidence-based physical therapy for musculoskeletal conditions including back pain and chronic injuries. Covered under VA benefits.', url: 'https://www.va.gov/health-care/about-va-health-benefits/dental-care/', priority: 'medium', tags: ['physical therapy', 'back pain', 'rehabilitation', 'veteran'], isFree: true },
    { title: 'My HealtheVet', description: 'Manage VA prescriptions, appointments, and health records in one secure portal. Accessible 24/7 from any device.', url: 'https://www.myhealth.va.gov/', priority: 'low', tags: ['records', 'portal', 'veteran'], isFree: true },
    { title: 'VA Caregiver Support Program', description: 'Resources and stipends for veterans needing daily assistance. Includes respite care and mental health support for caregivers.', url: 'https://www.caregiver.va.gov/', priority: 'low', tags: ['caregiver', 'support', 'veteran'], isFree: true },
    { title: 'VA MOVE! Weight Management', description: 'Evidence-based weight management program offered at VA facilities nationwide. Combines nutrition counseling with fitness planning.', url: 'https://www.move.va.gov/', priority: 'low', tags: ['weight loss', 'fitness', 'nutrition', 'veteran', 'free'], isFree: true },
  ];

  const rawNgo: RawResource[] = [
    { title: 'Wounded Warrior Project', description: 'Comprehensive programs for post-9/11 veterans including mental health, career, and physical wellness support. Free for eligible veterans.', url: 'https://www.woundedwarriorproject.org/', phone: '1-888-997-2586', priority: 'high', tags: ['peer support', 'mental health', 'veteran', 'free', 'peer-led'] },
    { title: 'Give An Hour', description: 'Free mental health services from licensed professionals donated by volunteer clinicians. Specializes in PTSD, anxiety, and military trauma.', url: 'https://giveanhour.org/', priority: 'high', tags: ['mental health', 'ptsd', 'free', 'counseling', 'veteran'], isFree: true },
    { title: 'Cohen Veterans Network', description: 'Nationwide network of mental health clinics offering sliding-scale services for veterans and military families. Covers PTSD, TBI, and adjustment disorders.', url: 'https://www.cohenveteransnetwork.org/', phone: '1-888-523-6936', priority: 'high', tags: ['mental health', 'ptsd', 'veteran', 'sliding-scale', 'counseling'], costLevel: 'low' },
    { title: 'Team Red White & Blue', description: 'Physical and social activity programs connecting veterans through sports, fitness, and community events. Peer-led chapters nationwide.', url: 'https://www.teamrwb.org/', priority: 'medium', tags: ['fitness', 'peer-led', 'community', 'veteran', 'adaptive sports'], isFree: true },
    { title: 'National Alliance on Mental Illness (NAMI)', description: 'Peer-led mental health education and support groups for veterans and families. Free membership and resources available.', url: 'https://www.nami.org/Support-Education/Support-Groups', priority: 'medium', tags: ['mental health', 'peer support', 'peer-led', 'free', 'community'], isFree: true },
    { title: 'Headstrong Project', description: 'Free, confidential mental health treatment for post-9/11 veterans through a nationwide network of licensed therapists. Covers PTSD, anxiety, depression, and military trauma with zero cost and zero bureaucracy.', url: 'https://getheadstrong.org/', priority: 'high', tags: ['mental health', 'ptsd', 'free', 'counseling', 'veteran', 'therapy'], isFree: true },
    { title: 'Stop Soldier Suicide', description: 'Peer support and crisis intervention focused on suicide prevention and mental health. Free hotline and digital mental health tools.', url: 'https://stopsoldiersuicide.org/', phone: '1-800-273-8255', priority: 'medium', tags: ['mental health', 'crisis', 'peer support', 'veteran', 'free'], isFree: true },
  ];

  const rawState: RawResource[] = [
    { title: 'Pennsylvania DMVA Veterans Benefits', description: 'PA Department of Military and Veterans Affairs provides state-funded benefits including education, healthcare, and burial assistance. Free to all eligible PA veterans.', url: 'https://www.dmva.pa.gov/veteransbenefits/', priority: 'high', tags: ['veteran', 'benefits', 'pennsylvania', 'grant', 'free'], location: 'Pennsylvania, PA', isFree: true },
    { title: 'PA Veterans Trust Fund Grants', description: 'Emergency financial assistance grants for Pennsylvania veterans facing hardship. Applications accepted through county directors year-round.', url: 'https://www.dmva.pa.gov/VETERANS/BenefitsAndServices/pages/veterans-trust-fund.aspx', priority: 'high', tags: ['grant', 'financial assistance', 'veteran', 'pennsylvania', 'free'], location: 'Pennsylvania, PA', isFree: true },
    { title: 'HACC Veterans Resource Center (Carlisle area)', description: 'Harrisburg Area Community College offers veteran-specific academic support, counseling referrals, and peer mentorship. Located in the Carlisle/Camp Hill area.', url: 'https://www.hacc.edu/StudentServices/VeteranServices/', priority: 'high', tags: ['education', 'peer support', 'carlisle', 'veteran', 'free'], location: 'Carlisle, PA', isFree: true },
    { title: 'PA Veteran Emergency Assistance Program', description: 'Short-term emergency financial aid for Pennsylvania veterans experiencing temporary financial crisis. Includes utility, rent, and medical cost assistance.', url: 'https://www.phfa.org/', priority: 'medium', tags: ['financial assistance', 'grant', 'veteran', 'pennsylvania', 'emergency'], location: 'Pennsylvania, PA' },
    { title: 'Penn State Hershey VA Community Based Outpatient Clinic', description: 'VA community clinic serving Cumberland County veterans near Carlisle with primary care and mental health services. No travel to main VAMC required.', url: 'https://www.va.gov/central-pennsylvania-health-care/locations/', priority: 'high', tags: ['healthcare', 'mental health', 'carlisle', 'veteran', 'va', 'free'], location: 'Carlisle, PA', isFree: true },
    { title: 'PA Adaptive Sports & Wellness Program', description: 'State-funded adaptive sports and wellness programs for veterans with service-connected disabilities. Includes yoga, archery, and fitness programs.', url: 'https://www.dmva.pa.gov/', priority: 'medium', tags: ['adaptive sports', 'fitness', 'yoga', 'veteran', 'pennsylvania', 'free'], location: 'Pennsylvania, PA', isFree: true },
    { title: 'Cumberland County Veterans Affairs Office', description: 'Free claims assistance, benefits counseling, and referrals for veterans in Carlisle and surrounding Cumberland County area. Walk-ins welcome.', url: 'https://www.cumberlandcountypa.gov/departments/veterans-affairs/', priority: 'medium', tags: ['benefits', 'claims', 'carlisle', 'veteran', 'vso', 'free'], location: 'Carlisle, PA', isFree: true },
  ];

  const scored = applyScoring(rawVa, rawNgo, rawState, bridgeContext);

  return {
    aiMessage: `Based on what you've shared about ${condText}, here are personalized resources matched to your situation. ${conditions.length > 0 ? `Resources are ranked based on relevance to ${condText}.` : 'Resources are ranked by veteran relevance and accessibility.'} This is not medical advice. Discuss with your VA provider or primary doctor.`,
    nextStep: 'complete',
    isCrisis: false,
    severity: 'moderate',
    recommendations: {
      va: scored.va,
      ngo: scored.ngo,
      state: scored.state,
    },
    keywords: scored.keywords,
  };
}

function getCrisisResponse() {
  return {
    aiMessage: `I hear you, and help is available right now. You don't have to face this alone.\n\n**If you're in immediate danger, call 911.**\n\nVeterans Crisis Line: Dial **988** then Press **1** — free, confidential, 24/7.\n\nThis is not medical advice. Discuss with your VA provider or primary doctor.`,
    nextStep: 'crisis',
    isCrisis: true,
    severity: 'crisis',
    recommendations: {
      va: [
        { track: 'va', title: 'Veterans Crisis Line', description: 'Free, confidential support 24/7 for veterans in crisis. Staffed by caring responders who understand military service.', url: 'https://www.veteranscrisisline.net/', phone: '988 (Press 1)', priority: 'high', tags: ['crisis', 'mental health', 'veteran', 'free'], isFree: true },
        { track: 'va', title: 'VA Crisis Text Line', description: 'Text-based confidential crisis support for veterans. Available 24/7 for those who prefer not to call.', url: 'https://www.veteranscrisisline.net/get-help-now/chat', phone: 'Text 838255', priority: 'high', tags: ['crisis', 'mental health', 'veteran', 'free'], isFree: true },
        { track: 'va', title: 'VA Emergency Care', description: 'Go to your nearest VA Emergency Room or call 911 for immediate life-threatening emergencies.', url: 'https://www.va.gov/find-locations/', priority: 'high', tags: ['emergency', 'crisis', 'veteran'], isFree: true },
      ],
      ngo: [
        { track: 'ngo', title: 'Stop Soldier Suicide', description: 'Peer-led crisis intervention and mental health support for veterans and service members.', url: 'https://stopsoldiersuicide.org/', phone: '1-800-273-8255', priority: 'high', tags: ['crisis', 'peer support', 'veteran', 'free'], isFree: true },
        { track: 'ngo', title: 'SAMHSA National Helpline', description: 'Free, confidential 24/7 treatment referral and information for mental health and substance use. Connects to local resources.', url: 'https://www.samhsa.gov/find-help/national-helpline', phone: '1-800-662-4357', priority: 'high', tags: ['crisis', 'mental health', 'free', 'substance use'], isFree: true },
      ],
      state: [
        { track: 'state', title: '911 Emergency Services', description: 'Call 911 for any immediate life-threatening emergency in Pennsylvania or nationwide.', url: '', phone: '911', priority: 'high', tags: ['emergency', 'crisis'], location: 'Pennsylvania, PA' },
        { track: 'state', title: 'PA Crisis Line', description: 'Pennsylvania statewide mental health crisis line staffed 24/7 by trained counselors. Free for all PA residents.', url: 'https://www.sphs.org/crisis-services/', phone: '1-855-284-2494', priority: 'high', tags: ['crisis', 'mental health', 'pennsylvania', 'free'], location: 'Pennsylvania, PA', isFree: true },
      ],
    },
    keywords: [],
  };
}

// ─── Prose sanitizer ─────────────────────────────────────────────────────────
// CRITICAL: Strips any raw JSON blobs that Grok accidentally embeds in the
// conversational aiMessage field. Resources MUST travel via the structured
// `recommendations` object — never inside the chat text.

function sanitizeAiMessage(raw: string): string {
  if (!raw) return '';

  // Strip standalone JSON objects/arrays (greedy but effective)
  let cleaned = raw
    .replace(/\{[\s\S]*"vaResources"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"ngoResources"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"stateResources"[\s\S]*\}/g, '')
    .replace(/\[[\s\S]*"title"[\s\S]*"description"[\s\S]*\]/g, '')
    .trim();

  // If the entire message was JSON and nothing useful remains, return a
  // hardcoded friendly summary so the chat bubble is never empty.
  if (!cleaned || cleaned.length < 20) {
    cleaned = 'Here are your top matched resources based on your records. '
            + 'This is not medical advice. Discuss with your VA provider or primary doctor.';
  }

  // Guarantee the medical disclaimer is always present
  if (!cleaned.includes('not medical advice')) {
    cleaned += ' This is not medical advice. Discuss with your VA provider or primary doctor.';
  }

  return cleaned;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: TriageRequest = await request.json();
    const { messages = [], step, category, userMessage, bridgeContext } = body;

    // Crisis check across all user text
    const allUserText = [
      userMessage ?? '',
      ...messages.filter(m => m.role === 'user').map(m => m.content),
    ].join(' ');

    if (detectCrisis(allUserText)) {
      return NextResponse.json(getCrisisResponse());
    }

    // Assess step: AI-powered assessment + scoring
    if (step === 'assess') {
      const systemPrompt = buildSystemPrompt('assess', bridgeContext);
      const aiResponse = await callGrokAI(messages, systemPrompt);

      if (aiResponse) {
        try {
          // Grok is instructed to return pure JSON, but sometimes wraps it in
          // prose or markdown. Extract the outermost JSON object.
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.severity === 'crisis') {
              return NextResponse.json(getCrisisResponse());
            }

            // Extract resource arrays from the parsed JSON
            const rawVa    = parsed.vaResources    ?? [];
            const rawNgo   = parsed.ngoResources   ?? [];
            const rawState = parsed.stateResources ?? [];
            const hasResources = rawVa.length + rawNgo.length + rawState.length > 0;

            // Apply scoring to AI-returned resources
            const scored = hasResources
              ? applyScoring(rawVa, rawNgo, rawState, bridgeContext)
              : applyScoring([], [], [], bridgeContext);

            // CRITICAL: Always sanitize aiMessage to remove any raw JSON.
            // Resources travel ONLY via the structured recommendations object.
            const cleanMessage = sanitizeAiMessage(parsed.aiMessage ?? aiResponse);

            return NextResponse.json({
              aiMessage: cleanMessage,
              nextStep: 'complete',
              isCrisis: false,
              severity: parsed.severity ?? 'moderate',
              recommendations: {
                va: scored.va.map((r) => ({ ...r, track: 'va' as const })),
                ngo: scored.ngo.map((r) => ({ ...r, track: 'ngo' as const })),
                state: scored.state.map((r) => ({ ...r, track: 'state' as const })),
              },
              keywords: scored.keywords,
            });
          }
        } catch (parseErr) {
          console.warn('[SymptomTriage] JSON parse failed, falling back to static assess:', parseErr);
        }
      }

      // AI unavailable or parse failed → static fallback with scoring
      return NextResponse.json(getAssessFallback(bridgeContext));
    }

    // quick_triage step (and legacy steps): conversational AI or static fallback
    const systemPrompt = buildSystemPrompt(step ?? 'quick_triage', bridgeContext);
    const aiResponse = await callGrokAI(messages, systemPrompt);

    if (aiResponse) {
      // Sanitize quick_triage responses too — Grok sometimes jumps ahead
      // and dumps resource JSON even during the conversational phase.
      const cleanMessage = sanitizeAiMessage(aiResponse);

      return NextResponse.json({
        aiMessage: cleanMessage,
        nextStep: 'awaiting_answers',
        isCrisis: false,
        suggestedQuestions: [
          'Yes, I have an active VA claim',
          "No, I don't have a VA claim yet",
          "I'm not enrolled in VA healthcare",
        ],
      });
    }

    // Static quick_triage fallback
    return NextResponse.json(getQuickTriageFallback());

  } catch (error) {
    // ZERO 500 errors — always return a usable response
    console.error('[SymptomTriage] Unhandled error:', error);
    return NextResponse.json(getAssessFallback());
  }
}
