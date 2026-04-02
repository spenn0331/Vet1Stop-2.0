// @ts-nocheck
"use client";

/**
 * /health/pathways/[id]/page.tsx
 * Route-based mission page — opens MissionPanel for the given mission ID.
 * Supports both new mission IDs (e.g. "chronic-pain") and legacy pathway IDs
 * (e.g. "pathway-5") via LEGACY_ID_MAP.
 */

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getMissionById } from '@/data/missions';
import { LEGACY_ID_MAP } from '@/services/mock-pathways-service';
import MissionPanel from '../../components/MissionPanel';
import MissionHub from '../../components/MissionHub';

export default function PathwayPage() {
  const params   = useParams();
  const router   = useRouter();
  const rawId    = params.id as string;

  // Resolve legacy pathway IDs to new mission IDs
  const missionId = LEGACY_ID_MAP[rawId] ?? rawId;
  const mission   = getMissionById(missionId);

  const [panelOpen, setPanelOpen] = useState(true);

  function handleClose() {
    setPanelOpen(false);
    router.push('/health#missions');
  }

  return (
    <main className="bg-white min-h-screen" role="main">
      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => router.push('/health#missions')}
          className="inline-flex items-center text-sm font-semibold text-[#1A2C5B] hover:text-blue-700 transition-colors focus:outline-none focus:underline"
          aria-label="Back to all missions"
        >
          <ArrowLeftIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
          All Missions
        </button>
      </div>

      {/* Mission not found */}
      {!mission && (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">Mission not found.</p>
          <p className="text-sm text-gray-500 mb-6">
            The mission &ldquo;{rawId}&rdquo; does not exist. Browse all missions below.
          </p>
          <MissionHub />
        </div>
      )}

      {/* Inline mission strip (background) so user sees context */}
      {mission && (
        <div className="opacity-30 pointer-events-none select-none" aria-hidden="true">
          <MissionHub />
        </div>
      )}

      {/* MissionPanel overlay — open immediately on page load */}
      {mission && panelOpen && (
        <MissionPanel
          missionId={missionId}
          onClose={handleClose}
        />
      )}

      {/* If panel was closed, show full hub */}
      {mission && !panelOpen && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <MissionHub />
        </div>
      )}
    </main>
  );
}
