'use client';

/**
 * MissionPanel.tsx — Mission Briefings slide-in drawer.
 * Desktop: right-side drawer (max-w-2xl). Mobile: bottom sheet (h-[90vh]).
 * Features: step timeline, action checklist, NGO partner cards, Records Recon deeplink,
 * localStorage progress via useMissionProgress, Sea Bag save for NGO resources.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  BookmarkIcon as BookmarkSolid,
} from '@heroicons/react/24/solid';
import { getMissionById, type Mission } from '@/data/missions';
import useMissionProgress from '@/hooks/useMissionProgress';

const SEA_BAG_KEY = 'vet1stop_sea_bag';

function loadSeaBag(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEA_BAG_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveSeaBag(titles: Set<string>): void {
  try { localStorage.setItem(SEA_BAG_KEY, JSON.stringify(Array.from(titles))); }
  catch { /* non-fatal */ }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MissionPanelProps {
  missionId: string;
  onClose: () => void;
}

// ─── Difficulty label ─────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<Mission['difficulty'], string> = {
  easy:   'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard:   'bg-red-100 text-red-800',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MissionPanel({ missionId, onClose }: MissionPanelProps) {
  const mission = getMissionById(missionId);
  const { getProgress, markStepComplete, setCurrentStep, resetMission, isStepComplete } = useMissionProgress();

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [savedNGOs, setSavedNGOs]       = useState<Set<string>>(new Set());
  const [mounted, setMounted]           = useState(false);

  // Hydrate state from localStorage after mount
  useEffect(() => {
    setMounted(true);
    setSavedNGOs(loadSeaBag());
    if (mission) {
      const saved = getProgress(mission.id);
      setActiveStepIdx(saved.currentStepIdx);
    }
  }, [mission, getProgress]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mission) return null;

  const totalSteps  = mission.steps.length;
  const currentStep = mission.steps[activeStepIdx];
  const progress    = mounted ? getProgress(mission.id) : { currentStepIdx: 0, completedSteps: [] };
  const pct         = Math.round((progress.completedSteps.length / totalSteps) * 100);

  // ── Action item checklist ──────────────────────────────────────────────────

  const stepCheckKey = (item: string) => `${currentStep.id}::${item}`;

  function handleCheckItem(item: string) {
    const key = stepCheckKey(item);
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  const goToStep = useCallback((idx: number) => {
    setActiveStepIdx(idx);
    setCurrentStep(mission!.id, idx);
    setCheckedItems(new Set()); // reset local check state when changing step
  }, [mission.id, setCurrentStep]);

  function handleMarkComplete() {
    markStepComplete(mission!.id, currentStep.id, totalSteps);
    // Advance UI directly — do NOT call goToStep here because goToStep → setCurrentStep
    // runs with a stale allProgress closure and overwrites completedSteps back to [].
    if (activeStepIdx < totalSteps - 1) {
      setActiveStepIdx(activeStepIdx + 1);
      setCheckedItems(new Set());
    }
  }

  // ── Sea Bag for NGO partners ───────────────────────────────────────────────

  function handleToggleSaveNGO(title: string) {
    setSavedNGOs(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      saveSeaBag(next);
      return next;
    });
  }

  const stepComplete = mounted && isStepComplete(mission.id, currentStep.id);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — desktop: right drawer; mobile: bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Mission: ${mission.title}`}
        className={[
          'fixed z-50 bg-white flex flex-col shadow-2xl',
          'sm:inset-y-0 sm:right-0 sm:w-full sm:max-w-2xl sm:rounded-l-2xl',
          'inset-x-0 bottom-0 h-[92vh] rounded-t-2xl sm:h-auto',
        ].join(' ')}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#EAB308] uppercase tracking-wider mb-0.5">
                Mission Briefing
              </p>
              <h2 className="text-lg font-extrabold text-[#1A2C5B] leading-tight line-clamp-2">
                {mission.title}
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[mission.difficulty]}`}>
                  {mission.difficulty.charAt(0).toUpperCase() + mission.difficulty.slice(1)}
                </span>
                <span className="text-xs text-gray-400">
                  Step {activeStepIdx + 1} of {totalSteps}
                </span>
                {pct > 0 && (
                  <span className="text-xs font-semibold text-green-700 flex items-center gap-0.5">
                    <CheckCircleSolid className="h-3.5 w-3.5" aria-hidden="true" />
                    {pct}% done
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Close mission panel"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
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

        {/* ── Step timeline tabs (scrollable horizontal on mobile) ── */}
        <div className="flex-shrink-0 border-b border-gray-100 overflow-x-auto">
          <div className="flex gap-0 min-w-max px-5 py-2">
            {mission.steps.map((step, idx) => {
              const done    = mounted && isStepComplete(mission.id, step.id);
              const active  = idx === activeStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(idx)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mr-1 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1A2C5B]',
                    active
                      ? 'bg-[#1A2C5B] text-white shadow-sm'
                      : done
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'text-gray-500 hover:bg-gray-100',
                  ].join(' ')}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`${done ? 'Completed: ' : ''}Step ${idx + 1}: ${step.title}`}
                >
                  {done
                    ? <CheckCircleSolid className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    : <span className="h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[9px] font-bold border-current">{idx + 1}</span>
                  }
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">Step {idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 space-y-5">

            {/* Step title + description */}
            <div>
              <h3 className="text-base font-extrabold text-[#1A2C5B] mb-1">
                {currentStep.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Key points */}
            <div>
              <h4 className="text-xs font-bold text-[#1A2C5B] uppercase tracking-wider mb-2">
                Key Points
              </h4>
              <ul className="space-y-2">
                {currentStep.keyPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-[#1A2C5B]/10 flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1A2C5B]" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            {currentStep.warnings && currentStep.warnings.length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Important</span>
                </div>
                {currentStep.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-red-800 leading-relaxed">{w}</p>
                ))}
              </div>
            )}

            {/* Tips */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LightBulbIcon className="h-4 w-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Pro Tip</span>
                </div>
                {currentStep.tips.map((t, i) => (
                  <p key={i} className="text-sm text-blue-900 leading-relaxed">{t}</p>
                ))}
              </div>
            )}

            {/* Vet1Stop Platform Tip (Strike 9) */}
            {currentStep.vet1stopTip && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BoltIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Vet1Stop Tip</span>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">{currentStep.vet1stopTip}</p>
              </div>
            )}

            {/* Action items checklist */}
            <div>
              <h4 className="text-xs font-bold text-[#1A2C5B] uppercase tracking-wider mb-2">
                Action Items
              </h4>
              <ul className="space-y-2">
                {currentStep.actionItems.map((item, i) => {
                  const key     = stepCheckKey(item);
                  const checked = checkedItems.has(key);
                  return (
                    <li key={i}>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCheckItem(item)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1A2C5B] focus:ring-[#1A2C5B] flex-shrink-0 cursor-pointer"
                          aria-label={item}
                        />
                        <span className={`text-sm leading-relaxed transition-colors ${
                          checked ? 'line-through text-gray-400' : 'text-gray-700 group-hover:text-[#1A2C5B]'
                        }`}>
                          {item}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Records Recon deeplink */}
            {currentStep.recordsReconDeeplink && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-amber-800 mb-1">
                    Records Recon Recommended
                  </p>
                  <p className="text-xs text-amber-700 mb-2">
                    This step involves organizing your medical records. Vet1Stop&apos;s Records Recon tool can extract and structure them for you.
                  </p>
                  <Link
                    href="/health/records-recon"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  >
                    Launch Records Recon
                    <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}

            {/* NGO Partners */}
            {currentStep.ngoPartners.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#1A2C5B] uppercase tracking-wider mb-2">
                  Support Partners for This Step
                </h4>
                <div className="space-y-3">
                  {currentStep.ngoPartners.map(ngo => {
                    const saved = mounted && savedNGOs.has(ngo.title);
                    return (
                      <div
                        key={ngo.title}
                        className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1A2C5B] leading-tight mb-1">
                              {ngo.title}
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed mb-2">
                              {ngo.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={ngo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
                                aria-label={`Visit ${ngo.title} website`}
                              >
                                Visit Website
                                <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden="true" />
                              </a>
                              {ngo.phone && (
                                <a
                                  href={`tel:${ngo.phone.replace(/\D/g, '')}`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#B22234] hover:text-red-700 transition-colors focus:outline-none focus:underline"
                                  aria-label={`Call ${ngo.title}: ${ngo.phone}`}
                                >
                                  <PhoneIcon className="h-3 w-3" aria-hidden="true" />
                                  {ngo.phone}
                                </a>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSaveNGO(ngo.title)}
                            className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300 ${
                              saved
                                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800'
                            }`}
                            aria-label={saved ? `Remove ${ngo.title} from Sea Bag` : `Save ${ngo.title} to Sea Bag`}
                          >
                            {saved
                              ? <BookmarkSolid className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
                              : <BookmarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            }
                            {saved ? 'Saved' : 'Sea Bag'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reset option */}
            {pct > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => { resetMission(mission.id); goToStep(0); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors focus:outline-none focus:ring-1 focus:ring-gray-300 rounded"
                >
                  Reset mission progress
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: 988 line + navigation ── */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white">
          {/* 988 crisis strip */}
          <div className="bg-[#B22234] px-5 py-2 flex items-center justify-between gap-2">
            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
              <PhoneIcon className="h-3.5 w-3.5 text-[#EAB308]" aria-hidden="true" />
              Veterans Crisis Line: Dial 988 then Press 1
            </span>
            <a
              href="tel:988"
              className="flex-shrink-0 text-xs font-bold text-[#1F2937] bg-[#EAB308] hover:bg-[#FACC15] px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-300"
              aria-label="Call Veterans Crisis Line"
            >
              Call 988
            </a>
          </div>

          {/* Prev / Mark Complete / Next */}
          <div className="px-5 py-3 flex items-center gap-3">
            <button
              onClick={() => goToStep(activeStepIdx - 1)}
              disabled={activeStepIdx === 0}
              className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#1A2C5B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A2C5B] rounded px-2 py-1.5"
              aria-label="Previous step"
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
              Prev
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={stepComplete}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-green-400',
                stepComplete
                  ? 'bg-green-50 border border-green-200 text-green-700 cursor-default'
                  : 'bg-[#1A2C5B] text-white hover:bg-[#243d7a] shadow-md hover:shadow-lg',
              ].join(' ')}
              aria-label={stepComplete ? 'Step already completed' : 'Mark this step complete and advance'}
            >
              {stepComplete
                ? <><CheckCircleSolid className="h-4 w-4 text-green-600" aria-hidden="true" /> Step Complete</>
                : <><CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Mark Complete</>
              }
            </button>

            <button
              onClick={() => goToStep(activeStepIdx + 1)}
              disabled={activeStepIdx === totalSteps - 1}
              className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#1A2C5B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A2C5B] rounded px-2 py-1.5"
              aria-label="Next step"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
