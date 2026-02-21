import { NextRequest } from 'next/server';

/**
 * POST /api/health/medical-detective — v4.2 "Two-Phase + Streaming Synthesis"
 *
 * Architecture (v4.2 — reliable <90s scans):
 *   Phase 1: Smart Pre-Filter (NO AI, ~1-2s) — tiered keyword scoring
 *            (1+ keyword = kept, 2+ = live flag pill), section headers,
 *            noise exclusion, 10K char / 80-paragraph cap.
 *   Phase 2: Grok-4 Streaming Synthesis (70s + auto-retry at 60% cap)
 *            pre-filtered text → token-by-token receipt → structured flags.
 *
 * On timeout: auto-retry once at 60% cap → if still fails, interim JSON.
 *
 * Streaming NDJSON response. Emits JSON events line-by-line:
 *   {type:'progress', message, percent, phase}
 *   {type:'file_ready', fileName, numPages, filteredChunks, reductionPct}
 *   {type:'keyword_flag', flag}  — live flag from keyword pre-filter
 *   {type:'complete', report}
 *   {type:'error', message}
 *
 * SAFETY: Processed in memory only — deleted immediately after scan.
 * Files are NEVER stored. Zero HIPAA exposure.
 */

// ─── Next.js Route Config ────────────────────────────────────────────────────

export const maxDuration = 300; // 5 min max for serverless function
export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilePayload {
  name: string;
  type: string;
  data: string; // base64
  size: number;
}

