/**
 * education-bridge.ts — Smart Bridge types for the Education pillar.
 * School Finder → GI Bill Pathfinder (same localStorage bridge pattern as records-recon).
 * Key: vet1stop_edu_bridge_data
 */

export const EDU_BRIDGE_KEY = 'vet1stop_edu_bridge_data';

export interface EduBridgeData {
  school?: {
    name:    string;
    tuition: number;   // annual out-of-state/private tuition
    state:   string;   // school's state for BAH lookup
  };
  timestamp: string;
}
