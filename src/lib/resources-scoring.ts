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

/** Population-specific description phrases that trigger a -20 penalty (branch/group-exclusive resources) */
const POPULATION_PENALTY_PHRASES = [
  'supports seals', 'navy seal foundation', 'for navy seals', 'seal teams',
  'for caregivers only', 'caregiver only', 'family members only',
];

/** Onboarding/enrollment phrases — penalized when user is already 100% P&T rated */
const ONBOARDING_PHRASES = [
  'how to apply', 'apply for va', 'file a claim', 'va enrollment', 'enroll in va',
  'how to get va', 'introduction to va', 'first time', 'getting started with va',
];

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
  /** Strike 5: Dynamic user state for geo scoring. null = no geo-bonus (honest default) */
  location: string | null;
  /** User preference tags (e.g., ["peer", "fitness", "grants"]) */
  preferences: string[];
  /** Fix J — per-keyword severity multiplier (e.g., { 'ptsd': 1.5, 'back pain': 1.0 }) */
  severityWeights?: Record<string, number>;
  /** Fix G/K — parsed user profile signals from chat text */
  userProfile?: {
    isPermanentTotal?: boolean;
    branch?: string;
    era?: string;
    vaDissatisfied?: boolean;
  };
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
  /** Fix H — ISO date string for freshness scoring */
  updatedAt?: string;
}

export interface ScoredResource extends ResourceInput {
  score: number;
  matchPercent: number;
  badge: 'Recommended' | 'Good Match' | null;
  /** ≤15 words explaining why this resource matches the user */
  whyMatches: string;
}

// ─── Geo helpers (Strike 5 — dynamic user state) ───────────────────────────────

function locationString(loc: ResourceInput['location']): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc.toLowerCase();
  return [loc.city, loc.state, loc.region].filter(Boolean).join(' ').toLowerCase();
}

/**
 * Returns true when a resource appears to serve the user's detected state.
 * Checks the full resource haystack (title + description + tags + location).
 * When userLocation is null, always returns false (no false geo-bonuses).
 */
function hasGeoBonus(resource: ResourceInput, userLocation: string | null): boolean {
  if (!userLocation) return false;
  const userLower = userLocation.toLowerCase().trim();
  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
    locationString(resource.location),
  ].join(' ').toLowerCase();
  return haystack.includes(userLower);
}

// ─── Keyword relevance scorer (50 pts, severity-weighted) ──────────────────────────────

function scoreKeywordRelevance(resource: ResourceInput, context: ScoringContext): number {
  const { keywords, severityWeights } = context;
  if (!keywords.length) return 0;

  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();

  let weightedHits = 0;
  let totalWeight = 0;

  for (const kw of keywords) {
    const normalizedKw = kw.toLowerCase();
    const weight = severityWeights?.[normalizedKw] ?? 1.0;
    totalWeight += weight;

    let hit = false;
    if (haystack.includes(normalizedKw)) {
      hit = true;
    } else {
      // Related-tag match via KEYWORD_TAG_MAP
      const relatedTags = KEYWORD_TAG_MAP[normalizedKw] ?? [];
      if (relatedTags.some(tag => haystack.includes(tag))) {
        hit = true;
      }
    }
    if (hit) weightedHits += weight;
  }

  if (weightedHits === 0) return 0;

  // Scale proportional to weighted hit ratio, max 50
  return Math.round(50 * (weightedHits / totalWeight));
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

// ─── Freshness scorer (+3 bonus) ─────────────────────────────────────────────────

function scoreFreshness(resource: ResourceInput): number {
  if (!resource.updatedAt) return 0;
  const monthsOld = (Date.now() - new Date(resource.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsOld < 6) return 3;
  if (monthsOld < 12) return 1;
  return 0;
}

// ─── Population penalty (-20 pts) ─────────────────────────────────────────────

function scorePopulationPenalty(resource: ResourceInput): number {
  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();
  if (POPULATION_PENALTY_PHRASES.some(phrase => haystack.includes(phrase))) return -20;
  return 0;
}

// ─── Already-handled penalty (-15 pts) ───────────────────────────────────────

function scoreOnboardingPenalty(resource: ResourceInput, context: ScoringContext): number {
  if (!context.userProfile?.isPermanentTotal && !context.hasVaClaim) return 0;
  const haystack = [resource.title, resource.description].join(' ').toLowerCase();
  if (ONBOARDING_PHRASES.some(phrase => haystack.includes(phrase))) return -15;
  return 0;
}

// ─── whyMatches builder (Fix E — per-resource keyword hits) ───────────────────────

function buildWhyMatches(
  resource: ResourceInput,
  context: ScoringContext,
  score: number,
): string {
  const haystack = [
    resource.title,
    resource.description,
    ...(resource.tags ?? []),
  ].join(' ').toLowerCase();

  // Find which of the user's keywords actually match THIS resource
  const matchedKws: string[] = [];
  for (const kw of context.keywords) {
    const nkw = kw.toLowerCase();
    if (haystack.includes(nkw)) {
      matchedKws.push(kw);
    } else {
      const relatedTags = KEYWORD_TAG_MAP[nkw] ?? [];
      if (relatedTags.some(tag => haystack.includes(tag))) {
        matchedKws.push(kw);
      }
    }
  }

  const hasGeo = hasGeoBonus(resource, context.location);
  const isFreeish = resource.isFree || resource.costLevel === 'free' || resource.costLevel === 'low';
  const isPeer = (resource.tags ?? []).some(t => ['peer', 'peer-led', 'peer support'].includes(t.toLowerCase()));

  const parts: string[] = [];
  if (matchedKws.length > 0) {
    parts.push(`Matches your ${matchedKws.slice(0, 2).join(' + ')} needs`);
  }
  if (isPeer) parts.push('peer-led support');
  if (isFreeish) parts.push('at no cost');
  if (hasGeo) parts.push('near your location');
  if (score >= 80 && context.preferences.length > 0) {
    parts.push(`fits ${context.preferences[0]} goal`);
  }

  const sentence = parts.join(', ');
  const words = sentence.split(' ');
  if (words.length > 15) return words.slice(0, 15).join(' ');
  return sentence || 'Strong match for your veteran health profile';
}

// ─── Main scoring function ───────────────────────────────────────────────────

export function scoreResource(resource: ResourceInput, context: ScoringContext): ScoredResource {
  const kwScore        = scoreKeywordRelevance(resource, context);
  const vetScore       = scoreVeteranCentric(resource);
  const freeScore      = scoreFreeAccessible(resource);
  const geoScore  = hasGeoBonus(resource, context.location) ? 10 : 0;
  const ratScore       = scoreRating(resource);
  const freshBonus     = scoreFreshness(resource);
  const popPenalty     = scorePopulationPenalty(resource);
  const onboardPenalty = scoreOnboardingPenalty(resource, context);

  const rawScore = kwScore + vetScore + freeScore + geoScore + ratScore + freshBonus + popPenalty + onboardPenalty;
  const score = Math.min(100, Math.max(0, rawScore));
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
  severityWeights?: Record<string, number>;
  userProfile?: ScoringContext['userProfile'];
  /** Strike 5: user's detected state (null = no geo-bonus) */
  userLocation?: string | null;
}): ScoringContext {
  const keywords = opts.conditions
    .map(c => c.toLowerCase().trim())
    .filter(Boolean);

  return {
    keywords,
    hasVaClaim: opts.hasVaClaim,
    location: opts.userLocation ?? null,
    preferences: opts.preferences ?? [],
    severityWeights: opts.severityWeights,
    userProfile: opts.userProfile,
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
