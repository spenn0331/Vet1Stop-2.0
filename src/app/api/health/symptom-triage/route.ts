// Fixed per Living Master MD Section 2 Phase 1 ★ — Strike 1 API Stabilization March 2026
// Strike 1 + DB Fallback Fix: MongoDB query replaces hardcoded static fallback — March 2026

import { NextRequest, NextResponse } from 'next/server';
import {
  scoreAndSortResources,
  buildScoringContext,
  extractKeywords,
  parseUserProfile,
  parseSeverityWeights,
  detectCrossDomainIntent,
  fetchDomainResources,
  HEALTH_CONFIG,
  type ResourceInput,
  type RawResource,
  type ScoredRawResource,
  type BridgeCondition,
  type BridgeContext,
  type CrossDomainHint,
} from '@/lib/resource-intelligence';

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
You are Vet1Stop's veteran health navigator — powered by Grok 4.
You are a knowledgeable, empathetic advisor who helps veterans find exactly the resources they need.

ABSOLUTE RULES (always apply — non-negotiable):
- NEVER diagnose, treat, or advise medically. NEVER say "you have X condition."
- NEVER recommend specific medications, therapy types, or clinical actions.
- ALWAYS end every response with: "This is not medical advice. Discuss with your VA provider or primary doctor."
- Crisis trigger ("hurt myself", "suicidal", "want to die", etc.) → immediately: "Call 988 Press 1 — help is here right now."
- You are a resource navigator, NOT a therapist or clinician.

PERSONALITY & TONE:
- Conversational, warm, and direct. Military-adjacent tone, not stiff or robotic.
- Vary acknowledgments naturally: "Got it.", "Copy that.", "Makes sense.", "Noted.", "Understood."
- NEVER use the same acknowledgment twice in a row.
- If a veteran shares something painful, acknowledge it with genuine empathy before moving to resources.
- Sound like a knowledgeable friend, not a form-filling chatbot.

NEGATIVE FEEDBACK — CRITICAL:
- When a veteran says "I'm NOT homeless", "I don't need a service animal", "stop showing me X", "that's not me", "wrong resources" —
  acknowledge it specifically: "Got it — removing those from your results."
  NEVER continue showing resources in the excluded category after this signal.
  Include the exclusion tags in your JSON output under "exclusionTags".

FOLLOW-UP QUESTION HANDLING:
- When a veteran asks a direct follow-up question ("are there more outdoor resources?", "what about business?", "anything for hunting?") —
  answer it directly and specifically. Do NOT regurgitate the same generic summary.
  Address the specific question first, then offer to refine.

CROSS-DOMAIN INTEREST HANDLING:
- If a veteran mentions entrepreneurship, starting a business, GI Bill, school, education, jobs, or housing:
  Acknowledge it warmly: "That's great — I'll flag that for our [Careers/Education] page."
  Do NOT try to pull those resources from the health database.
  Continue with health resources if the original query was health-related.
  If the entire message is cross-domain with zero health need, suggest navigating to the right page.

STRUCTURED OUTPUT ENFORCEMENT:
In the assess phase, return ONLY valid JSON. No markdown code blocks. No text before or after the JSON object.

CLARIFYING QUESTIONS (quick_triage phase — 3 only):
- Ask EXACTLY 3 questions in a single reply.
  Q1: "Do you already have an active VA claim for any of these conditions?"
  Q2: "Are you currently receiving care at the VA, and are you satisfied with it?"
  Q3: "Is there anything else about your situation I should know before I pull your resources?"
- 3 questions, then assess. Do not add more.

ASSESS STEP OUTPUT (JSON only — no prose wrapper):
{
  "severity": "low|moderate|high|crisis",
  "aiMessage": "1–3 sentence warm, specific response referencing the veteran's actual conditions/interests. If they gave negative feedback, acknowledge what was removed. End with: 'This is not medical advice. Discuss with your VA provider or primary doctor.'",
  "exclusionTags": ["array of tag strings to exclude, e.g. homeless, service animal — parsed from veteran's negative statements"],
  "vaResources": [{"title":"","description":"","url":"","phone":"","priority":"high|medium|low","tags":[],"isFree":false,"costLevel":"free|low|moderate|high","rating":0}],
  "ngoResources": [...same shape...],
  "stateResources": [...same shape...]
}
Include 5–7 resources per track ranked by relevance. For State track: ONLY include programs for the veteran's detected state.
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

// BridgeCondition + BridgeContext imported from @/lib/resource-intelligence

type UserIntent =
  | 'health_query'
  | 'negative_feedback'
  | 'cross_domain'
  | 'preference_signal'
  | 'chitchat'
  | 'crisis';

