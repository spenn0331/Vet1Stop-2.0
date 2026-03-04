'use client';

// All previously flagged junk files have been deleted:
// - src/app/api/health/symptom-finder/route.ts.new  ✓ DELETED
// - src/app/api/health/resources/route.ts.fixed      ✓ DELETED
// - src/app/api/health-resources/route.new.ts        ✓ DELETED

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ShieldCheckIcon,
  HeartIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PaperAirplaneIcon,
  ChevronDownIcon,
  SparklesIcon,
  XMarkIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowRightIcon,
  FireIcon,
  MagnifyingGlassIcon,
  MapIcon,
  FunnelIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  BookmarkIcon as BookmarkSolid,
} from '@heroicons/react/24/solid';
import {
  getSuggestedPathway,
  scoreAndSortResources,
  buildScoringContext,
} from '@/lib/resources-scoring';

// ─── localStorage keys ────────────────────────────────────────────────────────
const SEA_BAG_KEY         = 'vet1stop_sea_bag';
const SYMPTOM_PROFILE_KEY = 'vet1stop_symptom_profile';
// Saved filters key — ONLY used for browse-mode filter presets. NEVER touches sea_bag.
const SAVED_FILTERS_KEY   = 'vet1stop_saved_filters';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceRecommendation {
  track: 'va' | 'ngo' | 'state';
  title: string;
  description: string;
  url: string;
  phone?: string;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
  isFree?: boolean;
  costLevel?: 'free' | 'low' | 'moderate' | 'high';
  rating?: number;
  location?: string | { state?: string; city?: string; region?: string };
  score?: number;
  matchPercent?: number;
  badge?: 'Recommended' | 'Good Match' | null;
  whyMatches?: string;
}

export interface TriageResult {
  aiMessage: string;
  severity?: 'low' | 'moderate' | 'high' | 'crisis';
  recommendations: {
    va: ResourceRecommendation[];
    ngo: ResourceRecommendation[];
    state: ResourceRecommendation[];
  };
  keywords?: string[];
}

interface ResultsPanelProps {
  result: TriageResult;
  onReset: () => void;
}

interface RefineMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ─── Full Browse filters ──────────────────────────────────────────────────────

const BROWSE_FILTERS = ['Fitness', 'Peer', 'Grants', 'Yoga', 'Adaptive', 'Solo'] as const;
type BrowseFilter = (typeof BROWSE_FILTERS)[number];

const FILTER_TAG_MAP: Record<BrowseFilter, string[]> = {
  Fitness:  ['fitness', 'exercise', 'adaptive sports', 'wellness', 'physical therapy'],
  Peer:     ['peer', 'peer-led', 'peer support', 'veteran community'],
  Grants:   ['grant', 'financial assistance', 'scholarship', 'funding', 'benefits'],
  Yoga:     ['yoga', 'mindfulness', 'meditation', 'relaxation'],
  Adaptive: ['adaptive', 'adaptive sports', 'disability', 'accessibility'],
  Solo:     ['self-guided', 'online', 'app', 'telehealth', 'remote', 'solo'],
};

// ─── Pathway modal content ────────────────────────────────────────────────────

