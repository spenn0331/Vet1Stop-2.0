import type {
  WellnessEntry,
  WellnessProfile,
  NvwiCohortUpdate,
  VetEra,
  VetBranch,
  AgeDecade,
  USRegion,
} from '@/types/wellness';

// ─── ISO week helper ─────────────────────────────────────────────────────────

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
  const diff = d.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ─── Safe profile defaults ────────────────────────────────────────────────────

const DEFAULT_PROFILE: WellnessProfile = {
  era:      'unknown',
  branch:   'unknown',
  ageDec:   'unknown',
  region:   'unknown',
  savedAt:  '',
};

// ─── Build NVWI cohort update payload ────────────────────────────────────────
// No PII is ever included. Individual records are never stored.
// The server-side handler uses $inc to add to cohort aggregates only.

export function buildCohortUpdate(
  entry:   WellnessEntry,
  profile: WellnessProfile = DEFAULT_PROFILE,
): NvwiCohortUpdate {
  const cohort_week = getISOWeek(entry.date);

  const scores: NvwiCohortUpdate['scores'] = {
    mood:   { sum: entry.scores.mood,   count: 1 },
    energy: { sum: entry.scores.energy, count: 1 },
    sleep:  { sum: entry.scores.sleep,  count: 1 },
    pain:   { sum: entry.scores.pain,   count: 1 },
    social: { sum: entry.scores.social, count: 1 },
  };

  return {
    cohort_week,
    era:        (profile.era    || 'unknown') as VetEra,
    branch:     (profile.branch || 'unknown') as VetBranch,
    age_decade: (profile.ageDec || 'unknown') as AgeDecade,
    region:     (profile.region || 'unknown') as USRegion,
    scores,
  };
}
