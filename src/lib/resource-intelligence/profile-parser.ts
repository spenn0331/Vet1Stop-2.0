/**
 * profile-parser.ts — Strike 5
 *
 * Parses veteran profile signals from chat text.
 * Moved + generalized from symptom-triage/route.ts (Strike 4G/J/I).
 * Domain-agnostic — works for Health, Education, and Life pages.
 */

import type { UserProfile, CrossDomainHint } from './types';

// ─── 50-state name list ───────────────────────────────────────────────────────

export const US_STATE_NAMES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
  'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
  'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
  'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
  'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york',
  'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
  'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
  'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
  'west virginia', 'wisconsin', 'wyoming', 'district of columbia',
];

// ─── State abbreviation → full name (lowercase) ──────────────────────────────

const STATE_ABBR_MAP: Record<string, string> = {
  al:'alabama', ak:'alaska', az:'arizona', ar:'arkansas', ca:'california',
  co:'colorado', ct:'connecticut', de:'delaware', fl:'florida', ga:'georgia',
  hi:'hawaii', id:'idaho', il:'illinois', 'in':'indiana', ia:'iowa',
  ks:'kansas', ky:'kentucky', la:'louisiana', me:'maine', md:'maryland',
  ma:'massachusetts', mi:'michigan', mn:'minnesota', ms:'mississippi',
  mo:'missouri', mt:'montana', ne:'nebraska', nv:'nevada', nh:'new hampshire',
  nj:'new jersey', nm:'new mexico', ny:'new york', nc:'north carolina',
  nd:'north dakota', oh:'ohio', ok:'oklahoma', or:'oregon', pa:'pennsylvania',
  ri:'rhode island', sc:'south carolina', sd:'south dakota', tn:'tennessee',
  tx:'texas', ut:'utah', vt:'vermont', va:'virginia', wa:'washington',
  wv:'west virginia', wi:'wisconsin', wy:'wyoming', dc:'district of columbia',
};

// ─── Amplifier words for severity weighting ───────────────────────────────────

const AMPLIFIERS = [
  'more', 'most', 'worst', 'really', 'very', 'severely', 'seriously',
  'badly', 'affects me', 'bothers me most', 'affects me more',
];

// ─── Cross-domain intent signals ─────────────────────────────────────────────

const CROSS_DOMAIN_SIGNALS: Record<string, string[]> = {
  careers:   ['entrepreneur', 'business', 'job', 'career', 'employment', 'hire', 'resume', 'work', 'sdvosb'],
  education: ['school', 'college', 'gi bill', 'degree', 'certificate', 'vocational', 'training', 'university'],
  life:      ['housing', 'moving', 'relocation', 'lease', 'mortgage', 'pcs', 'home base', 'mwr', 'recreation'],
};

// ─── Exported parsers ─────────────────────────────────────────────────────────

/**
 * Parses veteran profile signals from the full conversation text.
 * Detects: 100% P&T, VA claim status, branch, era, VA satisfaction, US state.
 */
export function parseUserProfile(text: string): UserProfile {
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

  // 50-state detection from chat context patterns
  let state: string | undefined;

  // 1. Context phrase + full state name: "I'm in Pennsylvania", "live in Texas"
  const stateCtxRe = /(?:live(?:\s+in)?|living\s+in|i'?m\s+in|i\s+am\s+in|based\s+in|located\s+in|from|residing\s+in)\s+([a-z][a-z\s]{2,}?)(?:[\s,.]|$)/;
  const ctxMatch = lower.match(stateCtxRe);
  if (ctxMatch) {
    const candidate = ctxMatch[1].trim();
    state = US_STATE_NAMES.find(s => s === candidate || candidate.startsWith(s));
  }

  // 2. Context phrase + 2-letter abbreviation: "I'm in PA", "based in TX"
  if (!state) {
    const abbrCtxRe = /(?:live(?:\s+in)?|living\s+in|i'?m\s+in|i\s+am\s+in|based\s+in|located\s+in|from|residing\s+in)\s+\b([a-z]{2})\b/;
    const abbrCtxMatch = lower.match(abbrCtxRe);
    if (abbrCtxMatch) state = STATE_ABBR_MAP[abbrCtxMatch[1]];
  }

  // 3. Bare full state name anywhere in text: "Pennsylvania", "west virginia"
  if (!state) {
    const multiWord = US_STATE_NAMES.filter(s => s.includes(' '));
    state = multiWord.find(s => lower.includes(s))
      ?? US_STATE_NAMES.filter(s => !s.includes(' ')).find(s =>
          new RegExp(`\\b${s}\\b`).test(lower)
        );
  }

  // 4. Bare UPPERCASE 2-letter abbreviation in original text: "PA", "TX", "FL"
  //    Uses original text (not lowercased) to avoid false matches on "in", "or", "me", "va" (Veterans Affairs), etc.
  if (!state) {
    const EXCLUDE_ABBR = new Set(['VA', 'OK', 'IN', 'OR', 'ME', 'OH', 'HI', 'ID', 'MS', 'LA', 'MA']);
    const abbrMatch = text.match(/\b([A-Z]{2})\b/g);
    if (abbrMatch) {
      for (const abbr of abbrMatch) {
        if (!EXCLUDE_ABBR.has(abbr) && STATE_ABBR_MAP[abbr.toLowerCase()]) {
          state = STATE_ABBR_MAP[abbr.toLowerCase()];
          break;
        }
      }
    }
  }

  return { isPermanentTotal, hasVaClaim, branch, era, vaDissatisfied, state };
}

/**
 * Returns per-keyword severity weight multipliers.
 * Amplifier words near a keyword ("affects me more") → 1.5x weight.
 * Multiple mentions of same keyword → 1.3x weight.
 */
export function parseSeverityWeights(text: string, keywords: string[]): Record<string, number> {
  const lower = text.toLowerCase();
  const weights: Record<string, number> = {};

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    const kwIdx = lower.indexOf(kwLower);
    if (kwIdx === -1) { weights[kwLower] = 1.0; continue; }
    const window = lower.slice(Math.max(0, kwIdx - 40), kwIdx + kwLower.length + 40);
    const hasAmplifier = AMPLIFIERS.some(amp => window.includes(amp));
    const mentionCount = (lower.match(new RegExp(kwLower.replace(/[+?.*()\[\]{}|^$\\]/g, '\\$&'), 'g')) ?? []).length;
    weights[kwLower] = hasAmplifier ? 1.5 : mentionCount > 1 ? 1.3 : 1.0;
  }

  return weights;
}

/**
 * Detects signals for domains other than the current page.
 * e.g., mentions of "entrepreneur" on the Health page → careers hint.
 * Strike 4I: returned as crossDomainHints[] in API response for future UI.
 */
export function detectCrossDomainIntent(text: string): CrossDomainHint[] {
  const lower = text.toLowerCase();
  const hints: CrossDomainHint[] = [];

  for (const [domain, signals] of Object.entries(CROSS_DOMAIN_SIGNALS)) {
    const matched = signals.find(s => lower.includes(s));
    if (matched) hints.push({ domain: domain as CrossDomainHint['domain'], signal: matched });
  }

  return hints;
}