interface PathwayStep {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

/**
 * Hardcoded 4-step pathway content for each pathway label (Phase 1 MVP).
 * Language: "Many veterans find this helps with motivation" style only.
 * No clinical advice, no diagnosis language.
 */
const PATHWAY_STEPS: Record<string, PathwayStep[]> = {
  'Back Pain to Shape': [
    {
      icon: <CheckCircleSolid className="h-5 w-5 text-green-500" />,
      title: 'Step 1 — Triage Complete',
      body: "You've already done the hardest part. Many veterans find that simply naming what's going on — back pain, limited mobility, the ache that never goes away — is the first real step. Your matched resources are loaded above.",
    },
    {
      icon: <BookmarkSolid className="h-5 w-5 text-[#EAB308]" />,
      title: 'Step 2 — Save Your Top Picks',
      body: "Review your VA and NGO cards. Many veterans find that saving 2–3 resources to their Sea Bag keeps them from losing track. Tap 'Save to Sea Bag' on any card that feels right for where you are right now — not where you think you should be.",
    },
    {
      icon: <MapPinIcon className="h-5 w-5 text-[#1A2C5B]" />,
      title: 'Step 3 — Local Fitness (VOB Teaser)',
      body: "Veteran-Owned Businesses near Carlisle, PA offer adaptive fitness, yoga, and peer movement programs. Many veterans find working out alongside fellow vets removes the 'gym anxiety' entirely. Our Local VOB Directory (coming soon) will list Carlisle-area options — check back.",
    },
    {
      icon: <UserGroupIcon className="h-5 w-5 text-[#B22234]" />,
      title: 'Step 4 — Buddy Check-In',
      body: "Many veterans find accountability makes all the difference — even one text to a battle buddy changes follow-through. The VA's Whole Health peer coach program requires no appointment to start a conversation.",
      cta: { label: 'Connect with Peer Support →', href: 'https://www.va.gov/wholehealth/' },
    },
  ],
  'Sleep & Recovery Track': [
    {
      icon: <CheckCircleSolid className="h-5 w-5 text-green-500" />,
      title: 'Step 1 — Triage Complete',
      body: "Sleep issues are one of the most common — and most overlooked — health challenges veterans face. Many veterans find that naming the pattern (waking at 0200, hypervigilance, nightmares) helps providers actually respond. Your matched resources are above.",
    },
    {
      icon: <BookmarkSolid className="h-5 w-5 text-[#EAB308]" />,
      title: 'Step 2 — Save Your Top Picks',
      body: "Many veterans find that the VA's MOVE! program and Whole Health sleep resources work best when bookmarked and revisited. Save any card above that addresses sleep, stress, or recovery.",
    },
    {
      icon: <MapPinIcon className="h-5 w-5 text-[#1A2C5B]" />,
      title: 'Step 3 — Local Yoga / Mindfulness',
      body: "Peer-led yoga and mindfulness programs near Carlisle have shown strong results for sleep cycles. Many veterans find group sessions less clinical than individual therapy as a starting point. Local VOB Directory coming soon.",
    },
    {
      icon: <UserGroupIcon className="h-5 w-5 text-[#B22234]" />,
      title: 'Step 4 — Buddy Check-In',
      body: "Many veterans find that telling one person they're working on sleep — even casually — creates enough accountability to follow through. The Veterans Crisis Line is also available for non-crisis support conversations.",
      cta: { label: 'Veterans Crisis Line Support →', href: 'https://www.veteranscrisisline.net/' },
    },
  ],
};

// Fallback steps for any pathway label not in PATHWAY_STEPS
const DEFAULT_PATHWAY_STEPS: PathwayStep[] = [
  {
    icon: <CheckCircleSolid className="h-5 w-5 text-green-500" />,
    title: 'Step 1 — Triage Complete',
    body: "You've mapped your conditions to real resources. Many veterans find this first step is the most important — now you have a clear starting point.",
  },
  {
    icon: <BookmarkSolid className="h-5 w-5 text-[#EAB308]" />,
    title: 'Step 2 — Save Your Top Picks',
    body: "Tap 'Save to Sea Bag' on the cards above that feel most relevant. Many veterans find that having 2–3 saved resources makes it easier to follow through.",
  },
  {
    icon: <MapPinIcon className="h-5 w-5 text-[#1A2C5B]" />,
    title: 'Step 3 — Find Local Resources',
    body: "Our Local VOB Directory (coming soon) will surface veteran-owned businesses near Carlisle, PA. Many veterans find that local, peer-led options reduce the barrier to showing up.",
  },
  {
    icon: <UserGroupIcon className="h-5 w-5 text-[#B22234]" />,
    title: 'Step 4 — Buddy Check-In',
    body: "Many veterans find accountability is the missing piece. Let one person know what you're working toward — the VA's Whole Health peer coaches can help.",
    cta: { label: 'VA Whole Health →', href: 'https://www.va.gov/wholehealth/' },
  },
];

// ─── Trending resources (hardcoded, browse mode only) ────────────────────────

/**
 * Exactly 3 hardcoded top resources shown as a "Trending This Week" row
 * at the top of the Full Browse grid. Source-of-truth is here; no DB call.
 */
const TRENDING_RESOURCES = [
  {
    title: 'VA Whole Health Program',
    track: 'va' as const,
    description: 'Integrative health combining yoga, nutrition, and fitness — free for all enrolled veterans.',
    url: 'https://www.va.gov/wholehealth/',
    tags: ['yoga', 'wellness', 'free', 'veteran'],
  },
  {
    title: 'Wounded Warrior Project',
    track: 'ngo' as const,
    description: 'Peer-led mental health, career, and physical wellness programs for post-9/11 veterans.',
    url: 'https://www.woundedwarriorproject.org/',
    tags: ['peer', 'mental health', 'veteran'],
  },
  {
    title: 'Team Red White & Blue',
    track: 'ngo' as const,
    description: 'Physical and social activity programs connecting veterans through fitness events nationwide.',
    url: 'https://www.teamrwb.org/',
    tags: ['fitness', 'peer', 'community'],
  },
] as const;

// ─── Saved-filter localStorage helpers ───────────────────────────────────────

function loadSavedFilters(): Record<string, BrowseFilter[]> {
  try {
    const raw = localStorage.getItem(SAVED_FILTERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persistSavedFilters(filters: Record<string, BrowseFilter[]>): void {
  try { localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters)); }
  catch { /* no-op */ }
}

// ─── Refine quick-send buttons (5 total) ─────────────────────────────────────

const REFINE_QUICK_SENDS = [
  {
    label: 'More solo grants',
    message: 'Show me more solo, self-guided grant opportunities I can apply to from home.',
  },
  {
    label: 'Local Carlisle options',
    message: 'Show me more options near Carlisle, PA that I can access locally.',
  },
  {
    label: 'Explain top match',
    message: 'Explain why the top recommended resource is the best fit for me.',
  },
  {
    label: 'Military-to-VA Transition Guide',
    message: 'Show me resources for transitioning from military healthcare to VA healthcare — step-by-step.',
  },
  {
    label: 'Back Pain to Shape',
    message: 'Show me more resources specifically for back pain recovery, adaptive fitness, and pain management.',
  },
] as const;

// ─── Keyword extraction ───────────────────────────────────────────────────────

function extractRefinementKeywords(message: string, existing: string[]): string[] {
  const msg = message.toLowerCase();
  const TRIGGER_MAP: [string, string][] = [
    ['yoga',         'yoga'],
    ['solo',         'solo'],
    ['grant',        'grants'],
    ['carlisle',     'carlisle'],
    ['local',        'carlisle'],
    ['peer',         'peer'],
    ['fitness',      'fitness'],
    ['adaptive',     'adaptive'],
    ['free',         'free'],
    ['online',       'online'],
    ['telehealth',   'telehealth'],
    ['mindful',      'mindfulness'],
    ['meditat',      'meditation'],
    ['ptsd',         'ptsd'],
    ['back pain',    'back pain'],
    ['chronic',      'chronic pain'],
    ['sleep',        'sleep'],
    ['weight',       'weight loss'],
    ['anxiety',      'anxiety'],
    ['depress',      'depression'],
    ['substance',    'substance use'],
    ['tbi',          'tbi'],
    ['transit',      'transition'],
    ['va claim',     'va claim'],
    ['pain',         'back pain'],
  ];
  const additions = TRIGGER_MAP
    .filter(([trigger]) => msg.includes(trigger))
    .map(([, kw]) => kw)
    .filter(kw => !existing.includes(kw));
  return additions.length > 0 ? [...existing, ...additions] : existing;
}

// ─── Sea Bag helpers ──────────────────────────────────────────────────────────

function loadSeaBag(): string[] {
  try { return JSON.parse(localStorage.getItem(SEA_BAG_KEY) ?? '[]'); }
  catch { return []; }
}
function saveSeaBag(titles: string[]): void {
  try { localStorage.setItem(SEA_BAG_KEY, JSON.stringify(titles)); }
  catch { /* no-op */ }
}

// ─── PathwayModal ─────────────────────────────────────────────────────────────

interface PathwayModalProps {
  label: string;
  onClose: () => void;
}

function PathwayModal({ label, onClose }: PathwayModalProps) {
  const steps = PATHWAY_STEPS[label] ?? DEFAULT_PATHWAY_STEPS;

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} pathway guide`}
    >
      {/* Panel — full-screen sheet on mobile, centered modal on sm+ */}
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#1A2C5B] to-[#2563EB] flex-shrink-0">
          <div>
            <p className="text-[#EAB308] text-xs font-bold uppercase tracking-wider mb-0.5">Suggested Pathway</p>
            <h2 className="text-white font-bold text-lg leading-tight">{label}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close pathway guide"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
          <p className="text-xs text-amber-700">
            <strong>Not medical advice.</strong> Many veterans find these steps helpful for motivation — discuss all health decisions with your VA provider or primary doctor.
          </p>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
          {steps.map((s, idx) => (
            <div key={idx} className="flex gap-3">
              {/* Step number + icon */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                  {s.icon}
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-blue-100 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="pb-4 min-w-0">
                <h3 className="font-semibold text-[#1A2C5B] text-sm mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                {s.cta && (
                  <a
                    href={s.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A2C5B] hover:underline mt-2"
                  >
                    {s.cta.label}
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#1A2C5B] text-white font-bold text-sm hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            Back to My Resources
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

interface ResourceCardProps {
  rec: ResourceRecommendation;
  isSaved: boolean;
  onToggleSave: (title: string) => void;
}

function ResourceCard({ rec, isSaved, onToggleSave }: ResourceCardProps) {
  const isRecommended = rec.badge === 'Recommended';
  const hasBadge = isRecommended || rec.badge === 'Good Match';

  return (
    <div
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
        isRecommended ? 'border-[#1A2C5B] border-l-4' : 'border-gray-200'
      }`}
    >
      {/* Title + badge row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h5 className="font-semibold text-[#1A2C5B] text-sm leading-snug">{rec.title}</h5>
          {hasBadge && (
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
              isRecommended ? 'bg-[#1A2C5B] text-white' : 'bg-blue-100 text-[#1A2C5B]'
            }`}>
              {isRecommended && <CheckCircleSolid className="h-3 w-3" />}
              {rec.badge}
              {rec.matchPercent !== undefined && rec.matchPercent > 0 && (
                <span className="ml-0.5">{rec.matchPercent}% match</span>
              )}
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleSave(rec.title)}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            isSaved ? 'text-[#EAB308] hover:text-amber-600' : 'text-gray-400 hover:text-[#1A2C5B]'
          }`}
          aria-label={isSaved ? 'Remove from Sea Bag' : 'Save to Sea Bag'}
        >
          {isSaved ? <BookmarkSlashIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{rec.description}</p>

      {/* Tags */}
      {rec.tags && rec.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {rec.tags.slice(0, 5).map(tag => (
            <span key={tag} className="bg-blue-50 text-[#1A2C5B] text-xs px-2 py-0.5 rounded-full border border-blue-100">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Why this matches */}
      {rec.whyMatches && (
        <p className="text-xs italic text-gray-500 mb-3">{rec.whyMatches}</p>
      )}

      {/* CTA row */}
      <div className="flex flex-wrap items-center gap-3 mt-1">
        {rec.url && (
          <a
            href={rec.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A2C5B] hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200 rounded"
          >
            Visit Website
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
        )}
        {rec.phone && (
          <a
            href={`tel:${rec.phone.replace(/[^0-9+]/g, '')}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#B22234] hover:underline"
          >
            {rec.phone}
          </a>
        )}
        <button
          onClick={() => onToggleSave(rec.title)}
          className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-200 ${
            isSaved
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
          }`}
        >
          {isSaved ? 'Saved ✓' : 'Save to Sea Bag'}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-2">
        Not medical advice. Discuss with your VA provider or primary doctor.
      </p>
    </div>
  );
}

// ─── Main ResultsPanel ────────────────────────────────────────────────────────

export default function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  // ─── Core state ───────────────────────────────────────────────────────────
  const [activeTrack, setActiveTrack]     = useState<'va' | 'ngo' | 'state'>('va');
  const [browseMode, setBrowseMode]       = useState(false);
  const [activeFilters, setActiveFilters] = useState<BrowseFilter[]>([]);
  const [savedTitles, setSavedTitles]     = useState<string[]>([]);

  /**
   * liveRecs: driven by initial result.recommendations, updated in-place
   * by rescoreWithKeywords() after each refine send.
   */
  const [liveRecs, setLiveRecs]           = useState(result.recommendations);
  const [liveKeywords, setLiveKeywords]   = useState<string[]>(result.keywords ?? []);

  // ─── Pathway modal state ──────────────────────────────────────────────────
  const [pathwayModalLabel, setPathwayModalLabel] = useState<string | null>(null);

  // ─── Browse mode — Feature 1: Saved Filters ───────────────────────────────
  const [savedFilters, setSavedFilters]           = useState<Record<string, BrowseFilter[]>>({});
  const [savedFilterName, setSavedFilterName]     = useState('');
  const [showSavedFiltersMenu, setShowSavedFiltersMenu] = useState(false);
  const savedFiltersRef = useRef<HTMLDivElement>(null);

  // ─── Browse mode — Feature 3: Autocomplete search ─────────────────────────
  const [browseSearch, setBrowseSearch]           = useState('');

  // ─── Browse mode — Feature 4: Map View teaser ─────────────────────────────
  const [showMapTeaser, setShowMapTeaser]         = useState(false);

  // ─── Refine mini-chat state ───────────────────────────────────────────────
  const [refineOpen, setRefineOpen]       = useState(false);
  const [refineMessages, setRefineMessages] = useState<RefineMessage[]>([]);
  const [refineInput, setRefineInput]     = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refineError, setRefineError]     = useState<string | null>(null);

  const refineInputRef   = useRef<HTMLInputElement>(null);
  const refineChatEndRef = useRef<HTMLDivElement>(null);

  // Hydrate Sea Bag on mount
  useEffect(() => { setSavedTitles(loadSeaBag()); }, []);

  // Hydrate Saved Filters on mount (Feature 1)
  useEffect(() => { setSavedFilters(loadSavedFilters()); }, []);

  // Close Saved Filters dropdown on outside click (Feature 1)
  useEffect(() => {
    if (!showSavedFiltersMenu) return;
    const handler = (e: MouseEvent) => {
      if (savedFiltersRef.current && !savedFiltersRef.current.contains(e.target as Node)) {
        setShowSavedFiltersMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSavedFiltersMenu]);

  // Map teaser toast auto-dismiss after 5 s (Feature 4)
  useEffect(() => {
    if (!showMapTeaser) return;
    const t = setTimeout(() => setShowMapTeaser(false), 5000);
    return () => clearTimeout(t);
  }, [showMapTeaser]);

  // Auto-scroll refine chat
  useEffect(() => {
    refineChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [refineMessages, refineLoading]);

  // Focus refine input when opened
  useEffect(() => {
    if (refineOpen) setTimeout(() => refineInputRef.current?.focus(), 150);
  }, [refineOpen]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!showRefreshToast) return;
    const t = setTimeout(() => setShowRefreshToast(false), 2800);
    return () => clearTimeout(t);
  }, [showRefreshToast]);

  // ─── Sea Bag ──────────────────────────────────────────────────────────────

  const handleToggleSave = useCallback((title: string) => {
    setSavedTitles(prev => {
      const next = prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title];
      saveSeaBag(next);
      return next;
    });
  }, []);

  /**
   * Save all resources with badge === 'Recommended' across all 3 tracks in one tap.
   * Many veterans find having everything pre-saved before browsing is more useful.
   */
  const handleSaveAllRecommended = useCallback(() => {
    const recommended = [
      ...liveRecs.va,
      ...liveRecs.ngo,
      ...liveRecs.state,
    ].filter(r => r.badge === 'Recommended').map(r => r.title);

    if (recommended.length === 0) return;

    setSavedTitles(prev => {
      const next = [...new Set([...prev, ...recommended])];
      saveSeaBag(next);
      return next;
    });
    setShowRefreshToast(false); // avoid collision with refresh toast
  }, [liveRecs]);

  // ─── Browse mode helpers ──────────────────────────────────────────────────

  const handleToggleFilter = (filter: BrowseFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter],
    );
  };

