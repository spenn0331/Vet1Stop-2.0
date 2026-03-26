import { NextRequest } from 'next/server';
import type {
  FilePayload,
  ReconExtractedItem,
  ReconTimelineEntry,
  ReconCondition,
  ReconKeywordFrequency,
  ReconDocumentSummary,
  ReconReport,
  KeywordFlag,
  ScanSynopsis,
  DetectionSource,
} from '@/types/records-recon';
import {
  CORE_KEYWORDS, KEYWORD_PATTERNS, GENERIC_STANDALONE_TERMS,
  GUARANTEED_SECTIONS, SECTION_HEADERS, SECTION_HEADER_REGEX,
  NOISE_PHRASES, NOISE_REGEX,
  CONDITION_SYNONYMS, normalizeConditionName,
  ABBREV_PATTERNS,
  SYNONYM_CLUSTERS,
  MED_CONDITION_MAP,
  ICD10_REGEX, lookupICD10,
  isNegativeContext, isScreeningFalsePositive,
} from '@/data/records-recon';

/**
 * POST /api/health/records-recon — v5.0 "Records Recon" (Label-Only Architecture)
 *
 * Architecture:
 *   Phase 1: Enhanced Server-Side Extraction (NO AI) — 300+ keywords,
 *            abbreviation map, synonym clusters, medication inference,
 *            ICD-10 lookup, negation detection. Source-tagged conditions.
 *   Phase 2: Label-Only Grok Processing — sends ONLY condition labels +
 *            document metadata to Grok. Grok deduplicates, generates
 *            plain-English summary, adds condition descriptions, flags gaps.
 *            ZERO clinical text, excerpts, or provider names sent to xAI.
 *
 * Upload-only. In-memory processing. Auto-delete after scan. No storage.
 * No claim filing. Zero PHI leaves our stack. Bold disclaimers on every output.
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

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERED_TEXT_CAP = 20_000;
const MAX_PARAGRAPHS_TO_SEND = 100;
const SECTION_GUARANTEE_COUNT = 6;
const SYNTHESIS_TIMEOUT_MS = 90_000;
const IDLE_TIMEOUT_MS = 45_000;
const MIN_PARAGRAPH_LENGTH = 30;
const MIN_KEYWORD_MATCHES_FLAG = 1; // Lowered from 2 — new passes produce high-quality single matches

const MODEL_LABEL = 'grok-4-1-fast-reasoning';
const MODEL_FALLBACK = 'grok-4-0709';

const DISCLAIMER = `Records Recon is a document organizer only. It extracts and structures factual content from records YOU uploaded. It does NOT provide medical advice, legal advice, claims advice, or recommendations. Always consult an accredited VSO representative before making decisions about VA benefits.`;


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

// isNegativeContext and isScreeningFalsePositive are now imported from @/data/records-recon

// ─── Phase 2: Label-Only Processing Prompt (ZERO PHI) ─────────────────────────

const LABEL_PROCESSING_PROMPT = `You are a medical record report generator. You receive ONLY structured condition labels and document metadata — never clinical text, excerpts, or provider names.

Your job:
1. DEDUPLICATE: Merge obvious duplicates (e.g., "PTSD" + "Post-Traumatic Stress Disorder" → keep one canonical name).
2. SUMMARIZE: Generate a plain-English 2-3 sentence report summary from the document stats (page count, date range, condition count, categories represented).
3. DESCRIBE: For each unique condition, add a brief general-knowledge description (1-2 sentences — what is it, is it common in veterans). This is general medical knowledge, NOT interpretation of the veteran's specific records.
4. TIMELINE: Organize conditions chronologically using the page/date metadata provided.
5. GAP FLAG: Note potential related conditions that commonly co-occur but aren't present (e.g., "8 PTSD mentions but no sleep condition noted — sleep disturbance is common with PTSD"). Frame as informational only, never as advice.

LANGUAGE RULES:
NEVER use: should, recommend, file, claim, rating, percentage, likely, nexus, service-connected, presumptive, aggravated, compensable, TDIU, disability, entitled, eligible, qualify, benefits, VA Form, va.gov, DBQ, C&P, diagnostic code, DC, 38 CFR, buddy statement, next step, action, consider filing
OK to use: noted, documented, found, common, frequently, associated with, may co-occur, informational, extracted, identified

OUTPUT — JSON object only:
{
  "summary": "Plain-English 2-3 sentence report summary",
  "deduplicated_conditions": [
    {
      "condition": "Canonical Name",
      "category": "Category",
      "description": "General-knowledge 1-2 sentence description",
      "mentionCount": number,
      "pages": [1,3,7],
      "sections": ["Assessment", "HPI"],
      "dateRange": { "earliest": "YYYY-MM-DD" | null, "latest": "YYYY-MM-DD" | null },
      "source": "keyword|abbrev|synonym|medication|icd10|section",
      "confidence": "high|medium|low"
    }
  ],
  "gap_flags": ["informational note about potentially related conditions"],
  "document_types_inferred": ["Progress Note", "C&P Exam", etc.]
}

Output ONLY valid JSON. No text before or after.`;

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

  // Helper to add a condition flag if not already seen
  const addFlag = (condition: string, confidence: 'high' | 'medium' | 'low', excerpt: string, source: DetectionSource, page: number, section?: string, date?: string) => {
    const key = normalizeConditionName(condition);
    if (seenConditions.has(key)) return;
    seenConditions.add(key);
    keywordFlags.push({
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      confidence,
      excerpt: excerpt.substring(0, 150),
      dateFound: date || extractDateFromText(excerpt),
      pageNumber: page,
      sectionFound: section || undefined,
      source,
    });
  };

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

    const paraDate = sp.nearestDate || extractDateFromText(sp.text);

    // ── Pass 1: Original keyword extraction (source: 'keyword') ──
    if (sp.matchedKeywords.length >= MIN_KEYWORD_MATCHES_FLAG) {
      const specificKeyword = sp.matchedKeywords.find(k => !GENERIC_STANDALONE_TERMS.has(k) && !isNegativeContext(sp.text, k) && !isScreeningFalsePositive(sp.text, k));
      if (specificKeyword) {
        const confidence: 'high' | 'medium' | 'low' =
          sp.matchedKeywords.length >= 3 ? 'high'
          : sp.matchedKeywords.length >= 2 ? 'medium'
          : 'low';
        addFlag(specificKeyword, confidence, sp.text, 'keyword', sp.pageNumber, sp.sectionName, paraDate);
      }
    }

    // ── Pass 2: Abbreviation extraction (source: 'abbrev') ──
    for (const { regex, entry } of ABBREV_PATTERNS) {
      if (entry.isContextFlag) continue; // Skip context flags like h/o, s/p
      if (regex.test(sp.text) && !isNegativeContext(sp.text, entry.fullName)) {
        const sectionConf: 'high' | 'medium' | 'low' = sp.sectionKey ? 'high' : 'medium';
        addFlag(entry.fullName, sectionConf, sp.text, 'abbrev', sp.pageNumber, sp.sectionName, paraDate);
      }
    }

    // ── Pass 3: Synonym cluster extraction (source: 'synonym') ──
    for (const cluster of SYNONYM_CLUSTERS) {
      if (cluster.regex.test(sp.text) && !isNegativeContext(sp.text, cluster.condition)) {
        addFlag(cluster.condition, cluster.confidence, sp.text, 'synonym', sp.pageNumber, sp.sectionName, paraDate);
      }
    }

    // ── Pass 4: Medication inference (source: 'medication') ──
    for (const med of MED_CONDITION_MAP) {
      if (med.regex.test(sp.text)) {
        addFlag(med.condition, med.confidence, sp.text, 'medication', sp.pageNumber, sp.sectionName, paraDate);
      }
    }

    // ── Pass 5: ICD-10 code extraction (source: 'icd10') ──
    const icd10Regex = new RegExp(ICD10_REGEX.source, 'g');
    let icdMatch: RegExpExecArray | null;
    while ((icdMatch = icd10Regex.exec(sp.text)) !== null) {
      const code = icdMatch[1];
      const entry = lookupICD10(code);
      if (entry && !isNegativeContext(sp.text, code)) {
        const icdConf: 'high' | 'medium' | 'low' = sp.sectionKey ? 'high' : 'medium';
        addFlag(entry.name, icdConf, sp.text, 'icd10', sp.pageNumber, sp.sectionName, paraDate);
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

// ─── Parse Label Processing Output (from Grok label-only call) ────────────────

function parseLabelProcessingOutput(rawText: string): {
  summary: string;
  gapFlags: string[];
  documentTypesInferred: string[];
  conditionDescriptions: Map<string, string>;
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
    const descriptions = new Map<string, string>();
    if (Array.isArray(parsed.deduplicated_conditions)) {
      for (const c of parsed.deduplicated_conditions) {
        if (c.condition && c.description) {
          descriptions.set(c.condition.toLowerCase(), c.description);
        }
      }
    }
    return {
      summary: parsed.summary || '',
      gapFlags: Array.isArray(parsed.gap_flags) ? parsed.gap_flags : [],
      documentTypesInferred: Array.isArray(parsed.document_types_inferred) ? parsed.document_types_inferred : [],
      conditionDescriptions: descriptions,
    };
  } catch (err) {
    console.warn('[RecordsRecon] Label processing parse failed:', (err as Error).message);
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
        source: item.source,
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
    source: f.source,
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
      if (response.status === 429) {
        throw new Error('AI network is currently at capacity. Please try scanning again in a few moments.');
      }
      if (response.status === 504) {
        throw new Error('AI network is currently at capacity. Please try scanning again in a few moments.');
      }
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

// ─── Label-Only Grok Call (ZERO PHI) ──────────────────────────────────────────

async function synthesizeLabelProcessing(
  conditions: KeywordFlag[],
  documentStats: { totalPages: number; dateRange: string; sectionsFound: string[]; providerCount: number },
  onProgress?: (tokenCount: number, maxTokens: number) => void,
  model: string = MODEL_LABEL,
): Promise<string> {
  // Build label-only payload — ZERO clinical text, excerpts, or provider names
  const labelPayload = {
    conditions: conditions.map(c => ({
      condition: c.condition,
      category: mapToCategory(c.condition),
      confidence: c.confidence,
      source: c.source || 'keyword',
      page: c.pageNumber || null,
      section: c.sectionFound || null,
      date: c.dateFound || null,
    })),
    documentStats,
  };

  return callGrokAPIStreaming(
    model,
    [
      { role: 'system', content: LABEL_PROCESSING_PROMPT },
      { role: 'user', content: JSON.stringify(labelPayload) },
    ],
    SYNTHESIS_TIMEOUT_MS,
    IDLE_TIMEOUT_MS,
    'Label Processing',
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
        // Retry re-runs label-only Grok call with cached conditions from Phase 1
        const retryKeywordFlags: KeywordFlag[] = body.retryKeywordFlags || [];
        const retrySynopsis: ScanSynopsis | undefined = body.retrySynopsis;

        if (retryKeywordFlags.length > 0 && body.retryLabelOnly) {
          emit({ type: 'progress', message: 'Retrying report generation...', percent: 50, phase: 'label_processing' });

          const retryItems = deduplicateItems(keywordFlagsToReconItems(retryKeywordFlags));
          const allDates = retryKeywordFlags.map(f => f.dateFound).filter((d): d is string => !!d).sort();
          const docStats = {
            totalPages: retrySynopsis?.totalPages || 0,
            dateRange: allDates.length > 0 ? `${allDates[0]} to ${allDates[allDates.length - 1]}` : 'unknown',
            sectionsFound: retrySynopsis?.sectionHeadersFound || [],
            providerCount: 0,
          };

          try {
            const labelOutput = await synthesizeLabelProcessing(retryKeywordFlags, docStats, (tc, mt) => {
              const pct = 50 + Math.round((tc / mt) * 40);
              emit({ type: 'progress', message: `Generating report — ${tc} tokens...`, percent: Math.min(pct, 90), phase: 'label_processing' });
            });

            const labelResult = labelOutput ? parseLabelProcessingOutput(labelOutput) : null;
            const report = buildReconReportFromItems(retryItems, 1, Date.now() - startTime, MODEL_LABEL, retrySynopsis);
            if (labelResult?.summary) report.summary = labelResult.summary;
            emit({ type: 'complete', report, percent: 100 });
          } catch {
            emit({ type: 'complete', report: buildReconReportFromItems(retryItems, 1, Date.now() - startTime, 'enhanced pre-filter', retrySynopsis), percent: 100 });
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
          if (f.size > 15 * 1024 * 1024) {
            emit({ type: 'error', message: `"${f.name}" exceeds 15MB limit. To ensure fast processing, please split your records into smaller batches.` });
            try { controller.close(); } catch { /* already closed */ }
            return;
          }
        }

        emit({ type: 'progress', message: 'Starting Records Recon v5.0...', percent: 2, phase: 'init' });

        // ═══ PHASE 1: Enhanced Server-Side Extraction (NO AI) ═══
        let allFilteredText = '';
        let allKeywordFlags: KeywordFlag[] = [];
        let totalPages = 0;
        let allTotalParagraphs = 0;
        let allKeptParagraphs = 0;
        const allDetectedKeywords = new Set<string>();
        const allDetectedHeaders = new Set<string>();
        const allProviders = new Set<string>();

        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi];
          emit({ type: 'progress', message: `Phase 1: Extracting "${file.name}"...`, percent: 5 + (fi / files.length) * 20, phase: 'filter' });

          if (file.type === 'application/pdf') {
            const { text, numPages } = await extractPDFData(file.data);
            file.data = '';
            totalPages += numPages;

            emit({ type: 'progress', message: `Phase 1: Analyzing "${file.name}" (${numPages} pages)...`, percent: 10 + (fi / files.length) * 20, phase: 'filter' });

            const { filtered, totalParagraphs, keptParagraphs, keywordFlags, detectedKeywords, detectedHeaders } = smartPreFilter(text);
            allFilteredText += (allFilteredText ? '\n\n---\n\n' : '') + filtered;
            allKeywordFlags.push(...keywordFlags);
            allTotalParagraphs += totalParagraphs;
            allKeptParagraphs += keptParagraphs;
            detectedKeywords.forEach(k => allDetectedKeywords.add(k));
            detectedHeaders.forEach(h => allDetectedHeaders.add(h));

            // Extract providers from filtered text (stays server-side)
            for (const line of filtered.split('\n')) {
              const prov = extractProviderFromText(line);
              if (prov) allProviders.add(prov);
            }

            const reductionPct = totalParagraphs > 0 ? Math.round((1 - keptParagraphs / totalParagraphs) * 100) : 0;
            emit({ type: 'file_ready', fileName: file.name, numPages, filteredChunks: keptParagraphs, totalParagraphs, keptParagraphs, reductionPct });

            for (const flag of keywordFlags) {
              emit({ type: 'keyword_flag', flag: { condition: flag.condition, confidence: flag.confidence, excerpt: flag.excerpt.substring(0, 120), source: flag.source } });
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
          message: `Phase 1 complete — ${allKeywordFlags.length} conditions extracted (${overallReductionPct}% noise removed), ${allDetectedKeywords.size} keywords detected`,
          percent: 40,
          phase: 'filter_done',
        });

        emit({
          type: 'scan_cache',
          filteredText: allFilteredText,
          keywordFlags: allKeywordFlags,
          synopsis,
          fileNames: files.map(f => f.name).join(', '),
        });

        // ═══ PHASE 2: Label-Only Grok Processing (ZERO PHI) ═══
        const finalItems = deduplicateItems(keywordFlagsToReconItems(allKeywordFlags));

        if (finalItems.length > 0) {
          emit({ type: 'progress', message: `Phase 2: Generating report for ${finalItems.length} conditions...`, percent: 45, phase: 'label_processing' });

          // Build document stats from server-side data (no PHI leaves the stack)
          const allDates = allKeywordFlags.map(f => f.dateFound).filter((d): d is string => !!d).sort();
          const documentStats = {
            totalPages,
            dateRange: allDates.length > 0 ? `${allDates[0]} to ${allDates[allDates.length - 1]}` : 'unknown',
            sectionsFound: Array.from(allDetectedHeaders),
            providerCount: allProviders.size,
          };

          // Try label-only Grok call with fallback
          const labelModels = [MODEL_LABEL, MODEL_FALLBACK];
          let labelResult: ReturnType<typeof parseLabelProcessingOutput> = null;

          for (let attempt = 0; attempt < labelModels.length; attempt++) {
            try {
              const labelOutput = await synthesizeLabelProcessing(allKeywordFlags, documentStats, (tc, mt) => {
                const pct = 45 + Math.round((tc / mt) * 45);
                emit({ type: 'progress', message: `Phase 2: Generating report — ${tc} tokens...`, percent: Math.min(pct, 90), phase: 'label_processing' });
              }, labelModels[attempt]);

              if (labelOutput) {
                labelResult = parseLabelProcessingOutput(labelOutput);
                if (labelResult) break;
              }
            } catch (err) {
              if ((err as Error).name === 'GrokTimeoutError') {
                console.warn(`[RecordsRecon] Label processing attempt ${attempt + 1} timed out (${labelModels[attempt]})`);
              } else { throw err; }
            }
          }

          // Build final report — server-side excerpts, Grok-enhanced summary
          const report = buildReconReportFromItems(finalItems, files.length, Date.now() - startTime, MODEL_LABEL, synopsis);

          // Merge Grok's label processing enhancements (if available)
          if (labelResult) {
            if (labelResult.summary) report.summary = labelResult.summary;
            if (labelResult.documentTypesInferred.length > 0) {
              report.documentSummary.documentTypesDetected = labelResult.documentTypesInferred;
            }
          }

          emit({ type: 'progress', message: `Complete — ${finalItems.length} condition(s) in report`, percent: 95, phase: 'complete' });
          emit({ type: 'complete', report, percent: 100 });
        } else {
          // No conditions found
          emit({
            type: 'complete',
            report: buildReconReportFromItems([], files.length, Date.now() - startTime, 'enhanced pre-filter', synopsis),
            percent: 100,
          });
        }

      } catch (err) {
        const error = err as Error;
        let phaseLabel = 'Unknown phase';
        const errMsg = error.message || 'Processing failed.';

        if (errMsg.includes('pdf-parse') || errMsg.includes('PDF') || errMsg.includes('extractPDF')) {
          phaseLabel = 'Phase 1: PDF Text Extraction';
        } else if (errMsg.includes('Pre-filter') || errMsg.includes('filter')) {
          phaseLabel = 'Phase 1: Condition Extraction';
        } else if (errMsg.includes('Label') || errMsg.includes('API') || errMsg.includes('timed out')) {
          phaseLabel = 'Phase 2: Report Generation';
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
