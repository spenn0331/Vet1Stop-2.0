import { NextRequest } from 'next/server';

/**
 * POST /api/health/medical-detective — v4.3 "Deep Evidence Synthesis"
 *
 * Architecture (Phase 1 ★ per master-strategy.md Section 2):
 *   Phase 1: Smart Pre-Filter (NO AI, ~1-2s) — tiered keyword scoring,
 *            section header priority, noise exclusion, 10K char cap.
 *   Phase 2: Streaming Grok-4 Synthesis (SSE, 70s + 30s idle timeout) —
 *            produces deep structured JSON per flag: excerpts, dates,
 *            context, claim type, next action. Auto-retry at 60% cap.
 *
 * Upload-only. In-memory processing. Auto-delete after scan. No storage.
 * No claim filing. No HIPAA exposure. Bold disclaimers on every output.
 *
 * Streaming NDJSON events:
 *   {type:'progress', message, percent, phase}
 *   {type:'file_ready', fileName, numPages, filteredChunks, reductionPct}
 *   {type:'keyword_flag', flag}
 *   {type:'scan_cache', filteredText, keywordFlags, synopsis, fileNames}
 *   {type:'complete', report}
 *   {type:'error', message}
 */

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilePayload {
  name: string;
  type: string;
  data: string;
  size: number;
}

interface FlaggedItem {
  flagId: string;
  label: string;
  category: string;
  excerpt: string;
  context: string;
  claimType: string;
  nextAction: string;
  dateFound?: string;
  pageNumber?: string;
  suggestedClaimCategory: string;
  confidence: 'high' | 'medium' | 'low';
}

