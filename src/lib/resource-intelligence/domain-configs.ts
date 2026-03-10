/**
 * domain-configs.ts — Strike 5
 *
 * Per-domain configuration objects. Each resource page plugs in its own
 * config to get domain-specific keyword extraction, DB collection, and tracks.
 *
 * Health: healthResources (190 docs) — VA / NGO / State tracks
 * Education: educationResources — Federal / Scholarship / State (Strike 6)
 * Life: lifeLeisureResources — Housing / Recreation / Financial (Strike 7)
 */

import type { DomainConfig, DomainTrack } from './types';

// ─── PA geo filter (shared by health + life state tracks) ────────────────────

export const PA_GEO_FILTER = {
  $or: [
    { 'location.state': { $regex: 'Pennsylvania|\\bPA\\b', $options: 'i' } },
    { 'location.city':  { $regex: 'Carlisle|Harrisburg|Camp Hill|York|Lancaster', $options: 'i' } },
    { title:            { $regex: 'Pennsylvania|DMVA|Cumberland', $options: 'i' } },
  ],
};

// ─── Health domain (Phase 1 MVP) ─────────────────────────────────────────────

const HEALTH_TRACKS: DomainTrack[] = [
  {
    id:          'va',
    label:       'VA Resources',
    subcategory: 'federal',
  },
  {
    id:          'ngo',
    label:       'Nonprofits',
    subcategory: 'ngo',
  },
  {
    id:          'state',
    label:       'State Resources',
    subcategory: 'state',
    geoFilter:   PA_GEO_FILTER,
  },
];

export const HEALTH_CONFIG: DomainConfig = {
  domain:     'health',
  collection: 'healthResources',
  tracks:     HEALTH_TRACKS,

  knownPhrases: [
    'back pain', 'chronic pain', 'sleep apnea', 'weight loss', 'weight gain',
    'substance use', 'traumatic brain injury', 'hearing loss', 'mental health',
    'physical therapy', 'peer support', 'pain management', 'adaptive sports',
    'sleep issues', 'sleep problems', 'out of shape', 'lack motivation',
    'lack of motivation', 'always tired', 'post traumatic',
  ],

  signalWords: new Set([
    'ptsd', 'tbi', 'pain', 'sleep', 'knee', 'back', 'anxiety', 'depression',
    'fitness', 'weight', 'fatigue', 'tired', 'motivation', 'wellness',
    'counseling', 'therapy', 'yoga', 'nutrition', 'stress', 'trauma',
    'entrepreneur', 'business', 'disability', 'tinnitus', 'diabetes',
  ]),
};

// ─── Education domain (Strike 6 — GI Bill Pathfinder) ────────────────────────

const EDUCATION_TRACKS: DomainTrack[] = [
  { id: 'federal',     label: 'Federal Programs', subcategory: 'federal'     },
  { id: 'scholarship', label: 'Scholarships',      subcategory: 'scholarship' },
  { id: 'state',       label: 'State Programs',    subcategory: 'state', geoFilter: PA_GEO_FILTER },
];

export const EDUCATION_CONFIG: DomainConfig = {
  domain:     'education',
  collection: 'educationResources',
  tracks:     EDUCATION_TRACKS,

  knownPhrases: [
    'gi bill', 'chapter 33', 'chapter 30', 'vocational rehab', 'tuition assistance',
    'financial aid', 'trade school', 'online learning', 'stem degree',
  ],

  signalWords: new Set([
    'school', 'college', 'degree', 'certificate', 'vocational', 'training',
    'university', 'scholarship', 'tuition', 'stem', 'apprenticeship',
  ]),
};

// ─── Life & Leisure domain (Strike 7 — Home Base) ────────────────────────────

const LIFE_TRACKS: DomainTrack[] = [
  { id: 'housing',     label: 'Housing',     subcategory: 'housing'     },
  { id: 'recreation',  label: 'Recreation',  subcategory: 'recreation'  },
  { id: 'financial',   label: 'Financial',   subcategory: 'financial'   },
];

export const LIFE_CONFIG: DomainConfig = {
  domain:     'life',
  collection: 'lifeLeisureResources',
  tracks:     LIFE_TRACKS,

  knownPhrases: [
    'va loan', 'home purchase', 'hud vash', 'space-a travel', 'mwr recreation',
    'property tax', 'veterans preference', 'scra protection',
  ],

  signalWords: new Set([
    'housing', 'moving', 'relocation', 'mortgage', 'lease', 'recreation',
    'mwr', 'fishing', 'hunting', 'camping', 'financial', 'budget', 'legal',
  ]),
};
