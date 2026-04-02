// @ts-nocheck
'use client';

/**
 * BrowseResourceCard.tsx — Lightweight resource card for the Browse section.
 * Also exports BrowseResourceSkeleton for zero-layout-shift loading state.
 * Intentionally lightweight — no heavy deps. Reads RawResource shape from MongoDB.
 */

import React, { useState } from 'react';
import {
  ArrowTopRightOnSquareIcon,
  PhoneIcon,
  BookmarkIcon,
  CheckCircleIcon,
  MapPinIcon,
  TagIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, HandThumbUpIcon as ThumbUpSolid, HandThumbDownIcon as ThumbDownSolid } from '@heroicons/react/24/solid';

const SEA_BAG_KEY = 'vet1stop_sea_bag';
export const RESOURCE_PREFS_KEY = 'vet1stop_resource_prefs';

// Helper to read/write the prefs store from localStorage
export function readResourcePrefs(): { liked: string[]; disliked: string[] } {
  try { return JSON.parse(localStorage.getItem(RESOURCE_PREFS_KEY) || '{"liked":[],"disliked":[]}'); }
  catch { return { liked: [], disliked: [] }; }
}
export function writeResourcePrefs(prefs: { liked: string[]; disliked: string[] }) {
  try { localStorage.setItem(RESOURCE_PREFS_KEY, JSON.stringify(prefs)); } catch { /* non-fatal */ }
}

export interface BrowseResource {
  _id?: string;
  title: string;
  description: string;
  url?: string;
  phone?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  isFree?: boolean;
  costLevel?: 'free' | 'low' | 'moderate' | 'high';
  rating?: number;
  location?: string | { state?: string; city?: string };
  subcategory?: string;
  resourceType?: string;
}

interface BrowseResourceCardProps {
  resource: BrowseResource;
}

