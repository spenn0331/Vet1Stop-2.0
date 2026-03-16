/**
 * POST /api/education/advise
 * Education Advisor AI — Grok 4 powered.
 * Fetches educationResources from MongoDB (federal, ngo, state) and returns
 * AI-curated, scored results based on the veteran's education goal.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractKeywords,
  parseUserProfile,
  fetchDomainResources,
  EDUCATION_CONFIG,
  type RawResource,
} from '@/lib/resource-intelligence';

const PRIMARY_MODEL  = 'grok-4';
const FALLBACK_MODEL = 'grok-3-latest';

const ADVISOR_SYSTEM_PROMPT = `
You are Vet1Stop's veteran education navigator — powered by Grok 4.
Help veterans find the exact education benefits, scholarships, and state programs they need.

RULES:
- NEVER provide official legal or financial advice.
- End every aiMessage with: "Verify your specific benefits and deadlines at VA.gov."
- Do NOT invent resources outside the pool provided.
- Keep aiMessage to 1-2 sentences max.

PERSONALITY: Direct, friendly, military-adjacent. Vary acknowledgments: "Got it.", "Copy that.", "Solid choice.", "Roger that."

STRUCTURED OUTPUT (JSON only — no markdown, no text outside the JSON object):
{
  "aiMessage": "1-2 sentence warm response. End: 'Verify your specific benefits and deadlines at VA.gov.'",
  "federalResources": [{"title":"","description":"","url":"","phone":"","priority":"high|medium|low","tags":[],"isFree":false,"rating":0}],
  "ngoResources": [same shape],
  "stateResources": [same shape]
}

Include 4-6 resources per track ranked by relevance. State track: ONLY programs for the veteran's detected state. Each description: exactly 2 sentences.
`;

interface AdviseMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AdviseRequest {
  messages:    AdviseMessage[];
  step:        'assess';
  userMessage: string;
  userState?:  string;
}

function getApiKey(): string {
  return process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY || '';
}

async function callModel(
  apiKey: string, model: string, msgs: AdviseMessage[],
  systemPrompt: string,
): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...msgs],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`Grok ${model} ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGrokAI(msgs: AdviseMessage[], systemPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) { console.warn('[EduAdvise] No Grok API key'); return ''; }
  try { const r = await callModel(apiKey, PRIMARY_MODEL, msgs, systemPrompt); if (r) return r; }
  catch (e) { console.warn('[EduAdvise]', PRIMARY_MODEL, (e as Error).message); }
  try { const r = await callModel(apiKey, FALLBACK_MODEL, msgs, systemPrompt); if (r) return r; }
  catch (e) { console.warn('[EduAdvise]', FALLBACK_MODEL, (e as Error).message); }
  return '';
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
function sortPool(resources: RawResource[]): RawResource[] {
  return [...resources].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? 'low'] ?? 2;
    const pb = PRIORITY_ORDER[b.priority ?? 'low'] ?? 2;
    if (pa !== pb) return pa - pb;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
}

function matchByTitles(grokItems: RawResource[], dbPool: RawResource[]): RawResource[] {
  const poolMap = new Map(dbPool.map(r => [r.title.toLowerCase().trim(), r]));
  const matched: RawResource[] = [];
  const seen = new Set<string>();
  for (const gr of grokItems) {
    const key = (gr.title ?? '').toLowerCase().trim();
    const rec = poolMap.get(key);
    if (rec && !seen.has(key)) { matched.push(rec); seen.add(key); }
  }
  for (const rec of dbPool) {
    const key = rec.title.toLowerCase().trim();
    if (!seen.has(key)) matched.push(rec);
  }
  return matched;
}

function buildPool(items: RawResource[]) {
  return items.slice(0, 20).map(r => ({
    title: r.title,
    description: (r.description ?? '').slice(0, 110),
    tags: (r.tags ?? []).slice(0, 8),
    isFree: r.isFree,
    rating: r.rating,
  }));
}

function toResponseShape(resources: RawResource[]) {
  return resources.slice(0, 6).map(r => ({
    title:       r.title,
    description: r.description ?? '',
    url:         r.url ?? '',
    phone:       r.phone ?? '',
    priority:    r.priority ?? 'medium',
    tags:        r.tags ?? [],
    isFree:      r.isFree ?? false,
    rating:      r.rating ?? 0,
  }));
}

function getStaticFallback() {
  return NextResponse.json({
    aiMessage: "Got it — here are top-rated veteran education resources to get you started. Verify your specific benefits and deadlines at VA.gov.",
    nextStep: 'complete',
    recommendations: {
      federal: [
        { title: 'Post-9/11 GI Bill (Chapter 33)', description: 'Covers full tuition at public in-state schools plus a monthly housing allowance. Apply at VA.gov using Form 22-1990.', url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/', priority: 'high', isFree: true, tags: ['gi bill', 'tuition'] },
        { title: 'VR&E Vocational Rehabilitation (Chapter 31)', description: 'Covers tuition, books, and a living stipend for veterans with service-connected disabilities. Apply at VA.gov.', url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/', priority: 'high', isFree: true, tags: ['vr&e', 'disability'] },
      ],
      ngo: [
        { title: 'Pat Tillman Foundation Scholarship', description: 'Merit-based scholarships plus a leadership network for veteran and military scholars. Applications open annually.', url: 'https://pattillmanfoundation.org/', priority: 'high', isFree: true, tags: ['scholarship', 'merit-based'] },
        { title: 'Student Veterans of America', description: 'Network of 1,500+ campus chapters providing peer support and resources for student veterans. Free to join.', url: 'https://studentveterans.org/', priority: 'medium', isFree: true, tags: ['networking', 'peer support'] },
      ],
      state: [],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: AdviseRequest = await request.json();
    const { messages = [], userMessage = '', userState } = body;

    if (!userMessage.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const allUserText = [
      userMessage,
      ...messages.filter(m => m.role === 'user').map(m => m.content),
    ].join(' ');

    const kws         = extractKeywords(allUserText);
    const userProfile = parseUserProfile(allUserText);
    const detectedState = userState ?? userProfile?.state ?? null;
    const bridgeCtx = detectedState ? { conditions: [], userState: detectedState } : undefined;

    console.log(`[EduAdvise] kws=[${kws.slice(0, 6).join(', ')}] state=${detectedState ?? 'none'}`);

    // Fetch MongoDB resources
    const dbResults = await fetchDomainResources(EDUCATION_CONFIG, kws, bridgeCtx);
    let dbFederal   = sortPool(dbResults['federal'] ?? []);
    let dbNgo       = sortPool(dbResults['ngo']     ?? []);
    let dbState     = sortPool(dbResults['state']   ?? []);
    let mongoTotal  = dbFederal.length + dbNgo.length + dbState.length;

    // Tier 2: relax state filter if sparse
    if (mongoTotal < 8 && detectedState) {
      console.log('[EduAdvise] Tier 2 — relaxing state filter');
      const t2 = await fetchDomainResources(EDUCATION_CONFIG, kws);
      const t2f = sortPool(t2['federal'] ?? []);
      const t2n = sortPool(t2['ngo']     ?? []);
      const t2s = sortPool(t2['state']   ?? []);
      if (t2f.length + t2n.length + t2s.length > mongoTotal) {
        dbFederal = t2f; dbNgo = t2n; dbState = t2s;
        mongoTotal = dbFederal.length + dbNgo.length + dbState.length;
      }
    }

    // Tier 3: drop keywords if still sparse
    if (mongoTotal < 8) {
      console.log('[EduAdvise] Tier 3 — dropping keywords');
      const t3 = await fetchDomainResources(EDUCATION_CONFIG, [], bridgeCtx);
      const t3f = sortPool(t3['federal'] ?? []);
      const t3n = sortPool(t3['ngo']     ?? []);
      const t3s = sortPool(t3['state']   ?? []);
      if (t3f.length + t3n.length + t3s.length > mongoTotal) {
        dbFederal = t3f; dbNgo = t3n; dbState = t3s;
      }
    }

    console.log(`[EduAdvise] Final pool → federal=${dbFederal.length} ngo=${dbNgo.length} state=${dbState.length}`);

    const mongoHas = dbFederal.length + dbNgo.length + dbState.length > 0;

    // Build D-lite pool for Grok
    const poolStr = mongoHas
      ? `\n\n--- RESOURCE POOL (select ONLY from these exact titles) ---\n` +
        `FEDERAL (${dbFederal.length}):\n${buildPool(dbFederal).map(r => `  - "${r.title}": ${r.description} [tags: ${r.tags.join(', ')}]${r.isFree ? ' [FREE]' : ''}`).join('\n')}\n\n` +
        `NGO/SCHOLARSHIPS (${dbNgo.length}):\n${buildPool(dbNgo).map(r => `  - "${r.title}": ${r.description} [tags: ${r.tags.join(', ')}]${r.isFree ? ' [FREE]' : ''}`).join('\n')}\n\n` +
        `STATE (${dbState.length}):\n${buildPool(dbState).map(r => `  - "${r.title}": ${r.description} [tags: ${r.tags.join(', ')}]${r.isFree ? ' [FREE]' : ''}`).join('\n')}`
      : '';

    const systemPrompt = ADVISOR_SYSTEM_PROMPT + poolStr;
    const grokStart = Date.now();
    const aiResponse = await callGrokAI(messages.concat([{ role: 'user', content: userMessage }]), systemPrompt);
    console.log(`[EduAdvise] Grok → ${aiResponse ? aiResponse.length + ' chars' : 'empty'} | ${Date.now() - grokStart}ms`);

    let aiMessage      = '';
    let grokFederal:   RawResource[] = [];
    let grokNgo:       RawResource[] = [];
    let grokState:     RawResource[] = [];

    if (aiResponse) {
      try {
        const stripped  = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const jsonMatch = stripped.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed  = JSON.parse(jsonMatch[0]);
          aiMessage     = String(parsed.aiMessage ?? '').trim();
          grokFederal   = Array.isArray(parsed.federalResources) ? parsed.federalResources : [];
          grokNgo       = Array.isArray(parsed.ngoResources)     ? parsed.ngoResources     : [];
          grokState     = Array.isArray(parsed.stateResources)   ? parsed.stateResources   : [];
        }
      } catch (e) {
        console.warn('[EduAdvise] JSON parse failed:', (e as Error).message);
      }
    }

    // D-lite: match Grok titles back to full DB records; fall back to sorted DB pool
    const finalFederal = mongoHas && grokFederal.length > 0 ? matchByTitles(grokFederal, dbFederal) : (mongoHas ? dbFederal : grokFederal);
    const finalNgo     = mongoHas && grokNgo.length > 0     ? matchByTitles(grokNgo,     dbNgo)     : (mongoHas ? dbNgo     : grokNgo);
    const finalState   = mongoHas && grokState.length > 0   ? matchByTitles(grokState,   dbState)   : (mongoHas ? dbState   : grokState);

    if (finalFederal.length + finalNgo.length + finalState.length === 0) {
      return getStaticFallback();
    }

    if (!aiMessage) {
      aiMessage = "Got it — here are your matched education resources. Verify your specific benefits and deadlines at VA.gov.";
    }

    console.log(`[EduAdvise] Response → federal=${finalFederal.length} ngo=${finalNgo.length} state=${finalState.length}`);

    return NextResponse.json({
      aiMessage,
      nextStep: 'complete',
      recommendations: {
        federal: toResponseShape(finalFederal),
        ngo:     toResponseShape(finalNgo),
        state:   toResponseShape(finalState),
      },
      crossDomainHints: [],
    });

  } catch (error) {
    console.error('[EduAdvise] Unhandled error:', error);
    return getStaticFallback();
  }
}
