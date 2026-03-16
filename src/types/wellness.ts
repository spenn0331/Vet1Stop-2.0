// ─── Wellness Shared Types ────────────────────────────────────────────────────

export interface WellnessScores {
  mood:   number;
  energy: number;
  sleep:  number;
  pain:   number;
  social: number;
}

export interface WellnessEntry {
  date:    string;
  scores:  WellnessScores;
  notes:   string;
  savedAt: string;
}

// ─── Veteran Wellness Profile (for NVWI cohort bucketing) ────────────────────

export type VetEra    = 'post-9/11' | 'gulf-war' | 'vietnam' | 'korea' | 'other' | 'unknown';
export type VetBranch = 'army' | 'navy' | 'marines' | 'air-force' | 'space-force' | 'coast-guard' | 'national-guard' | 'reserves' | 'unknown';
export type AgeDecade = '20s' | '30s' | '40s' | '50s' | '60s' | '70s+' | 'unknown';
export type USRegion  = 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'pacific' | 'unknown';

export interface WellnessProfile {
  era:       VetEra;
  branch:    VetBranch;
  ageDec:    AgeDecade;
  region:    USRegion;
  savedAt:   string;
}

// ─── NVWI (National Veteran Wellness Index) ──────────────────────────────────

export interface NvwiConsent {
  enrolled:       boolean;
  includeWearable: boolean;
  enrolledAt:     string;
}

export interface NvwiScoreField {
  sum:   number;
  count: number;
}

export interface NvwiWearableMetrics {
  hrv_sum:              number;
  hrv_count:            number;
  sleep_duration_sum:   number;
  sleep_count:          number;
  resting_hr_sum:       number;
  resting_hr_count:     number;
}

export interface NvwiCohortUpdate {
  cohort_week:     string;
  era:             VetEra;
  branch:          VetBranch;
  age_decade:      AgeDecade;
  region:          USRegion;
  scores:          Record<keyof WellnessScores, NvwiScoreField>;
  wearable_metrics?: NvwiWearableMetrics;
}

// ─── Wearable Data (Phase B) ─────────────────────────────────────────────────

export type WearablePlatform = 'fitbit' | 'garmin' | 'apple';

export interface WearableData {
  platform:         WearablePlatform;
  date:             string;
  sleepDurationMin: number | null;
  sleepEfficiency:  number | null;
  restingHR:        number | null;
  hrv:              number | null;
  steps:            number | null;
  activeMinutes:    number | null;
  syncedAt:         string;
}

export interface WearableToken {
  platform:     WearablePlatform;
  accessToken:  string;
  refreshToken: string | null;
  expiresAt:    number;
}

// ─── localStorage keys ────────────────────────────────────────────────────────

export const WELLNESS_LOG_KEY     = 'vet1stop_wellness_log'     as const;
export const WELLNESS_PROFILE_KEY = 'vet1stop_wellness_profile' as const;
export const NVWI_CONSENT_KEY     = 'vet1stop_nvwi_consent'     as const;
export const WEARABLE_TOKEN_KEY   = 'vet1stop_wearable_token'   as const;
export const WEARABLE_DATA_KEY    = 'vet1stop_wearable_data'    as const;
export const INSIGHT_CACHE_KEY    = 'vet1stop_insight_cache'    as const;