function getTrackColor(sub?: string) {
  if (!sub) return 'bg-gray-100 text-gray-600';
  const s = sub.toLowerCase();
  if (s === 'federal' || s === 'va') return 'bg-blue-50 text-blue-700';
  if (s === 'ngo') return 'bg-green-50 text-green-700';
  if (s === 'state') return 'bg-orange-50 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

function getTrackLabel(sub?: string) {
  if (!sub) return null;
  const s = sub.toLowerCase();
  if (s === 'federal' || s === 'va') return 'VA';
  if (s === 'ngo') return 'NGO';
  if (s === 'state') return 'State';
  return sub;
}

function getLocationStr(loc?: string | { state?: string; city?: string }): string | null {
  if (!loc) return null;
  if (typeof loc === 'string') return loc === 'N/A' ? null : loc;
  if (loc.city && loc.state) return `${loc.city}, ${loc.state}`;
  return loc.state ?? loc.city ?? null;
}

export default function BrowseResourceCard({ resource }: BrowseResourceCardProps) {
  const [saved, setSaved] = useState<boolean>(() => {
    try {
      const bag: string[] = JSON.parse(localStorage.getItem(SEA_BAG_KEY) || '[]');
      return bag.includes(resource.title);
    } catch { return false; }
  });
  const [justSaved, setJustSaved] = useState(false);

  // Thumbs up/down — session preference signal
  const [pref, setPref] = useState<'liked' | 'disliked' | null>(() => {
    try {
      const prefs = readResourcePrefs();
      if (prefs.liked.includes(resource.title)) return 'liked';
      if (prefs.disliked.includes(resource.title)) return 'disliked';
    } catch { /* non-fatal */ }
    return null;
  });

  function handleThumb(e: React.MouseEvent, direction: 'liked' | 'disliked') {
    e.preventDefault();
    e.stopPropagation();
    const prefs = readResourcePrefs();
    const isToggle = pref === direction; // clicking same button removes preference
    const newPref = isToggle ? null : direction;
    const otherDir: 'liked' | 'disliked' = direction === 'liked' ? 'disliked' : 'liked';
    // Remove from both, then add to target if not toggling off
    prefs.liked    = prefs.liked.filter(t => t !== resource.title);
    prefs.disliked = prefs.disliked.filter(t => t !== resource.title);
    if (!isToggle) prefs[direction].push(resource.title);
    writeResourcePrefs(prefs);
    setPref(newPref);
    // Dispatch custom event so HealthBrowseSection can re-rank in real-time
    window.dispatchEvent(new CustomEvent('vet1stop:pref-update', {
      detail: { title: resource.title, direction: newPref },
    }));
    void otherDir; // suppress unused var warning
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const bag: string[] = JSON.parse(localStorage.getItem(SEA_BAG_KEY) || '[]');
      const next = saved ? bag.filter(t => t !== resource.title) : Array.from(new Set([...bag, resource.title]));
      localStorage.setItem(SEA_BAG_KEY, JSON.stringify(next));
      setSaved(!saved);
      if (!saved) { setJustSaved(true); setTimeout(() => setJustSaved(false), 1500); }
    } catch { /* non-fatal */ }
  }

  const locationStr = getLocationStr(resource.location);
  const trackLabel = getTrackLabel(resource.subcategory ?? resource.resourceType);
  const trackColor = getTrackColor(resource.subcategory ?? resource.resourceType);
  const displayTags = (resource.tags ?? []).slice(0, 3);

  return (
    <article
      className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
      aria-label={`Resource: ${resource.title}`}
    >
      {/* Priority stripe */}
      {resource.priority === 'high' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#B22234] to-[#EAB308]" />
      )}

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {trackLabel && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${trackColor}`}>
                {trackLabel}
              </span>
            )}
            {resource.isFree && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                Free
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            aria-label={saved ? `Remove ${resource.title} from Sea Bag` : `Save ${resource.title} to Sea Bag`}
            className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-[#1A2C5B] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {justSaved
              ? <CheckCircleIcon className="h-4.5 w-4.5 text-green-500" />
              : saved
                ? <BookmarkSolid className="h-4.5 w-4.5 text-[#1A2C5B]" />
                : <BookmarkIcon className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[#1A2C5B] text-sm leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors duration-200">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 flex-1">
          {resource.description}
        </p>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1" aria-label="Resource tags">
            {displayTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                <TagIcon className="h-2.5 w-2.5" aria-hidden="true" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        {locationStr && (
          <p className="flex items-center gap-1 text-[11px] text-gray-400">
            <MapPinIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            {locationStr}
          </p>
        )}
      </div>

      {/* Footer CTAs + Thumbs */}
      <div className="px-4 pb-4 flex items-center gap-3 mt-auto">
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors duration-200 focus:outline-none focus:underline"
            aria-label={`Visit website for ${resource.title}`}
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Visit Website
          </a>
        )}
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/\D/g, '')}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B22234] hover:text-red-700 transition-colors duration-200 focus:outline-none focus:underline"
            aria-label={`Call ${resource.title}: ${resource.phone}`}
          >
            <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {resource.phone}
          </a>
        )}
        {/* Thumbs up / down — session preference signal */}
        <div className="flex items-center gap-1 ml-auto" role="group" aria-label="Rate this resource">
          <button
            onClick={e => handleThumb(e, 'liked')}
            className={`p-1 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-300 ${
              pref === 'liked' ? 'text-green-600' : 'text-gray-300 hover:text-green-500'
            }`}
            aria-label="This resource was helpful"
            aria-pressed={pref === 'liked'}
          >
            {pref === 'liked'
              ? <ThumbUpSolid className="h-4 w-4" />
              : <HandThumbUpIcon className="h-4 w-4" />}
          </button>
          <button
            onClick={e => handleThumb(e, 'disliked')}
            className={`p-1 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-300 ${
              pref === 'disliked' ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
            }`}
            aria-label="This resource was not helpful"
            aria-pressed={pref === 'disliked'}
          >
            {pref === 'disliked'
              ? <ThumbDownSolid className="h-4 w-4" />
              : <HandThumbDownIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Skeleton loader — animate-pulse shimmer, zero layout shift ───────────────

export function BrowseResourceSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="h-5 w-10 rounded-full bg-gray-200" />
        <div className="h-5 w-8 rounded-full bg-gray-100" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="flex gap-1 mt-1">
        <div className="h-4 w-14 rounded bg-gray-100" />
        <div className="h-4 w-16 rounded bg-gray-100" />
      </div>
      <div className="h-3 w-20 rounded bg-gray-100 mt-1" />
    </div>
  );
}
