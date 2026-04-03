// @ts-nocheck
'use client';

/**
 * MissionHub.tsx — thin client wrapper for Mission Briefings.
 * Manages activeMissionId state and renders MissionStrip + MissionPanel together.
 * Single import for health/page.tsx.
 */

import React, { useState } from 'react';
import MissionStrip from './MissionStrip';
import MissionPanel from './MissionPanel';

export default function MissionHub() {
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

  return (
    <>
      <div id="missions">
        <MissionStrip onSelect={setActiveMissionId} />
      </div>
      {activeMissionId && (
        <MissionPanel
          missionId={activeMissionId}
          onClose={() => setActiveMissionId(null)}
        />
      )}
    </>
  );
}