interface DetectiveReport {
  disclaimer: string;
  summary: string;
  totalFlagsFound: number;
  flaggedItems: FlaggedItem[];
  suggestedNextSteps: string[];
  processingDetails: { filesProcessed: number; processingTime: number; aiModel: string };
  scanSynopsis?: ScanSynopsis;
  isInterim?: boolean;
  interimNote?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERED_TEXT_CAP = 10_000;
const MAX_PARAGRAPHS_TO_SEND = 80;
const SECTION_GUARANTEE_COUNT = 3;
const SYNTHESIS_TIMEOUT_MS = 70_000;
const IDLE_TIMEOUT_MS = 30_000;
const RETRY_CAP_RATIO = 0.6;
const MIN_PARAGRAPH_LENGTH = 30;
const MIN_KEYWORD_MATCHES_FLAG = 2;

const MODEL_SYNTHESIS = 'grok-4-0709';

const GUARANTEED_SECTIONS = [
  'assessment', 'problem list', 'active problems', 'active diagnoses',
  'hpi', 'history of present illness', 'diagnosis', 'diagnoses',
  'plan', 'impression', 'chief complaint',
];

const DISCLAIMER = `This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.`;

// ─── Core Medical Keywords (~85 terms) ───────────────────────────────────────

const CORE_KEYWORDS = [
  'tinnitus', 'hearing loss', 'ptsd', 'post-traumatic', 'sleep apnea',
  'migraine', 'tbi', 'traumatic brain', 'anxiety', 'depression',
  'burn pit', 'burn-pit', 'agent orange', 'gulf war', 'toxic exposure',
  'pact act', 'presumptive', 'iraq', 'afghanistan',
  'back pain', 'lumbar', 'radiculopathy', 'knee', 'shoulder', 'arthritis',
  'cervical', 'sciatica',
  'sinusitis', 'rhinitis', 'asthma', 'copd', 'constrictive bronchiolitis',
  'gerd', 'neuropathy', 'chronic pain', 'fibromyalgia',
  'diabetes', 'hypertension', 'erectile', 'mst', 'military sexual trauma',
  'mgus', 'male breast cancer', 'urethral cancer', 'ischemic heart',
  'pancreatic cancer', 'kidney cancer', 'lymphatic cancer', 'bladder cancer',
  'melanoma', 'hepatitis', 'parkinson',
  'service connected', 'service-connected', 'nexus', 'at least as likely',
  'more likely than not', 'secondary to', 'aggravated by', 'in-service',
  'c&p', 'compensable', 'rated at', 'disability rating', 'tdiu',
  'individual unemployability', 'sc ',
  'diagnosis', 'diagnosed', 'abnormal', 'chronic', 'bilateral',
  'functional impairment', 'limitation of motion', 'worsening',
  'problem list', 'active diagnoses', 'range of motion', 'rom',
  'deluca', 'functional loss', 'pain on use', 'flare-up', 'flare up',
  'buddy statement', 'lay evidence', 'stressor', 'incident report',
  'seizure', 'epilepsy', 'cancer', 'tumor', 'thyroid', 'kidney', 'liver',
  'bipolar', 'schizophrenia', 'suicidal', 'substance',
];

const SECTION_HEADERS = [
  'assessment:', 'problem list:', 'active problems:', 'diagnosis:',
  'plan:', 'hpi:', 'history of present illness:', 'impression:',
  'clinical notes:', 'active diagnoses:', 'chief complaint:',
  'physical exam:', 'mental status exam:', 'c&p exam',
  'compensation', 'disability benefits questionnaire', 'dbq',
];

const SECTION_HEADER_REGEX = new RegExp(
  SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

const NOISE_PHRASES = [
  'appointment scheduled', 'next appointment', 'check-in', 'checked in',
  'no show', 'cancelled appointment', 'refill request', 'medication refill',
  'secure message', 'my healthevet', 'travel reimbursement', 'copay',
  'emergency contact', 'next of kin', 'pharmacy', 'prescription mailed',
  'demographics updated', 'insurance', 'eligibility', 'means test',
  'flu shot', 'covid vaccine', 'immunization', 'routine vital signs',
  'vital signs within normal', 'height:', 'weight:', 'bmi:',
];

const KEYWORD_PATTERNS = CORE_KEYWORDS.map(k =>
  new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
);

const NOISE_REGEX = new RegExp(
  NOISE_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ─── Synthesis Prompt — JSON output with deep evidence fields ────────────────

const SYNTHESIS_PROMPT = `You are an expert VA disability claims evidence analyst with deep knowledge of 38 CFR rating schedules, presumptive conditions, the PACT Act (2022-2026), secondary service-connection, and how clinical notes support disability claims.

You are given pre-filtered excerpts from a veteran's VA medical records. Every paragraph was keyword-filtered or is a clinical section header. Your job: identify EVERY claim-relevant finding with deep supporting detail.

RULES:
- Extract EXACT verbatim quotes from the text — 1-2 sentences that prove the finding
- Identify the claim type: "Primary Service-Connected", "Secondary", "PACT Act Presumptive", "Aggravated", or "Rating Increase"
- For secondary conditions, name the primary condition it's secondary to in the context
- For PACT Act presumptives, cite the specific PACT Act provision
- Assign confidence: High (direct diagnosis/nexus/rating language), Medium (clinical evidence suggesting condition), Low (indirect but worth noting)
- Provide a concrete next action specific to each finding
- Include dates when visible in the text
- Deduplicate: merge flags for the same condition
- Err on the side of INCLUSION — veterans need to see everything

OUTPUT FORMAT — You MUST output ONLY a valid JSON array. No markdown. No prose before or after. Just the array:
[
  {
    "condition": "Exact condition name",
    "confidence": "High",
    "category": "Musculoskeletal",
    "claimType": "Secondary",
    "excerpt": "Verbatim 1-2 sentence quote from records proving this finding",
    "date": "01/15/2024",
    "page": null,
    "context": "Found in Assessment section — diagnosed as secondary to service-connected lumbar DDD. Nexus language present: 'at least as likely as not'",
    "nextAction": "Request nexus letter from treating physician linking this condition to service-connected lumbar spine"
  }
]

Category must be one of: Mental Health, Musculoskeletal, Hearing, Neurological, Sleep Disorders, Respiratory, Cardiovascular, Gastrointestinal, Oncological, PACT Act Presumptive, Claim Language, Dermatological, Endocrine, Other.

claimType must be one of: Primary Service-Connected, Secondary, PACT Act Presumptive, Aggravated, Rating Increase.

If no evidence found, output: []`;

// ─── PDF Text Extraction ──────────────────────────────────────────────────────

async function extractPDFData(base64Data: string): Promise<{ text: string; numPages: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(base64Data, 'base64');
    const data = await pdfParse(buffer);
    return { text: data.text || '', numPages: data.numpages || 1 };
  } catch (err) {
    console.warn('[MedicalDetective] pdf-parse failed, using regex fallback:', err);
    return { text: extractTextWithRegex(base64Data), numPages: 1 };
  }
}

function extractTextWithRegex(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const latin1 = buffer.toString('latin1');
    const parts: string[] = [];
    const btBlocks = latin1.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btBlocks) {
      const tj = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      for (const t of tj) { const m = t.match(/\(([^)]*)\)/); if (m?.[1]) parts.push(m[1]); }
      const tjArr = block.match(/\[([^\]]*)\]\s*TJ/gi) || [];
      for (const a of tjArr) {
        const inner = a.match(/\(([^)]*)\)/g) || [];
        for (const i of inner) { const m = i.match(/\(([^)]*)\)/); if (m?.[1]) parts.push(m[1]); }
      }
    }
    if (parts.length < 10) {
      const utf8 = buffer.toString('utf-8');
      const readable = utf8.match(/[A-Za-z][A-Za-z0-9\s,.;:'\-\/()]{4,}/g) || [];
      parts.push(...readable.filter(t => t.length > 8 && /[a-z]/.test(t)));
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  } catch { return ''; }
}

// ─── Phase 1: Smart Pre-Filter ───────────────────────────────────────────────

interface KeywordFlag {
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  excerpt: string;
}

interface ScanSynopsis {
  totalPages: number;
  totalParagraphs: number;
  keptParagraphs: number;
  reductionPct: number;
  keywordsDetected: string[];
  sectionHeadersFound: string[];
}

function smartPreFilter(text: string): {
  filtered: string;
  totalParagraphs: number;
  keptParagraphs: number;
  keywordFlags: KeywordFlag[];
  detectedKeywords: string[];
  detectedHeaders: string[];
} {
  const rawLines = text.split(/\n/);
  const paragraphs: string[] = [];
  let currentGroup = '';
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (currentGroup.length > 0) { paragraphs.push(currentGroup.trim()); currentGroup = ''; }
      continue;
    }
    if (currentGroup.length > 0 && trimmed.length < MIN_PARAGRAPH_LENGTH && currentGroup.length < MIN_PARAGRAPH_LENGTH) {
      currentGroup += ' ' + trimmed;
    } else if (currentGroup.length > 0 && currentGroup.length >= MIN_PARAGRAPH_LENGTH) {
      paragraphs.push(currentGroup.trim());
      currentGroup = trimmed;
    } else {
      currentGroup += (currentGroup ? ' ' : '') + trimmed;
    }
  }
  if (currentGroup.trim().length > 0) paragraphs.push(currentGroup.trim());

  interface ScoredPara {
    text: string;
    keywordCount: number;
    matchedKeywords: string[];
    isHeader: boolean;
    sectionKey: string | null;
  }

  const scored: ScoredPara[] = [];
  const detectedKeywordsSet = new Set<string>();
  const detectedHeadersSet = new Set<string>();

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length < MIN_PARAGRAPH_LENGTH) continue;
    if (NOISE_REGEX.test(trimmed)) continue;
    const lower = trimmed.toLowerCase();

    let sectionKey: string | null = null;
    for (const s of GUARANTEED_SECTIONS) {
      if (lower.includes(s)) { sectionKey = s; break; }
    }

    const isHeader = SECTION_HEADER_REGEX.test(trimmed);
    if (isHeader) {
      for (const h of SECTION_HEADERS) {
        if (lower.includes(h.replace(':', '').toLowerCase())) {
          detectedHeadersSet.add(h.replace(':', '').trim());
        }
      }
    }

    const matchedKeywords: string[] = [];
    for (let i = 0; i < KEYWORD_PATTERNS.length; i++) {
      if (KEYWORD_PATTERNS[i].test(trimmed)) {
        matchedKeywords.push(CORE_KEYWORDS[i]);
        detectedKeywordsSet.add(CORE_KEYWORDS[i]);
      }
    }

    if (matchedKeywords.length >= 1 || isHeader) {
      scored.push({ text: trimmed, keywordCount: matchedKeywords.length, matchedKeywords, isHeader, sectionKey });
    }
  }

  scored.sort((a, b) => b.keywordCount - a.keywordCount);

  const guaranteed: ScoredPara[] = [];
  const sectionCounts = new Map<string, number>();
  for (const sp of scored) {
    if (sp.sectionKey) {
      const count = sectionCounts.get(sp.sectionKey) || 0;
      if (count < SECTION_GUARANTEE_COUNT) {
        guaranteed.push(sp);
        sectionCounts.set(sp.sectionKey, count + 1);
      }
    }
  }
  const guaranteedTexts = new Set(guaranteed.map(g => g.text));

  const selected: ScoredPara[] = [...guaranteed];
  for (const sp of scored) {
    if (selected.length >= MAX_PARAGRAPHS_TO_SEND) break;
    if (!guaranteedTexts.has(sp.text)) {
      selected.push(sp);
    }
  }

  const kept: string[] = [];
  const keywordFlags: KeywordFlag[] = [];
  const seenConditions = new Set<string>();
  let totalChars = 0;

  for (const sp of selected) {
    if (totalChars >= FILTERED_TEXT_CAP) break;
    const chunk = sp.text.length + totalChars > FILTERED_TEXT_CAP
      ? sp.text.substring(0, FILTERED_TEXT_CAP - totalChars)
      : sp.text;
    kept.push(chunk);
    totalChars += chunk.length;

    if (sp.matchedKeywords.length >= MIN_KEYWORD_MATCHES_FLAG) {
      const primaryKeyword = sp.matchedKeywords[0];
      const conditionKey = primaryKeyword.toLowerCase().replace(/[^a-z]/g, '');
      if (!seenConditions.has(conditionKey)) {
        seenConditions.add(conditionKey);
        const claimLanguage = ['service connected', 'service-connected', 'nexus', 'at least as likely',
          'more likely than not', 'compensable', 'rated at', 'disability rating', 'tdiu', 'c&p'];
        const isClaimLanguage = sp.matchedKeywords.some(k => claimLanguage.includes(k));
        const confidence: 'high' | 'medium' | 'low' = isClaimLanguage ? 'high'
          : sp.matchedKeywords.length >= 3 ? 'high'
          : sp.matchedKeywords.length >= 2 ? 'medium'
          : 'low';
        keywordFlags.push({
          condition: primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1),
          confidence,
          excerpt: sp.text.substring(0, 150),
        });
      }
    }
  }

  return {
    filtered: kept.join('\n\n'),
    totalParagraphs: paragraphs.length,
    keptParagraphs: kept.length,
    keywordFlags,
    detectedKeywords: Array.from(detectedKeywordsSet),
    detectedHeaders: Array.from(detectedHeadersSet),
  };
}

