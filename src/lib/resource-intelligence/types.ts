// @ts-nocheck
/**
 * types.ts — Strike 5 Resource Intelligence Engine
 *
 * Centralized shared types for all resource domains (Health, Education, Life).
 * Route-level types (RawResource, BridgeCondition, etc.) live here so every
 * domain page imports from one place rather than defining locally.
 */

// Re-export scoring engine types so consumers only need one import path
export type { ScoringContext, ResourceInput, ScoredResource } from '@/lib/resources-scoring';

// ─── Raw resource shape (from MongoDB, before scoring) ────────────────────────

export interface RawResource {
  title: string;
  description: string;
  url: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
  isFree?: boolean;
  costLevel?: 'free' | 'low' | 'moderate' | 'high';
  rating?: number;
  location?: string;
  updatedAt?: string;
}

export interface ScoredRawResource extends RawResource {
  score?: number;
  matchPercent?: number;
  badge?: string | null;
  whyMatches?: string;
  track?: string;
}

// ─── Bridge types (Smart Bridge ecosystem) ───────────────────────────────────

export interface BridgeCondition {
  condition: string;
  category: string;
  mentionCount: number;
}

export interface BridgeContext {
  conditions: BridgeCondition[];
  reportSummary?: string;
  /** Strike 5: veteran's state detected from bridge (Blue Button address) */
  userState?: string;
}

// ─── User profile (parsed from chat text) ────────────────────────────────────

export interface UserProfile {
  isPermanentTotal: boolean;
  hasVaClaim: boolean;
  branch?: string;
  era?: string;
  vaDissatisfied: boolean;
  /** Strike 5: detected US state (lowercase full name, e.g. "pennsylvania") */
  state?: string;
}

// ─── Cross-domain intent hint ─────────────────────────────────────────────────

export interface CrossDomainHint {
  domain: 'careers' | 'education' | 'life' | 'health';
  signal: string;
}

// ─── Domain configuration (pluggable per page) ───────────────────────────────

export interface DomainTrack {
  /** Identifier used in API response (e.g. 'va', 'ngo', 'state') */
  id: string;
  label: string;
  /** MongoDB subcategory value to filter on */
  subcategory: string;
  /** Optional extra MongoDB filter (e.g. geo filter for state track) */
  geoFilter?: Record<string, unknown>;
}

export interface DomainConfig {
  domain: string;
  /** MongoDB collection name (e.g. 'healthResources', 'educationResources') */
  collection: string;
  /** Track definitions — each becomes a tab in the results panel */
  tracks: DomainTrack[];
  /** Compound health/condition phrases detected before single-word splitting */
  knownPhrases: string[];
  /** Single-word health signals kept regardless of length */
  signalWords: Set<string>;
  /** Noise words filtered out from keyword extraction */
  noiseWords?: Set<string>;
}

// ─── Track results from fetchDomainResources ─────────────────────────────────

export type TrackResults = Record<string, RawResource[]>;