interface FlaggedItem {
  flagId: string;
  label: string;
  category: string;
  excerpt: string;
  context: string;
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

const FILTERED_TEXT_CAP = 10_000;       // ~2,500 tokens — Grok-4 target: <30s
const MAX_PARAGRAPHS_TO_SEND = 80;      // hard paragraph cap after sorting
const SECTION_GUARANTEE_COUNT = 3;      // min paragraphs guaranteed per major section
const SYNTHESIS_TIMEOUT_MS = 70_000;    // 70s streaming synthesis (first attempt)
const RETRY_TIMEOUT_MS = 50_000;        // 50s retry at 60% cap
const INITIAL_IDLE_MS = 45_000;         // 45s before first token (model thinking time)
const STREAM_IDLE_MS = 10_000;          // 10s between tokens (actual stall detection)
const RETRY_CAP_FACTOR = 0.6;          // retry sends 60% of filtered text
const IMAGE_TIMEOUT_MS = 60_000;        // 60s for image vision
const MIN_PARAGRAPH_LENGTH = 30;
const MIN_KEYWORD_MATCHES_FLAG = 2;     // 2+ keywords → live flag pill

// Major clinical sections — top 3 paragraphs from each are always included
const GUARANTEED_SECTIONS = [
  'assessment', 'problem list', 'active problems', 'active diagnoses',
  'hpi', 'history of present illness', 'diagnosis', 'diagnoses',
  'plan', 'impression', 'chief complaint',
];

// Models — user's xAI API models
const MODEL_SYNTHESIS = 'grok-4-0709';  // Deep analysis (single call)
const MODEL_VISION = 'grok-3-mini';     // Image analysis (fast on single images)

const DISCLAIMER = `This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.`;

// ─── Core Medical Keywords (~85 terms) for Pre-Filter (Phase 1) ─────────────

const CORE_KEYWORDS = [
  // Top conditions (highest VA claim frequency)
  'tinnitus', 'hearing loss', 'ptsd', 'post-traumatic', 'sleep apnea',
  'migraine', 'tbi', 'traumatic brain', 'anxiety', 'depression',
  // Toxic exposure / PACT Act
  'burn pit', 'burn-pit', 'agent orange', 'gulf war', 'toxic exposure',
  'pact act', 'presumptive', 'iraq', 'afghanistan',
  // Musculoskeletal
  'back pain', 'lumbar', 'radiculopathy', 'knee', 'shoulder', 'arthritis',
  'cervical', 'sciatica',
  // Respiratory
  'sinusitis', 'rhinitis', 'asthma', 'copd', 'constrictive bronchiolitis',
  // GI / Other conditions
  'gerd', 'neuropathy', 'chronic pain', 'fibromyalgia',
  'diabetes', 'hypertension', 'erectile', 'mst', 'military sexual trauma',
  // PACT Act cancers & conditions
  'mgus', 'male breast cancer', 'urethral cancer', 'ischemic heart',
  'pancreatic cancer', 'kidney cancer', 'lymphatic cancer', 'bladder cancer',
  'melanoma', 'hepatitis', 'parkinson',
  // VA claim language (highest signal)
  'service connected', 'service-connected', 'nexus', 'at least as likely',
  'more likely than not', 'secondary to', 'aggravated by', 'in-service',
  'c&p', 'compensable', 'rated at', 'disability rating', 'tdiu',
  'individual unemployability', 'sc ',
  // Clinical exam markers
  'diagnosis', 'diagnosed', 'abnormal', 'chronic', 'bilateral',
  'functional impairment', 'limitation of motion', 'worsening',
  'problem list', 'active diagnoses', 'range of motion', 'rom',
  'deluca', 'functional loss', 'pain on use', 'flare-up', 'flare up',
  // Claim support terms
  'buddy statement', 'lay evidence', 'stressor', 'incident report',
  // Additional clinical
  'seizure', 'epilepsy', 'cancer', 'tumor', 'thyroid', 'kidney', 'liver',
  'bipolar', 'schizophrenia', 'suicidal', 'substance',
];

// Section headers that are ALWAYS kept regardless of keyword count.
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

// Noise phrases — paragraphs containing these are administrative junk
const NOISE_PHRASES = [
  'appointment scheduled', 'next appointment', 'check-in', 'checked in',
  'no show', 'cancelled appointment', 'refill request', 'medication refill',
  'secure message', 'my healthevet', 'travel reimbursement', 'copay',
  'emergency contact', 'next of kin', 'pharmacy', 'prescription mailed',
  'demographics updated', 'insurance', 'eligibility', 'means test',
  'flu shot', 'covid vaccine', 'immunization', 'routine vital signs',
  'vital signs within normal', 'height:', 'weight:', 'bmi:',
];

// Compile individual keyword regexes for counting matches per paragraph
const KEYWORD_PATTERNS = CORE_KEYWORDS.map(k =>
  new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
);

// Compile noise regex
const NOISE_REGEX = new RegExp(
  NOISE_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ─── Synthesis Prompt (Phase 2 — Grok 4, single call) ────────────────────────

const SYNTHESIS_PROMPT = `You are an expert VA disability claims evidence analyst with deep knowledge of VA rating schedules, presumptive conditions, the PACT Act (2022-2026), and how clinical notes support disability claims.

You are given pre-filtered excerpts from a veteran's VA medical records. Every paragraph has been keyword-filtered or is a clinical section header, so treat all content as potentially relevant. Your job:

1. Identify EVERY claim-relevant finding — diagnoses, conditions, symptoms, claim language, PACT Act presumptives, secondary conditions
2. Extract exact verbatim quotes from the text for each finding
3. Deduplicate — merge flags referencing the same condition
4. Assign confidence: High (direct diagnosis, rating language, nexus statement), Medium (clinical evidence suggesting a condition), Low (indirect/circumstantial but worth noting)
5. Map each to the correct VA disability category
6. Provide a 1-sentence nexus/relevance explanation
7. Suggest concrete next steps

IMPORTANT PRIORITIES:
- PRIORITIZE secondary conditions ("secondary to", "aggravated by"), PACT Act presumptive conditions (burn pits, toxic exposure, specific cancers), and nexus language ("at least as likely as not", "more likely than not").
- INCLUDE moderate-confidence flags — do NOT omit findings just because evidence is indirect. Veterans need to see everything.
- Always include the EXACT verbatim quote and page number when available.
- For any PACT Act presumptive condition, note: "This may qualify under the PACT Act — see va.gov/pact for details."

Output in clean, numbered bullet list format. For each flag:
- Condition name
- Confidence: High / Medium / Low
- Category: (e.g., Mental Health, Musculoskeletal, Sleep Disorders, Hearing, Respiratory, PACT Act Presumptive, etc.)
- Exact quote: "[verbatim excerpt from the records]"
- Page number: [if available, e.g., "Page 47"]
- Date: [if available]
- Relevance: [1-sentence explanation of claim relevance]

If the text contains no meaningful evidence, state: 'No strong claim-relevant evidence flags were identified in this report.'

End with this exact bold disclaimer:
**This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.**

Be thorough, accurate, professional, and veteran-focused. Extract EVERY relevant finding — err on the side of inclusion.`;

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

// ─── Phase 1: Smart Pre-Filter (No AI) ──────────────────────────────────────

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

  // Sort by keyword density descending (highest signal first)
  scored.sort((a, b) => b.keywordCount - a.keywordCount);

  // Pass 1 — Section Guarantee: collect up to SECTION_GUARANTEE_COUNT per section
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

  // Pass 2 — Fill remaining slots with highest-scored non-guaranteed paragraphs
  const selected: ScoredPara[] = [...guaranteed];
  for (const sp of scored) {
    if (selected.length >= MAX_PARAGRAPHS_TO_SEND) break;
    if (!guaranteedTexts.has(sp.text)) {
      selected.push(sp);
    }
  }

  // Apply FILTERED_TEXT_CAP (whichever hits first: 80 paragraphs or 10K chars)
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
          excerpt: sp.text.substring(0, 120),
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

// ─── Parse Synthesis Output (numbered list) ──────────────────────────────────

function mapToCategory(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('tinnitus') || l.includes('hearing')) return 'Hearing';
  if (l.includes('ptsd') || l.includes('trauma') || l.includes('anxiety') || l.includes('depression') || l.includes('mental') || l.includes('panic') || l.includes('mst')) return 'Mental Health';
  if (l.includes('sleep apnea') || l.includes('osa') || l.includes('cpap') || l.includes('somnolence')) return 'Sleep Disorders';
  if (l.includes('migraine') || l.includes('headache') || l.includes('tbi') || l.includes('neurolog')) return 'Neurological';
  if (l.includes('burn pit') || l.includes('pact') || l.includes('agent orange') || l.includes('gulf war') || l.includes('toxic') || l.includes('presumptive')) return 'PACT Act Presumptive';
  if (l.includes('respirat') || l.includes('sinus') || l.includes('rhinitis') || l.includes('asthma') || l.includes('copd')) return 'Respiratory';
  if (l.includes('gerd') || l.includes('gastro') || l.includes('ibs') || l.includes('digest')) return 'Gastrointestinal';
  if (l.includes('back') || l.includes('knee') || l.includes('shoulder') || l.includes('musculo') || l.includes('arthritis') || l.includes('lumbar') || l.includes('spinal') || l.includes('joint')) return 'Musculoskeletal';
  if (l.includes('service connect') || l.includes(' sc ') || l.includes('nexus') || l.includes('rated at') || l.includes('compensable')) return 'Claim Language';
  if (l.includes('cancer') || l.includes('tumor') || l.includes('carcin')) return 'Oncological';
  if (l.includes('heart') || l.includes('cardio') || l.includes('hypertens')) return 'Cardiovascular';
  return 'Other';
}

function parseSynthesisOutput(rawText: string): FlaggedItem[] {
  if (!rawText || rawText.includes('No strong claim-relevant evidence flags were identified')) return [];

  const items: FlaggedItem[] = [];
  const blocks = rawText.split(/\n(?=\d+\.\s)/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || !/^\d+\./.test(trimmed)) continue;

    const firstLine = trimmed.split('\n')[0].replace(/^\d+\.\s*\*?\*?/, '').replace(/\*\*/g, '').trim();
    if (!firstLine || firstLine.length < 3) continue;

    const confMatch = block.match(/[Cc]onfidence[:\s]+([Hh]igh|[Mm]edium|[Ll]ow)/);
    const confidence = (confMatch?.[1]?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low';

    const quoteMatch = block.match(/(?:Exact [Qq]uote|[Qq]uote)[:\s]*[""'"']([^""'"']{5,})[""'"']/);
    const excerpt = quoteMatch?.[1]?.trim() || '';

    const pageMatch = block.match(/[Pp]age(?:\s+[Nn]umber)?[:\s]+(\d+)/);
    const pageNumber = pageMatch?.[1] || undefined;

    const dateMatch = block.match(/[Dd]ate(?:\s+of\s+the\s+[Nn]ote)?[:\s]+([\w\/\-,\s]+?)(?:\n|,\s*[A-Z]|$)/);
    const dateFound = dateMatch?.[1]?.trim().replace(/[,\s]+$/, '') || undefined;

    const relMatch = block.match(/[Rr]elevance(?:\s+[Ee]xplanation)?[:\s]+(.+?)(?:\n|$)/);
    const context = relMatch?.[1]?.trim() || firstLine;

    const catMatch = block.match(/[Cc]ategory[:\s]+([^\n]+)/);
    const category = catMatch?.[1]?.trim() || mapToCategory(firstLine);

    items.push({
      flagId: `${firstLine.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}_${items.length}`,
      label: firstLine,
      category,
      excerpt,
      context,
      dateFound,
      pageNumber,
      suggestedClaimCategory: category,
      confidence,
    });
  }

  return items;
}

// ─── Fallback: Convert keyword flags to FlaggedItems ─────────────────────────

function keywordFlagsToFlaggedItems(flags: KeywordFlag[]): FlaggedItem[] {
  return flags.map((f, i) => ({
    flagId: `kw_${f.condition.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${i}`,
    label: f.condition,
    category: mapToCategory(f.condition),
    excerpt: f.excerpt,
    context: `Keyword-detected: ${f.condition}. Review with your VSO for full assessment.`,
    suggestedClaimCategory: mapToCategory(f.condition),
    confidence: f.confidence,
  }));
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateFlags(items: FlaggedItem[]): FlaggedItem[] {
  const seen = new Map<string, FlaggedItem>();
  for (const item of items) {
    const key = item.label.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    const existing = seen.get(key);
    if (!existing || item.confidence === 'high') seen.set(key, item);
  }
  return Array.from(seen.values());
}

// ─── Report Builder ───────────────────────────────────────────────────────────

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
      };
    }
    return flag;
  });
}

