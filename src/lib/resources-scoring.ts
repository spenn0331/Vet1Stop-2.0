// Fixed per Living Master MD Section 2 Phase 1 ★ — Windsurf Architecture Refactor March 2026

/**
 * resources-scoring.ts
 *
 * Pure TypeScript scoring engine — no framework imports, no DB calls, no API calls.
 * Called server-side in symptom-triage/route.ts after AI returns resource candidates.
 *
 * Scoring rubric (max 100 pts):
 *   50 pts — Keyword relevance (symptom/condition match)
 *   20 pts — Veteran-centric / peer-led
 *   15 pts — Free / low-cost + accessibility
 *   10 pts — PA / Carlisle geo-bonus
 *    5 pts — Static rating
 *
 * Thresholds:
 *   >= 80 → badge: "Recommended" + matchPercent displayed
 *   >= 60 → badge: "Good Match"
 *   <  60 → badge: null
 */

// ─── Keyword maps ────────────────────────────────────────────────────────────

/** Canonical symptom/condition keywords mapped to related tag/title terms */
const KEYWORD_TAG_MAP: Record<string, string[]> = {
  'back pain':     ['back', 'spine', 'lumbar', 'musculoskeletal', 'chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'yoga'],
  'ptsd':          ['ptsd', 'trauma', 'mental health', 'anxiety', 'stress', 'peer support', 'counseling', 'veteran mental health'],
  'weight loss':   ['weight', 'fitness', 'nutrition', 'wellness', 'exercise', 'adaptive fitness', 'yoga', 'lifestyle'],
  'tinnitus':      ['tinnitus', 'hearing', 'audiology', 'hearing loss'],
  'sleep apnea':   ['sleep', 'sleep apnea', 'respiratory', 'chronic conditions'],
  'depression':    ['depression', 'mental health', 'counseling', 'peer support', 'wellness'],
  'anxiety':       ['anxiety', 'mental health', 'stress', 'counseling', 'peer support'],
  'chronic pain':  ['chronic pain', 'pain management', 'physical therapy', 'adaptive sports', 'musculoskeletal'],
  'diabetes':      ['diabetes', 'metabolic', 'nutrition', 'wellness', 'chronic conditions'],
  'tbi':           ['tbi', 'traumatic brain injury', 'cognitive', 'neurological', 'rehabilitation'],
  'substance use': ['substance', 'alcohol', 'recovery', 'peer support', 'rehabilitation'],
  'fitness':       ['fitness', 'exercise', 'adaptive sports', 'yoga', 'wellness', 'nutrition'],
  'grants':        ['grant', 'financial assistance', 'benefits', 'funding'],
  'peer':          ['peer', 'peer support', 'peer-led', 'veteran community'],
};

/** Compound keyword pair → suggested pathway label */
export const PATHWAY_MAP: Record<string, string> = {
  'back pain+ptsd':        'Back Pain to Shape',
  'ptsd+sleep apnea':      'Sleep & Recovery Track',
  'ptsd+sleep':            'Sleep & Recovery Track',
  'weight loss+fitness':   'Adaptive Fitness Track',
  'depression+ptsd':       'Mental Wellness Path',
  'anxiety+ptsd':          'Mental Wellness Path',
  'tbi+ptsd':              'Brain & Trauma Recovery',
  'chronic pain+fitness':  'Pain to Performance',
  'back pain+fitness':     'Back Pain to Shape',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoringContext {
  /** Normalized lowercase keywords extracted from conditions/symptoms (e.g., ["back pain", "ptsd"]) */
  keywords: string[];
  hasVaClaim: boolean;
  /** MVP: always "Carlisle, PA" — make dynamic in Pass 2 */
  location: string;
  /** User preference tags (e.g., ["peer", "fitness", "grants"]) */
  preferences: string[];
}

export interface ResourceInput {
  title: string;
  description: string;
  tags?: string[];
  isFree?: boolean;
  costLevel?: 'free' | 'low' | 'moderate' | 'high';
  rating?: number;
  location?: string | { state?: string; city?: string; region?: string };
  track?: 'va' | 'ngo' | 'state';
  phone?: string;
  url?: string;
}

export interface ScoredResource extends ResourceInput {
  score: number;
  matchPercent: number;
  badge: 'Recommended' | 'Good Match' | null;
  /** ≤15 words explaining why this resource matches the user */
  whyMatches: string;
}

// ─── Geo helpers ─────────────────────────────────────────────────────────────

const PA_TERMS = ['carlisle', 'pennsylvania', ', pa', ' pa ', 'pa,'];

function locationString(loc: ResourceInput['location']): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc.toLowerCase();
  return [loc.city, loc.state, loc.region].filter(Boolean).join(' ').toLowerCase();
}

function hasGeoBonus(loc: ResourceInput['location']): boolean {
  const s = locationString(loc);
  if (!s) return false;
  return PA_TERMS.some(t => s.includes(t));
}

// ─── Keyword relevance scorer (50 pts) ───────────────────────────────────────

function scoreKeywordRelevance(resource: ResourceInput, keywords: string[]): number {
  if (!keywords.length) return 0;

  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();

  let matchedKeywords = 0;
  let totalTagHits = 0;

  for (const kw of keywords) {
    const normalizedKw = kw.toLowerCase();
    // Direct match in haystack
    if (haystack.includes(normalizedKw)) {
      matchedKeywords++;
      totalTagHits++;
      continue;
    }
    // Related-tag match via KEYWORD_TAG_MAP
    const relatedTags = KEYWORD_TAG_MAP[normalizedKw] ?? [];
    const tagHits = relatedTags.filter(tag => haystack.includes(tag)).length;
    if (tagHits > 0) {
      matchedKeywords++;
      totalTagHits += tagHits;
    }
  }

  if (matchedKeywords === 0) return 0;

  // Scale: full 50 pts if all keywords match with multiple tag hits; proportional otherwise
  const keywordRatio = matchedKeywords / keywords.length;
  const bonusHits = Math.min(totalTagHits / (keywords.length * 2), 1);
  return Math.round(50 * (keywordRatio * 0.7 + bonusHits * 0.3));
}

// ─── Veteran-centric scorer (20 pts) ─────────────────────────────────────────

const VETERAN_TAGS = ['veteran', 'veterans', 'peer', 'peer-led', 'peer support', 'vso', 'veteran community', 'military', 'service member'];

function scoreVeteranCentric(resource: ResourceInput): number {
  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();

  const hits = VETERAN_TAGS.filter(t => haystack.includes(t)).length;
  if (hits >= 3) return 20;
  if (hits === 2) return 15;
  if (hits === 1) return 10;
  return 0;
}

// ─── Free/accessible scorer (15 pts) ─────────────────────────────────────────

const FREE_TAGS = ['free', 'no cost', 'sliding scale', 'sliding-scale', 'low cost', 'low-cost', 'grant', 'financial assistance'];

function scoreFreeAccessible(resource: ResourceInput): number {
  if (resource.isFree === true) return 15;
  if (resource.costLevel === 'free') return 15;
  if (resource.costLevel === 'low') return 10;

  const haystack = [
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();

  const hits = FREE_TAGS.filter(t => haystack.includes(t)).length;
  if (hits >= 2) return 12;
  if (hits === 1) return 7;
  return 0;
}

// ─── Rating scorer (5 pts) ────────────────────────────────────────────────────

function scoreRating(resource: ResourceInput): number {
  const r = resource.rating ?? 0;
  if (r >= 4.5) return 5;
  if (r >= 4.0) return 3;
  if (r >= 3.5) return 1;
  return 0;
}

// ─── whyMatches builder ───────────────────────────────────────────────────────

function buildWhyMatches(
  resource: ResourceInput,
  context: ScoringContext,
  score: number,
): string {
  const kws = context.keywords.slice(0, 2);
  const hasGeo = hasGeoBonus(resource.location);
  const isFreeish = resource.isFree || resource.costLevel === 'free' || resource.costLevel === 'low';
  const isPeer = (resource.tags ?? []).some(t => ['peer', 'peer-led', 'peer support'].includes(t.toLowerCase()));

  // Build a ≤15 word sentence from available signals
  const parts: string[] = [];

  if (kws.length > 0) {
    parts.push(`Matches your ${kws.join(' + ')} needs`);
  }
  if (isPeer) {
    parts.push('peer-led support');
  }
  if (isFreeish) {
    parts.push('at no cost');
  }
  if (hasGeo) {
    parts.push('near Carlisle, PA');
  }
  if (score >= 80 && context.preferences.length > 0) {
    parts.push(`fits ${context.preferences[0]} goal`);
  }

  const sentence = parts.join(', ');

  // Hard cap at 15 words
  const words = sentence.split(' ');
  if (words.length > 15) {
    return words.slice(0, 15).join(' ');
  }
  return sentence || 'Strong match for your veteran health profile';
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function scoreResource(resource: ResourceInput, context: ScoringContext): ScoredResource {
  const kwScore   = scoreKeywordRelevance(resource, context.keywords);
  const vetScore  = scoreVeteranCentric(resource);
  const freeScore = scoreFreeAccessible(resource);
  const geoScore  = hasGeoBonus(resource.location) ? 10 : 0;
  const ratScore  = scoreRating(resource);

  const score = Math.min(100, kwScore + vetScore + freeScore + geoScore + ratScore);
  const matchPercent = score;

  let badge: ScoredResource['badge'] = null;
  if (score >= 80) badge = 'Recommended';
  else if (score >= 60) badge = 'Good Match';

  const whyMatches = buildWhyMatches(resource, context, score);

  return {
    ...resource,
    score,
    matchPercent,
    badge,
    whyMatches,
  };
}

// ─── Batch scorer + sorter ────────────────────────────────────────────────────

export function scoreAndSortResources(
  resources: ResourceInput[],
  context: ScoringContext,
): ScoredResource[] {
  return resources
    .map(r => scoreResource(r, context))
    .sort((a, b) => b.score - a.score);
}

// ─── Context builder from triage answers ─────────────────────────────────────

export function buildScoringContext(opts: {
  conditions: string[];
  hasVaClaim: boolean;
  preferences?: string[];
}): ScoringContext {
  // MVP: location hardcoded — dynamic in Pass 2
  const MVP_LOCATION = 'Carlisle, PA';

  const keywords = opts.conditions
    .map(c => c.toLowerCase().trim())
    .filter(Boolean);

  return {
    keywords,
    hasVaClaim: opts.hasVaClaim,
    location: MVP_LOCATION,
    preferences: opts.preferences ?? [],
  };
}

// ─── Pathway banner helper ─────────────────────────────────────────────────────

/**
 * Returns a suggested pathway label when the user has a high-score compound condition pair,
 * or null if no pathway applies.
 */
export function getSuggestedPathway(keywords: string[]): string | null {
  const lower = keywords.map(k => k.toLowerCase());

  for (const [pair, label] of Object.entries(PATHWAY_MAP)) {
    const [a, b] = pair.split('+');
    if (lower.some(k => k.includes(a)) && lower.some(k => k.includes(b))) {
      return label;
    }
  }
  return null;
}
