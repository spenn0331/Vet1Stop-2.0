// Fixed per Living Master MD Section 2 Phase 1 ★ — Strike 1 API Stabilization March 2026
// Strike 1 + DB Fallback Fix: MongoDB query replaces hardcoded static fallback — March 2026

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
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
  updatedAt?: string;
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
  chatKeywords?: string[],
  userProfile?: ReturnType<typeof parseUserProfile>,
): {
  va: ScoredRawResource[];
  ngo: ScoredRawResource[];
  state: ScoredRawResource[];
  keywords: string[];
} {
  // Strike 4C: Merge bridge conditions + chat keywords into unified context
  const bridgeConditions = bridgeContext?.conditions?.map(c => c.condition) ?? [];
  const allConditions = Array.from(new Set([...bridgeConditions, ...(chatKeywords ?? [])]));

  const severityWeights = chatKeywords && chatKeywords.length > 0
    ? parseSeverityWeights(chatKeywords.join(' '), allConditions)
    : undefined;

  const scoringContext = buildScoringContext({
    conditions: allConditions,
    hasVaClaim: userProfile?.hasVaClaim ?? false,
    preferences: [],
    severityWeights,
    userProfile: userProfile ? {
      isPermanentTotal: userProfile.isPermanentTotal,
      branch: userProfile.branch,
      era: userProfile.era,
      vaDissatisfied: userProfile.vaDissatisfied,
    } : undefined,
  });

  // Strike 4D: Score cutoff — filter out resources below threshold; keep top 3 as safety net
  const SCORE_CUTOFF = 35;
  const scoreTrack = (resources: RawResource[]) => {
    const scored = scoreAndSortResources(
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
        updatedAt: r.updatedAt,
      })),
      scoringContext,
    ).map((s, idx): ScoredRawResource => ({
      ...resources[idx],
      ...s,
      location: typeof s.location === 'object' ? undefined : s.location,
    }));
    const filtered = scored.filter(r => (r.score ?? 0) >= SCORE_CUTOFF);
    return filtered.length >= 3 ? filtered : scored.slice(0, 3);
  };

  return {
    va:    scoreTrack(vaResources),
    ngo:   scoreTrack(ngoResources),
    state: scoreTrack(stateResources.map(r => ({ ...r, location: r.location ?? 'Pennsylvania, PA' }))),
    keywords: scoringContext.keywords,
  };
}

// ─── Keyword extractor (Strike 4A — compound phrase detection) ───────────────

/** Known health/condition phrases detected before single-word splitting */
const KNOWN_HEALTH_PHRASES = [
  'back pain', 'chronic pain', 'sleep apnea', 'weight loss', 'weight gain',
  'substance use', 'traumatic brain injury', 'hearing loss', 'mental health',
  'physical therapy', 'peer support', 'pain management', 'adaptive sports',
  'sleep issues', 'sleep problems', 'out of shape', 'lack motivation',
  'lack of motivation', 'always tired', 'post traumatic',
];

/** Single health-signal words — kept regardless of length */
const HEALTH_SIGNAL_WORDS = new Set([
  'ptsd', 'tbi', 'pain', 'sleep', 'knee', 'back', 'anxiety', 'depression',
  'fitness', 'weight', 'fatigue', 'tired', 'motivation', 'wellness',
  'counseling', 'therapy', 'yoga', 'nutrition', 'stress', 'trauma',
  'entrepreneur', 'business', 'disability', 'tinnitus', 'diabetes',
]);

