// @ts-nocheck
'use client';

// ─── Premium Feature Registry ─────────────────────────────────────────────────
// Single source of truth for all premium-gated features.
// Wire isPremium() to Stripe/Firebase subscription status when billing goes live.
// For now: reads localStorage flag `vet1stop_premium` (set manually for testing).
//
// ANNOTATION CONVENTION:
// Place  // [PREMIUM: <key>]  on the line just before any premium gate in the codebase.
// Use the exact key strings from PREMIUM_FEATURES below so they're grep-searchable.

// ─── Feature keys ────────────────────────────────────────────────────────────

export const PREMIUM_FEATURES = {
  // Wellness
  wellness_diary_export:        'Wellness: Symptom Diary PDF Export',
  wellness_wearable_sync:       'Wellness: Wearable Device Sync (Fitbit / Garmin / Apple)',
  wellness_correlation_chart:   'Wellness: 30-Day Trend Correlation Chart',
  wellness_insight_cards:       'Wellness: AI Weekly Insight Cards',
  wellness_caregiver_share:     'Wellness: Caregiver / VSO Share Link',

  // Records Recon
  records_recon_unlimited:      'Records Recon: Unlimited Daily Scans',

  // Scribe
  scribe_unlimited:             'Scribe: Unlimited AI Summaries',

  // C&P Prep
  cpp_prep_unlimited:           'C&P Exam Prep: Unlimited AI Sessions',

  // Auto-Fill
  autofill_unlimited:           'Auto-Fill: Unlimited Digital Sea Bag Profiles',

  // Global
  ad_free:                      'Ad-Free Experience',
} as const;

export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURES;

// ─── Free-tier numeric limits ─────────────────────────────────────────────────

export const FREE_TIER_LIMITS: Record<string, number> = {
  records_recon_daily_scans:  3,
  scribe_daily_summaries:     3,
  cpp_prep_daily_sessions:    3,
  autofill_saved_profiles:    1,
};

// ─── Gate check ──────────────────────────────────────────────────────────────

export function isPremium(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('vet1stop_premium') === 'true';
  } catch {
    return false;
  }
}

// PremiumGate React component lives in src/components/shared/PremiumGate.tsx
