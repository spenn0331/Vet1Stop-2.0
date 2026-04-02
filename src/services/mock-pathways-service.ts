// @ts-nocheck
import { Pathway, PathwayStep } from '@/types/pathway';
import { MISSIONS } from '@/data/missions';
import type { MissionStep } from '@/data/missions';

/**
 * Mock service for pathways — driven by missions.ts (single source of truth).
 * Converts Mission → Pathway so PathwayContext and pathway-service work with real data.
 */

function missionStepToPathwayStep(step: MissionStep): PathwayStep {
  return {
    id: step.id,
    title: step.title,
    description: step.description,
    resourceIds: step.ngoPartners.map(p => p.url),
    content: step.keyPoints.join(' • '),
    estimatedTimeMinutes: step.estimatedTimeMinutes,
    order: step.order,
    completed: false,
    detailedContent: step.actionItems.join('\n'),
    relatedResources: step.ngoPartners.map((p, i) => ({
      id: `${step.id}-ngo-${i}`,
      title: p.title,
      description: p.description,
      relevanceScore: 1,
    })),
  };
}

export const getMockPathways = (): Pathway[] => {
  return MISSIONS.map(mission => ({
    id: mission.id,
    title: mission.title,
    description: mission.description,
    targetAudience: mission.targetAudience,
    icon: mission.icon,
    steps: mission.steps.map(missionStepToPathwayStep),
    tags: mission.tags,
    recommendedFor: mission.targetAudience,
    estimatedDuration: mission.estimatedDuration,
    difficulty: mission.difficulty,
    featured: mission.featured,
  }));
};

// ─── Legacy stubs below are replaced by the converter above ───────────────────
// The following dead code is intentionally left as a tombstone comment only.
// Original 8-pathway stubs with "Steps omitted for brevity" have been removed.

// Old pathway IDs → new mission IDs mapping (for any deep-linked URLs still using old IDs)
export const LEGACY_ID_MAP: Record<string, string> = {
  'pathway-1': 'transitioning-healthcare',
  'pathway-2': 'mental-health-ptsd',
  'pathway-3': 'emergency-care',
  'pathway-4': 'womens-health',
  'pathway-5': 'chronic-pain',
  'pathway-6': 'substance-recovery',
  'pathway-7': 'preventive-wellness',
  'pathway-8': 'aging-veterans',
};

