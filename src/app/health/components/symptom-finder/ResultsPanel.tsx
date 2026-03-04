'use client';

// JUNK FILE REGISTRY — delete manually post-deploy (Zero-Clutter Mandate):
// - src/app/api/health/symptom-finder/route.ts.new
// - src/app/api/health/resources/route.ts.fixed
// - src/app/api/health-resources/route.new.ts

import React, { useState, useCallback, useEffect } from 'react';
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
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import type { ScoredResource } from '@/lib/resources-scoring';
import { getSuggestedPathway } from '@/lib/resources-scoring';

// ─── Sea Bag localStorage key ────────────────────────────────────────────────
const SEA_BAG_KEY = 'vet1stop_sea_bag';

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

// ─── Pathway label map (hardcoded for MVP) ────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        isRecommended
          ? 'border-[#1A2C5B] border-l-4'
          : 'border-gray-200'
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
        {/* Save to Sea Bag */}
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
          {isSaved
            ? <BookmarkSlashIcon className="h-4 w-4" />
            : <BookmarkIcon className="h-4 w-4" />
          }
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
        <p className="text-xs italic text-gray-500 mb-3">
          {rec.whyMatches}
        </p>
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

      {/* Not medical advice micro-disclaimer */}
      <p className="text-[10px] text-gray-400 mt-2">
        Not medical advice. Discuss with your VA provider or primary doctor.
      </p>
    </div>
  );
}

// ─── Main ResultsPanel ────────────────────────────────────────────────────────

export default function ResultsPanel({ result, onReset }: ResultsPanelProps) {
  const [activeTrack, setActiveTrack] = useState<'va' | 'ngo' | 'state'>('va');
  const [browseMode, setBrowseMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<BrowseFilter[]>([]);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);

  // Hydrate Sea Bag from localStorage on mount
  useEffect(() => {
    setSavedTitles(loadSeaBag());
  }, []);

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

  // ─── Pathway banner logic ──────────────────────────────────────────────────
  const keywords = result.keywords ?? [];
  const suggestedPathway = !browseMode ? getSuggestedPathway(keywords) : null;
  const topScore = Math.max(
    ...[
      ...result.recommendations.va,
      ...result.recommendations.ngo,
      ...result.recommendations.state,
    ].map(r => r.score ?? 0),
  );
  const showPathwayBanner = !browseMode && suggestedPathway !== null && topScore >= 80;

  // TODO Pass 2: wire to PathwayNavigator component
  const handleViewPathway = () => {};

  // ─── Full Browse Mode: merge + filter + sort ───────────────────────────────
  const allResources: ResourceRecommendation[] = [
    ...result.recommendations.va,
    ...result.recommendations.ngo,
    ...result.recommendations.state,
  ];

  const filteredResources = browseMode
    ? allResources.filter(r => {
        if (activeFilters.length === 0) return true;
        const haystack = [r.title, r.description, ...(r.tags ?? [])].join(' ').toLowerCase();
        return activeFilters.some(f =>
          FILTER_TAG_MAP[f].some(tag => haystack.includes(tag)),
        );
      }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : [];

  const activeResources = browseMode
    ? filteredResources
    : (result.recommendations[activeTrack] ?? []);

  // Tab counts
  const counts = {
    va: result.recommendations.va.length,
    ngo: result.recommendations.ngo.length,
    state: result.recommendations.state.length,
  };

  return (
    <section className="flex-1 overflow-auto flex flex-col min-h-0">

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

      {/* ─── Header: tabs + browse toggle ─── */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">

        {/* Sticky Tab Bar (VA | NGO | State) — hidden in browse mode */}
        {!browseMode && (
          <div className="flex border-b border-gray-200 flex-1 min-w-0">
            {(
              [
                { key: 'va' as const,    label: 'VA',    icon: <ShieldCheckIcon className="h-4 w-4" /> },
                { key: 'ngo' as const,   label: 'NGO',   icon: <HeartIcon className="h-4 w-4" /> },
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

        {/* Full Browse Mode toggle */}
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

      {/* ─── Full Browse: filter pills ─── */}
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
            <button
              onClick={() => setActiveFilters([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 self-center">
            Sorted by score ↓
          </span>
        </div>
      )}

      {/* ─── Card Grid ─── */}
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
                <button
                  onClick={() => setActiveFilters([])}
                  className="mt-2 text-sm text-[#1A2C5B] underline"
                >
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
      <div className="mt-2 pb-6 text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 text-sm text-[#1A2C5B] border border-[#1A2C5B] px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Start New Assessment
        </button>
      </div>

      {/* ─── PASS 2: Refine mini-chat — wired up in next sprint ─── */}
      <div
        className="h-0 overflow-hidden transition-all duration-300"
        id="refine-chat-panel"
      >
        {/* mini chat input + Grok refine call goes here in Pass 2 */}
      </div>
    </section>
  );
}