  // Feature 1 — Save current active filters under a user-defined name
  const handleSaveFilter = useCallback(() => {
    const name = savedFilterName.trim();
    if (!name || activeFilters.length === 0) return;
    const next = { ...savedFilters, [name]: [...activeFilters] };
    setSavedFilters(next);
    persistSavedFilters(next);
    setSavedFilterName('');
    setShowSavedFiltersMenu(false);
  }, [savedFilterName, activeFilters, savedFilters]);

  // Feature 1 — Load a previously saved filter set
  const handleLoadFilter = useCallback((name: string) => {
    setActiveFilters(savedFilters[name] ?? []);
    setBrowseSearch('');
    setShowSavedFiltersMenu(false);
  }, [savedFilters]);

  // Feature 1 — Delete a saved filter set
  const handleDeleteFilter = useCallback((name: string) => {
    const next = { ...savedFilters };
    delete next[name];
    setSavedFilters(next);
    persistSavedFilters(next);
  }, [savedFilters]);

  // ─── Pathway banner ───────────────────────────────────────────────────────

  const suggestedPathway = !browseMode ? getSuggestedPathway(liveKeywords) : null;
  const topScore = Math.max(
    ...[...liveRecs.va, ...liveRecs.ngo, ...liveRecs.state].map(r => r.score ?? 0),
    0,
  );
  const showPathwayBanner = !browseMode && suggestedPathway !== null && topScore >= 80;