/** Noise words that produce false DB regex matches */
const KEYWORD_NOISE = new Set([
  'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
  'for', 'of', 'with', 'have', 'has', 'is', 'are', 'was', 'be', 'been', 'do',
  'does', 'did', 'not', 'no', 'yes', 'its', 'it', 'this', 'that', 'what', 'how',
  'about', 'any', 'some', 'get', 'can', 'will', 'would', 'could', 'should', 'just',
  'also', 'your', 'you', 'we', 'they', 'he', 'she', 'very', 'more', 'want',
  'need', 'help', 'find', 'know', 'tell', 'here', 'there', 'when', 'where', 'which',
  // Noise that causes false DB matches
  'service', 'services', 'stuff', 'things', 'shape', 'leaving', 'started',
  'already', 'currently', 'affect', 'aspects', 'bother', 'since', 'like',
  'aches', 'pains', 'active', 'claim', 'past', 'satisfied', 'aspiring',
  'from', 'then', 'them', 'their', 'been', 'both', 'such', 'into', 'over',
]);

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ');
  const found: string[] = [];

  // Phase 1: Compound phrases (highest signal)
  for (const phrase of KNOWN_HEALTH_PHRASES) {
    if (lower.includes(phrase)) found.push(phrase);
  }

  // Phase 2: Single health-signal words
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (HEALTH_SIGNAL_WORDS.has(word) && !found.some(f => f.includes(word))) {
      found.push(word);
    }
  }

  // Phase 3: Meaningful remaining words (fallback for novel terms)
  for (const word of words) {
    if (word.length > 4 && !KEYWORD_NOISE.has(word) && !found.some(f => f.includes(word))) {
      found.push(word);
    }
  }

  return Array.from(new Set(found)).slice(0, 15);
}

// ─── User profile parser (Strike 4G) ─────────────────────────────────────────

function parseUserProfile(text: string): {
  isPermanentTotal: boolean;
  hasVaClaim: boolean;
  branch?: string;
  era?: string;
  vaDissatisfied: boolean;
} {
  const lower = text.toLowerCase();
  const isPermanentTotal = /100\s*%\s*p\s*[&and]*\s*t|permanent\s*(and\s*)?total/.test(lower);
  const hasVaClaim = /(active|open|pending)\s*claim|already\s*service\s*connected|service\s*connected/.test(lower)
    && !/no\s*active|no\s*claim|don.t\s*have/.test(lower);
  const vaDissatisfied = /not\s*satisfied|wasn.t\s*satisfied|dissatisfied|not\s*happy|poor\s*care/.test(lower);

  let branch: string | undefined;
  if (/\barmy\b/.test(lower)) branch = 'army';
  else if (/\bnavy\b/.test(lower)) branch = 'navy';
  else if (/\bmarine|\busmс/.test(lower)) branch = 'marines';
  else if (/\bair\s*force\b/.test(lower)) branch = 'air force';
  else if (/\bcoast\s*guard\b/.test(lower)) branch = 'coast guard';
  else if (/\bspace\s*force\b/.test(lower)) branch = 'space force';

  let era: string | undefined;
  if (/post.?9.?11|post\s*9\/11|gwot|oif|oef|iraq|afghanistan/.test(lower)) era = 'post-9/11';
  else if (/vietnam/.test(lower)) era = 'vietnam';
  else if (/gulf\s*war/.test(lower)) era = 'gulf war';

  return { isPermanentTotal, hasVaClaim, branch, era, vaDissatisfied };
}

// ─── Severity weight parser (Strike 4J) ──────────────────────────────────────

/** Amplifier words that indicate a keyword is more impactful */
const AMPLIFIERS = ['more', 'most', 'worst', 'really', 'very', 'severely', 'seriously', 'badly', 'affects me', 'bothers me most', 'affects me more'];

function parseSeverityWeights(text: string, keywords: string[]): Record<string, number> {
  const lower = text.toLowerCase();
  const weights: Record<string, number> = {};

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    // Look for amplifier words near the keyword (within 30 chars)
    const kwIdx = lower.indexOf(kwLower);
    if (kwIdx === -1) { weights[kwLower] = 1.0; continue; }
    const window = lower.slice(Math.max(0, kwIdx - 40), kwIdx + kwLower.length + 40);
    const hasAmplifier = AMPLIFIERS.some(amp => window.includes(amp));
    // Count extra mentions
    const mentionCount = (lower.match(new RegExp(kwLower.replace(/[+?.*()\[\]{}|^$\\]/g, '\\$&'), 'g')) ?? []).length;
    weights[kwLower] = hasAmplifier ? 1.5 : mentionCount > 1 ? 1.3 : 1.0;
  }

  return weights;
}

// ─── Cross-domain intent detector (Strike 4I) ────────────────────────────────

