'use client';

/**
 * MissionStrip.tsx — Mission Briefings card grid entry point.
 * Shows 4 featured missions by default; "View All 8" expands the grid.
 * Each card shows difficulty, time, NGO partner chips, and progress if started.
 */

import React, { useState } from 'react';
import {
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { MISSIONS, getFeaturedMissions, type Mission } from '@/data/missions';
import useMissionProgress from '@/hooks/useMissionProgress';

// ─── Icon map by mission id / icon field ─────────────────────────────────────

const ICON_LABELS: Record<string, string> = {
  'transition':       '🪖',
  'mental-health':    '🧠',
  'emergency':        '🚨',
  'women-health':     '⭐',
  'pain-management':  '💪',
  'recovery':         '🌱',
  'wellness':         '🛡️',
  'geriatric-care':   '🎖️',
};

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<Mission['difficulty'], string> = {
  easy:   'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard:   'bg-red-100 text-red-800',
};

const DIFFICULTY_LABELS: Record<Mission['difficulty'], string> = {
  easy:   'Beginner',
  medium: 'Intermediate',
  hard:   'Advanced',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface MissionStripProps {
  onSelect: (missionId: string) => void;
}

export default function MissionStrip({ onSelect }: MissionStripProps) {
  const [showAll, setShowAll] = useState(false);
  const { getProgress, hasStarted } = useMissionProgress();

  const featured = getFeaturedMissions(4);
  const displayed = showAll ? MISSIONS : featured;

  return (
    <section aria-labelledby="missions-heading" className="py-12 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapIcon className="h-5 w-5 text-[#EAB308]" aria-hidden="true" />
              <h2 id="missions-heading" className="text-2xl font-extrabold text-[#1A2C5B] tracking-tight">
                Mission Briefings
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xl">
              Guided, step-by-step plans for veterans who want a structured path — not just a list of resources.
            </p>
          </div>
          <button
            onClick={() => setShowAll(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline flex-shrink-0"
            aria-expanded={showAll}
            aria-controls="missions-grid"
          >
            {showAll ? (
              <>Show Featured <ChevronUpIcon className="h-4 w-4" aria-hidden="true" /></>
            ) : (
              <>View All {MISSIONS.length} Missions <ChevronDownIcon className="h-4 w-4" aria-hidden="true" /></>
            )}
          </button>
        </div>

        {/* Card grid */}
        <div
          id="missions-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {displayed.map(mission => {
            const progress   = getProgress(mission.id);
            const started    = hasStarted(mission.id);
            const pct        = started
              ? Math.round((progress.completedSteps.length / mission.steps.length) * 100)
              : 0;
            const resumeStep = started ? progress.currentStepIdx + 1 : 1;
            const iconEmoji  = ICON_LABELS[mission.icon] ?? '📋';

            return (
              <button
                key={mission.id}
                onClick={() => onSelect(mission.id)}
                className="group text-left bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#1A2C5B] focus:ring-offset-2 overflow-hidden flex flex-col"
                aria-label={`Open mission: ${mission.title}`}
              >
                {/* Color header bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99]" />

                <div className="p-5 flex flex-col flex-1">
                  {/* Icon + difficulty */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl" role="img" aria-hidden="true">{iconEmoji}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[mission.difficulty]}`}>
                      {DIFFICULTY_LABELS[mission.difficulty]}
                    </span>
                  </div>

                  {/* Title + objective */}
                  <h3 className="text-sm font-extrabold text-[#1A2C5B] leading-snug mb-1 group-hover:text-blue-700 transition-colors">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">
                    {mission.objective}
                  </p>

                  {/* Time + steps */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {mission.estimatedDuration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      {mission.steps.length} steps
                    </span>
                  </div>

                  {/* NGO partner chips — first 2 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {mission.steps[0].ngoPartners.slice(0, 2).map(ngo => (
                      <span
                        key={ngo.title}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-[#1A2C5B] px-1.5 py-0.5 rounded-full border border-blue-100"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1A2C5B] flex-shrink-0" />
                        {ngo.title.split('(')[0].trim().split(' ').slice(0, 2).join(' ')}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar (only if started) */}
                  {started && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircleSolid className="h-3 w-3 text-green-500" aria-hidden="true" />
                          {progress.completedSteps.length}/{mission.steps.length} complete
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1A2C5B] to-[#2d4d99] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {mission.targetAudience[0]}
                    </span>
                    <span className="text-xs font-bold text-[#1A2C5B] group-hover:text-blue-700 flex items-center gap-0.5 transition-colors">
                      {started ? `Resume Step ${resumeStep}` : 'Start Mission'}
                      <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Empty state (shouldn't occur) */}
        {displayed.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">No missions available.</p>
        )}
      </div>
    </section>
  );
}
