// @ts-nocheck
/**
 * resource-scorer.ts — Strike 5
 *
 * Re-exports all scoring engine functions from resources-scoring.ts.
 * This thin wrapper lets Education and Life pages import from one path
 * (@/lib/resource-intelligence) without touching the core scoring file.
 *
 * The actual scoring logic lives in src/lib/resources-scoring.ts.
 */

export {
  scoreResource,
  scoreAndSortResources,
  buildScoringContext,
  getSuggestedPathway,
  PATHWAY_MAP,
  type ScoringContext,
  type ResourceInput,
  type ScoredResource,
} from '@/lib/resources-scoring';
