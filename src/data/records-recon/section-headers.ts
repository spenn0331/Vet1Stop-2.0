// ─── Section Headers, Guaranteed Sections, Noise Phrases ─────────────────────
// Moved from records-recon/route.ts for config-driven maintainability.
// Edit these arrays to tune Phase 1 filtering without touching pipeline code.

export const GUARANTEED_SECTIONS = [
  'assessment', 'problem list', 'active problems', 'active diagnoses',
  'hpi', 'history of present illness', 'diagnosis', 'diagnoses',
  'plan', 'impression', 'chief complaint',
];

export const SECTION_HEADERS = [
  'assessment:', 'problem list:', 'active problems:', 'diagnosis:',
  'plan:', 'hpi:', 'history of present illness:', 'impression:',
  'clinical notes:', 'active diagnoses:', 'chief complaint:',
  'physical exam:', 'mental status exam:', 'c&p exam',
  'compensation', 'disability benefits questionnaire', 'dbq',
];

export const SECTION_HEADER_REGEX = new RegExp(
  SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

export const NOISE_PHRASES = [
  'appointment scheduled', 'next appointment', 'check-in', 'checked in',
  'no show', 'cancelled appointment', 'refill request', 'medication refill',
  'secure message', 'my healthevet', 'travel reimbursement', 'copay',
  'emergency contact', 'next of kin', 'pharmacy', 'prescription mailed',
  'demographics updated', 'insurance', 'eligibility', 'means test',
  'flu shot', 'covid vaccine', 'immunization', 'routine vital signs',
  'vital signs within normal', 'height:', 'weight:', 'bmi:',
  'intentionally left blank', 'this page intentionally', 'this page left blank',
  'page intentionally left blank', 'blank page',
];

export const NOISE_REGEX = new RegExp(
  NOISE_PHRASES.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);
