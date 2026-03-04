'use client';

// JUNK FILE REGISTRY — delete manually post-deploy (Zero-Clutter Mandate):
// - src/app/api/health/symptom-finder/route.ts.new  [DELETED]
// - src/app/api/health/resources/route.ts.fixed     [DELETED]
// - src/app/api/health-resources/route.new.ts       [DELETED]

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
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import {
  getSuggestedPathway,
  scoreAndSortResources,
  buildScoringContext,
} from '@/lib/resources-scoring';

// ─── localStorage keys ────────────────────────────────────────────────────────
const SEA_BAG_KEY = 'vet1stop_sea_bag';
const SYMPTOM_PROFILE_KEY = 'vet1stop_symptom_profile';

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
  // Injected by scoring engine
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
  /** Normalized keywords from scoring context (passed from Wizard) */
  keywords?: string[];
}

interface ResultsPanelProps {
  result: TriageResult;
  onReset: () => void;
}

/** Lightweight message shape for the refine mini-chat */
interface RefineMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ─── Full Browse filter options ───────────────────────────────────────────────

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

// ─── Refine quick-send buttons ────────────────────────────────────────────────

const REFINE_QUICK_SENDS = [
  { label: 'More solo grants',           message: 'Show me more solo, self-guided grant opportunities I can apply to from home.' },
  { label: 'Show local Carlisle options', message: 'Show me more options near Carlisle, PA that I can access locally.' },
  { label: 'Explain top match',          message: 'Explain why the top recommended resource is the best fit for me.' },
] as const;

// ─── Keyword extraction from refine message ───────────────────────────────────

/**
 * Parses the user's refine message to extract additional scoring keywords.
 * Merges with existing keywords so re-scoring boosts newly relevant resources.
 */
function extractRefinementKeywords(message: string, existing: string[]): string[] {
  const msg = message.toLowerCase();

  const TRIGGER_MAP: [string, string][] = [
    ['yoga',      'yoga'],
    ['solo',      'solo'],
    ['grant',     'grants'],
    ['carlisle',  'carlisle'],
    ['local',     'carlisle'],
    ['peer',      'peer'],
    ['fitness',   'fitness'],
    ['adaptive',  'adaptive'],
    ['free',      'free'],
    ['online',    'online'],
    ['telehealth','telehealth'],
    ['mindful',   'mindfulness'],
    ['meditat',   'meditation'],
    ['ptsd',      'ptsd'],
    ['back pain', 'back pain'],
    ['chronic',   'chronic pain'],
    ['sleep',     'sleep'],
    ['weight',    'weight loss'],
    ['anxiety',   'anxiety'],
    ['depress',   'depression'],
    ['substance', 'substance use'],
    ['tbi',       'tbi'],
  ];

  const additions = TRIGGER_MAP
    .filter(([trigger]) => msg.includes(trigger))
    .map(([, kw]) => kw)
    .filter(kw => !existing.includes(kw));

  return additions.length > 0 ? [...existing, ...additions] : existing;
}

// ─── Sea Bag helpers ──────────────────────────────────────────────────────────