  const handleViewPathway = useCallback(() => {
    if (suggestedPathway) setPathwayModalLabel(suggestedPathway);
  }, [suggestedPathway]);

  // ─── Re-score helper ──────────────────────────────────────────────────────

  const rescoreWithKeywords = useCallback((updatedKeywords: string[]) => {
    const ctx = buildScoringContext({ conditions: updatedKeywords, hasVaClaim: false, preferences: [] });

    const rescoreTrack = (recs: ResourceRecommendation[]): ResourceRecommendation[] => {
      const rescored = scoreAndSortResources(
        recs.map(r => ({
          title: r.title, description: r.description, tags: r.tags,
          isFree: r.isFree, costLevel: r.costLevel, rating: r.rating,
          location: typeof r.location === 'string' ? r.location : undefined,
          url: r.url, phone: r.phone,
        })),
        ctx,
      );
      return rescored.map((scored, idx) => ({
        ...recs[idx],
        score: scored.score, matchPercent: scored.matchPercent,
        badge: scored.badge,  whyMatches: scored.whyMatches,
      }));
    };

    setLiveRecs(prev => ({
      va:    rescoreTrack(prev.va),
      ngo:   rescoreTrack(prev.ngo),
      state: rescoreTrack(prev.state),
    }));
  }, []);