// ─── Parse Grok-4 Synthesis Output ───────────────────────────────────────────
// Primary: parse JSON array. Fallback: parse numbered text list.

function mapToCategory(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('tinnitus') || l.includes('hearing')) return 'Hearing';
  if (l.includes('ptsd') || l.includes('trauma') || l.includes('anxiety') || l.includes('depression') || l.includes('mental') || l.includes('panic') || l.includes('mst')) return 'Mental Health';
  if (l.includes('sleep apnea') || l.includes('osa') || l.includes('cpap')) return 'Sleep Disorders';
  if (l.includes('migraine') || l.includes('headache') || l.includes('tbi') || l.includes('neurolog')) return 'Neurological';
  if (l.includes('burn pit') || l.includes('pact') || l.includes('agent orange') || l.includes('gulf war') || l.includes('toxic') || l.includes('presumptive')) return 'PACT Act Presumptive';
  if (l.includes('respirat') || l.includes('sinus') || l.includes('rhinitis') || l.includes('asthma') || l.includes('copd')) return 'Respiratory';
  if (l.includes('gerd') || l.includes('gastro') || l.includes('ibs')) return 'Gastrointestinal';
  if (l.includes('back') || l.includes('knee') || l.includes('shoulder') || l.includes('musculo') || l.includes('arthritis') || l.includes('lumbar') || l.includes('spinal') || l.includes('joint') || l.includes('cervical') || l.includes('radiculop')) return 'Musculoskeletal';
  if (l.includes('service connect') || l.includes('nexus') || l.includes('rated at') || l.includes('compensable')) return 'Claim Language';
  if (l.includes('cancer') || l.includes('tumor')) return 'Oncological';
  if (l.includes('heart') || l.includes('cardio') || l.includes('hypertens')) return 'Cardiovascular';
  return 'Other';
}