const CROSS_DOMAIN_SIGNALS: Record<string, string[]> = {
  careers:   ['entrepreneur', 'business', 'job', 'career', 'employment', 'hire', 'resume', 'work', 'sdvosb'],
  education: ['school', 'college', 'gi bill', 'degree', 'certificate', 'vocational', 'training', 'university'],
  life:      ['housing', 'moving', 'relocation', 'lease', 'mortgage', 'pcs', 'home base', 'mwr', 'recreation'],
};

function detectCrossDomainIntent(text: string): Array<{ domain: string; signal: string }> {
  const lower = text.toLowerCase();
  const hints: Array<{ domain: string; signal: string }> = [];
  for (const [domain, signals] of Object.entries(CROSS_DOMAIN_SIGNALS)) {
    const matched = signals.find(s => lower.includes(s));
    if (matched) hints.push({ domain, signal: matched });
  }
  return hints;
}

// ─── MongoDB resource fetcher (replaces static fallback) ─────────────────────

async function fetchMongoResources(
  keywords: string[],
  bridgeContext?: BridgeContext,
): Promise<{ rawVa: RawResource[]; rawNgo: RawResource[]; rawState: RawResource[] }> {
  try {
    const dbName = process.env.MONGODB_DB || 'vet1stop';
    const { db } = await connectToDatabase(dbName);

    // healthResources is the single source of truth — 190 docs with subcategory: federal|ngo|state
    const coll = db.collection('healthResources');

    // Merge bridge conditions into keyword pool for richer matching
    const bridgeTerms = bridgeContext?.conditions?.map(c => c.condition.toLowerCase()) ?? [];
    const allTerms    = [...new Set([...keywords, ...bridgeTerms])];
    const searchPat   = allTerms.length > 0 ? allTerms.join('|') : '';

    // Keyword filter — title, description, AND tags array ($elemMatch for arrays)
    const keywordFilter = searchPat ? {
      $or: [
        { title:       { $regex: searchPat, $options: 'i' } },
        { description: { $regex: searchPat, $options: 'i' } },
        { tags:        { $elemMatch: { $regex: searchPat, $options: 'i' } } },
      ],
    } : {};

    // toRaw — fixed: location is a nested object {state, city, address} after Apr 2025 standardization
    const toRaw = (doc: Record<string, unknown>): RawResource => ({
      title:       String(doc.title ?? doc.name ?? ''),
      description: String(doc.description ?? ''),
      url:         String(doc.url ?? doc.website ?? doc.link ?? ''),
      phone:       doc.phone       ? String(doc.phone)
                 : doc.phoneNumber ? String(doc.phoneNumber)
                 : doc.contact     ? String(doc.contact)
                 : undefined,
      priority:    (['high', 'medium', 'low'].includes(String(doc.priority))
                     ? doc.priority as 'high' | 'medium' | 'low' : 'medium'),
      tags:        Array.isArray(doc.tags) ? (doc.tags as string[]) : [],
      isFree:      typeof doc.isFree === 'boolean' ? doc.isFree
                   : typeof doc.free  === 'boolean' ? (doc.free as boolean) : false,
      costLevel:   (['free', 'low', 'moderate', 'high'].includes(String(doc.costLevel))
                     ? doc.costLevel as 'free' | 'low' | 'moderate' | 'high' : 'free'),
      rating:      typeof doc.rating === 'number' ? doc.rating : 0,
      updatedAt:   doc.updatedAt ? String(doc.updatedAt) : doc.ratingLastUpdated ? String(doc.ratingLastUpdated) : undefined,
      location:    (() => {
        const loc = doc.location;
        if (loc && typeof loc === 'object') {
          const obj   = loc as Record<string, unknown>;
          const parts = [obj.city, obj.state].filter(Boolean);
          return parts.length ? (parts.join(', ') as string) : undefined;
        }
        return loc ? String(loc) : doc.state ? String(doc.state) : undefined;
      })(),
    });

    // ── VA track — subcategory: "federal" ────────────────────────────────────
    const vaQuery = searchPat
      ? { $and: [keywordFilter, { subcategory: 'federal' }] }
      : { subcategory: 'federal' };
    let vaRaw = await coll.find(vaQuery).sort({ rating: -1 }).limit(20)
      .toArray() as Record<string, unknown>[];
    if (vaRaw.length < 3) {
      // Pad: relax keyword filter, keep subcategory constraint
      vaRaw = await coll.find({ subcategory: 'federal' }).sort({ rating: -1 }).limit(20)
        .toArray() as Record<string, unknown>[];
    }
    console.log(`[SymptomTriage] healthResources VA → ${vaRaw.length} docs`);

    // ── NGO track — subcategory: "ngo" ────────────────────────────────────────
    const ngoQuery = searchPat
      ? { $and: [keywordFilter, { subcategory: 'ngo' }] }
      : { subcategory: 'ngo' };
    let ngoRaw = await coll.find(ngoQuery).sort({ rating: -1 }).limit(20)
      .toArray() as Record<string, unknown>[];
    if (ngoRaw.length < 3) {
      ngoRaw = await coll.find({ subcategory: 'ngo' }).sort({ rating: -1 }).limit(20)
        .toArray() as Record<string, unknown>[];
    }
    console.log(`[SymptomTriage] healthResources NGO → ${ngoRaw.length} docs`);

    // ── State track — subcategory: "state" + PA location filter ──────────────
    const paFilter = {
      $or: [
        { 'location.state': { $regex: 'Pennsylvania|\\bPA\\b', $options: 'i' } },
        { 'location.city':  { $regex: 'Carlisle|Harrisburg|Camp Hill|York|Lancaster', $options: 'i' } },
        { title:            { $regex: 'Pennsylvania|DMVA|Cumberland', $options: 'i' } },
      ],
    };
    const stateQueryStrict = searchPat
      ? { $and: [keywordFilter, { subcategory: 'state' }, paFilter] }
      : { $and: [{ subcategory: 'state' }, paFilter] };
    let stateRaw = await coll.find(stateQueryStrict).sort({ rating: -1 }).limit(20)
      .toArray() as Record<string, unknown>[];
    if (stateRaw.length < 3) {
      // Relax location filter — any state-subcategory resource matching keywords
      const stateQueryRelaxed = searchPat
        ? { $and: [keywordFilter, { subcategory: 'state' }] }
        : { subcategory: 'state' };
      stateRaw = await coll.find(stateQueryRelaxed).sort({ rating: -1 }).limit(20)
        .toArray() as Record<string, unknown>[];
    }
    console.log(`[SymptomTriage] healthResources State → ${stateRaw.length} docs`);

    const rawVa    = vaRaw.map(toRaw);
    const rawNgo   = ngoRaw.map(toRaw);
    const rawState = stateRaw.map(toRaw);

    console.log(`[SymptomTriage] MongoDB final → VA=${rawVa.length} NGO=${rawNgo.length} State=${rawState.length}`);
    return { rawVa, rawNgo, rawState };
  } catch (err) {
    console.error('[SymptomTriage] fetchMongoResources critical error:', (err as Error).message);
    return { rawVa: [], rawNgo: [], rawState: [] };
  }
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

// JSON contamination signals — if ANY of these appear in the message text,
// the message is considered JSON-contaminated and must be replaced wholesale.
// This handles truncated JSON (no closing `}`) which regex-replace can't catch.
const JSON_CONTAMINATION_SIGNALS = [
  '"vaResources"',
  '"ngoResources"',
  '"stateResources"',
  '"severity":',
  '"aiMessage":',
] as const;

function sanitizeAiMessage(raw: string): string {
  if (!raw) return '';

  // Nuclear check — if ANY resource JSON keyword is present, the entire
  // string is contaminated (possibly truncated). Replace immediately.
  // This is more reliable than regex which requires a closing `}` to match.
  const isJsonContaminated = JSON_CONTAMINATION_SIGNALS.some(sig => raw.includes(sig));
  if (isJsonContaminated) {
    return 'Here are your top matched resources based on your records. '
         + 'This is not medical advice. Discuss with your VA provider or primary doctor.';
  }

  // For non-resource JSON (stray brackets, partial arrays, etc.), clean with regex
  let cleaned = raw
    .replace(/\{[\s\S]*"vaResources"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"ngoResources"[\s\S]*\}/g, '')
    .replace(/\{[\s\S]*"stateResources"[\s\S]*\}/g, '')
    .replace(/\[[\s\S]*"title"[\s\S]*"description"[\s\S]*\]/g, '')
    .trim();

  if (!cleaned || cleaned.length < 20) {
    cleaned = 'Here are your top matched resources based on your records. '
            + 'This is not medical advice. Discuss with your VA provider or primary doctor.';
  }

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

    // Assess step: MongoDB-FIRST (primary source) + Grok for aiMessage/fallback
    if (step === 'assess') {
      const allUserTexts = [
        userMessage ?? '',
        ...messages.filter(m => m.role === 'user').map(m => m.content),
      ].join(' ');
      const kws         = extractKeywords(allUserTexts);
      const userProfile = parseUserProfile(allUserTexts);
      const crossHints  = detectCrossDomainIntent(allUserTexts);
      if (crossHints.length > 0) console.log('[SymptomTriage] Cross-domain intents detected:', crossHints);

      // ── 1. Query MongoDB FIRST ───────────────────────────────────────────────────
      const { rawVa: dbVa, rawNgo: dbNgo, rawState: dbState } =
        await fetchMongoResources(kws, bridgeContext);
      const mongoHas = dbVa.length + dbNgo.length + dbState.length > 0;

      // ── 2. Call Grok for aiMessage prose + last-resort resources (if DB empty) ─
      const systemPrompt = buildSystemPrompt('assess', bridgeContext);
      const aiResponse   = await callGrokAI(messages, systemPrompt);

      let aiMessage  = '';
      let grokVa:    RawResource[] = [];
      let grokNgo:   RawResource[] = [];
      let grokState: RawResource[] = [];
      let severity   = 'moderate';

      if (aiResponse) {
        try {
          const stripped = aiResponse
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          const jsonMatch = stripped.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.severity === 'crisis') {
              return NextResponse.json(getCrisisResponse());
            }

            severity  = parsed.severity ?? 'moderate';
            aiMessage = sanitizeAiMessage(String(parsed.aiMessage ?? ''));

            // Capture Grok resource arrays ONLY as fallback when MongoDB is empty
            if (!mongoHas) {
              grokVa    = Array.isArray(parsed.vaResources)    ? parsed.vaResources    : [];
              grokNgo   = Array.isArray(parsed.ngoResources)   ? parsed.ngoResources   : [];
              grokState = Array.isArray(parsed.stateResources) ? parsed.stateResources : [];
            }
          }
        } catch (parseErr) {
          console.warn('[SymptomTriage] assess JSON parse failed:', (parseErr as Error).message);
        }
      }

      // ── 3. Resolve final resource source: MongoDB preferred, Grok as fallback ──
      const finalVa    = mongoHas ? dbVa    : grokVa;
      const finalNgo   = mongoHas ? dbNgo   : grokNgo;
      const finalState = mongoHas ? dbState : grokState;
      const hasRes     = finalVa.length + finalNgo.length + finalState.length > 0;

      if (hasRes) {
        const scored = applyScoring(finalVa, finalNgo, finalState, bridgeContext, kws, userProfile);
        if (!aiMessage) {
          const ct = bridgeContext?.conditions?.length
            ? bridgeContext.conditions.slice(0, 2).map(c => c.condition).join(' and ')
            : 'your health concerns';
          aiMessage = `Based on your situation with ${ct}, here are your matched resources. This is not medical advice. Discuss with your VA provider or primary doctor.`;
        }
        return NextResponse.json({
          aiMessage,
          nextStep: 'complete',
          isCrisis: false,
          severity: severity as 'low' | 'moderate' | 'high' | 'crisis',
          recommendations: {
            va:    scored.va.map(r    => ({ ...r, track: 'va'    as const })),
            ngo:   scored.ngo.map(r   => ({ ...r, track: 'ngo'   as const })),
            state: scored.state.map(r => ({ ...r, track: 'state' as const })),
          },
          keywords: scored.keywords,
          crossDomainHints: crossHints,
        });
      }

      // ── 4. MongoDB + Grok both empty → static fallback ────────────────────────────
      return NextResponse.json(getAssessFallback(bridgeContext));
    }

    // quick_triage step (and legacy steps): conversational AI or static fallback
    const systemPrompt = buildSystemPrompt(step ?? 'quick_triage', bridgeContext);
    const aiResponse = await callGrokAI(messages, systemPrompt);

    if (aiResponse) {
      // ── Detect "Grok jumped ahead" ──────────────────────────────────────
      // When user answers all questions in one message, Grok ignores the
      // quick_triage instruction and returns assess-style JSON. We MUST
      // intercept this here — never let it leak into aiMessage as prose.
      const grokJumpedAhead = JSON_CONTAMINATION_SIGNALS.some(sig => aiResponse.includes(sig));

      if (grokJumpedAhead) {
        // MongoDB PREFERRED — query DB first, use Grok only for aiMessage + last-resort resources
        const jumpTexts = [
          userMessage ?? '',
          ...messages.filter(m => m.role === 'user').map(m => m.content),
        ].join(' ');
        const jumpKws     = extractKeywords(jumpTexts);
        const jumpProfile = parseUserProfile(jumpTexts);

        // ── Query MongoDB FIRST ───────────────────────────────────────────────────
        const { rawVa: jDbVa, rawNgo: jDbNgo, rawState: jDbState } =
          await fetchMongoResources(jumpKws, bridgeContext);
        const jumpMongoHas = jDbVa.length + jDbNgo.length + jDbState.length > 0;

        // ── Parse Grok response: aiMessage + fallback resources if MongoDB empty ─
        let jumpMsg      = '';
        let jGrokVa:    RawResource[] = [];
        let jGrokNgo:   RawResource[] = [];
        let jGrokState: RawResource[] = [];
        let jumpSev      = 'moderate';
        try {
          const sf = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const jm = sf.match(/\{[\s\S]*\}/);
          if (jm) {
            const parsed = JSON.parse(jm[0]);
            jumpMsg = sanitizeAiMessage(String(parsed.aiMessage ?? ''));
            jumpSev = parsed.severity ?? 'moderate';
            if (!jumpMongoHas) {
              jGrokVa    = Array.isArray(parsed.vaResources)    ? parsed.vaResources    : [];
              jGrokNgo   = Array.isArray(parsed.ngoResources)   ? parsed.ngoResources   : [];
              jGrokState = Array.isArray(parsed.stateResources) ? parsed.stateResources : [];
            }
          }
        } catch {
          console.warn('[SymptomTriage] quick_triage jump-ahead JSON parse failed (truncated?)');
        }

        const finalVa    = jumpMongoHas ? jDbVa    : jGrokVa;
        const finalNgo   = jumpMongoHas ? jDbNgo   : jGrokNgo;
        const finalState = jumpMongoHas ? jDbState : jGrokState;

        if (finalVa.length + finalNgo.length + finalState.length > 0) {
          const scored = applyScoring(finalVa, finalNgo, finalState, bridgeContext, jumpKws, jumpProfile);
          if (!jumpMsg) {
            const ct = bridgeContext?.conditions?.length
              ? bridgeContext.conditions.slice(0, 2).map(c => c.condition).join(' and ')
              : 'your health concerns';
            jumpMsg = `Based on your situation with ${ct}, here are your matched resources. This is not medical advice. Discuss with your VA provider or primary doctor.`;
          }
          return NextResponse.json({
            aiMessage: jumpMsg,
            nextStep: 'complete',
            isCrisis: false,
            severity: jumpSev as 'low' | 'moderate' | 'high' | 'crisis',
            recommendations: {
              va:    scored.va.map(r    => ({ ...r, track: 'va'    as const })),
              ngo:   scored.ngo.map(r   => ({ ...r, track: 'ngo'   as const })),
              state: scored.state.map(r => ({ ...r, track: 'state' as const })),
            },
            keywords: scored.keywords,
          });
        }

        // MongoDB + Grok both empty — static fallback (last resort)
        return NextResponse.json(getAssessFallback(bridgeContext));
      }

      // Normal conversational response — sanitize and return
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