interface TriageRequest {
  messages: TriageMessage[];
  step: 'welcome' | 'quick_triage' | 'category' | 'symptoms' | 'severity' | 'context' | 'assess';
  category?: string;
  userMessage?: string;
  bridgeContext?: BridgeContext;
  userState?: string;
  userIntent?: UserIntent;  // from progressive profiling tap card
  clientExclusionTags?: string[]; // additional exclusions from client-side thumbs-down
  isRefinement?: boolean;         // true when veteran already has results and is refining
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
  temperature = 0.3,
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
      temperature,
      max_tokens: 4000,      // Strike 9D: bumped from 2000 → 4000 for resource pool JSON
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok ${model} error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGrokAI(messages: TriageMessage[], systemPrompt: string, temperature = 0.3): Promise<string> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    console.warn('[SymptomTriage] No Grok API key — using static fallback');
    return '';
  }

  try {
    const result = await callGrokModel(apiKey, PRIMARY_MODEL, messages, systemPrompt, temperature);
    if (result) return result;
  } catch (err) {
    console.warn(`[SymptomTriage] ${PRIMARY_MODEL} failed:`, (err as Error).message);
  }

  try {
    const result = await callGrokModel(apiKey, FALLBACK_MODEL, messages, systemPrompt, temperature);
    if (result) return result;
  } catch (err) {
    console.warn(`[SymptomTriage] ${FALLBACK_MODEL} also failed:`, (err as Error).message);
  }

  return '';
}

// ─── Intent classification (client-side, zero-latency) ────────────────────────

