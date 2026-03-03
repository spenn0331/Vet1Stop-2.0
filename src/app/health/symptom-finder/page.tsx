'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, ArrowPathIcon, BeakerIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BRIDGE_STORAGE_KEY } from '@/types/records-recon';
import type { BridgeData } from '@/types/records-recon';
import SymptomFinderWizard from '../components/SymptomFinderWizard';

// ─── Sample Bridge Payload for Dev Testing ─────────────────────────────────
const SAMPLE_BRIDGE_DATA: BridgeData = {
  conditions: [
    { condition: 'PTSD', category: 'Mental Health', mentionCount: 8, firstMentionDate: '2019-06-12', pagesFound: [2, 4], sourceModule: 'records-recon' },
    { condition: 'Tinnitus', category: 'Hearing & Vision', mentionCount: 5, firstMentionDate: '2023-03-15', pagesFound: [1, 2], sourceModule: 'records-recon' },
    { condition: 'Sleep Apnea', category: 'Chronic Conditions', mentionCount: 3, firstMentionDate: '2021-11-20', pagesFound: [2, 4], sourceModule: 'records-recon' },
    { condition: 'Lumbar Degenerative Disc Disease', category: 'Physical Health', mentionCount: 4, firstMentionDate: '2020-01-08', pagesFound: [2, 3], sourceModule: 'records-recon' },
    { condition: 'GERD', category: 'Chronic Conditions', mentionCount: 2, firstMentionDate: null, pagesFound: [2], sourceModule: 'records-recon' },
  ],
  sourceModule: 'records-recon',
  timestamp: new Date().toISOString(),
  reportSummary: 'Sample VA medical records showing 5 conditions extracted from a 4-page Blue Button report. Conditions span mental health, hearing, chronic, and musculoskeletal categories.',
};

export default function SymptomFinderPage() {
  const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  // ─── Read bridge payload from localStorage (once), then wipe ────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIDGE_STORAGE_KEY);
      if (raw) {
        const parsed: BridgeData = JSON.parse(raw);
        if (parsed?.conditions?.length > 0) {
          setBridgeData(parsed);
          // Privacy hygiene: one-time read, then wipe
          localStorage.removeItem(BRIDGE_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('[SymptomFinderPage] Failed to parse bridge data:', err);
    }
    setIsHydrated(true);
  }, []);

  // ─── Clear & Reset ──────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    localStorage.removeItem(BRIDGE_STORAGE_KEY);
    setBridgeData(null);
    setWizardKey(prev => prev + 1);
  }, []);

  // ─── Simulate Bridge (dev only) ────────────────────────────────────────
  const handleSimulateBridge = useCallback(() => {
    setBridgeData({ ...SAMPLE_BRIDGE_DATA, timestamp: new Date().toISOString() });
    setWizardKey(prev => prev + 1);
  }, []);

  // Don't render until client-side hydration is complete (prevents SSR mismatch)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A2C5B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Breadcrumb Nav ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1 text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-[#1A2C5B] transition-colors">Home</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <Link href="/health" className="hover:text-[#1A2C5B] transition-colors">Health</Link>
            <ChevronRightIcon className="h-3 w-3" />
            <span className="text-[#1A2C5B] font-medium">Symptom Finder</span>
          </nav>
        </div>
      </div>

      {/* ─── Page Content ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bridge Intel Brief */}
        {bridgeData && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-[#1A2C5B]">
              <span className="font-bold">Intel Brief:</span> {bridgeData.conditions.length} condition{bridgeData.conditions.length !== 1 ? 's' : ''} loaded from Records Recon —{' '}
              {bridgeData.conditions.slice(0, 3).map(c => c.condition).join(', ')}
              {bridgeData.conditions.length > 3 ? ` +${bridgeData.conditions.length - 3} more` : ''}
            </p>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors ml-4 flex-shrink-0"
              aria-label="Clear bridge data and reset wizard"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        )}

        {/* Dev Tools (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleSimulateBridge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-purple-100 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-200 transition-colors"
            >
              <BeakerIcon className="h-3.5 w-3.5" />
              Simulate Bridge
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-gray-100 text-gray-600 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Reset Wizard
            </button>
          </div>
        )}

        {/* ─── Wizard ─── */}
        <SymptomFinderWizard key={wizardKey} bridgeData={bridgeData} />
      </div>
    </div>
  );
}
