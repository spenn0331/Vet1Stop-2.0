import { NextRequest } from 'next/server';

/**
 * POST /api/health/records-recon — v4.7 "Records Recon"
 *
 * Architecture:
 *   Phase 1: Smart Pre-Filter (NO AI, ~1-2s) — tiered keyword scoring,
 *            section header priority, noise exclusion, 5K/25-para cap.
 *            Negative-context gating. Page numbers from PDF boundaries.
 *   Phase 2a: Extraction (grok-4-1-fast-non-reasoning) — strict JSON array,
 *             extracts conditions with page, date, section, provider, excerpt.
 *             ZERO claim language. Pure document extraction.
 *   Phase 2b: Structuring (grok-4-1-fast-reasoning) — organizes raw extractions
 *             into timeline[], conditions_index[], keyword_frequency[],
 *             document_summary. Pure reorganization — no advice.
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

interface ReconExtractedItem {
  itemId: string;
  condition: string;
  category: string;
  excerpt: string;
  dateFound: string | null;
  pageNumber: number | null;
  sectionFound: string | null;
  provider: string | null;
  confidence: 'high' | 'medium' | 'low';
}

interface ReconTimelineEntry {
  date: string | null;
  page: number | null;
  section: string | null;
  provider: string | null;
  entry: string;
  category: string;
}

interface ReconCondition {
  condition: string;
  category: string;
  firstMentionDate: string | null;
  firstMentionPage: number | null;
  mentionCount: number;
  pagesFound: number[];
  excerpts: Array<{ text: string; page: number | null; date: string | null }>;
}

interface ReconKeywordFrequency {
  term: string;
  count: number;
}

interface ReconDocumentSummary {
  totalPagesReferenced: number;
  dateRange: { earliest: string | null; latest: string | null };
  documentTypesDetected: string[];
  providersFound: string[];
}

interface ReconReport {
  disclaimer: string;
  summary: string;
  documentSummary: ReconDocumentSummary;
  timeline: ReconTimelineEntry[];
  conditionsIndex: ReconCondition[];
  keywordFrequency: ReconKeywordFrequency[];
  extractedItems: ReconExtractedItem[];
  processingDetails: { filesProcessed: number; processingTime: number; aiModel: string };
  scanSynopsis?: ScanSynopsis;
  isInterim?: boolean;
  interimNote?: string;
}

interface KeywordFlag {
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  excerpt: string;
  dateFound?: string;
  pageNumber?: number;
  sectionFound?: string;
}

interface ScanSynopsis {
  totalPages: number;
  totalParagraphs: number;
  keptParagraphs: number;
  reductionPct: number;
  keywordsDetected: string[];
  sectionHeadersFound: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERED_TEXT_CAP = 20_000;
const MAX_PARAGRAPHS_TO_SEND = 100;
const SECTION_GUARANTEE_COUNT = 6;
const SYNTHESIS_TIMEOUT_MS = 90_000;
const IDLE_TIMEOUT_MS = 45_000;
const RETRY_CHAR_CAP = 10_000;
const MIN_PARAGRAPH_LENGTH = 30;
const MIN_KEYWORD_MATCHES_FLAG = 2;
const MAX_PARALLEL_CHUNKS = 4;
const CHARS_PER_CHUNK = 5_000;

const MODEL_EXTRACT = 'grok-4-1-fast-non-reasoning';
const MODEL_STRUCTURE = 'grok-4-1-fast-reasoning';
const MODEL_FALLBACK = 'grok-4-0709';

const GUARANTEED_SECTIONS = [
  'assessment', 'problem list', 'active problems', 'active diagnoses',
  'hpi', 'history of present illness', 'diagnosis', 'diagnoses',
  'plan', 'impression', 'chief complaint',
];

const DISCLAIMER = `Records Recon is a document organizer only. It extracts and structures factual content from records YOU uploaded. It does NOT provide medical advice, legal advice, claims advice, or recommendations. Always consult an accredited VSO representative before making decisions about VA benefits.`;

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

const GENERIC_STANDALONE_TERMS = new Set([
  'diagnosed', 'diagnosis', 'chronic', 'abnormal', 'bilateral',
  'problem list', 'active diagnoses', 'worsening',
  'functional impairment', 'limitation of motion', 'pain on use',
  'range of motion', 'rom', 'deluca', 'functional loss',
  'flare-up', 'flare up',
]);

// ─── Condition Synonym Map (for deduplication) ──────────────────────────────

const CONDITION_SYNONYMS = new Map<string, string>([
  ['bppv', 'benign paroxysmal positional vertigo'],
  ['benign positional vertigo', 'benign paroxysmal positional vertigo'],
  ['ptsd', 'post-traumatic stress disorder'],
  ['post traumatic stress disorder', 'post-traumatic stress disorder'],
  ['post-traumatic stress', 'post-traumatic stress disorder'],
  ['osa', 'obstructive sleep apnea'],
  ['sleep apnea', 'obstructive sleep apnea'],
  ['mdd', 'major depressive disorder'],
  ['major depression', 'major depressive disorder'],
  ['gad', 'generalized anxiety disorder'],
  ['gerd', 'gastroesophageal reflux disease'],
  ['acid reflux', 'gastroesophageal reflux disease'],
  ['gastroesophageal reflux', 'gastroesophageal reflux disease'],
  ['tbi', 'traumatic brain injury'],
  ['copd', 'chronic obstructive pulmonary disease'],
  ['cad', 'coronary artery disease'],
  ['chf', 'congestive heart failure'],
  ['ibs', 'irritable bowel syndrome'],
  ['ddd', 'degenerative disc disease'],
  ['ckd', 'chronic kidney disease'],
  ['ed', 'erectile dysfunction'],
  ['crps', 'complex regional pain syndrome'],
  ['rls', 'restless leg syndrome'],
  ['restless legs syndrome', 'restless leg syndrome'],
  ['htn', 'hypertension'],
  ['dm', 'diabetes mellitus'],
  ['dm2', 'diabetes mellitus type 2'],
  ['dm ii', 'diabetes mellitus type 2'],
  ['afib', 'atrial fibrillation'],
  ['a-fib', 'atrial fibrillation'],
  ['oa', 'osteoarthritis'],
  ['ra', 'rheumatoid arthritis'],
  ['mst', 'military sexual trauma'],
]);

function normalizeConditionName(name: string): string {
  const lower = name.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim();
  const canonical = CONDITION_SYNONYMS.get(lower);
  if (canonical) return canonical;
  return lower
    .replace(/\b(bilateral|chronic|acute|mild|moderate|severe|recurrent|left|right|unspecified)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Chunk Filtered Text for Parallel Extraction ────────────────────────────

function chunkFilteredText(text: string, maxChunks: number, targetCharsPerChunk: number): string[] {
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length <= 1) return [text];

  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const numChunks = Math.min(maxChunks, Math.max(1, Math.ceil(totalChars / targetCharsPerChunk)));
  if (numChunks <= 1) return [text];

  const targetSize = Math.ceil(totalChars / numChunks);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;

  for (const para of paragraphs) {
    if (currentSize >= targetSize && chunks.length < numChunks - 1) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [];
      currentSize = 0;
    }
    currentChunk.push(para);
    currentSize += para.length;
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }
  return chunks;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function extractDateFromText(text: string): string | undefined {
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  // VA Blue Button format: DATE OF NOTE: FEB 06, 2024@14:48 or ENTRY DATE: FEB 06, 2024@14:49:03
  const blueButton = text.match(/(?:DATE\s*OF\s*NOTE|ENTRY\s*DATE|DATE\s*ENTERED|DATE\s*SIGNED|DATE\s*OF\s*SERVICE|VISIT\s*DATE|NOTE\s*DATE|ADMISSION\s*DATE|DISCHARGE\s*DATE|Date\s*entered|Date\s*signed)[:\s]+([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})(?:@[\d:]+)?/i);
  if (blueButton) {
    const monthNum = months[blueButton[1].toLowerCase()];
    if (monthNum) return `${blueButton[3]}-${monthNum}-${blueButton[2].padStart(2, '0')}`;
  }

  // VA Blue Button numeric format: DATE OF NOTE: 02/06/2024@14:48
  const blueButtonNumeric = text.match(/(?:DATE\s*OF\s*NOTE|ENTRY\s*DATE|DATE\s*ENTERED|DATE\s*SIGNED|DATE\s*OF\s*SERVICE|VISIT\s*DATE|NOTE\s*DATE|ADMISSION\s*DATE|DISCHARGE\s*DATE|Date\s*entered|Date\s*signed)[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:@[\d:]+)?/i);
  if (blueButtonNumeric) {
    const [, m, d, y] = blueButtonNumeric;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // ISO format: 2024-02-06
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  // Numeric MM/DD/YYYY or MM-DD-YYYY
  const mdy = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Labeled date: note date, date of service, dos, visit date, encounter date
  const noteDate = text.match(/(?:note\s*date|date\s*of\s*service|dos|visit\s*date|encounter\s*date)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i);
  if (noteDate) {
    const y = noteDate[3].length === 2 ? `20${noteDate[3]}` : noteDate[3];
    return `${y}-${noteDate[1].padStart(2, '0')}-${noteDate[2].padStart(2, '0')}`;
  }

  // Abbreviated month with @timestamp: FEB 06, 2024@14:48 (standalone, not after a label)
  const abbrAt = text.match(/([A-Z]{3})\s+(\d{1,2}),?\s+(\d{4})@/i);
  if (abbrAt) {
    const monthNum = months[abbrAt[1].toLowerCase()];
    if (monthNum) return `${abbrAt[3]}-${monthNum}-${abbrAt[2].padStart(2, '0')}`;
  }

  // Named month: February 6, 2024 or Feb 06, 2024
  const named = text.match(/(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const monthNum = months[named[1].toLowerCase()];
    if (monthNum) return `${named[3]}-${monthNum}-${named[2].padStart(2, '0')}`;
  }

  return undefined;
}

function extractProviderFromText(text: string): string | undefined {
  // VA Blue Button formats: SIGNED BY: SMITH,JOHN M DO  or  AUTHOR: JONES,MARY PA-C  or  ATTENDING: DOE,JANE MD
  // Also: Ordered by: SMITH,JOHN A or Provider: Dr. Smith
  const bbProvider = text.match(/(?:SIGNED\s*BY|AUTHOR|ATTENDING|COSIGNED\s*BY|EXPECTED\s*COSIGNER|Ordered\s*by|Clinician)[:\s]+([A-Z][A-Z',.\-\s]{2,40}?)(?:\s+(?:MD|DO|PA|PA-C|NP|ARNP|RN|BSN|MSN|LCSW|PhD|PsyD|PharmD|DPM|OD|DDS|DMD)\b|\s*$)/im);
  if (bbProvider) {
    const raw = bbProvider[1].trim().replace(/,+$/, '');
    // Convert "SMITH,JOHN M" to "Smith, John M"
    if (raw.includes(',') && raw === raw.toUpperCase()) {
      const parts = raw.split(',').map(p => p.trim());
      const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(', ');
      return formatted;
    }
    return raw;
  }
  // Standard format: Dr. John Smith, Dr. Smith
  const drMatch = text.match(/(?:Dr\.?\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  if (drMatch) return `Dr. ${drMatch[1]}`;
  return undefined;
}

const NEGATIVE_CONTEXT_REGEX = /\b(?:no |absence of |denies |denied |negative for |without |(?:not |never )present|ruled out|no evidence of |no history of |no signs? of |no symptoms? of |does not have |patient denies )/i;

function isNegativeContext(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kwLower = keyword.toLowerCase();
  const idx = lower.indexOf(kwLower);
  if (idx === -1) return false;
  const prefix = lower.substring(Math.max(0, idx - 80), idx);
  return NEGATIVE_CONTEXT_REGEX.test(prefix);
}

function isScreeningFalsePositive(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  if (/phq-?9[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i.test(lower) && (kw === 'depression' || kw === 'suicidal')) return true;
  if (/c-?ssrs[:\s]*(?:negative|none|denied|no)/i.test(lower) && kw === 'suicidal') return true;
  if (/gad-?7[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i.test(lower) && kw === 'anxiety') return true;
  if (/pc-?ptsd[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i.test(lower) && (kw === 'ptsd' || kw === 'post-traumatic')) return true;
  if (/audit-?c[:\s]*(?:score[:\s]*)?\s*(?:0|none|negative|nil)/i.test(lower) && kw === 'substance') return true;
  if (/suicidal\s+ideation[:\s]*(?:0|none|denied|negative|absent)/i.test(lower) && kw === 'suicidal') return true;
  return false;
}

// ─── Phase 2a: Extraction Prompt (neutral, zero claims language) ──────────────

const EXTRACTION_PROMPT = `You are a medical record document extraction system. Extract all diagnosable conditions from medical records. Follow rules EXACTLY.

Each paragraph is tagged like "[Page 45 | Assessment | Date: 2024-02-06 | Provider: Smith, John] text..." showing page, clinical section, date of the note/entry, and the signing/authoring provider. Use the Date and Provider from the tag when the text itself does not contain them explicitly. If no Date or Provider tag is present, output null for those fields.

EXTRACTION LAYERS (use all three):

LAYER 1 — SECTION-ANCHORED (always extract):
Extract ANY condition listed after: Assessment, Assessment/Plan, Problem List, Active Problems, Active Diagnoses, Diagnosis/Diagnoses/DX, Discharge Diagnosis, Admitting Diagnosis, Past Medical History/PMHx, Impression, Chief Complaint (when clinical).

LAYER 2 — CONDITION CATEGORIES (extract when in clinical context):
MUSCULOSKELETAL: radiculopathy, DDD, degenerative disc, herniated disc, spinal stenosis, spondylosis, lumbar/cervical/thoracic strain, knee pain, patellofemoral, meniscus, ACL/MCL, shoulder impingement, rotator cuff, carpal tunnel, plantar fasciitis, flat feet/pes planus, arthritis, osteoarthritis, gout, bursitis, tendonitis, sciatica, sacroiliac, ankylosis, limited ROM, bone spurs, scoliosis
MENTAL HEALTH: PTSD, post-traumatic stress, anxiety disorder, GAD, panic disorder, MDD/major depressive, dysthymia, bipolar, adjustment disorder, mood disorder, OCD, TBI, post-concussive, insomnia disorder
HEARING: tinnitus, sensorineural hearing loss, bilateral hearing loss, mixed hearing loss, Meniere's, BPPV, vertigo, vestibular dysfunction, perforated TM
RESPIRATORY: sinusitis, allergic/vasomotor rhinitis, deviated septum, asthma, COPD, chronic bronchitis, constrictive bronchiolitis, pulmonary fibrosis, sarcoidosis
SLEEP: obstructive sleep apnea/OSA, central sleep apnea, insomnia disorder, restless leg/RLS, CPAP prescribed
CARDIOVASCULAR: hypertension, ischemic heart disease, CAD, atrial fibrillation, cardiomyopathy, CHF, PAD, DVT, varicose veins
NEUROLOGICAL: migraine, peripheral neuropathy, diabetic neuropathy, epilepsy, seizure disorder, Parkinson's, essential tremor, MS, CRPS, fibromyalgia, chronic fatigue, small fiber neuropathy
GI: GERD, hiatal hernia, Barrett's, peptic ulcer, IBS, Crohn's, ulcerative colitis, diverticulitis, gastroparesis, hepatitis, cirrhosis, pancreatitis
ENDOCRINE: diabetes mellitus, hypothyroidism, hyperthyroidism, Hashimoto's, thyroid nodule, adrenal insufficiency
GENITOURINARY: erectile dysfunction, kidney stones, chronic kidney disease, urinary incontinence, BPH, interstitial cystitis
DERMATOLOGICAL: eczema, psoriasis, dermatitis, chloracne, hidradenitis, skin cancer, burn/surgical scars, keloid
OPHTHALMOLOGICAL: glaucoma, cataracts, macular degeneration, diabetic retinopathy, dry eye
ONCOLOGICAL: any cancer/tumor/malignancy, lymphoma, leukemia

LAYER 3 — PATTERN CATCH-ALL:
Also extract: ICD-10 codes (letter+digits+decimal pattern), terms with "(chronic)"/"(bilateral)"/"(recurrent)", terms after "s/p" (status post), terms ending in "disorder"/"disease"/"syndrome"/"dysfunction"/"impairment", items in numbered problem lists.

NEVER EXTRACT:
NEGATIVE: Skip if preceded within 100 chars by: no, absence of, denies, denied, negative for, ruled out, not present, without, does not have, patient denies, no evidence of, no history of, no signs of, no symptoms of, no complaints of, resolved, in remission
SCREENING TOOLS (skip when score 0/negative/none/denied): PHQ-2, PHQ-9, PHQ-15, GAD-7, GAD-2, PC-PTSD-5, AUDIT-C, C-SSRS, DAST-10, CAGE, MDQ, PCL-5, SLUMS, MoCA, MMSE
ADMINISTRATIVE: scheduling, check-in, travel reimbursement, copay, insurance, demographics, "no show", "cancelled"
ROUTINE/NORMAL: "vital signs within normal", "WNL", "unremarkable", "normal exam", "NAD", routine labs, immunizations, flu shot, COVID vaccine
EDUCATIONAL: definitions of conditions, patient education handouts, discharge instruction warnings
MEDICATIONS: Do NOT extract medication names as conditions unless context reveals diagnosis (e.g., "sertraline for MDD" → extract MDD)

LANGUAGE RULES:
NEVER use these words/phrases in your output: should, recommend, file, claim, rating, percentage, likely, nexus, service-connected, presumptive, aggravated, compensable, TDIU, disability, entitled, eligible, qualify, benefits, VA Form, va.gov, DBQ, C&P, diagnostic code, DC, 38 CFR, buddy statement, next step, action, consider, important, significant, why this matters
Neutral document words are OK: excerpt, mention, found, referenced, page, section, provider, date, category, extracted, documented, noted, recorded, listed, appeared, identified, occurrence, entry

OUTPUT — JSON array only. Every element MUST have ALL fields (null for missing):
{"condition":"name","excerpt":"VERBATIM quote (max 200 chars)","page":"N","sectionFound":"Section or null","date":"YYYY-MM-DD or null","doctorName":"Dr. Name or null","category":"Musculoskeletal|Mental Health|Hearing|Respiratory|Sleep|Cardiovascular|Neurological|GI|Endocrine|Genitourinary|Dermatological|Ophthalmological|Oncological|Other","confidence":"High|Medium|Low"}

Confidence: High=Assessment/Problem List/Diagnosis section. Medium=HPI/clinical notes. Low=indirect mention.

Output ONLY the JSON array. No text before or after. If nothing found: []`;

// ─── Phase 2b: Structuring Prompt (organizes, never advises) ──────────────────

const STRUCTURING_PROMPT = `You are a document organizer. You receive a JSON array of conditions extracted from medical records. Organize them into a structured summary. You do NOT analyze, advise, or interpret.

RULES:
1. Organize ONLY what is provided in the input. Never add information not present.
2. NEVER use these words: should, recommend, file, claim, rating, percentage, likely, nexus, service-connected, presumptive, aggravated, compensable, TDIU, disability, entitled, eligible, qualify, benefits, VA Form, va.gov, DBQ, C&P, diagnostic code, DC, 38 CFR, buddy statement, next step, action, consider, important, significant, why this matters
3. Neutral words OK: excerpt, mention, found, referenced, page, section, provider, date, category, extracted, documented, noted, recorded, listed, appeared, identified, occurrence, entry, summary, condition, diagnosis, observation
4. Output ONLY the JSON object below. No text before or after.
5. Sort timeline chronologically (oldest date first). Null dates go last.
6. CRITICAL: Each unique excerpt+date+page combination must appear ONLY ONCE in the timeline. If one paragraph mentions multiple conditions, create ONE timeline entry using the most specific category. Never duplicate the same excerpt across multiple timeline entries.
7. Group conditions_index by unique condition name, merging duplicates.
8. keyword_frequency: count how many times each unique condition appears.

OUTPUT SCHEMA:
{
  "document_summary": {
    "total_pages_referenced": number,
    "date_range": { "earliest": "YYYY-MM-DD" | null, "latest": "YYYY-MM-DD" | null },
    "document_types_detected": ["Progress Note", "Lab Result", "Radiology", etc.],
    "providers_found": ["Dr. Name", ...]
  },
  "timeline": [
    { "date": "YYYY-MM-DD"|null, "page": number|null, "section": "string"|null, "provider": "string"|null, "entry": "verbatim excerpt (max 200 chars)", "category": "string" }
  ],
  "conditions_index": [
    { "condition": "name", "category": "string", "first_mention_date": "YYYY-MM-DD"|null, "first_mention_page": number|null, "mention_count": number, "pages_found": [1,5,12], "excerpts": [{"text":"verbatim","page":number|null,"date":"YYYY-MM-DD"|null}] }
  ],
  "keyword_frequency": [
    { "term": "condition name", "count": number }
  ]
}

Output ONLY valid JSON. No explanation text.`;

// ─── PDF Text Extraction ──────────────────────────────────────────────────────

async function extractPDFData(base64Data: string): Promise<{ text: string; numPages: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(base64Data, 'base64');

    // Collect per-page text keyed by 0-indexed page number.  This guarantees
    // a 1:1 mapping between <<<PAGE N>>> tags and physical PDF pages,
    // regardless of form-feed placement or async resolution order.
    const pageTextMap = new Map<number, string>();

    interface PdfTextItem { str: string; transform: number[] }
    interface PdfTextContent { items: PdfTextItem[] }
    interface PdfPageData {
      pageIndex: number;
      getTextContent: (opts?: Record<string, boolean>) => Promise<PdfTextContent>;
    }

    const data = await pdfParse(buffer, {
      pagerender: (pageData: PdfPageData) => {
        return pageData.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
          .then((textContent: PdfTextContent) => {
            let lastY: number | undefined;
            let pageText = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || lastY === undefined) {
                pageText += item.str;
              } else {
                pageText += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pageTextMap.set(pageData.pageIndex, pageText);
            return pageText;
          });
      },
    });

    const numPages = data.numpages || 1;

    // Diagnostic: compare per-page render count with old \f-split approach
    const rawText = data.text || '';
    if (rawText.includes('\f')) {
      const ffSegments = rawText.split('\f').length;
      console.log(
        `[RecordsRecon] Page alignment: ${pageTextMap.size} pages via per-page render, ` +
        `${ffSegments} segments via \\f split, ${numPages} reported by pdf-parse. ` +
        `Old \\f drift: ${ffSegments - numPages} pages.`
      );
    } else {
      console.log(
        `[RecordsRecon] Page alignment: ${pageTextMap.size} pages via per-page render, ` +
        `no \\f characters found, ${numPages} reported by pdf-parse.`
      );
    }

    // Build tagged text using per-page map — correct page numbers guaranteed
    const parts: string[] = [];
    for (let i = 0; i < numPages; i++) {
      parts.push(`<<<PAGE ${i + 1}>>>\n${pageTextMap.get(i) || ''}`);
    }
    const text = parts.join('\n');

    return { text, numPages };
  } catch (err) {
    console.warn('[RecordsRecon] pdf-parse failed, using regex fallback:', err);
    return { text: `<<<PAGE 1>>>\n${extractTextWithRegex(base64Data)}`, numPages: 1 };
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

function smartPreFilter(text: string): {
  filtered: string;
  totalParagraphs: number;
  keptParagraphs: number;
  keywordFlags: KeywordFlag[];
  detectedKeywords: string[];
  detectedHeaders: string[];
} {
  const rawLines = text.split(/\n/);
  const paragraphs: { text: string; page: number; nearestDate: string | undefined; nearestProvider: string | undefined }[] = [];
  let currentGroup = '';
  let currentPage = 1;
  let groupPage = 1;
  // Track the most recent date and provider seen across ALL lines (even short/filtered ones)
  // so headers like "DATE OF NOTE: FEB 06, 2024@14:48" and "SIGNED BY: SMITH,JOHN MD" propagate to nearby conditions
  let rollingDate: string | undefined = undefined;
  let groupDate: string | undefined = undefined;
  let rollingProvider: string | undefined = undefined;
  let groupProvider: string | undefined = undefined;

  for (const line of rawLines) {
    const trimmed = line.trim();
    const pageMarker = trimmed.match(/^<<<PAGE (\d+)>>>$/);
    if (pageMarker) {
      if (currentGroup.length > 0) { paragraphs.push({ text: currentGroup.trim(), page: groupPage, nearestDate: groupDate, nearestProvider: groupProvider }); currentGroup = ''; }
      currentPage = parseInt(pageMarker[1]);
      groupPage = currentPage;
      groupDate = rollingDate;
      groupProvider = rollingProvider;
      continue;
    }
    // Check every line for dates and providers (even short ones that might get filtered as paragraphs)
    if (trimmed.length > 0) {
      const lineDate = extractDateFromText(trimmed);
      if (lineDate) rollingDate = lineDate;
      const lineProvider = extractProviderFromText(trimmed);
      if (lineProvider) rollingProvider = lineProvider;
    }
    if (trimmed.length === 0) {
      if (currentGroup.length > 0) { paragraphs.push({ text: currentGroup.trim(), page: groupPage, nearestDate: groupDate, nearestProvider: groupProvider }); currentGroup = ''; groupPage = currentPage; groupDate = rollingDate; groupProvider = rollingProvider; }
      continue;
    }
    if (currentGroup.length === 0) { groupPage = currentPage; groupDate = rollingDate; groupProvider = rollingProvider; }
    if (currentGroup.length > 0 && trimmed.length < MIN_PARAGRAPH_LENGTH && currentGroup.length < MIN_PARAGRAPH_LENGTH) {
      currentGroup += ' ' + trimmed;
    } else if (currentGroup.length > 0 && currentGroup.length >= MIN_PARAGRAPH_LENGTH) {
      paragraphs.push({ text: currentGroup.trim(), page: groupPage, nearestDate: groupDate, nearestProvider: groupProvider });
      currentGroup = trimmed;
      groupPage = currentPage;
      groupDate = rollingDate;
      groupProvider = rollingProvider;
    } else {
      currentGroup += (currentGroup ? ' ' : '') + trimmed;
    }
  }
  if (currentGroup.trim().length > 0) paragraphs.push({ text: currentGroup.trim(), page: groupPage, nearestDate: groupDate, nearestProvider: groupProvider });

  interface ScoredPara {
    text: string;
    keywordCount: number;
    matchedKeywords: string[];
    isHeader: boolean;
    sectionKey: string | null;
    pageNumber: number;
    sectionName: string;
    nearestDate: string | undefined;
    nearestProvider: string | undefined;
  }

  const scored: ScoredPara[] = [];
  const detectedKeywordsSet = new Set<string>();
  const detectedHeadersSet = new Set<string>();
  let currentSection = '';

  for (const { text: para, page, nearestDate, nearestProvider } of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length < MIN_PARAGRAPH_LENGTH) continue;
    if (NOISE_REGEX.test(trimmed)) continue;
    const lower = trimmed.toLowerCase();

    let sectionKey: string | null = null;
    for (const s of GUARANTEED_SECTIONS) {
      if (lower.includes(s)) { sectionKey = s; break; }
    }
    if (sectionKey) {
      currentSection = (sectionKey === 'hpi' || sectionKey === 'history of present illness')
        ? 'HPI' : sectionKey.replace(/\b\w/g, c => c.toUpperCase());
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
      // Use date/provider found directly in the paragraph text, or fall back to nearest from prior lines
      const inlineDate = extractDateFromText(trimmed);
      const inlineProvider = extractProviderFromText(trimmed);
      scored.push({ text: trimmed, keywordCount: matchedKeywords.length, matchedKeywords, isHeader, sectionKey, pageNumber: page, sectionName: currentSection, nearestDate: inlineDate || nearestDate, nearestProvider: inlineProvider || nearestProvider });
    }
  }

  // Stable sort: keyword count desc, then page asc, then text length desc
  scored.sort((a, b) => {
    if (b.keywordCount !== a.keywordCount) return b.keywordCount - a.keywordCount;
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return b.text.length - a.text.length;
  });

  const selected: ScoredPara[] = [];
  const selectedTexts = new Set<string>();

  // Pass 1 — breadth-first: one paragraph per unique keyword for full coverage
  const coveredKeywords = new Set<string>();
  for (const sp of scored) {
    if (selected.length >= MAX_PARAGRAPHS_TO_SEND) break;
    const uncovered = sp.matchedKeywords.filter(k => !coveredKeywords.has(k));
    if (uncovered.length > 0 && !selectedTexts.has(sp.text)) {
      selected.push(sp);
      selectedTexts.add(sp.text);
      sp.matchedKeywords.forEach(k => coveredKeywords.add(k));
    }
  }

  // Pass 2 — guaranteed sections (Assessment, Problem List, etc.)
  const sectionCounts = new Map<string, number>();
  for (const sp of scored) {
    if (selected.length >= MAX_PARAGRAPHS_TO_SEND) break;
    if (sp.sectionKey && !selectedTexts.has(sp.text)) {
      const count = sectionCounts.get(sp.sectionKey) || 0;
      if (count < SECTION_GUARANTEE_COUNT) {
        selected.push(sp);
        selectedTexts.add(sp.text);
        sectionCounts.set(sp.sectionKey, count + 1);
      }
    }
  }

  // Pass 3 — fill remaining slots from highest-scored paragraphs
  for (const sp of scored) {
    if (selected.length >= MAX_PARAGRAPHS_TO_SEND) break;
    if (!selectedTexts.has(sp.text)) {
      selected.push(sp);
      selectedTexts.add(sp.text);
    }
  }

  const kept: string[] = [];
  const keywordFlags: KeywordFlag[] = [];
  const seenConditions = new Set<string>();
  let totalChars = 0;

  for (const sp of selected) {
    if (totalChars >= FILTERED_TEXT_CAP) break;
    const sectionTag = sp.sectionName ? ` | ${sp.sectionName}` : '';
    const dateTag = sp.nearestDate ? ` | Date: ${sp.nearestDate}` : '';
    const providerTag = sp.nearestProvider ? ` | Provider: ${sp.nearestProvider}` : '';
    const tagged = `[Page ${sp.pageNumber}${sectionTag}${dateTag}${providerTag}] ${sp.text}`;
    const chunk = tagged.length + totalChars > FILTERED_TEXT_CAP
      ? tagged.substring(0, FILTERED_TEXT_CAP - totalChars)
      : tagged;
    kept.push(chunk);
    totalChars += chunk.length;

    if (sp.matchedKeywords.length >= MIN_KEYWORD_MATCHES_FLAG) {
      const specificKeyword = sp.matchedKeywords.find(k => !GENERIC_STANDALONE_TERMS.has(k) && !isNegativeContext(sp.text, k) && !isScreeningFalsePositive(sp.text, k));
      if (specificKeyword) {
        const conditionKey = specificKeyword.toLowerCase().replace(/[^a-z]/g, '');
        if (!seenConditions.has(conditionKey)) {
          seenConditions.add(conditionKey);
          const confidence: 'high' | 'medium' | 'low' =
            sp.matchedKeywords.length >= 3 ? 'high'
            : sp.matchedKeywords.length >= 2 ? 'medium'
            : 'low';
          keywordFlags.push({
            condition: specificKeyword.charAt(0).toUpperCase() + specificKeyword.slice(1),
            confidence,
            excerpt: sp.text.substring(0, 150),
            dateFound: extractDateFromText(sp.text),
            pageNumber: sp.pageNumber,
            sectionFound: sp.sectionName || undefined,
          });
        }
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

// ─── Category Mapping ────────────────────────────────────────────────────────

function mapToCategory(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('tinnitus') || l.includes('hearing')) return 'Hearing';
  if (l.includes('ptsd') || l.includes('trauma') || l.includes('anxiety') || l.includes('depression') || l.includes('mental') || l.includes('panic') || l.includes('mst')) return 'Mental Health';
  if (l.includes('sleep apnea') || l.includes('osa') || l.includes('cpap')) return 'Sleep';
  if (l.includes('migraine') || l.includes('headache') || l.includes('tbi') || l.includes('neurolog')) return 'Neurological';
  if (l.includes('burn pit') || l.includes('pact') || l.includes('agent orange') || l.includes('gulf war') || l.includes('toxic') || l.includes('presumptive')) return 'Respiratory';
  if (l.includes('respirat') || l.includes('sinus') || l.includes('rhinitis') || l.includes('asthma') || l.includes('copd')) return 'Respiratory';
  if (l.includes('gerd') || l.includes('gastro') || l.includes('ibs')) return 'GI';
  if (l.includes('back') || l.includes('knee') || l.includes('shoulder') || l.includes('musculo') || l.includes('arthritis') || l.includes('lumbar') || l.includes('spinal') || l.includes('joint') || l.includes('cervical') || l.includes('radiculop')) return 'Musculoskeletal';
  if (l.includes('cancer') || l.includes('tumor')) return 'Oncological';
  if (l.includes('heart') || l.includes('cardio') || l.includes('hypertens')) return 'Cardiovascular';
  if (l.includes('diabetes') || l.includes('thyroid')) return 'Endocrine';
  if (l.includes('erectile') || l.includes('kidney') || l.includes('bladder')) return 'Genitourinary';
  if (l.includes('eczema') || l.includes('psoriasis') || l.includes('dermatit') || l.includes('scar')) return 'Dermatological';
  if (l.includes('glaucoma') || l.includes('cataract') || l.includes('eye')) return 'Ophthalmological';
  return 'Other';
}

// ─── Parse Phase 2a Extraction Output ─────────────────────────────────────────

function parseExtractionOutput(rawText: string): ReconExtractedItem[] {
  if (!rawText || rawText.trim() === '[]') return [];

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const mapItem = (item: Record<string, string>, i: number): ReconExtractedItem => ({
      itemId: `recon_${(item.condition || '').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${i}`,
      condition: item.condition || 'Unknown Condition',
      category: item.category || mapToCategory(item.condition || ''),
      excerpt: item.excerpt || '',
      dateFound: item.date || null,
      pageNumber: item.page ? parseInt(String(item.page)) : null,
      sectionFound: item.sectionFound || null,
      provider: item.doctorName || null,
      confidence: (['high', 'medium', 'low'].includes((item.confidence || '').toLowerCase())
        ? (item.confidence || '').toLowerCase()
        : 'medium') as 'high' | 'medium' | 'low',
    });

    const tryParse = (json: string): ReconExtractedItem[] | null => {
      try {
        const arr = JSON.parse(json);
        if (Array.isArray(arr) && arr.length > 0) {
          return arr
            .filter((item: Record<string, string>) => {
              const cond = (item.condition || '').toLowerCase();
              return cond.length > 2 && !GENERIC_STANDALONE_TERMS.has(cond);
            })
            .map(mapItem);
        }
      } catch { /* parse failed */ }
      return null;
    };

    const result = tryParse(jsonMatch[0]);
    if (result) return result;

    console.warn('[RecordsRecon] JSON parse failed — attempting cleanup...');
    const fixedJson = jsonMatch[0]
      .replace(/,\s*}/g, '}')
      .replace(/,\s*\]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, ' ');
    const fixedResult = tryParse(fixedJson);
    if (fixedResult) return fixedResult;

    console.warn('[RecordsRecon] JSON cleanup also failed — falling through to text parser');
  }

  // Strategy 2: Parse numbered text list (backward compat)
  const hasNumberedItems = /^\d+\.\s/m.test(rawText);
  if (!hasNumberedItems) return [];

  const items: ReconExtractedItem[] = [];
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
    const catMatch = block.match(/[Cc]ategory[:\s]+([^\n]+)/);

    items.push({
      itemId: `recon_${firstLine.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${items.length}`,
      condition: firstLine,
      category: catMatch?.[1]?.trim() || mapToCategory(firstLine),
      excerpt,
      dateFound: dateMatch?.[1]?.trim().replace(/[,\s]+$/, '') || null,
      pageNumber: pageMatch?.[1] ? parseInt(pageMatch[1]) : null,
      sectionFound: null,
      provider: null,
      confidence,
    });
  }

  return items;
}

