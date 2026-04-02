// @ts-nocheck
'use client';

/**
 * SmartBridgeBanner.tsx — Smart Bridge awareness banner for the Health Hub.
 * PEEK ONLY — never clears localStorage. Only symptom-finder/page.tsx clears it.
 * Dismissible within the session (sessionStorage flag).
 * Hydration-safe: all localStorage access inside useEffect, returns null on SSR.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DocumentTextIcon, ArrowRightIcon, XMarkIcon, MapIcon } from '@heroicons/react/24/outline';
import { BRIDGE_STORAGE_KEY } from '@/types/records-recon';
import type { BridgeData } from '@/types/records-recon';
import { getMissionMatch, getMissionById } from '@/data/missions';

const DISMISS_KEY = 'vet1stop_bridge_banner_dismissed';

export default function SmartBridgeBanner() {
  const [conditions, setConditions]           = useState<string[]>([]);
  const [matchedMissionId, setMatchedMission] = useState<string | null>(null);
  const [visible, setVisible]                 = useState(false);

  useEffect(() => {
    // Respect session-level dismiss
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') return;
    } catch { /* non-fatal */ }

    // PEEK — read but never clear the bridge data
    try {
      const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
      if (!raw) return;
      const parsed: BridgeData = JSON.parse(raw);
      if (!parsed?.conditions?.length) return;
      const names = parsed.conditions.map(c => c.condition).filter(Boolean);
      if (!names.length) return;
      setConditions(names);
      setMatchedMission(getMissionMatch(names));
      setVisible(true);
    } catch { /* invalid JSON — return null silently */ }
  }, []);

  function handleDismiss() {
    setVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, 'true'); } catch { /* non-fatal */ }
  }

  if (!visible) return null;

  // Display max 2 condition names
  const display = conditions.slice(0, 2);
  const overflow = conditions.length - display.length;
  const conditionText = display.join(' and ') + (overflow > 0 ? ` +${overflow} more` : '');
  const matchedMission = matchedMissionId ? getMissionById(matchedMissionId) : null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4"
    >
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-[#1A2C5B] flex items-center justify-center">
              <DocumentTextIcon className="h-4 w-4 text-[#EAB308]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[#1A2C5B] min-w-0">
              <span className="font-semibold">Records found:</span>{' '}
              <span className="text-gray-700">
                We found mentions of{' '}
                <span className="font-semibold text-[#1A2C5B]">{conditionText}</span>{' '}
                in your records.
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/health/symptom-finder"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2C5B] text-white text-xs font-bold hover:bg-[#243d7a] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 whitespace-nowrap"
              aria-label="Go to Symptom Finder with your records pre-loaded"
            >
              Find Resources
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Dismiss this notification"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mission suggestion chip — only shown when conditions match a mission */}
        {matchedMission && (
          <div className="mt-2 pt-2 border-t border-blue-100 flex items-center gap-2">
            <MapIcon className="h-3.5 w-3.5 text-[#EAB308] flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-gray-600">
              Suggested mission based on your records:
            </span>
            <a
              href="#missions"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1A2C5B] hover:text-blue-700 underline transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
              aria-label={`Start mission: ${matchedMission.title}`}
            >
              {matchedMission.title}
              <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
