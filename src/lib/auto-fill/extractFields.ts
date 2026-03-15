/**
 * extractFields.ts — DD-214 field extraction utility (client-side only)
 *
 * Accepts raw text extracted by pdfjs-dist (PDF) or Tesseract.js (image/photo).
 * Returns a SeaBagData object. Raw text is never stored — only the structured result is.
 *
 * PRIVACY: SSN field (box 3 on DD-214) pattern is intentionally absent.
 *          No PII beyond the fields listed below is ever read or returned.
 */

export interface SeaBagData {
  fullName:        string | null;
  branch:          string | null;
  entryDate:       string | null;  // YYYY-MM-DD or freeform if format unclear
  separationDate:  string | null;
  mos:             string | null;
  characterOfDischarge: string | null;
  awards:          string | null;
  yearsOfService:  string | null;  // computed from dates if available
  lastUpdated:     string;         // ISO timestamp
  source:          'pdf' | 'image' | 'manual';
}

// ─── Branch normalization ─────────────────────────────────────────────────────

const BRANCH_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /army national guard/i,           value: 'Army National Guard' },
  { pattern: /air national guard/i,            value: 'Air National Guard' },
  { pattern: /marine corps|marines|usmc/i,     value: 'Marine Corps' },
  { pattern: /coast guard|uscg/i,              value: 'Coast Guard' },
  { pattern: /space force|ussf/i,              value: 'Space Force' },
  { pattern: /air force|usaf/i,                value: 'Air Force' },
  { pattern: /navy|usn\b/i,                    value: 'Navy' },
  { pattern: /army|usa\b/i,                    value: 'Army' },
];

function normalizeBranch(raw: string): string {
  const cleaned = raw.trim();
  for (const { pattern, value } of BRANCH_PATTERNS) {
    if (pattern.test(cleaned)) return value;
  }
  return cleaned;
}

// ─── Discharge character normalization ───────────────────────────────────────

const DISCHARGE_PATTERNS: { pattern: RegExp; value: string }[] = [
  { pattern: /general.*honorable|under honorable conditions/i, value: 'General (Under Honorable Conditions)' },
  { pattern: /other than honorable|oth\b/i,                    value: 'Other Than Honorable' },
  { pattern: /bad conduct|bcd\b/i,                             value: 'Bad Conduct' },
  { pattern: /dishonorable/i,                                   value: 'Dishonorable' },
  { pattern: /uncharacterized/i,                                value: 'Uncharacterized' },
  { pattern: /honorable/i,                                      value: 'Honorable' },
];

function normalizeDischarge(raw: string): string {
  const cleaned = raw.trim();
  for (const { pattern, value } of DISCHARGE_PATTERNS) {
    if (pattern.test(cleaned)) return value;
  }
  return cleaned;
}

// ─── Date normalization ───────────────────────────────────────────────────────

function normalizeDate(raw: string): string | null {
  const cleaned = raw.trim().replace(/\s+/g, ' ');

  // YYYYMMDD
  const compact = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;

  // DD MMM YYYY (e.g., 15 JAN 2010)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const dmy = cleaned.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dmy) {
    const m = monthNames[dmy[2].toLowerCase()];
    if (m) return `${dmy[3]}-${m}-${dmy[1].padStart(2, '0')}`;
  }

  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  return cleaned || null;
}

// ─── Years of service computation ────────────────────────────────────────────

function computeYearsOfService(entry: string | null, separation: string | null): string | null {
  if (!entry || !separation) return null;
  try {
    const start = new Date(entry);
    const end   = new Date(separation);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const diffMs     = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    const totalMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    const years  = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
  } catch {
    return null;
  }
}

// ─── Field extraction regex patterns ─────────────────────────────────────────

function extractAfterLabel(text: string, labelPattern: RegExp, maxLen = 80): string | null {
  const match = text.match(labelPattern);
  if (!match) return null;
  const afterLabel = text.slice(match.index! + match[0].length);
  // Take up to maxLen chars or up to next label-like pattern
  const snippet = afterLabel.slice(0, maxLen).split(/\n/)[0].trim();
  return snippet || null;
}

// ─── Main extraction function ─────────────────────────────────────────────────