function loadSeaBag(): string[] {
  try {
    const raw = localStorage.getItem(SEA_BAG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSeaBag(titles: string[]): void {
  try {
    localStorage.setItem(SEA_BAG_KEY, JSON.stringify(titles));
  } catch {
    // localStorage unavailable — no-op
  }
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

interface ResourceCardProps {
  rec: ResourceRecommendation;
  isSaved: boolean;
  onToggleSave: (title: string) => void;
}

function ResourceCard({ rec, isSaved, onToggleSave }: ResourceCardProps) {
  const hasBadge = rec.badge === 'Recommended' || rec.badge === 'Good Match';
  const isRecommended = rec.badge === 'Recommended';

  return (
    <div
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
        isRecommended ? 'border-[#1A2C5B] border-l-4' : 'border-gray-200'
      }`}
    >
      {/* Title row + badge */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h5 className="font-semibold text-[#1A2C5B] text-sm leading-snug">{rec.title}</h5>
          {hasBadge && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                isRecommended
                  ? 'bg-[#1A2C5B] text-white'
                  : 'bg-blue-100 text-[#1A2C5B]'
              }`}
            >
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
            isSaved
              ? 'text-[#EAB308] hover:text-amber-600'
              : 'text-gray-400 hover:text-[#1A2C5B]'
          }`}
          aria-label={isSaved ? 'Remove from Sea Bag' : 'Save to Sea Bag'}
          title={isSaved ? 'Saved ✓' : 'Save to Sea Bag'}
        >
          {isSaved ? <BookmarkSlashIcon className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Description (2 sentences max) */}
      <p className="text-sm text-gray-600 mb-2 leading-relaxed">{rec.description}</p>

      {/* Tags */}
      {rec.tags && rec.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {rec.tags.slice(0, 5).map(tag => (
            <span
              key={tag}
              className="bg-blue-50 text-[#1A2C5B] text-xs px-2 py-0.5 rounded-full border border-blue-100"
            >
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
  // ─── Core display state ───────────────────────────────────────────────────
  const [activeTrack, setActiveTrack] = useState<'va' | 'ngo' | 'state'>('va');
  const [browseMode, setBrowseMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<BrowseFilter[]>([]);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);

  /**
   * liveRecs: the live recommendations shown in the card grid.
   * Starts as result.recommendations, then updated in-place by the refine chat
   * after re-scoring. Using a separate state means the card grid re-renders
   * immediately without waiting for a new triage round.
   */
  const [liveRecs, setLiveRecs] = useState(result.recommendations);

  /**
   * liveKeywords: tracks the current active scoring keyword set.
   * Grows as the user sends refine messages (e.g., + "yoga").
   */
  const [liveKeywords, setLiveKeywords] = useState<string[]>(result.keywords ?? []);

  // ─── Refine mini-chat state ───────────────────────────────────────────────
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineMessages, setRefineMessages] = useState<RefineMessage[]>([]);
  const [refineInput, setRefineInput] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const refineInputRef = useRef<HTMLInputElement>(null);
  const refineChatEndRef = useRef<HTMLDivElement>(null);

  // Hydrate Sea Bag on mount
  useEffect(() => {
    setSavedTitles(loadSeaBag());
  }, []);

  // Auto-scroll refine chat on new messages
  useEffect(() => {
    refineChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [refineMessages, refineLoading]);

  // Focus refine input when panel opens
  useEffect(() => {
    if (refineOpen) {
      setTimeout(() => refineInputRef.current?.focus(), 150);
    }
  }, [refineOpen]);

  // ─── Toast auto-dismiss ───────────────────────────────────────────────────
  useEffect(() => {
    if (!showRefreshToast) return;
    const t = setTimeout(() => setShowRefreshToast(false), 2800);
    return () => clearTimeout(t);
  }, [showRefreshToast]);

  // ─── Sea Bag toggle ───────────────────────────────────────────────────────
  const handleToggleSave = useCallback((title: string) => {
    setSavedTitles(prev => {
      const next = prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title];
      saveSeaBag(next);
      return next;
    });
  }, []);

  const handleToggleFilter = (filter: BrowseFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter],
    );
  };

  // ─── Re-score helper ──────────────────────────────────────────────────────

  /**
   * Re-scores all liveRecs using an updated keyword set, then updates state.
   * Called after every successful refine AI response.
   */
  const rescoreWithKeywords = useCallback((updatedKeywords: string[]) => {
    const ctx = buildScoringContext({
      conditions: updatedKeywords,
      hasVaClaim: false,
      preferences: [],
    });

    const rescoreTrack = (recs: ResourceRecommendation[]): ResourceRecommendation[] => {
      const rescored = scoreAndSortResources(
        recs.map(r => ({
          title: r.title,
          description: r.description,
          tags: r.tags,
          isFree: r.isFree,
          costLevel: r.costLevel,
          rating: r.rating,
          location: typeof r.location === 'string' ? r.location : undefined,
          url: r.url,
          phone: r.phone,
        })),
        ctx,
      );
      // Merge scores back onto the original recs (preserve track/priority etc.)
      return rescored.map((scored, idx) => ({
        ...recs[idx],
        score: scored.score,
        matchPercent: scored.matchPercent,
        badge: scored.badge,
        whyMatches: scored.whyMatches,
      }));
    };

    setLiveRecs(prev => ({
      va:    rescoreTrack(prev.va),
      ngo:   rescoreTrack(prev.ngo),
      state: rescoreTrack(prev.state),
    }));
  }, []);

  // ─── Refine chat send ─────────────────────────────────────────────────────

  const handleRefineSend = useCallback(async (overrideMessage?: string) => {
    const text = (overrideMessage ?? refineInput).trim();
    if (!text || refineLoading) return;

    const userMsg: RefineMessage = { role: 'user', content: text, timestamp: Date.now() };
    setRefineMessages(prev => [...prev, userMsg]);
    setRefineInput('');
    setRefineLoading(true);
    setRefineError(null);

    // Compute updated keywords before the API call so we can re-score regardless
    const updatedKeywords = extractRefinementKeywords(text, liveKeywords);

    try {
      // Read saved symptom profile for richer context
      let profilePayload: Record<string, unknown> = {};
      try {
        const raw = localStorage.getItem(SYMPTOM_PROFILE_KEY);
        if (raw) profilePayload = JSON.parse(raw);
      } catch {
        // Profile read failed — non-fatal, continue with keyword context
      }

      const res = await fetch('/api/health/symptom-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // mode: 'refine' — tells the route this is a refinement, not a fresh triage
          mode: 'refine',
          step: 'quick_triage',
          userMessage: text,
          messages: [
            // Give AI full refine context
            {
              role: 'system',
              content: `The user has already received resource recommendations and wants to refine them. Their current keywords are: ${updatedKeywords.join(', ')}. Profile: ${JSON.stringify(profilePayload)}. Respond with 2–3 sentences explaining how these resources address their refinement request, then suggest what kind of resources they should look for. End with: "This is not medical advice. Discuss with your VA provider or primary doctor."`,
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
        data.aiMessage ??
        data.message ??
        'Got it — I\'ve re-scored your resources based on that preference. Check the updated cards above. This is not medical advice. Discuss with your VA provider or primary doctor.';

      setRefineMessages(prev => [
        ...prev,
        { role: 'assistant', content: aiText, timestamp: Date.now() },
      ]);
    } catch (err) {
      console.error('[ResultsPanel] Refine API error:', err);
      // Non-fatal: still re-score from keyword extraction even if AI call fails
      setRefineError('Connection issue — results re-scored from your message keywords.');
      setRefineMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I hit a snag connecting, but I\'ve re-scored your cards based on your request. This is not medical advice. Discuss with your VA provider or primary doctor.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setRefineLoading(false);
      // Re-score regardless of API success/failure — keyword extraction is client-side
      if (updatedKeywords.length !== liveKeywords.length) {
        setLiveKeywords(updatedKeywords);
        rescoreWithKeywords(updatedKeywords);
        setShowRefreshToast(true);
      }
    }
  }, [refineInput, refineLoading, refineMessages, liveKeywords, rescoreWithKeywords]);

  // ─── Pathway banner ───────────────────────────────────────────────────────
  const suggestedPathway = !browseMode ? getSuggestedPathway(liveKeywords) : null;
  const topScore = Math.max(
    ...[...liveRecs.va, ...liveRecs.ngo, ...liveRecs.state].map(r => r.score ?? 0),
    0,
  );
  const showPathwayBanner = !browseMode && suggestedPathway !== null && topScore >= 80;

  // TODO Pass 2: wire to PathwayNavigator component
  const handleViewPathway = () => {};

  // ─── Browse mode derived lists ────────────────────────────────────────────
  const allResources: ResourceRecommendation[] = [
    ...liveRecs.va,
    ...liveRecs.ngo,
    ...liveRecs.state,
  ];

  const filteredResources = browseMode
    ? allResources
        .filter(r => {
          if (activeFilters.length === 0) return true;
          const haystack = [r.title, r.description, ...(r.tags ?? [])].join(' ').toLowerCase();
          return activeFilters.some(f => FILTER_TAG_MAP[f].some(tag => haystack.includes(tag)));
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : [];

  const activeResources = browseMode
    ? filteredResources
    : (liveRecs[activeTrack] ?? []);

  const counts = {
    va:    liveRecs.va.length,
    ngo:   liveRecs.ngo.length,
    state: liveRecs.state.length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="flex-1 overflow-auto flex flex-col min-h-0">

      {/* ─── "Match refreshed!" toast ─── */}
      {showRefreshToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 bg-[#1A2C5B] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg">
            <CheckCircleSolid className="h-4 w-4 text-[#EAB308]" />
            Match refreshed!
          </div>
        </div>
      )}

      {/* ─── Suggested Pathway Banner ─── */}
      {showPathwayBanner && (
        <div className="bg-yellow-100 border border-yellow-300 p-4 rounded-md mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-yellow-800 font-medium">
            <span className="font-bold">Suggested Pathway:</span>{' '}
            {suggestedPathway} — Get step-by-step guidance.
          </p>
          {/* TODO Pass 2: wire to PathwayNavigator component */}
          <button
            onClick={handleViewPathway}
            className="flex-shrink-0 text-xs font-bold text-yellow-900 bg-yellow-200 hover:bg-yellow-300 border border-yellow-400 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            View Now
          </button>
        </div>
      )}

      {/* ─── Tab bar + browse toggle ─── */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
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
                {tab.label}
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => { setBrowseMode(m => !m); setActiveFilters([]); }}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            browseMode
              ? 'bg-[#1A2C5B] text-white border-[#1A2C5B]'
              : 'bg-white text-[#1A2C5B] border-[#1A2C5B] hover:bg-blue-50'
          }`}
          aria-pressed={browseMode}
        >
          <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
          {browseMode ? 'Exit Browse' : 'Full Browse Mode'}
        </button>
      </div>

      {/* ─── Full Browse filter pills ─── */}
      {browseMode && (
        <div className="flex flex-wrap gap-2 mb-4">
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
            <button onClick={() => setActiveFilters([])} className="text-xs text-gray-500 hover:text-gray-700 underline ml-1">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 self-center">Sorted by score ↓</span>
        </div>
      )}

      {/* ─── Card Grid (driven by liveRecs — updates live after refine) ─── */}
      <div className="space-y-3 pb-4">
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
            <div className="text-center py-12 text-gray-500">
              <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No resources found for this selection.</p>
              {browseMode && activeFilters.length > 0 && (
                <button onClick={() => setActiveFilters([])} className="mt-2 text-sm text-[#1A2C5B] underline">
                  Clear filters to see all resources
                </button>
              )}
            </div>
          )
        }
      </div>

      {/* ─── Sea Bag saved count ─── */}
      {savedTitles.length > 0 && (
        <div className="flex items-center gap-2 py-3 px-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-800">
          <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{savedTitles.length}</strong> resource{savedTitles.length !== 1 ? 's' : ''} saved to your Sea Bag.
          </span>
        </div>
      )}

      {/* ─── Reset / Start Over ─── */}
      <div className="mt-2 pb-3 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm text-[#1A2C5B] border border-[#1A2C5B] px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Start New Assessment
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ─── Refine Mini-Chat Panel ─────────────────────────────────────
          Always-visible slim blue trigger bar. Tapping expands to h-96.
          Sends POST /api/health/symptom-triage {mode:'refine'}, parses AI
          response, re-runs scoreResource() client-side, updates liveRecs.
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="border-t border-blue-100 bg-white rounded-b-xl overflow-hidden transition-all duration-300"
        id="refine-chat-panel"
        style={{ maxHeight: refineOpen ? '384px' : '44px' }}
      >
        {/* ─── Slim trigger bar (always visible) ─── */}
        <button
          onClick={() => setRefineOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1A2C5B] hover:bg-[#0F1D3D] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-expanded={refineOpen}
          aria-controls="refine-chat-inner"
        >
          <div className="flex items-center gap-2">
            <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4 text-[#EAB308] flex-shrink-0" />
            <span className="text-white text-xs font-semibold">
              Need better matches? Chat with Grok-4
            </span>
            <span className="text-blue-300 text-xs">→</span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-blue-300 transition-transform duration-300 ${refineOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* ─── Expandable body ─── */}
        <div
          id="refine-chat-inner"
          className="flex flex-col"
          style={{ height: '340px' }}
        >
          {/* Collapse button at top */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border-b border-blue-100">
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

          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-gray-50 to-white">
            {refineMessages.length === 0 && (
              <p className="text-xs text-gray-400 text-center pt-4">
                Tell Grok-4 how to improve your results — e.g.&nbsp;
                <em>&quot;show more yoga options&quot;</em> or{' '}
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
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-[#1A2C5B] text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                    }`}
                  >
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
            {refineError && (
              <p className="text-[10px] text-orange-500 text-center">{refineError}</p>
            )}
            <div ref={refineChatEndRef} />
          </div>

          {/* Quick-send buttons */}
          <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 bg-white border-t border-gray-100">
            {REFINE_QUICK_SENDS.map(({ label, message }) => (
              <button
                key={label}
                onClick={() => handleRefineSend(message)}
                disabled={refineLoading}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-[#1A2C5B]/30 text-[#1A2C5B] hover:bg-[#1A2C5B] hover:text-white transition-all disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-blue-200"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex gap-2 items-center px-3 pb-3 pt-1 bg-white">
            <input
              ref={refineInputRef}
              type="text"
              value={refineInput}
              onChange={e => setRefineInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRefineSend();
                }
              }}
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
    </section>
  );
}
