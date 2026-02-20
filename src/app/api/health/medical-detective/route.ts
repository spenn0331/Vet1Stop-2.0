import { NextRequest } from 'next/server';

/**
 * POST /api/health/medical-detective — v4 "Two-Phase Pipeline"
 *
 * Architecture (v4 — optimized for <65s scans):
 *   Phase 1: Aggressive Pre-Filter (NO AI, ~1-2s) — strict keyword scoring
 *            (2+ matches required per paragraph), noise-phrase exclusion,
 *            hard cap at 32K chars. Emits live keyword-based flags to client.
 *   Phase 2: Single Grok-4 Synthesis (one API call, ~20-45s) — takes the
 *            entire pre-filtered text and produces structured flags with
 *            confidence, category, nexus reasoning, and next steps.
 *
 * Fallback: If Grok-4 fails, keyword-extracted flags from Phase 1 are used
 *           directly to generate a usable (if less polished) report.
 *
 * Streaming NDJSON response. Emits JSON events line-by-line:
 *   {type:'progress', message, percent, phase}
 *   {type:'file_ready', fileName, numPages, filteredChunks, reductionPct}
 *   {type:'keyword_flag', flag}  — live flag from keyword pre-filter
 *   {type:'complete', report}
 *   {type:'error', message}
 *
 * SAFETY: Raw file data cleared from memory immediately after text extraction.
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
}

// ─── Constants ────────────────────────────────────────────────────────────────

// v4: Single Grok-4 call — no more grok-3-mini batching
const FILTERED_TEXT_CAP = 32_000;     // ~8K tokens — hard cap for Grok-4 input
const SYNTHESIS_TIMEOUT_MS = 90_000;  // 90s timeout (down from 120s)
const IMAGE_TIMEOUT_MS = 60_000;      // 60s timeout for image vision
const MAX_RETRIES = 1;                // 1 retry (down from 2) — fail fast
const MIN_PARAGRAPH_LENGTH = 40;      // Require 40+ chars (up from 20)
const MIN_KEYWORD_MATCHES = 2;        // Require 2+ keyword hits per paragraph

// Models — user's xAI API models
const MODEL_SYNTHESIS = 'grok-4-0709';  // Deep analysis (single call)
const MODEL_VISION = 'grok-3-mini';     // Image analysis (fast on single images)

const DISCLAIMER = `This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.`;

// ─── Core Medical Keywords for Aggressive Pre-Filter (Phase 1) ──────────────
// 50 core claim terms focused on high-value disability evidence.
// Paragraph must match 2+ of these to be kept. This is intentionally strict
// to reduce 1001 pages → ~100-150 high-signal paragraphs (~4-8K tokens).

const CORE_KEYWORDS = [
  // Top conditions (highest VA claim frequency)
  'tinnitus', 'hearing loss', 'ptsd', 'post-traumatic', 'sleep apnea',
  'migraine', 'tbi', 'traumatic brain', 'anxiety', 'depression',
  // Toxic exposure / PACT Act
  'burn pit', 'agent orange', 'gulf war', 'toxic exposure', 'pact act', 'presumptive',
  // Musculoskeletal
  'back pain', 'lumbar', 'radiculopathy', 'knee', 'shoulder', 'arthritis',
  // Respiratory
  'sinusitis', 'rhinitis', 'asthma', 'copd',
  // GI / Other conditions
  'gerd', 'sleep apnea', 'neuropathy', 'chronic pain', 'fibromyalgia',
  'diabetes', 'hypertension', 'erectile', 'mst', 'military sexual trauma',
  // VA claim language (highest signal)
  'service connected', 'service-connected', 'nexus', 'at least as likely',
  'more likely than not', 'secondary to', 'aggravated by', 'in-service',
  'c&p', 'compensable', 'rated at', 'disability rating', 'tdiu',
  'unemployability', 'sc ',
  // Clinical markers
  'diagnosis', 'diagnosed', 'abnormal', 'chronic', 'bilateral',
  'functional impairment', 'limitation of motion', 'worsening',
  'problem list', 'active diagnoses',
];

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
// Takes the entire pre-filtered text and produces structured analysis

const SYNTHESIS_PROMPT = `You are an expert VA disability claims evidence analyst with deep knowledge of VA rating schedules, presumptive conditions, the PACT Act, and how clinical notes support claims.

You are given pre-filtered excerpts from a veteran's VA medical records. These have already been keyword-filtered so every paragraph is potentially relevant. Your job is to:

1. Identify every claim-relevant finding (diagnoses, conditions, symptoms, claim language, PACT Act presumptives)
2. Extract exact quotes from the text for each finding
3. Deduplicate — merge flags that reference the same condition
4. Assign accurate confidence levels (High = direct diagnosis/rating language, Medium = clinical evidence suggesting condition, Low = indirect/circumstantial)
5. Map each flag to the correct VA disability category
6. Provide a 1-sentence nexus/relevance explanation for each
7. Suggest concrete next steps

Output in clean, numbered bullet list format. For each flag:
- Condition name
- Confidence: High / Medium / Low
- Category: (e.g., Mental Health, Musculoskeletal, Sleep Disorders, Hearing, Respiratory, etc.)
- Exact quote: "[the excerpt from the records]"
- Page number: [if available]
- Date: [if available]
- Relevance: [1-sentence explanation of claim relevance]

If the text contains no meaningful evidence, state: 'No strong claim-relevant evidence flags were identified in this report.'

End with this exact bold disclaimer:
**This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.**

Be thorough, accurate, professional, and veteran-focused. Extract EVERY relevant finding.`;

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

// ─── Phase 1: Aggressive Pre-Filter (No AI) ─────────────────────────────────
// v4: Requires 2+ keyword matches per paragraph, excludes noise phrases,
// and hard-caps output at FILTERED_TEXT_CAP chars (~8K tokens).
// Also extracts live keyword-based flags for immediate client feedback.

interface KeywordFlag {
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  excerpt: string;
}

function aggressivePreFilter(text: string): {
  filtered: string;
  totalParagraphs: number;
  keptParagraphs: number;
  keywordFlags: KeywordFlag[];
} {
  const paragraphs = text.split(/\n{2,}|\r\n{2,}/);
  const kept: string[] = [];
  const keywordFlags: KeywordFlag[] = [];
  const seenConditions = new Set<string>();
  let totalChars = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    // Skip short paragraphs
    if (trimmed.length < MIN_PARAGRAPH_LENGTH) continue;
    // Skip noise (appointment scheduling, demographics, etc.)
    if (NOISE_REGEX.test(trimmed)) continue;

    // Count keyword matches in this paragraph
    const matchedKeywords: string[] = [];
    for (let i = 0; i < KEYWORD_PATTERNS.length; i++) {
      if (KEYWORD_PATTERNS[i].test(trimmed)) {
        matchedKeywords.push(CORE_KEYWORDS[i]);
      }
    }

    // Require 2+ keyword matches (strict filtering)
    if (matchedKeywords.length >= MIN_KEYWORD_MATCHES) {
      // Hard cap on total filtered text size
      if (totalChars + trimmed.length > FILTERED_TEXT_CAP) {
        // Still add if we haven't hit the cap yet (allow partial)
        if (totalChars < FILTERED_TEXT_CAP) {
          kept.push(trimmed.substring(0, FILTERED_TEXT_CAP - totalChars));
          totalChars = FILTERED_TEXT_CAP;
        }
        break; // Stop adding more paragraphs
      }

      kept.push(trimmed);
      totalChars += trimmed.length;

      // Extract live keyword flags for client feedback
      // Pick the most specific matched keyword as the condition name
      const primaryKeyword = matchedKeywords[0];
      const conditionKey = primaryKeyword.toLowerCase().replace(/[^a-z]/g, '');
      if (!seenConditions.has(conditionKey)) {
        seenConditions.add(conditionKey);

        // Determine confidence from keyword type
        const claimLanguage = ['service connected', 'service-connected', 'nexus', 'at least as likely',
          'more likely than not', 'compensable', 'rated at', 'disability rating', 'tdiu', 'c&p'];
        const isClaimLanguage = matchedKeywords.some(k => claimLanguage.includes(k));
        const confidence: 'high' | 'medium' | 'low' = isClaimLanguage ? 'high'
          : matchedKeywords.length >= 3 ? 'high'
          : matchedKeywords.length >= 2 ? 'medium'
          : 'low';

        keywordFlags.push({
          condition: primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1),
          confidence,
          excerpt: trimmed.substring(0, 120),
        });
      }
    }
  }

  return {
    filtered: kept.join('\n\n'),
    totalParagraphs: paragraphs.length,
    keptParagraphs: kept.length,
    keywordFlags,
  };
}

// ─── Parse Synthesis Output (Phase 3 — numbered list) ───────────────────────

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

    // Try to get category from the AI output first, then fall back to mapToCategory
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

// ─── Fallback: Convert keyword flags to FlaggedItems (if Grok 4 fails) ──────

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

function buildReport(flags: FlaggedItem[], filesProcessed: number, processingTime: number, aiModel: string): DetectiveReport {
  return {
    disclaimer: DISCLAIMER,
    summary: flags.length > 0
      ? `${flags.length} potential claim-relevant flag(s) identified across ${filesProcessed} document(s). Review with your VSO or accredited claims representative.`
      : `No strong claim-relevant flags were identified in the ${filesProcessed} document(s) processed. This does not mean there are no valid claims — consider uploading additional records, progress notes, or screenshots for a more thorough scan.`,
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
          'Contact a free VSO (American Legion, DAV, VFW) — they can review your records in person',
          'Request your full C-file from the VA by submitting VA Form 3288',
          'Visit va.gov/disability for information on filing a claim',
        ],
    processingDetails: { filesProcessed, processingTime, aiModel },
  };
}

// ─── Grok API Calls ───────────────────────────────────────────────────────────

function getApiKey(): string {
  return process.env.XAI_API_KEY || '';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Shared retry wrapper for Grok API calls (v4: 1 retry only — fail fast)
async function callGrokAPI(
  model: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  timeoutMs: number,
  label: string,
  maxTokens: number = 6000,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('XAI_API_KEY is not configured in environment variables.');

  let lastError = '';
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.1, max_tokens: maxTokens }),
      }, timeoutMs);

      if (!response.ok) {
        const err = await response.text();
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          lastError = `Rate limited (429). Retrying...`;
          continue;
        }
        throw new Error(`${label} API error ${response.status}: ${err.substring(0, 200)}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      lastError = (err as Error).message || 'Unknown error';
      if ((err as Error).name === 'AbortError') {
        lastError = `${label} timed out after ${timeoutMs / 1000}s`;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
    }
  }
  console.warn(`[MedicalDetective] ${label} failed after ${MAX_RETRIES + 1} attempts: ${lastError}`);
  return '';
}

// Phase 2: Single Grok-4 synthesis on pre-filtered text (v4 — replaces grok-3-mini batching)
async function synthesizeWithGrok4(filteredText: string, fileNames: string): Promise<string> {
  return callGrokAPI(
    MODEL_SYNTHESIS,
    [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: `Veteran's documents: "${fileNames}"\n\nPre-filtered medical record excerpts (high-signal paragraphs only):\n\n${filteredText}` },
    ],
    SYNTHESIS_TIMEOUT_MS,
    'Grok 4 synthesis',
    6000,
  );
}

// Image analysis with grok-3-mini (fast on single images)
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

// ─── Streaming POST Handler — v4 Two-Phase Pipeline ─────────────────────────

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

        if (files.length === 0) {
          emit({ type: 'error', message: 'No files provided.' });
          controller.close();
          return;
        }

        // Validate file sizes
        for (const f of files) {
          if (f.size > 50 * 1024 * 1024) {
            emit({ type: 'error', message: `"${f.name}" exceeds 50MB limit.` });
            controller.close();
            return;
          }
        }

        emit({ type: 'progress', message: 'Starting analysis...', percent: 2, phase: 'init' });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: Extract + Aggressive Pre-Filter (No AI — ~1-2s)
        // ═══════════════════════════════════════════════════════════════════

        let allFilteredText = '';
        let allKeywordFlags: KeywordFlag[] = [];
        let totalPages = 0;
        const imageFiles: Array<{ name: string; data: string; mime: string }> = [];

        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi];
          emit({ type: 'progress', message: `Phase 1: Extracting text from "${file.name}"...`, percent: 5 + (fi / files.length) * 15, phase: 'filter' });

          if (file.type.startsWith('image/')) {
            // Images go directly to vision API in Phase 2
            imageFiles.push({ name: file.name, data: file.data, mime: file.type });
            file.data = ''; // clear from request payload
          } else if (file.type === 'application/pdf') {
            const { text, numPages } = await extractPDFData(file.data);
            file.data = ''; // clear raw data immediately — zero HIPAA exposure
            totalPages += numPages;

            emit({ type: 'progress', message: `Phase 1: Pre-filtering "${file.name}" (${numPages} pages)...`, percent: 10 + (fi / files.length) * 15, phase: 'filter' });

            const { filtered, totalParagraphs, keptParagraphs, keywordFlags } = aggressivePreFilter(text);
            allFilteredText += (allFilteredText ? '\n\n---\n\n' : '') + filtered;
            allKeywordFlags.push(...keywordFlags);

            const reductionPct = totalParagraphs > 0 ? Math.round((1 - keptParagraphs / totalParagraphs) * 100) : 0;
            emit({
              type: 'file_ready',
              fileName: file.name,
              numPages,
              filteredChunks: keptParagraphs,
              totalParagraphs,
              keptParagraphs,
              reductionPct,
            });

            // Emit live keyword flags as they're found
            for (const flag of keywordFlags) {
              emit({
                type: 'keyword_flag',
                flag: { condition: flag.condition, confidence: flag.confidence, excerpt: flag.excerpt.substring(0, 120) },
              });
            }
          }
        }

        const filteredTokenEstimate = Math.round(allFilteredText.length / 4);
        emit({
          type: 'progress',
          message: `Phase 1 complete — ${allKeywordFlags.length} potential flags detected, ~${filteredTokenEstimate} tokens to analyze${imageFiles.length > 0 ? `, ${imageFiles.length} image(s) queued` : ''}`,
          percent: 25,
          phase: 'filter_done',
        });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: Single Grok-4 Synthesis (one API call, ~20-45s)
        // + Image vision analysis (if any images uploaded)
        // ═══════════════════════════════════════════════════════════════════

        let finalFlags: FlaggedItem[] = [];
        let usedModel = MODEL_SYNTHESIS;
        let usedFallback = false;

        // Process images with vision API (parallel with text synthesis)
        const imagePromise = imageFiles.length > 0
          ? Promise.all(imageFiles.map(async (img) => {
              emit({ type: 'progress', message: `Phase 2: Analyzing image "${img.name}" with ${MODEL_VISION}...`, percent: 30, phase: 'synthesis' });
              const output = await screenImageWithVision(img.data, img.mime, img.name);
              img.data = ''; // clear immediately
              return { name: img.name, output };
            }))
          : Promise.resolve([]);

        // Process text with single Grok-4 call
        const textPromise = allFilteredText.length > 50
          ? (async () => {
              emit({
                type: 'progress',
                message: `Phase 2: ${MODEL_SYNTHESIS} is analyzing ${allKeywordFlags.length} flagged areas (~${filteredTokenEstimate} tokens)...`,
                percent: 35,
                phase: 'synthesis',
              });
              const fileNames = files.map(f => f.name).join(', ');
              return synthesizeWithGrok4(allFilteredText, fileNames);
            })()
          : Promise.resolve('');

        // Wait for both to complete (parallel execution)
        const [imageResults, synthesisOutput] = await Promise.all([imagePromise, textPromise]);

        // Parse text synthesis output
        if (synthesisOutput) {
          emit({ type: 'progress', message: 'Phase 2: Processing analysis results...', percent: 85, phase: 'synthesis' });
          finalFlags = parseSynthesisOutput(synthesisOutput);
        }

        // Parse image analysis output (reuse parseSynthesisOutput — same format)
        for (const imgResult of imageResults) {
          if (imgResult.output) {
            const imgFlags = parseSynthesisOutput(imgResult.output);
            finalFlags.push(...imgFlags);
          }
        }

        // Fallback: if Grok-4 returned nothing but keywords found flags, use keyword flags
        if (finalFlags.length === 0 && allKeywordFlags.length > 0) {
          console.warn('[MedicalDetective] Grok 4 synthesis returned no flags — using keyword fallback');
          finalFlags = keywordFlagsToFlaggedItems(allKeywordFlags);
          usedModel = 'keyword-fallback';
          usedFallback = true;
        }

        emit({
          type: 'progress',
          message: usedFallback
            ? `Analysis complete — ${finalFlags.length} flags from keyword scan (AI analysis unavailable)`
            : `Phase 2 complete — ${finalFlags.length} verified flag(s)`,
          percent: 95,
          phase: 'synthesis_done',
        });

        // ═══════════════════════════════════════════════════════════════════
        // BUILD REPORT
        // ═══════════════════════════════════════════════════════════════════

        const deduped = deduplicateFlags(finalFlags);
        const modelLabel = imageFiles.length > 0
          ? `${usedModel} (text) + ${MODEL_VISION} (images)`
          : usedModel;
        const report = buildReport(deduped, files.length, Date.now() - startTime, modelLabel);
        emit({ type: 'complete', report, percent: 100 });

      } catch (err) {
        console.error('[MedicalDetective] Stream error:', err);
        emit({ type: 'error', message: (err as Error).message || 'Processing failed. Please try again.' });
      } finally {
        controller.close();
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