function parseSynthesisOutput(rawText: string): FlaggedItem[] {
  if (!rawText || rawText.trim() === '[]') return [];

  // Strategy 1: Parse as JSON array
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map((item: Record<string, string>, i: number) => ({
          flagId: `grok_${(item.condition || '').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${i}`,
          label: item.condition || 'Unknown Condition',
          category: item.category || mapToCategory(item.condition || ''),
          excerpt: item.excerpt || '',
          context: item.context || '',
          claimType: item.claimType || 'Primary Service-Connected',
          nextAction: item.nextAction || 'Review with your VSO for assessment.',
          dateFound: item.date || undefined,
          pageNumber: item.page || undefined,
          suggestedClaimCategory: item.category || mapToCategory(item.condition || ''),
          confidence: (['high', 'medium', 'low'].includes((item.confidence || '').toLowerCase())
            ? (item.confidence || '').toLowerCase()
            : 'medium') as 'high' | 'medium' | 'low',
        }));
      }
    } catch { /* JSON parse failed — fall through to text parsing */ }
  }

  // Strategy 2: Parse numbered text list (backward compat)
  const hasNumberedItems = /^\d+\.\s/m.test(rawText);
  if (!hasNumberedItems && rawText.includes('No strong claim-relevant evidence flags')) return [];

  const items: FlaggedItem[] = [];
  const blocks = rawText.split(/\n(?=\d+\.\s)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || !/^\d+\./.test(trimmed)) continue;

    const firstLine = trimmed.split('\n')[0].replace(/^\d+\.\s*\*?\*?/, '').replace(/\*\*/g, '').trim();
    if (!firstLine || firstLine.length < 3) continue;

    const confMatch = block.match(/[Cc]onfidence[:\s]+([Hh]igh|[Mm]edium|[Ll]ow)/);
    const confidence = (confMatch?.[1]?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low';

    const quoteMatch = block.match(/(?:[Ee]xcerpt|[Ee]xact [Qq]uote|[Qq]uote)[:\s]*[""'"']?([^""'"'\n]{10,})[""'"']?/);
    const excerpt = quoteMatch?.[1]?.trim() || '';

    const pageMatch = block.match(/[Pp]age[:\s]+(\d+)/);
    const dateMatch = block.match(/[Dd]ate[:\s]+([\w\/\-,\s]+?)(?:\n|$)/);
    const ctxMatch = block.match(/[Cc]ontext[:\s]+(.+?)(?:\n|$)/);
    const relMatch = block.match(/[Rr]elevance[:\s]+(.+?)(?:\n|$)/);
    const claimMatch = block.match(/[Cc]laim\s*[Tt]ype[:\s]+(.+?)(?:\n|$)/);
    const actionMatch = block.match(/[Nn]ext\s*[Aa]ction[:\s]+(.+?)(?:\n|$)/);
    const catMatch = block.match(/[Cc]ategory[:\s]+([^\n]+)/);

    items.push({
      flagId: `grok_${firstLine.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${items.length}`,
      label: firstLine,
      category: catMatch?.[1]?.trim() || mapToCategory(firstLine),
      excerpt,
      context: ctxMatch?.[1]?.trim() || relMatch?.[1]?.trim() || '',
      claimType: claimMatch?.[1]?.trim() || 'Primary Service-Connected',
      nextAction: actionMatch?.[1]?.trim() || 'Review with your VSO for assessment.',
      dateFound: dateMatch?.[1]?.trim().replace(/[,\s]+$/, '') || undefined,
      pageNumber: pageMatch?.[1] || undefined,
      suggestedClaimCategory: catMatch?.[1]?.trim() || mapToCategory(firstLine),
      confidence,
    });
  }

  return items;
}

