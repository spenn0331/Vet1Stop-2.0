// ─── Shared Types for Records Recon ─────────────────────────────────────────
// Centralized type definitions used across:
//   - RecordsReconPanel.tsx (frontend)
//   - BriefingPackExport.tsx (frontend)
//   - route.ts (backend API)
//   - Smart Bridge ecosystem (cross-tool handoff)

export interface ReconExtractedItem {
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

export interface ReconTimelineEntry {
  date: string | null;
  page: number | null;
  section: string | null;
  provider: string | null;
  entry: string;
  category: string;
}

export interface ReconCondition {
  condition: string;
  category: string;
  firstMentionDate: string | null;
  firstMentionPage: number | null;
  mentionCount: number;
  pagesFound: number[];
  excerpts: Array<{ text: string; page: number | null; date: string | null }>;
}

export interface ReconKeywordFrequency {
  term: string;
  count: number;
}

export interface ReconDocumentSummary {
  totalPagesReferenced: number;
  dateRange: { earliest: string | null; latest: string | null };
  documentTypesDetected: string[];
  providersFound: string[];
}

export interface ScanSynopsis {
  totalPages: number;
  totalParagraphs: number;
  keptParagraphs: number;
  reductionPct: number;
  keywordsDetected: string[];
  sectionHeadersFound: string[];
}

export interface ReconReport {
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

// ─── Smart Bridge Types ─────────────────────────────────────────────────────
// Used by the Smart Bridge Ecosystem for cross-tool data handoff.
// Records Recon (Sender Node) → Symptom Finder (Receiver Node)

export interface ConditionPayload {
  condition: string;
  category: string;
  mentionCount: number;
  firstMentionDate: string | null;
  pagesFound: number[];
  sourceModule: 'records-recon';
}

export interface BridgeData {
  conditions: ConditionPayload[];
  sourceModule: string;
  timestamp: string;
  reportSummary: string;
}

// ─── Internal Component Types ───────────────────────────────────────────────

export interface UploadedFile {
  name: string;
  type: string;
  data: string;
  size: number;
  file?: File;
}

export interface ScanCache {
  filteredText: string;
  keywordFlags: Array<{ condition: string; confidence: string; excerpt: string }>;
  synopsis: ScanSynopsis;
  fileNames: string;
}

export type PanelState = 'upload' | 'processing' | 'results' | 'no_items' | 'error';
export type TabId = 'dashboard' | 'timeline' | 'conditions' | 'export';

// ─── Backend-specific Types ─────────────────────────────────────────────────

export interface FilePayload {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface KeywordFlag {
  condition: string;
  confidence: 'high' | 'medium' | 'low';
  excerpt: string;
  dateFound?: string;
  pageNumber?: number;
  sectionFound?: string;
}

// Bridge localStorage key constant
export const BRIDGE_STORAGE_KEY = 'vet1stop_recon_bridge_data';