export function extractFields(rawText: string, source: SeaBagData['source']): SeaBagData {
  // Normalize whitespace and newlines
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Full Name (Box 1: LAST, FIRST, MIDDLE) ────────────────────────────────
  // DD-214 box 1 label: "1. NAME (Last, First, Middle)"
  let fullName: string | null = null;
  const namePatterns = [
    /1\.\s*NAME[^a-z\n]*\n([^\n]{2,60})/i,
    /NAME\s*(?:\(Last.*?\))?\s*\n([A-Z][^\n]{1,60})/i,
    /LAST\s*,?\s*FIRST\s*,?\s*MIDDLE[^\n]*\n([^\n]{2,60})/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { fullName = m[1].trim().replace(/\s+/g, ' '); break; }
  }

  // ── Branch of Service (Box 12b / 24) ──────────────────────────────────────
  let branch: string | null = null;
  const branchPatterns = [
    /BRANCH\s+OF\s+SERVICE[^a-z\n]*\n([^\n]{2,40})/i,
    /(?:12b\.?|24\.?)\s*BRANCH[^\n]*\n([^\n]{2,40})/i,
    /COMPONENT\s*\n([^\n]{2,40})/i,
  ];
  for (const p of branchPatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { branch = normalizeBranch(m[1].trim()); break; }
  }
  // Fallback: scan for branch keywords in first 500 chars
  if (!branch) {
    const head = text.slice(0, 500);
    for (const { pattern, value } of BRANCH_PATTERNS) {
      if (pattern.test(head)) { branch = value; break; }
    }
  }

  // ── Entry Date (Box 12c: DATE ENTERED ACTIVE DUTY) ────────────────────────
  let entryDate: string | null = null;
  const entryPatterns = [
    /DATE\s+ENTERED\s+(?:ACTIVE\s+DUTY|SERVICE)[^a-z\n]*[\n\s]+(\d[\d\s\/\-A-Za-z]{5,12})/i,
    /(?:12c\.?)\s*DATE[^\n]*\n([^\n]{5,20})/i,
    /ENTRY\s+DATE[^\n]*\n([^\n]{5,20})/i,
  ];
  for (const p of entryPatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { entryDate = normalizeDate(m[1].trim()); break; }
  }

  // ── Separation Date (Box 12d / 17) ────────────────────────────────────────
  let separationDate: string | null = null;
  const sepPatterns = [
    /DATE\s+OF\s+SEPARATION[^a-z\n]*[\n\s]+(\d[\d\s\/\-A-Za-z]{5,12})/i,
    /SEPARATION\s+DATE[^\n]*[\n\s]+(\d[\d\s\/\-A-Za-z]{5,12})/i,
    /(?:12d\.?)\s*DATE[^\n]*\n([^\n]{5,20})/i,
  ];
  for (const p of sepPatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { separationDate = normalizeDate(m[1].trim()); break; }
  }

  // ── MOS / Rate / Specialty (Box 11: PRIMARY SPECIALTY) ───────────────────
  let mos: string | null = null;
  const mosPatterns = [
    /(?:11\.?|PRIMARY\s+)SPECIALTY[^a-z\n]*\n([^\n]{2,80})/i,
    /MOS[^a-z\n]*\n([^\n]{2,60})/i,
    /OCCUPATIONAL\s+SPECIALTY[^\n]*\n([^\n]{2,80})/i,
    /RATE\/MOS\/AFSC[^\n]*\n([^\n]{2,60})/i,
  ];
  for (const p of mosPatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { mos = m[1].trim().replace(/\s+/g, ' ').slice(0, 80); break; }
  }

  // ── Character of Discharge (Box 24 / 28) ──────────────────────────────────
  // NOTE: SSN (Box 3) is intentionally NOT extracted — pattern excluded
  let characterOfDischarge: string | null = null;
  const dischargePatterns = [
    /CHARACTER\s+OF\s+(?:SERVICE|DISCHARGE)[^a-z\n]*\n([^\n]{2,60})/i,
    /(?:24\.?|28\.?)\s*CHARACTER[^\n]*\n([^\n]{2,60})/i,
    /TYPE\s+OF\s+SEPARATION[^\n]*\n([^\n]{2,60})/i,
  ];
  for (const p of dischargePatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) { characterOfDischarge = normalizeDischarge(m[1].trim()); break; }
  }

  // ── Awards / Decorations (Box 13) ────────────────────────────────────────
  let awards: string | null = null;
  const awardsPatterns = [
    /(?:13\.?)?\s*DECORATIONS[,\s]+MEDALS[^\n]*\n([\s\S]{2,300}?)(?=\n\d+\.|$)/i,
    /AWARDS?\s+AND\s+DECORATIONS[^\n]*\n([^\n]{2,200})/i,
    /MEDALS[^\n]*\n([^\n]{2,200})/i,
  ];
  for (const p of awardsPatterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) {
      awards = m[1].trim().replace(/\s+/g, ' ').slice(0, 300);
      break;
    }
  }

  // ── Compute Years of Service ──────────────────────────────────────────────
  const yearsOfService = computeYearsOfService(entryDate, separationDate);

  return {
    fullName,
    branch,
    entryDate,
    separationDate,
    mos,
    characterOfDischarge,
    awards,
    yearsOfService,
    lastUpdated: new Date().toISOString(),
    source,
  };
}

export const SEA_BAG_KEY = 'vet1stop_sea_bag';
