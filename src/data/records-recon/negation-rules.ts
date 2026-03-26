// ─── Negation Detection Rules ────────────────────────────────────────────────
// Configurable negation prefixes and proximity window for all extraction passes.
// Consolidates logic from isNegativeContext() and isScreeningFalsePositive().

// Number of characters to look back from the keyword position for negation prefixes
export const NEGATION_WINDOW_CHARS = 80;

export const NEGATION_PREFIXES = [
  'no ', 'absence of ', 'denies ', 'denied ', 'negative for ',
  'without ', 'not present', 'never present', 'ruled out',
  'no evidence of ', 'no history of ', 'no signs of ', 'no sign of ',
  'no symptoms of ', 'no symptom of ', 'does not have ',
  'patient denies ', 'veteran denies ', 'reports no ',
  'no current ', 'not consistent with ', 'no active ',
  'no diagnosis of ', 'no findings of ', 'not diagnosed with ',
  'unremarkable for ', 'absent ', 'resolved ',
];

export const NEGATION_REGEX = new RegExp(
  `\\b(?:${NEGATION_PREFIXES.map(p => p.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'i'
);

// Screening tool false-positive patterns
// When a screening score is negative/zero, the condition should NOT be extracted
export interface ScreeningRule {
  toolRegex: RegExp;
  blockedKeywords: string[];
}

export const SCREENING_RULES: ScreeningRule[] = [
  {
    toolRegex: /phq-?9[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil|minimal)/i,
    blockedKeywords: ['depression', 'depressive', 'suicidal'],
  },
  {
    toolRegex: /c-?ssrs[:\s]*(?:negative|none|denied|no)/i,
    blockedKeywords: ['suicidal', 'suicidal ideation', 'self-harm'],
  },
  {
    toolRegex: /gad-?7[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil|minimal)/i,
    blockedKeywords: ['anxiety', 'anxious', 'generalized anxiety'],
  },
  {
    toolRegex: /pc-?ptsd[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i,
    blockedKeywords: ['ptsd', 'post-traumatic', 'post traumatic'],
  },
  {
    toolRegex: /audit-?c[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i,
    blockedKeywords: ['substance', 'alcohol', 'alcohol use'],
  },
  {
    toolRegex: /suicidal\s+ideation[:\s]*(?:0|none|denied|negative|absent)/i,
    blockedKeywords: ['suicidal', 'suicidal ideation'],
  },
];

/**
 * Check if a keyword appears in a negative context within the given text.
 * Looks back NEGATION_WINDOW_CHARS characters from the keyword position.
 */
export function isNegativeContext(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kwLower = keyword.toLowerCase();
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return false;
  const prefix = lower.substring(Math.max(0, idx - NEGATION_WINDOW_CHARS), idx);
  return NEGATION_REGEX.test(prefix);
}

/**
 * Check if a keyword is a false positive from a negative screening tool score.
 */
export function isScreeningFalsePositive(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  for (const rule of SCREENING_RULES) {
    if (rule.toolRegex.test(lower) && rule.blockedKeywords.some(bk => kw.includes(bk))) {
      return true;
    }
  }
  return false;
}