  // ─── Refine send ──────────────────────────────────────────────────────────

  const handleRefineSend = useCallback(async (overrideMessage?: string) => {
    const text = (overrideMessage ?? refineInput).trim();
    if (!text || refineLoading) return;

    setRefineMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
    setRefineInput('');
    setRefineLoading(true);
    setRefineError(null);

    const updatedKeywords = extractRefinementKeywords(text, liveKeywords);

    try {
      let profilePayload: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem(SYMPTOM_PROFILE_KEY);
        if (raw) profilePayload = JSON.parse(raw);
      } catch { /* non-fatal */ }

      const res = await fetch('/api/health/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'refine',
          step: 'quick_triage',
          userMessage: text,
          messages: [
            {
              role: 'system',
              content: `The user is refining existing resource results. Current keywords: ${updatedKeywords.join(', ')}. Profile: ${JSON.stringify(profilePayload)}. Respond in 2–3 sentences explaining how their request changes the recommendations. End with: "This is not medical advice. Discuss with your VA provider or primary doctor."`,
            },
            ...refineMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          profile: JSON.stringify(profilePayload),
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      const aiText: string =
        data.aiMessage ?? data.message ??
        "Got it — I've re-scored your resources based on that. Check the updated cards above. This is not medical advice. Discuss with your VA provider or primary doctor.";

      setRefineMessages(prev => [...prev, { role: 'assistant', content: aiText, timestamp: Date.now() }]);
    } catch (err) {
      console.error('[ResultsPanel] Refine error:', err);
      setRefineError('Connection issue — cards re-scored from your message keywords.');
      setRefineMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I hit a snag, but I've re-scored your cards from your request. This is not medical advice. Discuss with your VA provider or primary doctor.", timestamp: Date.now() },
      ]);
    } finally {
      setRefineLoading(false);
      if (updatedKeywords.length !== liveKeywords.length) {
        setLiveKeywords(updatedKeywords);
        rescoreWithKeywords(updatedKeywords);
        setShowRefreshToast(true);
      }
    }
  }, [refineInput, refineLoading, refineMessages, liveKeywords, rescoreWithKeywords]);

  // ─── Derived resource lists ───────────────────────────────────────────────

  const allResources = [...liveRecs.va, ...liveRecs.ngo, ...liveRecs.state];

  const searchTerm = browseSearch.trim().toLowerCase();

  const filteredResources = browseMode
    ? allResources
        .filter(r => {
          const h = [r.title, r.description, ...(r.tags ?? [])].join(' ').toLowerCase();
          // Feature 3: autocomplete search — filters by title or any tag
          const searchMatch = !searchTerm || h.includes(searchTerm);
          // Existing tag-filter logic
          const filterMatch =
            activeFilters.length === 0 ||
            activeFilters.some(f => FILTER_TAG_MAP[f].some(tag => h.includes(tag)));
          return searchMatch && filterMatch;
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : [];

  const activeResources = browseMode ? filteredResources : (liveRecs[activeTrack] ?? []);
  const recommendedCount = allResources.filter(r => r.badge === 'Recommended').length;
  const counts = { va: liveRecs.va.length, ngo: liveRecs.ngo.length, state: liveRecs.state.length };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* ─── Pathway Modal ─── */}
      {pathwayModalLabel && (
        <PathwayModal
          label={pathwayModalLabel}
          onClose={() => setPathwayModalLabel(null)}
        />
      )}

      {/*
        Layout: flex-col, flex-1. Inner scroll div takes all available space.
        Refine panel is OUTSIDE the scroll div so it's always anchored at bottom
        on mobile — no overlap, always visible without scrolling.
      */}
      <section className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ─── "Match refreshed!" toast ─── */}
        {showRefreshToast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 bg-[#1A2C5B] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-xl">
              <CheckCircleSolid className="h-4 w-4 text-[#EAB308]" />
              Match refreshed!
            </div>
          </div>
        )}

        {/* ─── Feature 4: Map View teaser toast ───────────────────────────────
            Uses the same absolute-positioned toast slot as "Match refreshed!" but
            styled as a dismissible info card — distinct from the success toast.
            Auto-dismisses after 5 s (see useEffect above).
            ─────────────────────────────────────────────────────────────────── */}
        {showMapTeaser && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-72 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start gap-3 bg-white border border-blue-200 rounded-xl shadow-xl p-4">
              <MapIcon className="h-5 w-5 text-[#1A2C5B] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1A2C5B] mb-1">Map View — Coming Soon</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Interactive Map View is deploying soon with the{' '}
                  <strong>Local VOB (Veteran-Owned Business) Network</strong>.
                  Find fitness, yoga, and peer programs on the map near Carlisle, PA.
                </p>
              </div>
              <button
                onClick={() => setShowMapTeaser(false)}
                className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 rounded"
                aria-label="Dismiss map teaser"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            Scrollable content area — cards never overlap
            the refine bar below on any screen size
            ══════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-0">

          {/* ─── Suggested Pathway Banner ─── */}
          {showPathwayBanner && (
            <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-md mb-4 mx-0 flex items-center justify-between gap-3">
              <p className="text-sm text-yellow-800 font-medium">
                <span className="font-bold">Suggested Pathway:</span>{' '}
                {suggestedPathway} — Get step-by-step guidance.
              </p>
              {/* Opens PathwayModal — wired to PathwayNavigator in Pass 2 */}
              <button
                onClick={handleViewPathway}
                className="flex-shrink-0 text-xs font-bold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                View Now
              </button>
            </div>
          )}

          {/* ─── Tab bar + browse toggle ─── */}
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-1 pb-1">
            {!browseMode && (
              <div className="flex border-b border-gray-200 flex-1 min-w-0">
                {(
                  [
                    { key: 'va'    as const, label: 'VA',    icon: <ShieldCheckIcon className="h-4 w-4" /> },
                    { key: 'ngo'   as const, label: 'NGO',   icon: <HeartIcon className="h-4 w-4" /> },
                    { key: 'state' as const, label: 'State', icon: <BuildingOffice2Icon className="h-4 w-4" /> },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTrack(tab.key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTrack === tab.key
                        ? 'text-[#1A2C5B] border-[#EAB308]'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.label.slice(0, 2)}</span>
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{counts[tab.key]}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Feature 4 toggle + existing Browse All button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Feature 4 — Map View teaser button (visually distinct / inactive) */}
              <button
                onClick={() => setShowMapTeaser(true)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-2 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#1A2C5B] hover:text-[#1A2C5B] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
                title="Map View — coming soon"
                aria-label="Map View coming soon"
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>

              <button
                onClick={() => {
                  setBrowseMode(m => !m);
                  setActiveFilters([]);
                  setBrowseSearch('');
                  setShowSavedFiltersMenu(false);
                }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  browseMode
                    ? 'bg-[#1A2C5B] text-white border-[#1A2C5B]'
                    : 'bg-white text-[#1A2C5B] border-[#1A2C5B] hover:bg-blue-50'
                }`}
                aria-pressed={browseMode}
              >
                <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                {browseMode ? 'Exit Browse' : 'Browse All'}
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              FULL BROWSE MODE FEATURES — injected only when browseMode
              Mobile constraint: all inside flex-1 overflow-y-auto,
              no fixed heights here, flows within h-[calc(100dvh-180px)]
              ══════════════════════════════════════════════════════════ */}
          {browseMode && (
            <>
              {/* Feature 1 — Filter pills row + Saved Filters + Map View indicator */}
              <div className="mb-2">
                {/* Filter pills */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {BROWSE_FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => handleToggleFilter(f)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        activeFilters.includes(f)
                          ? 'bg-[#1A2C5B] text-white border-[#1A2C5B]'
                          : 'bg-blue-100 text-[#1A2C5B] border-blue-200 hover:bg-blue-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  {activeFilters.length > 0 && (
                    <button
                      onClick={() => setActiveFilters([])}
                      className="text-xs text-gray-500 hover:text-gray-700 underline ml-1 self-center"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Feature 1 — Saved Filters dropdown + score label row */}
                <div className="flex items-center justify-between">
                  <div className="relative" ref={savedFiltersRef}>
                    <button
                      onClick={() => setShowSavedFiltersMenu(o => !o)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        showSavedFiltersMenu
                          ? 'bg-blue-50 border-[#1A2C5B] text-[#1A2C5B]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-[#1A2C5B] hover:text-[#1A2C5B]'
                      }`}
                      aria-expanded={showSavedFiltersMenu}
                    >
                      <FunnelIcon className="h-3.5 w-3.5" />
                      Saved Filters
                      {Object.keys(savedFilters).length > 0 && (
                        <span className="bg-[#1A2C5B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {Object.keys(savedFilters).length}
                        </span>
                      )}
                      <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${showSavedFiltersMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown panel */}
                    {showSavedFiltersMenu && (
                      <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                        {/* Save current filters */}
                        <div className="p-2 border-b border-gray-100">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1.5 px-1">
                            Save current filters
                          </p>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={savedFilterName}
                              onChange={e => setSavedFilterName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveFilter(); }}
                              placeholder={activeFilters.length > 0 ? 'Name this preset...' : 'Select filters first'}
                              disabled={activeFilters.length === 0}
                              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:border-[#1A2C5B] focus:ring-1 focus:ring-blue-200 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                            />
                            <button
                              onClick={handleSaveFilter}
                              disabled={!savedFilterName.trim() || activeFilters.length === 0}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#1A2C5B] text-white disabled:opacity-40 hover:bg-[#0F1D3D] transition-colors focus:outline-none"
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        {/* Saved presets list */}
                        {Object.keys(savedFilters).length > 0 ? (
                          <div className="p-2 max-h-40 overflow-y-auto overscroll-contain">
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1.5 px-1">
                              Load preset
                            </p>
                            {Object.entries(savedFilters).map(([name, filters]) => (
                              <div key={name} className="flex items-center justify-between gap-1 px-1 py-1.5 rounded-lg hover:bg-blue-50 group">
                                <button
                                  onClick={() => handleLoadFilter(name)}
                                  className="flex-1 text-left text-xs text-[#1A2C5B] font-medium truncate"
                                >
                                  {name}
                                  <span className="text-gray-400 font-normal ml-1">
                                    ({filters.join(', ')})
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleDeleteFilter(name)}
                                  className="flex-shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  aria-label={`Delete saved filter: ${name}`}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 text-center py-3 px-2">
                            No saved presets yet — select filters above and save.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-gray-400">Score ↓</span>
                </div>
              </div>

              {/* Feature 3 — Autocomplete search input */}
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={browseSearch}
                  onChange={e => setBrowseSearch(e.target.value)}
                  placeholder="Search by resource name or tag…"
                  className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:border-[#1A2C5B] focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white shadow-sm"
                  aria-label="Search resources in browse mode"
                />
                {browseSearch && (
                  <button
                    onClick={() => setBrowseSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Feature 2 — "Trending This Week" horizontal card row */}
              {/* Only shown when no active search/filter so it doesn't compete with results */}
              {!searchTerm && activeFilters.length === 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FireIcon className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      Trending This Week
                    </span>
                  </div>
                  {/* Horizontal scroll — overscroll-contain keeps it from capturing page scroll */}
                  <div className="flex gap-3 overflow-x-auto overscroll-contain pb-2 -mx-0.5 px-0.5">
                    {TRENDING_RESOURCES.map(t => (
                      <a
                        key={t.title}
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-44 sm:w-52 bg-amber-50 border border-amber-200 rounded-xl p-3 hover:shadow-md hover:border-amber-400 transition-all focus:outline-none focus:ring-2 focus:ring-amber-300"
                      >
                        {/* Badge */}
                        <div className="flex items-center gap-1 mb-1.5">
                          <FireIcon className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                            Trending
                          </span>
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            t.track === 'va'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {t.track.toUpperCase()}
                          </span>
                        </div>
                        {/* Title */}
                        <p className="font-semibold text-[#1A2C5B] text-xs leading-snug mb-1 line-clamp-2">
                          {t.title}
                        </p>
                        {/* Description */}
                        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2 mb-1.5">
                          {t.description}
                        </p>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {t.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full border border-amber-200"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Save All Recommended — one-tap bulk save ─── */}
          {recommendedCount > 0 && (
            <button
              onClick={handleSaveAllRecommended}
              className="w-full mb-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-200"
            >
              <BookmarkSolid className="h-3.5 w-3.5 text-[#EAB308]" />
              Save All {recommendedCount} Recommended to Sea Bag
            </button>
          )}

          {/* ─── Card Grid ─── */}
          <div className="space-y-3 pb-3">
            {activeResources.length > 0
              ? activeResources.map((rec, idx) => (
                  <ResourceCard
                    key={`${rec.title}-${idx}`}
                    rec={rec}
                    isSaved={savedTitles.includes(rec.title)}
                    onToggleSave={handleToggleSave}
                  />
                ))
              : (
                <div className="text-center py-10 text-gray-500">
                  <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No resources found for this selection.</p>
                  {browseMode && (activeFilters.length > 0 || searchTerm) && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      {searchTerm && (
                        <button
                          onClick={() => setBrowseSearch('')}
                          className="text-sm text-[#1A2C5B] underline"
                        >
                          Clear search &ldquo;{browseSearch}&rdquo;
                        </button>
                      )}
                      {activeFilters.length > 0 && (
                        <button
                          onClick={() => setActiveFilters([])}
                          className="text-sm text-[#1A2C5B] underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            }
          </div>

          {/* ─── Sea Bag saved count ─── */}
          {savedTitles.length > 0 && (
            <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-sm text-amber-800">
              <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{savedTitles.length}</strong> resource{savedTitles.length !== 1 ? 's' : ''} saved to your Sea Bag.
              </span>
            </div>
          )}

          {/* ─── Reset ─── */}
          <div className="pb-4 text-center">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 text-sm text-[#1A2C5B] border border-[#1A2C5B] px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Start New Assessment
            </button>
          </div>
        </div>
        {/* end scrollable area */}

        {/* ══════════════════════════════════════════════════
            Refine mini-chat — anchored OUTSIDE scroll div.
            Always visible at bottom on mobile without scrolling.
            Expands upward into the scroll area on open.
            ══════════════════════════════════════════════════ */}
        <div
          className="border-t border-blue-100 bg-white flex-shrink-0 overflow-hidden transition-all duration-300"
          id="refine-chat-panel"
          style={{ maxHeight: refineOpen ? '384px' : '44px' }}
        >
          {/* ─── Slim trigger bar ─── */}
          <button
            onClick={() => setRefineOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1A2C5B] hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-expanded={refineOpen}
            aria-controls="refine-chat-inner"
            style={{ minHeight: '44px' }}
          >
            <div className="flex items-center gap-2">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-[#EAB308] flex-shrink-0" />
              <span className="text-white text-xs font-semibold">Need better matches? Chat with Grok-4</span>
              <span className="text-blue-300 text-xs">→</span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-blue-300 transition-transform duration-300 flex-shrink-0 ${refineOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* ─── Expandable body ─── */}
          <div id="refine-chat-inner" className="flex flex-col" style={{ height: '340px' }}>

            {/* Collapse header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border-b border-blue-100 flex-shrink-0">
              <span className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">
                Refine results — re-scores cards live
              </span>
              <button
                onClick={() => setRefineOpen(false)}
                className="text-blue-400 hover:text-[#1A2C5B] transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                aria-label="Collapse refine chat"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
              {refineMessages.length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-4">
                  Tell Grok-4 how to improve your results — e.g.&nbsp;
                  <em>&quot;show more yoga options&quot;</em> or&nbsp;
                  <em>&quot;more local Carlisle resources&quot;</em>.
                </p>
              )}
              {refineMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-1.5 flex-shrink-0 mt-0.5">
                        <SparklesIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-[#1A2C5B] text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {refineLoading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A2C5B] to-[#2563EB] flex items-center justify-center mr-1.5 flex-shrink-0">
                    <SparklesIcon className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-1.5 h-1.5 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#2563EB] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#1A2C5B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-gray-400 ml-1">Re-scoring...</span>
                    </div>
                  </div>
                </div>
              )}
              {refineError && <p className="text-[10px] text-orange-500 text-center">{refineError}</p>}
              <div ref={refineChatEndRef} />
            </div>

            {/* Quick-send buttons (5 total — wraps neatly on mobile) */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex-shrink-0">
              {REFINE_QUICK_SENDS.map(({ label, message }) => (
                <button
                  key={label}
                  onClick={() => handleRefineSend(message)}
                  disabled={refineLoading}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-[#1A2C5B]/30 text-[#1A2C5B] hover:bg-[#1A2C5B] hover:text-white transition-all disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-blue-200 whitespace-nowrap"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 items-center px-3 pb-3 pt-1 bg-white flex-shrink-0">
              <input
                ref={refineInputRef}
                type="text"
                value={refineInput}
                onChange={e => setRefineInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineSend(); } }}
                placeholder="Tell me how to improve these results..."
                disabled={refineLoading}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-300 focus:border-[#1A2C5B] focus:ring-1 focus:ring-blue-200 focus:outline-none disabled:opacity-50 shadow-sm"
                aria-label="Refine your resource results"
              />
              <button
                onClick={() => handleRefineSend()}
                disabled={!refineInput.trim() || refineLoading}
                className="p-2 rounded-lg bg-[#1A2C5B] text-white hover:bg-[#0F1D3D] transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-200 flex-shrink-0"
                aria-label="Send refine message"
              >
                <PaperAirplaneIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        {/* end refine panel */}

      </section>
    </>
  );
}