// ─── Keyword Flags → FlaggedItems (interim fallback) ─────────────────────────

function keywordFlagsToFlaggedItems(flags: KeywordFlag[]): FlaggedItem[] {
  return flags.map((f, i) => ({
    flagId: `kw_${f.condition.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${i}`,
    label: f.condition,
    category: mapToCategory(f.condition),
    excerpt: f.excerpt,
    context: `Keyword-detected in your records. Review with your VSO for full assessment.`,
    claimType: 'Primary Service-Connected',
    nextAction: `Discuss ${f.condition} with your VSO to determine if a claim or increase is warranted.`,
    suggestedClaimCategory: mapToCategory(f.condition),
    confidence: f.confidence,
  }));
}

// ─── Deduplication + PACT Act Cross-Ref ──────────────────────────────────────

function deduplicateFlags(items: FlaggedItem[]): FlaggedItem[] {
  const seen = new Map<string, FlaggedItem>();
  for (const item of items) {
    const key = item.label.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    const existing = seen.get(key);
    if (!existing || item.confidence === 'high') seen.set(key, item);
  }
  return Array.from(seen.values());
}

const PACT_ACT_CONDITIONS = [
  'burn pit', 'burn-pit', 'toxic exposure', 'pact act', 'presumptive',
  'agent orange', 'gulf war', 'constrictive bronchiolitis',
  'mgus', 'male breast cancer', 'urethral cancer', 'ischemic heart',
  'pancreatic cancer', 'kidney cancer', 'lymphatic cancer', 'bladder cancer',
  'melanoma', 'hepatitis', 'parkinson', 'sinusitis', 'rhinitis',
  'iraq', 'afghanistan', 'hypertension',
];