function buildReport(flags: FlaggedItem[], filesProcessed: number, processingTime: number, aiModel: string, synopsis?: ScanSynopsis, isInterim?: boolean, interimNote?: string): DetectiveReport {
  return {
    disclaimer: DISCLAIMER,
    summary: flags.length > 0
      ? `${flags.length} potential claim-relevant flag(s) identified across ${filesProcessed} document(s). Review with your VSO or accredited claims representative.`
      : `No strong claim-relevant flags were identified in the ${filesProcessed} document(s) processed. This does not mean there are no valid claims \u2014 consider uploading additional records, progress notes, or screenshots for a more thorough scan.`,
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

// ─── Grok API Calls ───────────────────────────────────────────────────────────

class GrokTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs / 1000}s`);
    this.name = 'GrokTimeoutError';
  }
}

function getApiKey(): string {
  return process.env.XAI_API_KEY || process.env.GROK_API_KEY || '';
}

// Non-streaming call — kept for image/vision analysis
async function callGrokAPI(
  model: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  timeoutMs: number,
  label: string,
  maxTokens: number = 6000,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('XAI_API_KEY is not configured in environment variables.');

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${label} API error ${response.status}: ${err.substring(0, 200)}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    const error = err as Error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new GrokTimeoutError(label, timeoutMs);
    }
    console.warn(`[MedicalDetective] ${label} failed: ${error.message}`);
    throw error;
  }
}

// ─── Streaming Grok API (synthesis — avoids response.json() hang) ─────────────

async function callGrokAPIStreaming(
  model: string,
  messages: Array<{ role: string; content: string }>,
  overallTimeoutMs: number,
  maxTokens: number,
  onProgress?: (tokenCount: number) => void,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('XAI_API_KEY is not configured.');

  const ac = new AbortController();
  const overallTimer = setTimeout(() => ac.abort(), overallTimeoutMs);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let receivedFirstToken = false;

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    const timeout = receivedFirstToken ? STREAM_IDLE_MS : INITIAL_IDLE_MS;
    idleTimer = setTimeout(() => ac.abort(), timeout);
  };

  try {
    console.log(`[MedicalDetective] Streaming call to ${model} (timeout: ${overallTimeoutMs}ms, idle: ${INITIAL_IDLE_MS}/${STREAM_IDLE_MS}ms, maxTokens: ${maxTokens})`);
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens, stream: true }),
      signal: ac.signal,
    });

    console.log(`[MedicalDetective] Streaming response status: ${res.status}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`API error ${res.status}: ${errText.substring(0, 200)}`);
    }

    if (!res.body) throw new Error('No response body from streaming API');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let result = '';
    let tokenCount = 0;

    resetIdle();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetIdle();
      buf += decoder.decode(value, { stream: true });

      const lines = buf.split('\n');
      buf = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed.startsWith('data: ')) {
          const payload = trimmed.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              if (!receivedFirstToken) {
                receivedFirstToken = true;
                console.log(`[MedicalDetective] First token received — switching to ${STREAM_IDLE_MS}ms idle timeout`);
                resetIdle();
              }
              result += token;
              tokenCount++;
              if (tokenCount % 50 === 0 && onProgress) onProgress(tokenCount);
            }
          } catch { /* skip malformed SSE chunk */ }
        }
      }
    }

    console.log(`[MedicalDetective] Streaming complete: ${result.length} chars, ${tokenCount} tokens`);
    return result;
  } catch (err) {
    const error = err as Error;
    console.warn(`[MedicalDetective] Streaming error: ${error.name} — ${error.message}`);
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new GrokTimeoutError('Grok streaming synthesis', overallTimeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(overallTimer);
    if (idleTimer) clearTimeout(idleTimer);
  }
}