// ─── Parse Phase 2b Structuring Output ────────────────────────────────────────

function parseStructuringOutput(rawText: string): {
  documentSummary: ReconDocumentSummary;
  timeline: ReconTimelineEntry[];
  conditionsIndex: ReconCondition[];
  keywordFrequency: ReconKeywordFrequency[];
} | null {
  if (!rawText) return null;

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const ds = parsed.document_summary || {};
    const documentSummary: ReconDocumentSummary = {
      totalPagesReferenced: ds.total_pages_referenced || 0,
      dateRange: {
        earliest: ds.date_range?.earliest || null,
        latest: ds.date_range?.latest || null,
      },
      documentTypesDetected: ds.document_types_detected || [],
      providersFound: ds.providers_found || [],
    };

    const timeline: ReconTimelineEntry[] = (parsed.timeline || []).map((t: Record<string, unknown>) => ({
      date: t.date || null,
      page: t.page ? Number(t.page) : null,
      section: t.section || null,
      provider: t.provider || null,
      entry: String(t.entry || ''),
      category: String(t.category || 'Other'),
    }));

    const conditionsIndex: ReconCondition[] = (parsed.conditions_index || []).map((c: Record<string, unknown>) => ({
      condition: String(c.condition || ''),
      category: String(c.category || 'Other'),
      firstMentionDate: c.first_mention_date || null,
      firstMentionPage: c.first_mention_page ? Number(c.first_mention_page) : null,
      mentionCount: Number(c.mention_count || 1),
      pagesFound: (c.pages_found as number[]) || [],
      excerpts: ((c.excerpts as Array<Record<string, unknown>>) || []).map(e => ({
        text: String(e.text || ''),
        page: e.page ? Number(e.page) : null,
        date: (e.date as string) || null,
      })),
    }));

    const keywordFrequency: ReconKeywordFrequency[] = (parsed.keyword_frequency || []).map((k: Record<string, unknown>) => ({
      term: String(k.term || ''),
      count: Number(k.count || 1),
    }));

    return { documentSummary, timeline, conditionsIndex, keywordFrequency };
  } catch (err) {
    console.warn('[RecordsRecon] Structuring parse failed:', (err as Error).message);
    return null;
  }
}