function addPactActCrossRef(flags: FlaggedItem[]): FlaggedItem[] {
  const pactRegex = new RegExp(PACT_ACT_CONDITIONS.join('|'), 'i');
  return flags.map(flag => {
    const matchesPact = pactRegex.test(flag.label) || pactRegex.test(flag.excerpt) || pactRegex.test(flag.category);
    if (matchesPact && !flag.context.includes('PACT Act')) {
      return {
        ...flag,
        context: flag.context + ' This may qualify under the PACT Act \u2014 see va.gov/pact for details.',
        claimType: flag.claimType === 'Primary Service-Connected' ? 'PACT Act Presumptive' : flag.claimType,
      };
    }
    return flag;
  });
}

// ─── Report Builder ──────────────────────────────────────────────────────────

function buildReport(flags: FlaggedItem[], filesProcessed: number, processingTime: number, aiModel: string, synopsis?: ScanSynopsis, isInterim?: boolean, interimNote?: string): DetectiveReport {
  return {
    disclaimer: DISCLAIMER,
    summary: flags.length > 0
      ? `${flags.length} potential claim-relevant flag(s) identified across ${filesProcessed} document(s). Review with your VSO or accredited claims representative.`
      : `No strong claim-relevant flags were identified in the ${filesProcessed} document(s) processed. This does not mean there are no valid claims \u2014 consider uploading additional records.`,
    totalFlagsFound: flags.length,
    flaggedItems: flags,
    suggestedNextSteps: flags.length > 0
      ? [
          'Review this report with an accredited VSO (Veterans Service Organization) representative',
          'Request a nexus letter from your healthcare provider for flagged conditions',
          'Contact your local VA Regional Office to file or supplement a disability claim',
          'Gather supporting buddy statements and service records for flagged conditions',
          'Visit va.gov/disability to file online or call 1-800-827-1000',
        ]
      : [
          'Upload additional VA records, progress notes, or Blue Button exports for a more thorough scan',
          'Contact a free VSO (American Legion, DAV, VFW) \u2014 they can review your records in person',
          'Request your full C-file from the VA by submitting VA Form 3288',
          'Visit va.gov/disability for information on filing a claim',
        ],
    processingDetails: { filesProcessed, processingTime, aiModel },
    scanSynopsis: synopsis,
    isInterim,
    interimNote,
  };
}

// ─── Grok API ────────────────────────────────────────────────────────────────

class GrokTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs / 1000}s`);
    this.name = 'GrokTimeoutError';
  }
}

function getApiKey(): string {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

async function callGrokAPIStreaming(
  model: string,
  messages: Array<{ role: string; content: string }>,
  overallTimeoutMs: number,
  idleTimeoutMs: number,
  label: string,
  maxTokens: number = 3000,
  onToken?: (tokenCount: number, maxTokens: number) => void,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('XAI_API_KEY / GROK_API_KEY is not configured.');

  const controller = new AbortController();
  let overallTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => controller.abort(), overallTimeoutMs);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (overallTimer) { clearTimeout(overallTimer); overallTimer = null; }
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  };

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(), idleTimeoutMs);
  };

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens, stream: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'unknown error');
      throw new Error(`${label} API error ${response.status}: ${errText.substring(0, 200)}`);
    }

    if (!response.body) throw new Error(`${label}: no response body`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';
    let tokenCount = 0;

    resetIdle();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetIdle();
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                tokenCount++;
                if (onToken && tokenCount % 15 === 0) {
                  onToken(tokenCount, maxTokens);
                }
              }
            } catch { /* malformed SSE line */ }
          }
        }
      }
    } catch (readErr) {
      if (controller.signal.aborted) {
        throw new GrokTimeoutError(label, overallTimeoutMs);
      }
      throw readErr;
    }

    clearTimers();
    return accumulated;
  } catch (err) {
    clearTimers();
    const error = err as Error;
    if (error.name === 'GrokTimeoutError') throw error;
    if (error.name === 'AbortError' || error.name === 'TimeoutError' || controller.signal.aborted) {
      throw new GrokTimeoutError(label, overallTimeoutMs);
    }
    console.warn(`[MedicalDetective] ${label} streaming failed: ${error.message}`);
    throw error;
  }
}

async function synthesizeWithGrok4(
  filteredText: string,
  fileNames: string,
  onProgress?: (tokenCount: number, maxTokens: number) => void,
): Promise<string> {
  return callGrokAPIStreaming(
    MODEL_SYNTHESIS,
    [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: `Veteran's documents: "${fileNames}"\n\nPre-filtered medical record excerpts (high-signal paragraphs only):\n\n${filteredText}` },
    ],
    SYNTHESIS_TIMEOUT_MS,
    IDLE_TIMEOUT_MS,
    'Grok-4 synthesis',
    3_000,
    onProgress,
  );
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        try { controller.enqueue(encoder.encode(JSON.stringify(event) + '\n')); } catch { /* closed */ }
      };

      try {
        const body = await request.json();
        const files: FilePayload[] = body.files || [];

        // ═══ RETRY PATH ═══
        const retryFilteredText: string = body.retryFilteredText || '';
        const retrySynopsis: ScanSynopsis | undefined = body.retrySynopsis;
        const retryKeywordFlags: KeywordFlag[] = body.retryKeywordFlags || [];
        const retryFileNames: string = body.retryFileNames || 'cached documents';

        if (retryFilteredText) {
          const useReducedCap = body.useReducedCap === true;
          const textForSynthesis = useReducedCap
            ? retryFilteredText.substring(0, Math.floor(retryFilteredText.length * RETRY_CAP_RATIO))
            : retryFilteredText;

          emit({ type: 'progress', message: `Retrying deep analysis${useReducedCap ? ' (reduced scope)' : ''}...`, percent: 30, phase: 'synthesis' });

          try {
            const output = await synthesizeWithGrok4(textForSynthesis, retryFileNames, (tc, mt) => {
              const pct = 35 + Math.round((tc / mt) * 55);
              emit({ type: 'progress', message: `Deep Synthesis — ${tc} tokens received...`, percent: Math.min(pct, 92), phase: 'synthesis' });
            });
            const flags = addPactActCrossRef(deduplicateFlags(output ? parseSynthesisOutput(output) : []));
            emit({ type: 'progress', message: `Complete — ${flags.length} flag(s)`, percent: 95, phase: 'synthesis_done' });
            emit({ type: 'complete', report: buildReport(flags, 1, Date.now() - startTime, MODEL_SYNTHESIS, retrySynopsis), percent: 100 });
          } catch (retryErr) {
            if ((retryErr as Error).name === 'GrokTimeoutError') {
              const interim = addPactActCrossRef(deduplicateFlags(keywordFlagsToFlaggedItems(retryKeywordFlags)));
              emit({ type: 'complete', report: buildReport(interim, 1, Date.now() - startTime, 'keyword pre-filter', retrySynopsis, true, 'Deep scan timed out — showing keyword flags. Click Retry to try again.'), percent: 100 });
            } else { throw retryErr; }
          }
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        // ═══ NORMAL SCAN ═══
        if (files.length === 0) {
          emit({ type: 'error', message: 'No files provided.' });
          try { controller.close(); } catch { /* already closed */ }
          return;
        }
        for (const f of files) {
          if (f.size > 50 * 1024 * 1024) {
            emit({ type: 'error', message: `"${f.name}" exceeds 50MB limit.` });
            try { controller.close(); } catch { /* already closed */ }
            return;
          }
        }

        emit({ type: 'progress', message: 'Starting analysis...', percent: 2, phase: 'init' });

        // ═══ PHASE 1: Extract + Pre-Filter ═══
        let allFilteredText = '';
        let allKeywordFlags: KeywordFlag[] = [];
        let totalPages = 0;
        let allTotalParagraphs = 0;
        let allKeptParagraphs = 0;
        const allDetectedKeywords = new Set<string>();
        const allDetectedHeaders = new Set<string>();

        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi];
          emit({ type: 'progress', message: `Phase 1: Extracting "${file.name}"...`, percent: 5 + (fi / files.length) * 15, phase: 'filter' });

          if (file.type === 'application/pdf') {
            const { text, numPages } = await extractPDFData(file.data);
            file.data = '';
            totalPages += numPages;

            emit({ type: 'progress', message: `Phase 1: Pre-filtering "${file.name}" (${numPages} pages)...`, percent: 10 + (fi / files.length) * 15, phase: 'filter' });

            const { filtered, totalParagraphs, keptParagraphs, keywordFlags, detectedKeywords, detectedHeaders } = smartPreFilter(text);
            allFilteredText += (allFilteredText ? '\n\n---\n\n' : '') + filtered;
            allKeywordFlags.push(...keywordFlags);
            allTotalParagraphs += totalParagraphs;
            allKeptParagraphs += keptParagraphs;
            detectedKeywords.forEach(k => allDetectedKeywords.add(k));
            detectedHeaders.forEach(h => allDetectedHeaders.add(h));

            const reductionPct = totalParagraphs > 0 ? Math.round((1 - keptParagraphs / totalParagraphs) * 100) : 0;
            emit({ type: 'file_ready', fileName: file.name, numPages, filteredChunks: keptParagraphs, totalParagraphs, keptParagraphs, reductionPct });

            for (const flag of keywordFlags) {
              emit({ type: 'keyword_flag', flag: { condition: flag.condition, confidence: flag.confidence, excerpt: flag.excerpt.substring(0, 120) } });
            }
          } else {
            file.data = '';
          }
        }

        const filteredTokenEstimate = Math.round(allFilteredText.length / 4);
        const overallReductionPct = allTotalParagraphs > 0 ? Math.round((1 - allKeptParagraphs / allTotalParagraphs) * 100) : 0;

        const synopsis: ScanSynopsis = {
          totalPages,
          totalParagraphs: allTotalParagraphs,
          keptParagraphs: allKeptParagraphs,
          reductionPct: overallReductionPct,
          keywordsDetected: Array.from(allDetectedKeywords),
          sectionHeadersFound: Array.from(allDetectedHeaders),
        };

        emit({
          type: 'progress',
          message: `Phase 1 complete — ${allKeptParagraphs} kept (${overallReductionPct}% noise removed), ${allDetectedKeywords.size} keywords, ~${filteredTokenEstimate} tokens`,
          percent: 25,
          phase: 'filter_done',
        });

        emit({
          type: 'scan_cache',
          filteredText: allFilteredText,
          keywordFlags: allKeywordFlags,
          synopsis,
          fileNames: files.map(f => f.name).join(', '),
        });

        // ═══ PHASE 2: Streaming Grok-4 Deep Synthesis ═══
        let finalFlags: FlaggedItem[] = [];
        const fileNames = files.map(f => f.name).join(', ');
        let synthesisTimedOut = false;
        let synthesisOutput = '';

        if (allFilteredText.length > 50) {
          emit({ type: 'progress', message: `Phase 2: ${MODEL_SYNTHESIS} analyzing ${allKeptParagraphs} paragraphs (~${filteredTokenEstimate} tokens)...`, percent: 35, phase: 'synthesis' });

          try {
            synthesisOutput = await synthesizeWithGrok4(allFilteredText, fileNames, (tc, mt) => {
              const pct = 35 + Math.round((tc / mt) * 50);
              emit({ type: 'progress', message: `Phase 2: Deep Synthesis — ${tc} tokens received...`, percent: Math.min(pct, 88), phase: 'synthesis' });
            });
          } catch (err1) {
            if ((err1 as Error).name !== 'GrokTimeoutError') throw err1;

            console.warn('[MedicalDetective] Attempt 1 timed out — retrying at 60% cap');
            emit({ type: 'progress', message: 'Phase 2: Retrying with reduced scope...', percent: 50, phase: 'synthesis' });
            const reducedText = allFilteredText.substring(0, Math.floor(allFilteredText.length * RETRY_CAP_RATIO));

            try {
              synthesisOutput = await synthesizeWithGrok4(reducedText, fileNames, (tc, mt) => {
                const pct = 55 + Math.round((tc / mt) * 35);
                emit({ type: 'progress', message: `Phase 2: Retry — ${tc} tokens...`, percent: Math.min(pct, 88), phase: 'synthesis' });
              });
            } catch (err2) {
              if ((err2 as Error).name === 'GrokTimeoutError') {
                synthesisTimedOut = true;
              } else { throw err2; }
            }
          }
        }

        if (synthesisTimedOut) {
          const interim = addPactActCrossRef(deduplicateFlags(keywordFlagsToFlaggedItems(allKeywordFlags)));
          emit({ type: 'complete', report: buildReport(interim, files.length, Date.now() - startTime, 'keyword pre-filter (Deep Analysis Paused)', synopsis, true, `Deep scan timed out — here's everything we caught so far. Click "Retry Deep Analysis" for full AI synthesis with excerpts and claim mapping.`), percent: 100 });
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        if (synthesisOutput) {
          emit({ type: 'progress', message: 'Phase 2: Processing results...', percent: 90, phase: 'synthesis' });
          finalFlags = parseSynthesisOutput(synthesisOutput);
        }

        emit({ type: 'progress', message: `Phase 2 complete — ${finalFlags.length} verified flag(s)`, percent: 95, phase: 'synthesis_done' });

        const report = buildReport(
          addPactActCrossRef(deduplicateFlags(finalFlags)),
          files.length,
          Date.now() - startTime,
          MODEL_SYNTHESIS,
          synopsis,
        );
        emit({ type: 'complete', report, percent: 100 });

      } catch (err) {
        console.error('[MedicalDetective] Stream error:', err);
        emit({ type: 'error', message: (err as Error).message || 'Processing failed.' });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