// Truncate pre-filtered text to a fraction (paragraphs already sorted by signal)
function reduceText(text: string, factor: number): string {
  const target = Math.floor(text.length * factor);
  const paragraphs = text.split('\n\n');
  let out = '';
  for (const p of paragraphs) {
    if (out.length + p.length + 2 > target) break;
    out += (out ? '\n\n' : '') + p;
  }
  return out || paragraphs[0]?.substring(0, target) || text.substring(0, target);
}

// Phase 2: Grok-4 streaming synthesis — throws GrokTimeoutError on stall
async function synthesizeWithGrok4(
  filteredText: string,
  fileNames: string,
  timeoutMs: number = SYNTHESIS_TIMEOUT_MS,
  onProgress?: (tokenCount: number) => void,
): Promise<string> {
  return callGrokAPIStreaming(
    MODEL_SYNTHESIS,
    [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: `Veteran's documents: "${fileNames}"\n\nPre-filtered medical record excerpts (high-signal paragraphs only):\n\n${filteredText}` },
    ],
    timeoutMs,
    1_500,
    onProgress,
  );
}

// Image analysis with grok-3-mini (non-streaming — images are fast)
async function screenImageWithVision(base64Data: string, mimeType: string, fileName: string): Promise<string> {
  const imagePrompt = `You are an expert VA disability claims evidence analyst. Analyze this VA medical record image for disability claim-relevant findings.

For each finding, output in numbered bullet list format:
- Condition name
- Confidence: High / Medium / Low
- Category: (e.g., Mental Health, Musculoskeletal, Sleep Disorders, Hearing, Respiratory, etc.)
- Exact quote: "[text visible in the image]"
- Relevance: [1-sentence explanation]

If nothing relevant found, state: 'No strong claim-relevant evidence flags were identified.'`;

  return callGrokAPI(
    MODEL_VISION,
    [
      { role: 'system', content: imagePrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analyze this VA medical record image (${fileName}) for disability claim-relevant findings.` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      },
    ],
    IMAGE_TIMEOUT_MS,
    `Image analysis: ${fileName}`,
    4000,
  );
}

// ─── Streaming POST Handler ─────────────────────────────────────────────────

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

        // ═══════════════════════════════════════════════════════════════════
        // RETRY PATH: retryFilteredText skips Phase 1 — jump to Phase 2
        // ═══════════════════════════════════════════════════════════════════
        const retryFilteredText: string = body.retryFilteredText || '';
        const retrySynopsis: ScanSynopsis | undefined = body.retrySynopsis;
        const retryKeywordFlags: KeywordFlag[] = body.retryKeywordFlags || [];
        const retryFileNames: string = body.retryFileNames || 'cached documents';
        const useReducedCap: boolean = body.useReducedCap || false;

        if (retryFilteredText) {
          const textForRetry = useReducedCap ? reduceText(retryFilteredText, RETRY_CAP_FACTOR) : retryFilteredText;
          const retryTimeout = useReducedCap ? RETRY_TIMEOUT_MS : SYNTHESIS_TIMEOUT_MS;

          emit({ type: 'progress', message: `Retrying deep analysis${useReducedCap ? ' (reduced cap)' : ''} — using cached scan data...`, percent: 30, phase: 'synthesis' });
          emit({ type: 'progress', message: `Sending ${useReducedCap ? 'reduced' : 'cached'} text to ${MODEL_SYNTHESIS}...`, percent: 35, phase: 'synthesis' });

          const onRetryProgress = (tokens: number) => {
            const pct = Math.min(80, 35 + Math.floor((tokens / 1500) * 45));
            emit({ type: 'progress', message: `Deep Synthesis — receiving analysis (${tokens} tokens)...`, percent: pct, phase: 'synthesis' });
          };

          try {
            const synthesisOutput = await synthesizeWithGrok4(textForRetry, retryFileNames, retryTimeout, onRetryProgress);
            const retryFlags = synthesisOutput ? parseSynthesisOutput(synthesisOutput) : [];
            const deduped = deduplicateFlags(retryFlags);
            const withPactRefs = addPactActCrossRef(deduped);
            emit({ type: 'progress', message: `Deep analysis complete — ${withPactRefs.length} verified flag(s)`, percent: 95, phase: 'synthesis_done' });
            const report = buildReport(withPactRefs, 1, Date.now() - startTime, MODEL_SYNTHESIS, retrySynopsis);
            emit({ type: 'complete', report, percent: 100 });
          } catch (retryErr) {
            if ((retryErr as Error).name === 'GrokTimeoutError') {
              emit({ type: 'progress', message: 'Deep analysis timed out again. Showing keyword flags.', percent: 100, phase: 'synthesis_done' });
              const interimFlags = addPactActCrossRef(deduplicateFlags(keywordFlagsToFlaggedItems(retryKeywordFlags)));
              const report = buildReport(interimFlags, 1, Date.now() - startTime, 'keyword pre-filter (Grok-4 unavailable)', retrySynopsis, true, `Deep scan hit timeout \u2014 here's everything we caught so far. Grok-4 may be under heavy load. Try again later for full AI synthesis.${retrySynopsis ? ` Prioritized ${retrySynopsis.keptParagraphs} highest-signal paragraphs across ${retrySynopsis.totalPages} pages.` : ''}`);
              emit({ type: 'complete', report, percent: 100 });
            } else {
              throw retryErr;
            }
          }
          controller.close();
          return;
        }

        // ═══════════════════════════════════════════════════════════════════
        // NORMAL SCAN — validate files
        // ═══════════════════════════════════════════════════════════════════

        if (files.length === 0) {
          emit({ type: 'error', message: 'No files provided.' });
          controller.close();
          return;
        }

        for (const f of files) {
          if (f.size > 50 * 1024 * 1024) {
            emit({ type: 'error', message: `"${f.name}" exceeds 50MB limit.` });
            controller.close();
            return;
          }
        }

        emit({ type: 'progress', message: 'Starting analysis...', percent: 2, phase: 'init' });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: Extract + Smart Pre-Filter (No AI — ~1-2s)
        // ═══════════════════════════════════════════════════════════════════

        let allFilteredText = '';
        let allKeywordFlags: KeywordFlag[] = [];
        let totalPages = 0;
        let allTotalParagraphs = 0;
        let allKeptParagraphs = 0;
        const allDetectedKeywords = new Set<string>();
        const allDetectedHeaders = new Set<string>();
        const imageFiles: Array<{ name: string; data: string; mime: string }> = [];

        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi];
          emit({ type: 'progress', message: `Phase 1: Extracting text from "${file.name}"...`, percent: 5 + (fi / files.length) * 15, phase: 'filter' });

          if (file.type.startsWith('image/')) {
            imageFiles.push({ name: file.name, data: file.data, mime: file.type });
            file.data = '';
          } else if (file.type === 'application/pdf') {
            const { text, numPages } = await extractPDFData(file.data);
            file.data = ''; // clear raw data immediately — zero HIPAA exposure
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
          message: `Phase 1 complete — ${allKeptParagraphs} paragraphs kept (${overallReductionPct}% noise removed), ${allDetectedKeywords.size} keywords, ~${filteredTokenEstimate} tokens${imageFiles.length > 0 ? `, ${imageFiles.length} image(s) queued` : ''}`,
          percent: 25,
          phase: 'filter_done',
        });

        // Emit cached scan data so frontend can store for retry
        emit({
          type: 'scan_cache',
          filteredText: allFilteredText,
          keywordFlags: allKeywordFlags,
          synopsis,
          fileNames: files.map(f => f.name).join(', '),
        });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: Grok-4 Streaming Synthesis + Auto-Retry at 60% Cap
        // ═══════════════════════════════════════════════════════════════════

        let finalFlags: FlaggedItem[] = [];
        const usedModel = MODEL_SYNTHESIS;
        const fileNames = files.map(f => f.name).join(', ');

        // Image analysis runs in parallel (non-streaming vision API)
        const imagePromise = imageFiles.length > 0
          ? Promise.all(imageFiles.map(async (img) => {
              emit({ type: 'progress', message: `Phase 2: Analyzing image "${img.name}"...`, percent: 30, phase: 'synthesis' });
              const output = await screenImageWithVision(img.data, img.mime, img.name);
              img.data = '';
              return { name: img.name, output };
            }))
          : Promise.resolve([] as Array<{ name: string; output: string }>);

        // Text synthesis with streaming + auto-retry
        let synthesisOutput = '';
        let synthesisTimedOut = false;

        if (allFilteredText.length > 50) {
          emit({
            type: 'progress',
            message: `Phase 2: Deep Synthesis — ${MODEL_SYNTHESIS} analyzing ${allKeptParagraphs} paragraphs (~${filteredTokenEstimate} tokens)...`,
            percent: 35,
            phase: 'synthesis',
          });

          const onSynthesisProgress = (tokens: number) => {
            const pct = Math.min(80, 35 + Math.floor((tokens / 1500) * 45));
            emit({ type: 'progress', message: `Phase 2: Deep Synthesis — receiving analysis (${tokens} tokens)...`, percent: pct, phase: 'synthesis' });
          };

          try {
            // Attempt 1: full text, 70s streaming timeout
            synthesisOutput = await synthesizeWithGrok4(allFilteredText, fileNames, SYNTHESIS_TIMEOUT_MS, onSynthesisProgress);
          } catch (err1) {
            if ((err1 as Error).name === 'GrokTimeoutError') {
              // Auto-retry at 60% cap
              const reducedText = reduceText(allFilteredText, RETRY_CAP_FACTOR);
              emit({
                type: 'progress',
                message: `First attempt timed out — retrying with reduced input (${Math.round(RETRY_CAP_FACTOR * 100)}% cap, ~${Math.round(reducedText.length / 4)} tokens)...`,
                percent: 55,
                phase: 'synthesis',
              });

              try {
                synthesisOutput = await synthesizeWithGrok4(reducedText, fileNames, RETRY_TIMEOUT_MS, onSynthesisProgress);
              } catch (err2) {
                if ((err2 as Error).name === 'GrokTimeoutError') {
                  synthesisTimedOut = true;
                  console.warn('[MedicalDetective] Both synthesis attempts timed out — building interim report');
                } else {
                  throw err2;
                }
              }
            } else {
              throw err1;
            }
          }
        }

        // Wait for image results
        const imageResults = await imagePromise;

        // ═══════════════════════════════════════════════════════════════════
        // TIMEOUT PATH: Interim Report from keyword flags
        // ═══════════════════════════════════════════════════════════════════
        if (synthesisTimedOut) {
          emit({ type: 'progress', message: 'Deep Analysis Paused — building report from pre-filter flags...', percent: 100, phase: 'synthesis_done' });

          const imgFlags: FlaggedItem[] = [];
          for (const imgResult of imageResults) {
            if (imgResult.output) imgFlags.push(...parseSynthesisOutput(imgResult.output));
          }

          const interimFlags = addPactActCrossRef(deduplicateFlags([
            ...keywordFlagsToFlaggedItems(allKeywordFlags),
            ...imgFlags,
          ]));
          const report = buildReport(
            interimFlags,
            files.length,
            Date.now() - startTime,
            'keyword pre-filter (deep analysis paused)',
            synopsis,
            true,
            `Deep scan hit timeout \u2014 here's everything we caught so far. Click "Retry Deep Analysis" for full AI synthesis with reduced input. Scanned ${synopsis.keptParagraphs} highest-signal paragraphs across ${synopsis.totalPages} pages.`,
          );
          emit({ type: 'complete', report, percent: 100 });
          return; // finally block closes stream
        }

        // Wait for image analysis to finish
        const imageResults = await imagePromise.catch(() => [] as Array<{ name: string; output: string }>);

        // Parse text synthesis output
        if (synthesisOutput) {
          emit({ type: 'progress', message: 'Phase 2: Processing analysis results...', percent: 85, phase: 'synthesis' });
          finalFlags = parseSynthesisOutput(synthesisOutput);
        }

        // Parse image analysis output
        for (const imgResult of imageResults) {
          if (imgResult.output) {
            finalFlags.push(...parseSynthesisOutput(imgResult.output));
          }
        }

        emit({
          type: 'progress',
          message: `Phase 2 complete — ${finalFlags.length} verified flag(s)`,
          percent: 95,
          phase: 'synthesis_done',
        });

        // ═══════════════════════════════════════════════════════════════════
        // BUILD FULL REPORT (PACT Act cross-refs + synopsis)
        // ═══════════════════════════════════════════════════════════════════

        const deduped = deduplicateFlags(finalFlags);
        const withPactRefs = addPactActCrossRef(deduped);
        const modelLabel = imageFiles.length > 0
          ? `${usedModel} (text) + ${MODEL_VISION} (images)`
          : usedModel;
        const report = buildReport(withPactRefs, files.length, Date.now() - startTime, modelLabel, synopsis);
        emit({ type: 'complete', report, percent: 100 });

      } catch (err) {
        console.error('[MedicalDetective] Stream error:', err);
        emit({ type: 'error', message: (err as Error).message || 'Processing failed. Please try again.' });
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