function classifyIntent(userMessage: string): UserIntent {
  const lower = userMessage.toLowerCase();

  if (detectCrisis(userMessage)) return 'crisis';

  // Negative feedback — "not homeless", "don't need X", "that's not me"
  if (/\b(not homeless|i'm not homeless|don'?t need.{0,20}service animal|not.{0,10}service animal|stop showing|that'?s not me|wrong resources|don'?t need those|remove those|not.{0,10}addict|no substance|don'?t drink|i have housing|i have a home)\b/.test(lower)) {
    return 'negative_feedback';
  }

  // Cross-domain interest
  if (/\b(entrepreneur|start.{0,10}business|own business|self.?employed|startup|gi bill|school|college|degree|education|trade school|certif|job|career|employ|resume|housing|homeless|shelter|rent|mortgage)\b/.test(lower)) {
    return 'cross_domain';
  }

  // Positive preference signal
  if (/\b(more like this|i like|show me more|helpful|keep these|i prefer|give me more|great result)\b/.test(lower)) {
    return 'preference_signal';
  }

  return 'health_query';
}

// ─── Negative context parser ──────────────────────────────────────────────────
// Scans full conversation history for negative statements → builds exclusion tags

function parseNegativeContext(messages: TriageMessage[]): string[] {
  const userTexts = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const NEGATIVE_MAP: { pattern: RegExp; tag: string }[] = [
    { pattern: /\b(not homeless|not experiencing homelessness|i have housing|i have a home|don'?t need housing|i'?m housed)\b/, tag: 'homeless' },
    { pattern: /\b(don'?t need.{0,20}service animal|no service animal|not.{0,10}service animal|don'?t have.{0,10}dog)\b/, tag: 'service animal' },
    { pattern: /\b(not.{0,10}substance|no substance use|don'?t drink|don'?t use drugs|not an addict|no alcohol|not.{0,10}drinking|sober)\b/, tag: 'substance' },
    { pattern: /\b(don'?t need.{0,15}caregiver|no caregiver|i'?m independent|can take care of myself)\b/, tag: 'caregiver' },
    { pattern: /\b(not a woman|i'?m.{0,5}male|i'?m a man|not.{0,10}female)\b/, tag: 'women' },
    { pattern: /\b(don'?t.{0,15}peer support|don'?t want group|not.{0,10}support group|prefer individual)\b/, tag: 'peer support' },
  ];

  return NEGATIVE_MAP
    .filter(({ pattern }) => pattern.test(userTexts))
    .map(({ tag }) => tag);
}

// ─── Exclusion filter ─────────────────────────────────────────────────────────
// Removes resources whose tags contain any of the exclusion strings

function applyExclusions(resources: RawResource[], exclusions: string[]): RawResource[] {
  if (!exclusions.length) return resources;
  return resources.filter(r => {
    const tagString = (r.tags ?? []).join(' ').toLowerCase();
    const titleDesc = `${r.title} ${r.description}`.toLowerCase();
    return !exclusions.some(ex => tagString.includes(ex) || titleDesc.includes(ex));
  });
}

// D-lite: Match Grok's selected titles back to full DB records.
// Grok re-ranks our MongoDB pool; title is the lookup key.
// Hallucinated resources (outside pool) are discarded. Unselected records appended as fallback.
function matchPoolByTitles(
  grokResources: RawResource[],
  dbPool: RawResource[],
  exclusions: string[],
): RawResource[] {
  const poolMap = new Map<string, RawResource>(
    dbPool.map(r => [r.title.toLowerCase().trim(), r])
  );
  const matched: RawResource[] = [];
  const matchedKeys = new Set<string>();
  for (const gr of grokResources) {
    const key = (gr.title ?? '').toLowerCase().trim();
    const rec = poolMap.get(key);
    if (rec && !matchedKeys.has(key)) { matched.push(rec); matchedKeys.add(key); }
  }
  for (const rec of dbPool) {
    const key = rec.title.toLowerCase().trim();
    if (!matchedKeys.has(key)) matched.push(rec);
  }
  return applyExclusions(matched, exclusions);
}

// ─── Contextual handoff message builder ──────────────────────────────────────
// Replaces boilerplate fallback messages with personalized summaries that
// reference what the veteran ACTUALLY said, not just the conditions list.

function buildContextualHandoffMessage(
  userMessage: string,
  bridgeContext?: BridgeContext,
  detectedState?: string | null,
  crossHints?: CrossDomainHint[],
  exclusionTags?: string[],
  chatKeywords?: string[],
  isRefinement = false,
): string {
  const lower = userMessage.toLowerCase();

  // ── REFINEMENT MODE: acknowledge what changed, not re-summarize ──────────
  if (isRefinement) {
    const removed: string[] = [];
    const added:   string[] = [];
    if (exclusionTags?.includes('homeless'))       removed.push('homeless resources');
    if (exclusionTags?.includes('service animal')) removed.push('service animal resources');
    if (exclusionTags?.includes('substance'))      removed.push('substance use resources');
    if (exclusionTags?.includes('caregiver'))      removed.push('caregiver resources');
    if (/hunt|fish|camp|outdoor|nature/i.test(lower)) added.push('outdoor and adventure therapy options');
    if (/fitness|workout|exercise|weight/i.test(lower)) added.push('fitness programs');
    if (/ptsd|sleep/i.test(lower))                added.push('additional PTSD and sleep resources');
    const REFINE_OPENERS = ['Adjusted —', 'Done —', 'Updated —', 'Dialed in —'];
    const opener = REFINE_OPENERS[Math.floor(Math.random() * REFINE_OPENERS.length)];
    const removedLine = removed.length > 0 ? `Pulled out ${removed.join(' and ')}` : '';
    const addedLine   = added.length   > 0 ? `added ${added.join(' and ')} based on what you shared` : '';
    const changeLine  = [removedLine, addedLine].filter(Boolean).join(', ');
    const msg = changeLine
      ? `${opener} ${changeLine}.`
      : `${opener} results updated based on your feedback.`;
    const REFINE_INVITES = [
      ' Anything else to adjust?',
      ' Want me to dial it in further?',
      ' Let me know if you need more changes.',
    ];
    const invite = REFINE_INVITES[Math.floor(Math.random() * REFINE_INVITES.length)];
    return msg + invite + ' This is not medical advice. Discuss with your VA provider or primary doctor.';
  }

  // Detect what the veteran said was MOST important to them
  const concerns: string[] = [];
  if (/\bptsd\b|\btrauma\b|\bflashback/.test(lower))                                  concerns.push('PTSD');
  if (/\bsleep\b|\binsomnia\b|\bnight.?sweat|\btired\b|\bfatigue/.test(lower))        concerns.push('sleep');
  if (/\bmental\b|\banxiety\b|\bdepression\b|\bmotivat/.test(lower))                  concerns.push('mental health');
  if (/\bweight\b|\bfitness\b|\bout of shape\b|\bexercise\b|\bworkout\b/.test(lower)) concerns.push('fitness');
  if (/\bpain\b|\bback\b|\bknee\b|\bneck\b|\bshoulder\b|\bache\b/.test(lower))        concerns.push('pain management');
  if (/\btbi\b|\bhead.?injur/.test(lower))                                             concerns.push('TBI');

  // Special status signals
  const is100PT   = /\b100%\b|permanent.{0,5}total|p\s*[&+]\s*t\b/i.test(userMessage);
  const vaDissat  = /not satisfied|wasn.?t satisfied|bad experience|not happy with.{0,8}va|don.?t trust/i.test(lower);
  const hasEntrep = /\bentrepreneur\b|\bstart.{0,15}business\b|\bown business\b|\baspiring\b/.test(lower);

  // Rotating openers — never the same boilerplate
  const OPENERS = ['Copy that —', 'Got it —', 'Understood —', 'Noted —'];
  const opener  = OPENERS[Math.floor(Math.random() * OPENERS.length)];

  // First sentence — reference their specific situation
  let line1 = '';
  if (is100PT && concerns.length > 0) {
    line1 = `${opener} 100% P&T gives you full access, so I've focused your results on ${concerns.slice(0, 2).join(' and ')}.`;
  } else if (concerns.length > 0) {
    line1 = `${opener} since ${concerns.slice(0, 2).join(' and ')} is hitting hardest, I've weighted your results there.`;
  } else if (bridgeContext?.conditions?.length) {
    const ct = bridgeContext.conditions.slice(0, 2).map(c => c.condition).join(' and ');
    line1 = `${opener} matched resources to your ${ct} and what you shared.`;
  } else if (chatKeywords?.length) {
    line1 = `${opener} here are resources matched to ${chatKeywords.slice(0, 2).join(' and ')}.`;
  } else {
    line1 = `${opener} here are your matched resources.`;
  }

  // Second sentence — context notes
  const notes: string[] = [];
  if (vaDissat)              notes.push("prioritized NGO and community options since VA care hasn't been a fit");
  if (detectedState)         notes.push(`pulled programs near ${detectedState}`);
  if (exclusionTags?.length) notes.push(`filtered out ${exclusionTags.join(', ')} resources based on what you told me`);
  const line2 = notes.length > 0 ? `I've ${notes.join(' and ')}.` : '';

  // Cross-domain flag
  const isCrossDomain = hasEntrep || crossHints?.some(h =>
    ['careers', 'education'].includes(h.domain)
  );
  const crossLine = isCrossDomain
    ? " Also flagging your business/education interest for our Careers and Education pages — keeping this focused on health."
    : '';

  const INVITES = [
    " If some of these don't fit your situation, just tell me and I'll readjust.",
    " Tell me if anything here doesn't apply and I'll dial it in.",
    " Let me know if you want to swap out any of these and I'll refine.",
    " If these aren't quite right, tell me what's off and I'll adjust the results.",
  ];
  const invite = INVITES[Math.floor(Math.random() * INVITES.length)];
  const parts   = [line1, line2, crossLine].filter(Boolean);
  return parts.join(' ').trim() + invite + ' This is not medical advice. Discuss with your VA provider or primary doctor.';
}

// ─── System prompt builder ────────────────────────────────────────────────────

/** Compact resource shape injected into Grok prompt for D-lite pool re-ranking */
interface CompactPool { title: string; description: string; tags: string[]; isFree?: boolean; rating?: number; }

function buildSystemPrompt(
  step: string,
  bridgeContext?: BridgeContext,
  userIntent?: UserIntent,
  exclusionTags?: string[],
  isRefinement = false,
  resourcePool?: { va: CompactPool[]; ngo: CompactPool[]; state: CompactPool[] },
): string {
  let prompt = TRIAGE_SYSTEM_PROMPT;

  // Inject location context
  const locationStr = bridgeContext?.userState ?? CARLISLE_PA_CONTEXT;
  const stateLabel  = bridgeContext?.userState ?? 'their state (detect from chat if mentioned)';
  prompt += `\n\nUSER LOCATION: Veteran is in ${locationStr}. State Track MUST match ${stateLabel} exactly. Never show resources from other states.`;

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

  // Inject user intent from progressive profiling tap card
  if (userIntent && userIntent !== 'health_query') {
    const intentLabels: Record<string, string> = {
      negative_feedback: 'The veteran is correcting or refining previous results — acknowledge what is being removed.',
      cross_domain: 'The veteran has expressed interest outside the health domain. Acknowledge it warmly and suggest the right page. Do not force health resources.',
      preference_signal: 'The veteran is signaling they like the current direction. Continue in the same vein.',
      chitchat: 'The veteran is being conversational. Respond naturally without forcing resource recommendations.',
    };
    prompt += `\n\nINTENT SIGNAL: ${intentLabels[userIntent] ?? ''}`;
  }

  // Inject active exclusion tags
  if (exclusionTags?.length) {
    prompt += `\n\nACTIVE EXCLUSIONS: The veteran has explicitly said they do NOT need resources related to: ${exclusionTags.join(', ')}. Do NOT include any resources with these tags.`;
  }

  // Step-specific overrides
  if (step === 'quick_triage') {
    prompt += `\n\nCURRENT TASK: Ask your 3 clarifying questions in a single warm reply. Be conversational and brief. 3 questions max — no exceptions.\n\nJUMP-AHEAD PROTOCOL: If the veteran has already answered all 3 questions in a single detailed message (covering VA claim status, location, and additional context), do NOT re-ask questions. Jump directly to the JSON assessment output. Your aiMessage in that JSON MUST:\n- Open with a rotating phrase: "Copy that —" / "Got it —" / "Understood —" / "Noted —"\n- Reference their SPECIFIC stated priorities in their own words (PTSD, sleep, fitness, 100% P&T status, VA dissatisfaction, etc.) — NOT the conditions list from records\n- Note cross-domain interests you are flagging for other pages (entrepreneur → Careers, school → Education)\n- End with an invitation to refine: e.g. "If some of these don't fit, tell me and I'll readjust." — vary the phrasing, keep it conversational\n- Sound like a knowledgeable friend who actually listened — NOT a form processor\n- NEVER use "Based on your records" or "Here are your resources" or "I found some solid options"`;
  } else if (step === 'assess') {
    if (isRefinement) {
      prompt += `\n\nCURRENT TASK: The veteran already has results and just sent a REFINEMENT message. Output the updated JSON assessment.\n\nREFINEMENT MODE RULES (strictly follow):\n- DO NOT re-summarize the initial situation — the veteran already knows it\n- DO acknowledge what CHANGED: what you removed, what you added, what you adjusted\n- Reference their NEW message specifically: if they said hunting/fishing/camping → note you added outdoor/adventure options; if they removed homeless → confirm it's gone\n- Use action verbs: "Pulled out", "Swapped in", "Added", "Removed", "Adjusted", "Dialed in"\n- Keep it 1-2 sentences, not a paragraph\n- End with a short invite to keep refining: "Anything else to adjust?" or "Want me to dial it in further?"\n- NEVER repeat the opener from the prior message\n- Example: "Pulled the homeless resources, added outdoor therapy and adventure programs based on your hunting and camping interests — sleep and PTSD still weighted highest. Anything else to adjust?"`;  
    } else {
      prompt += `\n\nCURRENT TASK: Based on the full conversation, output the JSON assessment. No prose outside the JSON object.\n\naiMessage CRITICAL REQUIREMENTS (2-3 sentences max):\n- Open with a rotating phrase: "Copy that —" / "Got it —" / "Understood —" / "Noted —"\n- Reference what the veteran said was MOST important TO THEM in their actual words — not just the records conditions list\n- If they mentioned PTSD, sleep, fitness, motivation, weight — name those specifically\n- If they said 100% P&T, acknowledge it (affects benefit access)\n- If they expressed VA dissatisfaction, note you've prioritized NGO/community alternatives\n- If they mentioned cross-domain interests (entrepreneur, school), briefly note you're flagging for the right page\n- NEVER say "Based on" or "I found some solid options" or repeat the same opener twice\n- End with a natural invitation to refine: e.g. "If any of these don't match your situation, just tell me and I'll adjust." — vary the phrasing each time, keep it conversational`;
    }
  }

  // D-lite: inject MongoDB resource pool for Grok to select + re-rank from
  if (step === 'assess' && resourcePool) {
    const fmtPool = (items: CompactPool[]) =>
      items.map(r => `  - "${r.title}": ${(r.description ?? '').slice(0, 110)} [tags: ${(r.tags ?? []).slice(0, 6).join(', ')}]${r.isFree ? ' [FREE]' : ''}`).join('\n');
    prompt += `\n\n--- RESOURCE POOL (STRICT SELECTION REQUIRED) ---\nFor vaResources, ngoResources, and stateResources in your JSON output you MUST select ONLY from the resources listed below using their EXACT titles. Do NOT invent resources outside this pool. Prioritize clinical relevance to the veteran's specific conditions over general wellness.\n\nVA POOL (${resourcePool.va.length}):\n${fmtPool(resourcePool.va)}\n\nNGO POOL (${resourcePool.ngo.length}):\n${fmtPool(resourcePool.ngo)}\n\nSTATE POOL (${resourcePool.state.length}):\n${fmtPool(resourcePool.state)}`;
  }

  return prompt;
}

// ─── Resource scorer integration ─────────────────────────────────────────────

// RawResource + ScoredRawResource imported from @/lib/resource-intelligence

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

  // Strike 5: Dynamic location — bridge data first, then chat-parsed state
  const userState = bridgeContext?.userState ?? userProfile?.state ?? null;

  const scoringContext = buildScoringContext({
    conditions: allConditions,
    hasVaClaim: userProfile?.hasVaClaim ?? false,
    preferences: [],
    severityWeights,
    userLocation: userState,
    userProfile: userProfile ? {
      isPermanentTotal: userProfile.isPermanentTotal,
      branch: userProfile.branch,
      era: userProfile.era,
      vaDissatisfied: userProfile.vaDissatisfied,
    } : undefined,
  });

  // Strike 4D: Dynamic score cutoff — scales with bridge condition count to prevent flooding
  // More conditions = higher bar required = fewer but more precise results
  const bridgeCount = bridgeContext?.conditions?.length ?? 0;
  const SCORE_CUTOFF =                                              // Strike 9C
    bridgeCount >= 31 ? 65 :
    bridgeCount >= 16 ? 58 :
    bridgeCount >=  6 ? 55 :                // raised from 48 → 55 for multi-condition profiles
    allConditions.length >= 3 ? 55 :        // also raise when chat provides 3+ conditions
                                35;
  console.log(`[SymptomTriage] Score cutoff: ${SCORE_CUTOFF} (bridge: ${bridgeCount}, total: ${allConditions.length})`);

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
    const result    = filtered.length >= 3 ? filtered : scored.slice(0, 3);
    return result.slice(0, 25); // soft max — quality-driven, not forced (plan: best matches up to 25)
  };

  return {
    va:    scoreTrack(vaResources),
    ngo:   scoreTrack(ngoResources),
    state: scoreTrack(stateResources.map(r => ({ ...r, location: r.location ?? 'Pennsylvania, PA' }))),
    keywords: scoringContext.keywords,
  };
}