// ─── Build Structured Report from Raw Items (fallback if Phase 2b fails) ──────

function buildReconReportFromItems(
  items: ReconExtractedItem[],
  filesProcessed: number,
  processingTime: number,
  aiModel: string,
  synopsis?: ScanSynopsis,
  isInterim?: boolean,
  interimNote?: string,
): ReconReport {
  // Build timeline from raw items (sorted by date), deduplicated by content
  const rawTimeline: ReconTimelineEntry[] = items
    .map(item => ({
      date: item.dateFound,
      page: item.pageNumber,
      section: item.sectionFound,
      provider: item.provider,
      entry: item.excerpt.substring(0, 200),
      category: item.category,
    }))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

  // Deduplicate timeline entries by date+page+excerpt (category excluded so the
  // same verbatim excerpt isn't repeated once per condition category)
  const timelineSeen = new Set<string>();
  const timeline: ReconTimelineEntry[] = rawTimeline.filter(entry => {
    const key = `${entry.date || ''}|${entry.page || ''}|${entry.entry.toLowerCase().substring(0, 80)}`;
    if (timelineSeen.has(key)) return false;
    timelineSeen.add(key);
    return true;
  });

  // Build conditions index from raw items
  const condMap = new Map<string, ReconCondition>();
  for (const item of items) {
    const key = item.condition.toLowerCase();
    const existing = condMap.get(key);
    if (existing) {
      existing.mentionCount++;
      if (item.pageNumber && !existing.pagesFound.includes(item.pageNumber)) {
        existing.pagesFound.push(item.pageNumber);
      }
      existing.excerpts.push({ text: item.excerpt, page: item.pageNumber, date: item.dateFound });
    } else {
      condMap.set(key, {
        condition: item.condition,
        category: item.category,
        firstMentionDate: item.dateFound,
        firstMentionPage: item.pageNumber,
        mentionCount: 1,
        pagesFound: item.pageNumber ? [item.pageNumber] : [],
        excerpts: [{ text: item.excerpt, page: item.pageNumber, date: item.dateFound }],
      });
    }
  }
  const conditionsIndex = Array.from(condMap.values());

  // Build keyword frequency
  const keywordFrequency = conditionsIndex
    .map(c => ({ term: c.condition, count: c.mentionCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Build document summary
  const allPages = items.map(i => i.pageNumber).filter((p): p is number => p !== null);
  const allDates = items.map(i => i.dateFound).filter((d): d is string => d !== null).sort();
  const providerSet = new Set(items.map(i => i.provider).filter((p): p is string => p !== null));
  const allProviders = Array.from(providerSet);

  const documentSummary: ReconDocumentSummary = {
    totalPagesReferenced: new Set(allPages).size,
    dateRange: {
      earliest: allDates[0] || null,
      latest: allDates[allDates.length - 1] || null,
    },
    documentTypesDetected: [],
    providersFound: allProviders,
  };

  return {
    disclaimer: DISCLAIMER,
    summary: items.length > 0
      ? `${items.length} condition(s) extracted and organized from ${filesProcessed} document(s). This is a structured summary of what was found in your records.`
      : `No conditions were extracted from the ${filesProcessed} document(s) processed. Consider uploading additional records for a more thorough scan.`,
    documentSummary,
    timeline,
    conditionsIndex,
    keywordFrequency,
    extractedItems: items,
    processingDetails: { filesProcessed, processingTime, aiModel },
    scanSynopsis: synopsis,
    isInterim,
    interimNote,
  };
}

// ─── Build Structured Report from Phase 2b Output ─────────────────────────────

function buildReconReport(
  items: ReconExtractedItem[],
  structured: {
    documentSummary: ReconDocumentSummary;
    timeline: ReconTimelineEntry[];
    conditionsIndex: ReconCondition[];
    keywordFrequency: ReconKeywordFrequency[];
  },
  filesProcessed: number,
  processingTime: number,
  aiModel: string,
  synopsis?: ScanSynopsis,
): ReconReport {
  // Deduplicate timeline entries from Phase 2b output (category excluded so the
  // same verbatim excerpt isn't repeated once per condition category)
  const tlSeen = new Set<string>();
  const dedupedTimeline = structured.timeline.filter(entry => {
    const key = `${entry.date || ''}|${entry.page || ''}|${(entry.entry || '').toLowerCase().substring(0, 80)}`;
    if (tlSeen.has(key)) return false;
    tlSeen.add(key);
    return true;
  });

  return {
    disclaimer: DISCLAIMER,
    summary: items.length > 0
      ? `${items.length} condition(s) extracted and organized from ${filesProcessed} document(s). This is a structured summary of what was found in your records.`
      : `No conditions were extracted from the ${filesProcessed} document(s) processed. Consider uploading additional records for a more thorough scan.`,
    documentSummary: structured.documentSummary,
    timeline: dedupedTimeline,
    conditionsIndex: structured.conditionsIndex,
    keywordFrequency: structured.keywordFrequency,
    extractedItems: items,
    processingDetails: { filesProcessed, processingTime, aiModel },
    scanSynopsis: synopsis,
  };
}

// ─── Keyword Flags → ReconExtractedItems (interim fallback) ──────────────────

function keywordFlagsToReconItems(flags: KeywordFlag[]): ReconExtractedItem[] {
  return flags.map((f, i) => ({
    itemId: `kw_${f.condition.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 25)}_${i}`,
    condition: f.condition,
    category: mapToCategory(f.condition),
    excerpt: f.excerpt,
    dateFound: f.dateFound || null,
    pageNumber: f.pageNumber || null,
    sectionFound: f.sectionFound || null,
    provider: null,
    confidence: f.confidence,
  }));
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateItems(items: ReconExtractedItem[]): ReconExtractedItem[] {
  const seen = new Map<string, ReconExtractedItem>();
  for (const item of items) {
    const key = normalizeConditionName(item.condition);
    const existing = seen.get(key);
    if (!existing ||
        (item.confidence === 'high' && existing.confidence !== 'high') ||
        (item.confidence === existing.confidence && item.excerpt.length > existing.excerpt.length)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

// ─── Grok API ─────────────────────────────────────────────────────────────────

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
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens, stream: true }),
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
    console.warn(`[RecordsRecon] ${label} streaming failed: ${error.message}`);
    throw error;
  }
}

async function synthesizeExtraction(
  filteredText: string,
  fileNames: string,
  onProgress?: (tokenCount: number, maxTokens: number) => void,
): Promise<string> {
  return callGrokAPIStreaming(
    MODEL_EXTRACT,
    [
      { role: 'system', content: EXTRACTION_PROMPT },
      { role: 'user', content: `Documents: "${fileNames}"\n\nPre-filtered medical record excerpts (high-signal paragraphs only):\n\n${filteredText}` },
    ],
    SYNTHESIS_TIMEOUT_MS,
    IDLE_TIMEOUT_MS,
    'Extraction (fast)',
    3_000,
    onProgress,
  );
}

async function synthesizeStructuring(
  rawItems: ReconExtractedItem[],
  onProgress?: (tokenCount: number, maxTokens: number) => void,
  model: string = MODEL_STRUCTURE,
): Promise<string> {
  const itemsSummary = rawItems.map(item => ({
    condition: item.condition,
    excerpt: item.excerpt,
    page: item.pageNumber,
    sectionFound: item.sectionFound,
    date: item.dateFound,
    doctorName: item.provider,
    category: item.category,
    confidence: item.confidence,
  }));

  return callGrokAPIStreaming(
    model,
    [
      { role: 'system', content: STRUCTURING_PROMPT },
      { role: 'user', content: JSON.stringify(itemsSummary) },
    ],
    SYNTHESIS_TIMEOUT_MS,
    IDLE_TIMEOUT_MS,
    model.includes('reasoning') ? 'Structuring (reasoning)' : 'Structuring (fallback)',
    3_000,
    onProgress,
  );
}

// ─── Parallel Chunked Extraction ──────────────────────────────────────────────

async function parallelExtraction(
  filteredText: string,
  fileNames: string,
  emit: (event: object) => void,
  phaseStartPct: number,
  phaseEndPct: number,
): Promise<{ items: ReconExtractedItem[]; succeeded: boolean }> {
  const chunks = chunkFilteredText(filteredText, MAX_PARALLEL_CHUNKS, CHARS_PER_CHUNK);
  const numChunks = chunks.length;

  emit({
    type: 'progress',
    message: `Phase 2a: Extracting conditions across ${numChunks} parallel stream${numChunks > 1 ? 's' : ''}...`,
    percent: phaseStartPct,
    phase: 'extraction',
  });

  const completedCount = { n: 0 };

  const extractionPromises = chunks.map(async (chunk, i) => {
    try {
      const onProgress = i === 0 ? (tc: number, mt: number) => {
        const pct = phaseStartPct + Math.round((tc / mt) * (phaseEndPct - phaseStartPct) * 0.8);
        emit({
          type: 'progress',
          message: `Phase 2a: Extracting — ${tc} tokens (${numChunks} stream${numChunks > 1 ? 's' : ''})...`,
          percent: Math.min(pct, phaseEndPct - 5),
          phase: 'extraction',
        });
      } : undefined;

      const output = await synthesizeExtraction(chunk, fileNames, onProgress);

      completedCount.n++;
      if (numChunks > 1) {
        emit({
          type: 'progress',
          message: `Phase 2a: ${completedCount.n}/${numChunks} streams complete...`,
          percent: phaseStartPct + Math.round((completedCount.n / numChunks) * (phaseEndPct - phaseStartPct)),
          phase: 'extraction',
        });
      }

      if (output) {
        const items = parseExtractionOutput(output);
        for (const item of items) {
          if (!item.dateFound && item.excerpt) {
            const fallbackDate = extractDateFromText(item.excerpt);
            if (fallbackDate) item.dateFound = fallbackDate;
          }
          if (!item.provider && item.excerpt) {
            const fallbackProvider = extractProviderFromText(item.excerpt);
            if (fallbackProvider) item.provider = fallbackProvider;
          }
        }
        return items;
      }
      return [];
    } catch (err) {
      console.warn(`[RecordsRecon] Chunk ${i + 1}/${numChunks} extraction failed:`, (err as Error).message);
      return [];
    }
  });

  const results = await Promise.all(extractionPromises);
  const allItems = results.flat();
  const succeeded = allItems.length > 0 || completedCount.n > 0;

  return { items: deduplicateItems(allItems), succeeded };
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
            ? retryFilteredText.substring(0, RETRY_CHAR_CAP)
            : retryFilteredText;

          try {
            const result = await parallelExtraction(textForSynthesis, retryFileNames, emit, 30, 60);
            const items = result.items;

            if (items.length > 0) {
              emit({ type: 'progress', message: `Phase 2b: Organizing ${items.length} conditions...`, percent: 65, phase: 'structuring' });
              try {
                const structOutput = await synthesizeStructuring(items, (tc, mt) => {
                  const pct = 65 + Math.round((tc / mt) * 25);
                  emit({ type: 'progress', message: `Phase 2b: Organizing — ${tc} tokens...`, percent: Math.min(pct, 90), phase: 'structuring' });
                });
                const structured = structOutput ? parseStructuringOutput(structOutput) : null;
                if (structured) {
                  emit({ type: 'progress', message: `Complete — ${items.length} condition(s) organized`, percent: 95, phase: 'structuring_done' });
                  emit({ type: 'complete', report: buildReconReport(items, structured, 1, Date.now() - startTime, `${MODEL_EXTRACT} + ${MODEL_STRUCTURE}`, retrySynopsis), percent: 100 });
                } else {
                  emit({ type: 'complete', report: buildReconReportFromItems(items, 1, Date.now() - startTime, MODEL_EXTRACT, retrySynopsis), percent: 100 });
                }
              } catch {
                emit({ type: 'complete', report: buildReconReportFromItems(items, 1, Date.now() - startTime, MODEL_EXTRACT, retrySynopsis), percent: 100 });
              }
            } else {
              // Fall back to keyword flags if parallel extraction found nothing
              if (retryKeywordFlags.length > 0) {
                const interim = deduplicateItems(keywordFlagsToReconItems(retryKeywordFlags));
                emit({ type: 'complete', report: buildReconReportFromItems(interim, 1, Date.now() - startTime, 'keyword pre-filter', retrySynopsis, true, 'Extraction found no conditions — showing keyword-detected items. Click Retry to try again.'), percent: 100 });
              } else {
                emit({ type: 'complete', report: buildReconReportFromItems([], 1, Date.now() - startTime, MODEL_EXTRACT, retrySynopsis), percent: 100 });
              }
            }
          } catch (retryErr) {
            if ((retryErr as Error).name === 'GrokTimeoutError') {
              const interim = deduplicateItems(keywordFlagsToReconItems(retryKeywordFlags));
              emit({ type: 'complete', report: buildReconReportFromItems(interim, 1, Date.now() - startTime, 'keyword pre-filter', retrySynopsis, true, 'Extraction timed out — showing keyword-detected items. Click Retry to try again.'), percent: 100 });
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

        emit({ type: 'progress', message: 'Starting Records Recon...', percent: 2, phase: 'init' });

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

        // ── Fail-fast: image-only / scanned PDFs with no searchable text ──
        const pureTextDensity = allFilteredText.replace(/\s+/g, '').replace(/<<<PAGE\s*\d+>>>/g, '').length;
        if (pureTextDensity < 50) {
          emit({
            type: 'error',
            message: 'This PDF appears to be image-only (scanned) with no searchable text. Records Recon currently requires text-searchable PDFs — such as VA Blue Button exports, MyHealtheVet downloads, or standard digital medical records. If your document is a scanned image, try using your device\'s OCR tool first, then re-upload.',
          });
          try { controller.close(); } catch { /* already closed */ }
          return;
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

        // ═══ PHASE 2a: Parallel Chunked Extraction ═══
        const fileNames = files.map(f => f.name).join(', ');
        let rawItems: ReconExtractedItem[] = [];
        let extractionSucceeded = false;

        if (allFilteredText.length > 50) {
          const result = await parallelExtraction(allFilteredText, fileNames, emit, 30, 55);
          rawItems = result.items;
          extractionSucceeded = result.succeeded;
        }

        // ═══ PHASE 2b: Structuring ═══
        let finalItems: ReconExtractedItem[] = [];

        if (extractionSucceeded && rawItems.length > 0) {
          finalItems = deduplicateItems(rawItems);
          emit({ type: 'progress', message: `Phase 2b: Organizing ${finalItems.length} conditions into structured summary...`, percent: 60, phase: 'structuring' });

          const structuringModels = [MODEL_STRUCTURE, MODEL_FALLBACK];
          let structured: ReturnType<typeof parseStructuringOutput> = null;

          for (let attempt = 0; attempt < structuringModels.length; attempt++) {
            try {
              const structOutput = await synthesizeStructuring(finalItems, (tc, mt) => {
                const pct = 60 + Math.round((tc / mt) * 30);
                emit({ type: 'progress', message: `Phase 2b: Organizing — ${tc} tokens...`, percent: Math.min(pct, 90), phase: 'structuring' });
              }, structuringModels[attempt]);

              if (structOutput) {
                structured = parseStructuringOutput(structOutput);
                if (structured) break;
              }
            } catch (err) {
              if ((err as Error).name === 'GrokTimeoutError') {
                console.warn(`[RecordsRecon] Structuring attempt ${attempt + 1} timed out (${structuringModels[attempt]})`);
              } else { throw err; }
            }
          }

          emit({ type: 'progress', message: `Complete — ${finalItems.length} condition(s) organized`, percent: 95, phase: 'structuring_done' });

          if (structured) {
            emit({
              type: 'complete',
              report: buildReconReport(finalItems, structured, files.length, Date.now() - startTime, `${MODEL_EXTRACT} + ${MODEL_STRUCTURE}`, synopsis),
              percent: 100,
            });
          } else {
            // Structuring failed — build report from raw items
            emit({
              type: 'complete',
              report: buildReconReportFromItems(finalItems, files.length, Date.now() - startTime, MODEL_EXTRACT, synopsis, false, 'Organized using extraction data (structuring phase skipped).'),
              percent: 100,
            });
          }
        } else if (!extractionSucceeded) {
          // Fall back to keyword flags
          if (allKeywordFlags.length > 0) {
            finalItems = deduplicateItems(keywordFlagsToReconItems(allKeywordFlags));
          }
          emit({
            type: 'complete',
            report: buildReconReportFromItems(
              finalItems, files.length, Date.now() - startTime,
              'keyword pre-filter (Extraction Paused)', synopsis, true,
              'Extraction timed out — showing keyword-detected items. Click "Retry" for another attempt.'
            ),
            percent: 100,
          });
        } else {
          // Extraction succeeded but found nothing
          emit({
            type: 'complete',
            report: buildReconReportFromItems([], files.length, Date.now() - startTime, MODEL_EXTRACT, synopsis),
            percent: 100,
          });
        }

      } catch (err) {
        // Determine which phase failed based on current progress state
        const error = err as Error;
        let phaseLabel = 'Unknown phase';
        const errMsg = error.message || 'Processing failed.';

        if (errMsg.includes('Extraction')) {
          phaseLabel = 'Phase 2a: Extraction';
        } else if (errMsg.includes('Structuring')) {
          phaseLabel = 'Phase 2b: Structuring';
        } else if (errMsg.includes('pdf-parse') || errMsg.includes('PDF') || errMsg.includes('extractPDF')) {
          phaseLabel = 'Phase 1: PDF Text Extraction';
        } else if (errMsg.includes('Pre-filter') || errMsg.includes('filter')) {
          phaseLabel = 'Phase 1: Pre-Filter';
        } else if (errMsg.includes('API') || errMsg.includes('timed out')) {
          phaseLabel = 'Phase 2: AI Processing';
        }

        console.error(`[RecordsRecon] ${phaseLabel} failed:`, errMsg, error.stack?.substring(0, 300));
        emit({
          type: 'error',
          message: `${phaseLabel} encountered an error: ${errMsg}`,
          phase: phaseLabel,
        });
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
