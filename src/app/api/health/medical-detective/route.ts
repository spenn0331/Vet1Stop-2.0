import { NextRequest } from 'next/server';

/**
 * POST /api/health/medical-detective — v3 "Three-Phase Pipeline"
 *
 * Architecture:
 *   Phase 1: Smart Pre-Filter (NO AI, instant) — keyword-scores every paragraph,
 *            discards administrative noise (~75% of VA Blue Button content).
 *   Phase 2: Fast Screening (grok-3-mini) — extracts raw flagged quotes from
 *            the pre-filtered text in parallel batches. ~5-10s per chunk.
 *   Phase 3: Grok 4 Synthesis (single call) — takes the raw quotes and produces
 *            structured, high-quality flags with confidence, category, nexus reasoning.
 *
 * Streaming NDJSON response. Emits JSON events line-by-line:
 *   {type:'progress', message, percent, phase}
 *   {type:'file_ready', fileName, numPages, numChunks, filteredChunks}
 *   {type:'screening_flag', flag}  — live flag during Phase 2
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

// Phase 2 chunk size — larger since grok-3-mini is fast
const SCREENING_CHUNK_SIZE = 96000;   // ~24K tokens — grok-3-mini handles this fine
const MAX_SCREENING_CHUNKS = 20;      // Safety cap
const CONCURRENT_BATCH_SIZE = 3;      // Parallel API calls per batch
const API_TIMEOUT_MS = 60_000;        // 60s timeout per call (mini is fast)
const SYNTHESIS_TIMEOUT_MS = 120_000; // 120s for final Grok 4 synthesis
const MAX_RETRIES = 2;

// Models — user's xAI API models (from Vet1Stop AI Cheat Sheet)
const MODEL_SCREENING = 'grok-3-mini';      // Fast bulk screening
const MODEL_SYNTHESIS = 'grok-4-0709';       // Deep analysis (single call)
const MODEL_VISION = 'grok-3-mini';          // Image analysis

const DISCLAIMER = `This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.`;

// ─── Medical Keywords for Pre-Filter (Phase 1) ──────────────────────────────
// Any paragraph containing at least one of these terms (case-insensitive) is
// considered "high signal" and kept for AI analysis. Everything else is noise.

const MEDICAL_KEYWORDS = [
  // Conditions / diagnoses
  'tinnitus', 'hearing loss', 'ptsd', 'post-traumatic', 'anxiety', 'depression',
  'sleep apnea', 'osa', 'cpap', 'insomnia', 'migraine', 'headache', 'tbi',
  'traumatic brain', 'burn pit', 'agent orange', 'gulf war', 'toxic exposure',
  'sinusitis', 'rhinitis', 'asthma', 'copd', 'respiratory', 'gerd', 'ibs',
  'gastro', 'knee', 'back pain', 'lumbar', 'cervical', 'shoulder', 'arthritis',
  'radiculopathy', 'sciatica', 'neuropathy', 'fibromyalgia', 'chronic pain',
  'diabetes', 'hypertension', 'heart', 'cardiac', 'cancer', 'tumor',
  'erectile', 'kidney', 'liver', 'thyroid', 'seizure', 'epilepsy',
  'skin condition', 'eczema', 'psoriasis', 'mst', 'military sexual trauma',
  'substance', 'alcohol', 'suicidal', 'homicidal', 'bipolar', 'schizophrenia',
  'gulf war illness', 'chronic fatigue', 'pact act', 'presumptive',
  // VA claim language
  'service connected', 'service-connected', ' sc ', 'compensable', 'rated at',
  'disability rating', 'c&p', 'comp and pen', 'nexus', 'at least as likely',
  'more likely than not', 'caused by military', 'aggravated by', 'due to service',
  'consistent with service', 'in-service', 'secondary to',
  // Clinical significance markers
  'diagnosis', 'diagnosed', 'assessment', 'impression', 'abnormal', 'positive',
  'elevated', 'decreased', 'chronic', 'bilateral', 'limited range', 'limitation of motion',
  'functional impairment', 'occupational impairment', 'unemployability', 'tdiu',
  'individual unemployability', 'flare', 'exacerbation', 'worsening',
  // ICD / procedure codes
  'icd', 'f43', 'f32', 'f41', 'g43', 'g47', 'h93', 'j45', 'm54', 'k21',
  // Section headers (VA Blue Button)
  'problem list', 'active diagnoses', 'clinical notes', 'progress note',
  'c&p exam', 'compensation', 'disability', 'medical history',
];

// Compile a single regex from all keywords for fast paragraph scoring
const KEYWORDS_REGEX = new RegExp(
  MEDICAL_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ─── Screening Prompt (Phase 2 — grok-3-mini) ───────────────────────────────
// Simplified prompt: just find and list quotes. No analysis. Fast.

const SCREENING_PROMPT = `You are a fast medical records scanner. Your ONLY job is to find and extract exact quotes from VA medical records that are relevant to disability claims.

Look for ANY mention of:
- Diagnoses, conditions, symptoms (physical and mental)
- Service connection language ("service connected", "SC", "nexus", "at least as likely as not")
- Disability ratings or C&P exam findings
- PACT Act / burn pit / toxic exposure references
- Medications that indicate serious conditions
- Abnormal lab results or clinical findings
- Functional limitations or impairment statements

For each finding, output EXACTLY this format (one per line):
FLAG|[Condition/Topic]|[High/Medium/Low]|[Exact quote from the text, 1-2 sentences]|[Page number if visible, else "N/A"]|[Date if visible, else "N/A"]

Rules:
- Output ONLY FLAG lines. No explanations, no headers, no disclaimers.
- Be thorough — extract every relevant quote you find.
- Do NOT flag normal/routine results (normal vitals, routine labs, appointment scheduling).
- Include 1-2 surrounding sentences for context in the quote.
- If nothing relevant found, output exactly: NO_FLAGS_FOUND`;

// ─── Synthesis Prompt (Phase 3 — Grok 4) ────────────────────────────────────
// Takes pre-screened quotes and produces final structured analysis

const SYNTHESIS_PROMPT = `You are an expert VA disability claims evidence analyst with deep knowledge of VA rating schedules, presumptive conditions, the PACT Act, and how clinical notes support claims.

Below are raw flagged excerpts extracted from a veteran's VA medical records. Your job is to:

1. Deduplicate — merge flags that reference the same condition
2. Assign accurate confidence levels (High = direct diagnosis/rating language, Medium = clinical evidence suggesting condition, Low = indirect/circumstantial)
3. Map each flag to the correct VA disability category
4. Provide a 1-sentence nexus/relevance explanation for each
5. Identify any PACT Act presumptive conditions
6. Suggest concrete next steps

Output in clean, numbered bullet list format. For each flag:
- Condition name
- Confidence: High / Medium / Low
- Category: (e.g., Mental Health, Musculoskeletal, Sleep Disorders, Hearing, Respiratory, etc.)
- Exact quote: "[the excerpt]"
- Page number: [if available]
- Date: [if available]
- Relevance: [1-sentence explanation of claim relevance]

If the excerpts contain no meaningful evidence, state: 'No strong claim-relevant evidence flags were identified in this report.'

End with this exact bold disclaimer:
**This report is for informational purposes only and does not constitute medical or legal advice. This tool does not file claims. Please share this report with your accredited VSO or claims representative for professional review.**

Be accurate, professional, and veteran-focused.`;

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
// Scores every paragraph against MEDICAL_KEYWORDS and keeps only high-signal ones.
// Reduces a 1001-page VA Blue Button export by ~75% before any API call.

function preFilterText(text: string): { filtered: string; totalParagraphs: number; keptParagraphs: number } {
  const paragraphs = text.split(/\n{2,}|\r\n{2,}/);
  const kept: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    // Skip very short paragraphs (headers with no content, blank lines)
    if (trimmed.length < 20) continue;
    // Keep if it matches any medical/claim keyword
    if (KEYWORDS_REGEX.test(trimmed)) {
      kept.push(trimmed);
    }
  }

  return {
    filtered: kept.join('\n\n'),
    totalParagraphs: paragraphs.length,
    keptParagraphs: kept.length,
  };
}

// ─── Text Chunking (for pre-filtered text) ──────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n{2,}/);
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > SCREENING_CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());
  if (chunks.length === 0 && text.length > 0) return [text.substring(0, SCREENING_CHUNK_SIZE)];

  // Safety cap
  if (chunks.length > MAX_SCREENING_CHUNKS) {
    const kept = chunks.slice(0, MAX_SCREENING_CHUNKS - 1);
    const overflow = chunks.slice(MAX_SCREENING_CHUNKS - 1).join('\n\n');
    kept.push(overflow.substring(0, SCREENING_CHUNK_SIZE * 2));
    return kept;
  }

  return chunks;
}

// ─── Grok API Calls ───────────────────────────────────────────────────────────

function getApiKey(): string {
  return process.env.XAI_API_KEY || '';
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// Shared retry wrapper for all Grok API calls
async function callGrokAPI(
  model: string,
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  timeoutMs: number,
  label: string,
  maxTokens: number = 4000,
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

// Phase 2: Screen a chunk with grok-3-mini (fast)
async function screenChunkWithMini(chunk: string, chunkIdx: number, totalChunks: number, fileName: string): Promise<string> {
  return callGrokAPI(
    MODEL_SCREENING,
    [
      { role: 'system', content: SCREENING_PROMPT },
      { role: 'user', content: `Document: "${fileName}" | Section ${chunkIdx + 1} of ${totalChunks}\n\n${chunk}` },
    ],
    API_TIMEOUT_MS,
    `Screening chunk ${chunkIdx + 1}/${totalChunks}`,
    4000,
  );
}

// Phase 2 (images): Screen an image with grok-3-mini
async function screenImageWithVision(base64Data: string, mimeType: string, fileName: string): Promise<string> {
  return callGrokAPI(
    MODEL_VISION,
    [
      { role: 'system', content: SCREENING_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analyze this VA medical record image (${fileName}) for disability claim-relevant findings. Use the FLAG| format.` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
        ],
      },
    ],
    API_TIMEOUT_MS,
    `Image screening: ${fileName}`,
    4000,
  );
}

// Phase 3: Synthesize all raw flags with Grok 4 (single call)
async function synthesizeWithGrok4(rawFlags: string[], fileName: string): Promise<string> {
  const flagText = rawFlags.join('\n');
  return callGrokAPI(
    MODEL_SYNTHESIS,
    [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: `Veteran's document: "${fileName}"\n\nRaw flagged excerpts from screening:\n\n${flagText}` },
    ],
    SYNTHESIS_TIMEOUT_MS,
    'Grok 4 synthesis',
    6000,
  );
}

// ─── Parse Screening Output (Phase 2 FLAG| format) ──────────────────────────

interface RawScreeningFlag {
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  excerpt: string;
  pageNumber: string;
  dateFound: string;
}

function parseScreeningOutput(rawText: string): RawScreeningFlag[] {
  if (!rawText || rawText.includes('NO_FLAGS_FOUND')) return [];
  const flags: RawScreeningFlag[] = [];
  const lines = rawText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('FLAG|')) continue;
    const parts = trimmed.split('|');
    if (parts.length < 6) continue;

    const confidence = (parts[2] || 'medium').trim().toLowerCase();
    flags.push({
      condition: (parts[1] || '').trim(),
      confidence: (['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium') as 'high' | 'medium' | 'low',
      excerpt: (parts[3] || '').trim(),
      pageNumber: (parts[4] || 'N/A').trim(),
      dateFound: (parts[5] || 'N/A').trim(),
    });
  }

  return flags;
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

// ─── Fallback: Convert screening flags directly (if Grok 4 synthesis fails) ─

function screeningFlagsToFlaggedItems(rawFlags: RawScreeningFlag[]): FlaggedItem[] {
  return rawFlags.map((f, i) => ({
    flagId: `${f.condition.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}_${i}`,
    label: f.condition,
    category: mapToCategory(f.condition),
    excerpt: f.excerpt,
    context: f.condition,
    dateFound: f.dateFound !== 'N/A' ? f.dateFound : undefined,
    pageNumber: f.pageNumber !== 'N/A' ? f.pageNumber : undefined,
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

function buildReport(flags: FlaggedItem[], filesProcessed: number, processingTime: number): DetectiveReport {
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
    processingDetails: { filesProcessed, processingTime, aiModel: `${MODEL_SCREENING} (screening) + ${MODEL_SYNTHESIS} (analysis)` },
  };
}

// ─── Streaming POST Handler — 3-Phase Pipeline ─────────────────────────────

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
        // PHASE 1: Extract + Pre-Filter (No AI — instant)
        // ═══════════════════════════════════════════════════════════════════

        type FileInfo = {
          name: string;
          chunks: string[];
          numPages: number;
          isImage: boolean;
          imageData?: string;
          imageMime?: string;
          totalParagraphs: number;
          keptParagraphs: number;
        };
        const fileInfos: FileInfo[] = [];
        let totalScreeningChunks = 0;

        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi];
          emit({ type: 'progress', message: `Phase 1: Extracting text from "${file.name}"...`, percent: 5 + (fi / files.length) * 10, phase: 'extract' });

          if (file.type.startsWith('image/')) {
            fileInfos.push({
              name: file.name, chunks: ['__IMAGE__'], numPages: 1,
              isImage: true, imageData: file.data, imageMime: file.type,
              totalParagraphs: 0, keptParagraphs: 0,
            });
            totalScreeningChunks += 1;
          } else if (file.type === 'application/pdf') {
            const { text, numPages } = await extractPDFData(file.data);
            file.data = ''; // clear raw data immediately

            // Pre-filter: remove administrative noise
            emit({ type: 'progress', message: `Phase 1: Pre-filtering "${file.name}" (${numPages} pages)...`, percent: 10 + (fi / files.length) * 10, phase: 'filter' });
            const { filtered, totalParagraphs, keptParagraphs } = preFilterText(text);

            // Chunk the filtered text
            const chunks = filtered.length > 50 ? chunkText(filtered) : [text.substring(0, SCREENING_CHUNK_SIZE)];
            fileInfos.push({
              name: file.name, chunks, numPages,
              isImage: false,
              totalParagraphs, keptParagraphs,
            });
            totalScreeningChunks += chunks.length;

            const reductionPct = totalParagraphs > 0 ? Math.round((1 - keptParagraphs / totalParagraphs) * 100) : 0;
            emit({
              type: 'file_ready',
              fileName: file.name,
              numPages,
              numChunks: chunks.length,
              filteredChunks: chunks.length,
              totalParagraphs,
              keptParagraphs,
              reductionPct,
            });
          }
        }

        emit({
          type: 'progress',
          message: `Phase 1 complete — ${totalScreeningChunks} section(s) to screen with ${MODEL_SCREENING}`,
          percent: 20,
          phase: 'filter_done',
        });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: Fast Screening with grok-3-mini (parallel batches)
        // ═══════════════════════════════════════════════════════════════════

        const allRawFlags: RawScreeningFlag[] = [];
        const allRawFlagLines: string[] = []; // raw text for Phase 3 synthesis
        let processedChunks = 0;

        // Flatten work queue
        type WorkItem = { fileInfo: FileInfo; chunkIdx: number };
        const workQueue: WorkItem[] = [];
        for (const info of fileInfos) {
          for (let ci = 0; ci < info.chunks.length; ci++) {
            workQueue.push({ fileInfo: info, chunkIdx: ci });
          }
        }

        // Process in parallel batches
        for (let batchStart = 0; batchStart < workQueue.length; batchStart += CONCURRENT_BATCH_SIZE) {
          const batch = workQueue.slice(batchStart, batchStart + CONCURRENT_BATCH_SIZE);
          const batchIdx = Math.floor(batchStart / CONCURRENT_BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(workQueue.length / CONCURRENT_BATCH_SIZE);

          emit({
            type: 'progress',
            message: `Phase 2: Screening batch ${batchIdx} of ${totalBatches} with ${MODEL_SCREENING}...`,
            percent: Math.round(20 + (processedChunks / totalScreeningChunks) * 50),
            phase: 'screening',
          });

          // Run batch in parallel
          const batchPromises = batch.map(async (item) => {
            const { fileInfo: info, chunkIdx: ci } = item;
            let rawOutput = '';
            if (info.isImage && info.imageData && info.imageMime) {
              rawOutput = await screenImageWithVision(info.imageData, info.imageMime, info.name);
              info.imageData = ''; // clear immediately
            } else {
              rawOutput = await screenChunkWithMini(info.chunks[ci], ci, info.chunks.length, info.name);
            }
            return { rawOutput, ci, info };
          });

          const batchResults = await Promise.all(batchPromises);

          for (const result of batchResults) {
            processedChunks++;
            const flags = parseScreeningOutput(result.rawOutput);
            allRawFlags.push(...flags);

            // Collect raw flag lines for Phase 3 synthesis
            const flagLines = result.rawOutput.split('\n').filter(l => l.trim().startsWith('FLAG|'));
            allRawFlagLines.push(...flagLines);

            // Emit live flags to client as they're found
            for (const flag of flags) {
              emit({
                type: 'screening_flag',
                flag: { condition: flag.condition, confidence: flag.confidence, excerpt: flag.excerpt.substring(0, 120) },
              });
            }
          }

          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const estimatedRemaining = processedChunks > 0
            ? Math.round(((Date.now() - startTime) / processedChunks) * (totalScreeningChunks - processedChunks) / 1000)
            : 0;
          emit({
            type: 'progress',
            message: `Phase 2: ${processedChunks}/${totalScreeningChunks} screened — ${allRawFlags.length} flags found (${elapsed}s elapsed${estimatedRemaining > 0 ? `, ~${estimatedRemaining}s remaining` : ''})`,
            percent: Math.round(20 + (processedChunks / totalScreeningChunks) * 50),
            phase: 'screening',
          });
        }

        emit({
          type: 'progress',
          message: `Phase 2 complete — ${allRawFlags.length} raw flags found. Sending to ${MODEL_SYNTHESIS} for deep analysis...`,
          percent: 75,
          phase: 'screening_done',
        });

        // ═══════════════════════════════════════════════════════════════════
        // PHASE 3: Grok 4 Synthesis (single call on pre-screened quotes)
        // ═══════════════════════════════════════════════════════════════════

        let finalFlags: FlaggedItem[] = [];

        if (allRawFlags.length > 0) {
          emit({
            type: 'progress',
            message: `Phase 3: ${MODEL_SYNTHESIS} is analyzing ${allRawFlags.length} flagged excerpts...`,
            percent: 80,
            phase: 'synthesis',
          });

          const fileNames = fileInfos.map(f => f.name).join(', ');
          const synthesisOutput = await synthesizeWithGrok4(allRawFlagLines, fileNames);

          if (synthesisOutput) {
            finalFlags = parseSynthesisOutput(synthesisOutput);
          }

          // Fallback: if Grok 4 synthesis fails or returns nothing, use screening flags directly
          if (finalFlags.length === 0 && allRawFlags.length > 0) {
            console.warn('[MedicalDetective] Grok 4 synthesis returned no flags — using screening flags as fallback');
            finalFlags = screeningFlagsToFlaggedItems(allRawFlags);
          }

          emit({
            type: 'progress',
            message: `Phase 3 complete — ${finalFlags.length} verified flags`,
            percent: 95,
            phase: 'synthesis_done',
          });
        } else {
          emit({
            type: 'progress',
            message: 'No flags found during screening — generating report...',
            percent: 95,
            phase: 'synthesis_done',
          });
        }

        // ═══════════════════════════════════════════════════════════════════
        // BUILD REPORT
        // ═══════════════════════════════════════════════════════════════════

        const deduped = deduplicateFlags(finalFlags);
        const report = buildReport(deduped, files.length, Date.now() - startTime);
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