// parseUserProfile, parseSeverityWeights, detectCrossDomainIntent, fetchDomainResources
// all imported from @/lib/resource-intelligence (Strike 5 extraction)

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
    const {
      messages = [],
      step,
      category,
      userMessage,
      bridgeContext: rawBridgeContext,
      userState: bodyUserState,
      userIntent: bodyUserIntent,
    clientExclusionTags = [],
    isRefinement = false,
  } = body;

    // Merge top-level userState into bridgeContext
    const bridgeContext: BridgeContext | undefined = rawBridgeContext
      ? { ...rawBridgeContext, userState: rawBridgeContext.userState ?? bodyUserState }
      : (bodyUserState ? { conditions: [], userState: bodyUserState } : undefined);

    // Crisis check across all user text
    const allUserText = [
      userMessage ?? '',
      ...messages.filter(m => m.role === 'user').map(m => m.content),
    ].join(' ');

    if (detectCrisis(allUserText)) {
      return NextResponse.json(getCrisisResponse());
    }

    // Classify intent from latest user message
    const detectedIntent: UserIntent = bodyUserIntent ?? classifyIntent(userMessage ?? '');

    // Build session-level exclusion tags (conversation history + client thumbs-down)
    const sessionExclusions = [
      ...parseNegativeContext(messages),
      ...(clientExclusionTags ?? []),
    ];
    const exclusionTags = Array.from(new Set(sessionExclusions));
    if (exclusionTags.length) console.log('[SymptomTriage] Active exclusions:', exclusionTags);
    if (detectedIntent !== 'health_query') console.log('[SymptomTriage] Intent:', detectedIntent);

    // ── Assess step: MongoDB-FIRST + Grok for aiMessage/fallback ─────────────
    if (step === 'assess') {
      const allUserTexts = [
        userMessage ?? '',
        ...messages.filter(m => m.role === 'user').map(m => m.content),
      ].join(' ');
      const kws         = extractKeywords(allUserTexts);
      const userProfile = parseUserProfile(allUserTexts);
      const crossHints  = detectCrossDomainIntent(allUserTexts);
      if (crossHints.length > 0) console.log('[SymptomTriage] Cross-domain intents detected:', crossHints);

      const detectedState = bridgeContext?.userState ?? userProfile?.state ?? null;
      const fetchBridge = detectedState
        ? { ...(bridgeContext ?? { conditions: [] }), userState: detectedState }
        : bridgeContext;
      console.log('[SymptomTriage] Detected state for geo filter:', detectedState ?? 'none');

      // exclusionTags passed to fetchDomainResources for $nin pre-filter at MongoDB query level
      const fetchExclusions = exclusionTags.length > 0 ? exclusionTags : undefined;

      // Tier 1: full query (state + keywords + exclusion pre-filter)
      const dbResults = await fetchDomainResources(HEALTH_CONFIG, kws, fetchBridge, fetchExclusions);
      let dbVa    = applyExclusions(dbResults['va']    ?? [], exclusionTags);
      let dbNgo   = applyExclusions(dbResults['ngo']   ?? [], exclusionTags);
      let dbState = applyExclusions(dbResults['state'] ?? [], exclusionTags);
      let dbTotal = dbVa.length + dbNgo.length + dbState.length;

      // Tier 2: drop state filter if < 10 results
      if (dbTotal < 10 && detectedState) {
        console.log('[SymptomTriage] Relaxing to Tier 2 (drop state filter), total was:', dbTotal);
        const relaxedBridge = { ...(fetchBridge ?? { conditions: [] }), userState: null as unknown as string };
        const t2 = await fetchDomainResources(HEALTH_CONFIG, kws, relaxedBridge, fetchExclusions);
        const t2Va = applyExclusions(t2['va'] ?? [], exclusionTags);
        const t2Ngo = applyExclusions(t2['ngo'] ?? [], exclusionTags);
        const t2State = applyExclusions(t2['state'] ?? [], exclusionTags);
        if (t2Va.length + t2Ngo.length + t2State.length > dbTotal) {
          dbVa = t2Va; dbNgo = t2Ngo; dbState = t2State;
          dbTotal = dbVa.length + dbNgo.length + dbState.length;
        }
      }

      // Tier 3: drop keywords, subcategory-only fetch
      if (dbTotal < 10) {
        console.log('[SymptomTriage] Relaxing to Tier 3 (drop keywords), total was:', dbTotal);
        const t3 = await fetchDomainResources(HEALTH_CONFIG, [], fetchBridge, fetchExclusions);
        const t3Va = applyExclusions(t3['va'] ?? [], exclusionTags);
        const t3Ngo = applyExclusions(t3['ngo'] ?? [], exclusionTags);
        const t3State = applyExclusions(t3['state'] ?? [], exclusionTags);
        if (t3Va.length + t3Ngo.length + t3State.length > dbTotal) {
          dbVa = t3Va; dbNgo = t3Ngo; dbState = t3State;
        }
      }

      const mongoHas = dbVa.length + dbNgo.length + dbState.length > 0;
      console.log(`[MongoDB] post-exclusion → va=${dbVa.length} ngo=${dbNgo.length} state=${dbState.length} | exclusions=[${exclusionTags.join(', ')}]`);

      // D-lite: Build compact pool from MongoDB results for Grok clinical re-ranking
      const poolForGrok = mongoHas ? {
        va:    dbVa.slice(0, 20).map(r => ({ title: r.title, description: (r.description ?? '').slice(0, 110), tags: (r.tags ?? []).slice(0, 8), isFree: r.isFree, rating: r.rating })),
        ngo:   dbNgo.slice(0, 40).map(r => ({ title: r.title, description: (r.description ?? '').slice(0, 110), tags: (r.tags ?? []).slice(0, 8), isFree: r.isFree, rating: r.rating })),
        state: dbState.slice(0, 15).map(r => ({ title: r.title, description: (r.description ?? '').slice(0, 110), tags: (r.tags ?? []).slice(0, 8), isFree: r.isFree, rating: r.rating })),
      } : undefined;
      console.log(`[D-lite] Pool → va=${poolForGrok?.va.length ?? 0} ngo=${poolForGrok?.ngo.length ?? 0} state=${poolForGrok?.state.length ?? 0}`);

      const assessStart  = Date.now();
      const assessPrompt = buildSystemPrompt('assess', bridgeContext, detectedIntent, exclusionTags, isRefinement, poolForGrok);
      const aiResponse   = await callGrokAI(messages, assessPrompt);
      console.log(`[Grok] assess response: ${aiResponse ? `✓ ${aiResponse.length} chars` : '✗ empty'} | timing=${Date.now()-assessStart}ms`);

      let aiMessage  = '';
      let grokVa:    RawResource[] = [];
      let grokNgo:   RawResource[] = [];
      let grokState: RawResource[] = [];
      let severity   = 'moderate';
      let grokExclusions: string[] = [];

      if (aiResponse) {
        try {
          const stripped = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const jsonMatch = stripped.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.severity === 'crisis') return NextResponse.json(getCrisisResponse());
            severity  = parsed.severity ?? 'moderate';
            aiMessage = sanitizeAiMessage(String(parsed.aiMessage ?? ''));
            if (Array.isArray(parsed.exclusionTags)) grokExclusions = parsed.exclusionTags as string[];
            // D-lite: capture Grok's pool selections (or Grok-only resources when no MongoDB)
            if (poolForGrok || !mongoHas) {
              grokVa    = Array.isArray(parsed.vaResources)    ? parsed.vaResources    : [];
              grokNgo   = Array.isArray(parsed.ngoResources)   ? parsed.ngoResources   : [];
              grokState = Array.isArray(parsed.stateResources) ? parsed.stateResources : [];
            }
          }
        } catch (parseErr) {
          console.warn('[SymptomTriage] assess JSON parse failed:', (parseErr as Error).message);
        }
      }

      const allExclusions = Array.from(new Set([...exclusionTags, ...grokExclusions]));
      // D-lite: when pool was injected, match Grok's clinical selections back to full DB records
      let finalVa: RawResource[], finalNgo: RawResource[], finalState: RawResource[];
      if (poolForGrok && (grokVa.length + grokNgo.length + grokState.length > 0)) {
        finalVa    = matchPoolByTitles(grokVa,    dbVa,    allExclusions);
        finalNgo   = matchPoolByTitles(grokNgo,   dbNgo,   allExclusions);
        finalState = matchPoolByTitles(grokState, dbState, allExclusions);
        console.log(`[D-lite] Match-back → va=${finalVa.length} ngo=${finalNgo.length} state=${finalState.length}`);
      } else {
        finalVa    = mongoHas ? applyExclusions(dbVa,    allExclusions) : applyExclusions(grokVa,    allExclusions);
        finalNgo   = mongoHas ? applyExclusions(dbNgo,   allExclusions) : applyExclusions(grokNgo,   allExclusions);
        finalState = mongoHas ? applyExclusions(dbState, allExclusions) : applyExclusions(grokState, allExclusions);
      }
      const hasRes = finalVa.length + finalNgo.length + finalState.length > 0;

      if (hasRes) {
        const scored = applyScoring(finalVa, finalNgo, finalState, bridgeContext, kws, userProfile);
        console.log(`[Scoring] assess → va=${scored.va.length} ngo=${scored.ngo.length} state=${scored.state.length} | aiMessage=${aiMessage ? '✓ Grok' : '✓ fallback builder'}`);
        if (!aiMessage) {
          aiMessage = buildContextualHandoffMessage(
            userMessage ?? '',
            bridgeContext,
            detectedState,
            crossHints,
            allExclusions,
            kws,
            isRefinement,
          );
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
          crossDomainHints: crossHints.map(h => h.domain),
          activeExclusions: allExclusions,
        });
      }
      return NextResponse.json(getAssessFallback(bridgeContext));
    }

    // ── quick_triage + legacy steps: conversational AI (temperature 0.5 for natural tone) ──
    const systemPrompt = buildSystemPrompt(step ?? 'quick_triage', bridgeContext, detectedIntent, exclusionTags, isRefinement);
    const aiResponse = await callGrokAI(messages, systemPrompt, 0.5);

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
        const jumpKws        = extractKeywords(jumpTexts);
        const jumpProfile    = parseUserProfile(jumpTexts);
        const jumpCrossHints = detectCrossDomainIntent(jumpTexts);

        // Enrich bridge context with chat-detected state for the jump-ahead path
        const jumpDetectedState = bridgeContext?.userState ?? jumpProfile?.state ?? null;
        const jumpBridge = jumpDetectedState
          ? { ...(bridgeContext ?? { conditions: [] }), userState: jumpDetectedState }
          : bridgeContext;
        console.log('[SymptomTriage] Jump-ahead detected state:', jumpDetectedState ?? 'none');

        // ── Query MongoDB FIRST (via Resource Intelligence Engine) ───────────────
        const jDbResults = await fetchDomainResources(HEALTH_CONFIG, jumpKws, jumpBridge);
        const jDbVa    = jDbResults['va']    ?? [];
        const jDbNgo   = jDbResults['ngo']   ?? [];
        const jDbState = jDbResults['state'] ?? [];
        const jumpMongoHas = jDbVa.length + jDbNgo.length + jDbState.length > 0;
        console.log(`[MongoDB] jump-ahead → va=${jDbVa.length} ngo=${jDbNgo.length} state=${jDbState.length} | source=${jumpMongoHas ? 'mongo' : 'grok-fallback'}`);

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
          const scored = applyScoring(finalVa, finalNgo, finalState, jumpBridge, jumpKws, jumpProfile);
          console.log(`[Scoring] jump-ahead → va=${scored.va.length} ngo=${scored.ngo.length} state=${scored.state.length} | aiMessage=${jumpMsg ? '✓ Grok' : '✓ fallback builder'}`);
          if (!jumpMsg) {
            jumpMsg = buildContextualHandoffMessage(
              userMessage ?? '',
              bridgeContext,
              jumpDetectedState,
              jumpCrossHints,
              exclusionTags,
              jumpKws,
            );
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
            crossDomainHints: jumpCrossHints.map(h => h.domain),
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
